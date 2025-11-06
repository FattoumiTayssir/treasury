# file: etl_jobs/ventes_locales_upsert.py
import os
import ssl
from datetime import date, datetime, UTC
import xmlrpc.client
from dotenv import load_dotenv

# DB driver for PostgreSQL
import psycopg2
import psycopg2.extras

load_dotenv()

# --- ENV: Odoo ---
URL = os.getenv("ODOO_URL", "").rstrip("/")
DB = os.getenv("ODOO_DB", "")
USER = os.getenv("ODOO_USERNAME", "")
PASSWORD = os.getenv("ODOO_PASSWORD", "")
COMPANY_ID = 1
DATE_FROM = os.getenv("ODOO_DATE_FROM")  # optional window, ISO date YYYY-MM-DD

if COMPANY_ID:
    COMPANY_ID = int(COMPANY_ID)

if not all([URL, DB, USER, PASSWORD]):
    raise RuntimeError("Missing Odoo env vars. Check .env")

# --- ENV: PostgreSQL ---
PG_HOST = os.getenv("PGHOST", "127.0.0.1")
PG_PORT = int(os.getenv("PGPORT", "5432"))
PG_DB = os.getenv("DB_NAME", "appdb")
PG_USER = os.getenv("POSTGRES_USER", "postgres")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")
# System user to attribute movements to (will be created if missing)
SYSTEM_USER_EMAIL = os.getenv("SYSTEM_USER_EMAIL", "system@local")
SYSTEM_USER_NAME = os.getenv("SYSTEM_USER_NAME", "System")
SYSTEM_USER_ROLE = os.getenv("SYSTEM_USER_ROLE", "Admin")  # Admin or Manager
if not PG_PASSWORD:
    raise RuntimeError("Missing PostgreSQL POSTGRES_PASSWORD. Check .env")

# --- Odoo XML-RPC connections ---
context = ssl._create_unverified_context()
common = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/common", context=context)
uid = common.authenticate(DB, USER, PASSWORD, {})
if not uid:
    raise RuntimeError("Auth failed. Check creds")
models = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/object", context=context)

TODAY = date.today()
NOW_ISO = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

# --- Domain & fields (Ventes locales) ---
# Note from spec line 60: "On parle toujours des factures non payés" (We always talk about unpaid invoices)
domain = [
    ("move_type", "in", ["out_invoice", "out_refund"]),
    ("state", "in", ["draft", "posted"]),
    ("payment_state", "!=", "paid"),  # ONLY unpaid invoices per spec note
]
if COMPANY_ID:
    domain.append(("company_id", "=", COMPANY_ID))
if DATE_FROM:
    domain.append(("invoice_date", ">=", DATE_FROM))

fields = [
    "name",
    "ref",
    "move_type",
    "state",
    "payment_state",
    "invoice_date",
    "invoice_date_due",
    "amount_total",
    "amount_residual",
    "company_id",
    "partner_id",
]

# --- Helpers ---

def to_date(val):
    if not val:
        return None
    if isinstance(val, str):
        return date.fromisoformat(val)
    if isinstance(val, datetime):
        return val.date()
    return None


def ref_type_from_move_type(mt: str) -> str:
    return "Facture" if mt == "out_invoice" else "Avoir"


def sign_from_move_type(mt: str) -> str:
    return "Entrée" if mt == "out_invoice" else "Sortie"


def ref_status_from_payment_state(ps: str) -> str:
    if ps == "paid":
        return "Payée"
    if ps in {"in_payment", "partial", "not_paid"}:
        return "En attente"
    if ps in {"reversed", "cancelled"}:
        return "Annulée"
    return "En attente"


# --- Fetch Odoo records ---
limit = 100
offset = 0
records = []
while True:
    ids = models.execute_kw(
        DB, uid, PASSWORD,
        "account.move", "search",
        [domain],
        {"limit": limit, "offset": offset, "order": "invoice_date desc, id desc"}
    )
    if not ids:
        break
    recs = models.execute_kw(
        DB, uid, PASSWORD,
        "account.move", "read",
        [ids],
        {"fields": fields}
    )
    records.extend(recs)
    if len(ids) < limit:
        break
    offset += limit

# --- Connect to PostgreSQL ---
conn = psycopg2.connect(
    host=PG_HOST,
    port=PG_PORT,
    dbname=PG_DB,
    user=PG_USER,
    password=PG_PASSWORD,
)
conn.autocommit = False

# --- Ensure System user exists and fetch its ID ---
def get_or_create_system_user(cur) -> int:
    cur.execute('SELECT user_id FROM "User" WHERE email = %s', (SYSTEM_USER_EMAIL,))
    row = cur.fetchone()
    if row and row[0]:
        return int(row[0])
    # Insert minimal user
    cur.execute(
        'INSERT INTO "User"(display_name, email, role) VALUES (%s,%s,%s) RETURNING user_id',
        (SYSTEM_USER_NAME, SYSTEM_USER_EMAIL, SYSTEM_USER_ROLE),
    )
    new_id_row = cur.fetchone()
    if not new_id_row or new_id_row[0] is None:
        # Fallback read
        cur.execute('SELECT user_id FROM "User" WHERE email = %s', (SYSTEM_USER_EMAIL,))
        new_id_row = cur.fetchone()
    return int(new_id_row[0])

# --- Ensure Company exists (FK) with the same id as Odoo ---
def ensure_company(cur, company_id: int, company_name: str | None = None) -> None:
    if company_id is None:
        return
    cur.execute(
        'SELECT 1 FROM company WHERE company_id = %s',
        (company_id,)
    )
    if not cur.fetchone():
        cur.execute(
            'INSERT INTO company(company_id, name) VALUES (%s, %s) ON CONFLICT (company_id) DO NOTHING',
            (company_id, company_name or f"Company {company_id}"),
        )

# --- Delete old data then insert fresh data ---
ETL_TYPE = "Ventes locales"
non_automatable_states = {"reversed", "cancelled"}

with conn.cursor() as cur:
    created_by_id = get_or_create_system_user(cur)
    
    # Delete ALL movements of this ETL type to prevent conflicts with duplicate references
    # (e.g., multiple invoices with "/" reference)
    cur.execute('DELETE FROM movement WHERE type = %s', (ETL_TYPE,))
    deleted_movements = cur.rowcount
    
    # Delete existing Exception records for this ETL type
    cur.execute('DELETE FROM "Exception" WHERE type = %s', (ETL_TYPE,))
    deleted_exceptions = cur.rowcount
    
    print(f"Deleted {deleted_movements} old movements and {deleted_exceptions} old exceptions for {ETL_TYPE}")
    
    # Track inserted references to avoid duplicates within same run
    inserted_movement_refs = set()
    inserted_exception_refs = set()
    
    for r in records:
        company = r.get("company_id") or [None, None]
        company_id = company[0]
        company_name = company[1] if isinstance(company, (list, tuple)) and len(company) > 1 else None
        ensure_company(cur, company_id, company_name)
        mt = r.get("move_type")
        ps = r.get("payment_state")
        inv_date = to_date(r.get("invoice_date"))
        due = to_date(r.get("invoice_date_due"))
        total = float(r.get("amount_total") or 0.0)
        residual = float(r.get("amount_residual") or 0.0)
        odoo_id = r.get("id")
        # Use Odoo ID in reference to ensure uniqueness (especially for "/" references)
        base_name = r.get("name") or r.get("ref") or ""
        name = f"{base_name} (ID:{odoo_id})" if odoo_id else base_name
        odoo_link = f"{URL}/web#id={odoo_id}&model=account.move&view_type=form" if odoo_id else ""

        ref_type = ref_type_from_move_type(mt)
        sign = sign_from_move_type(mt)
        ref_status = ref_status_from_payment_state(ps)
        
        # Create unique key for tracking duplicates
        ref_key = (company_id, ref_type, name, 1)  # archive_version always 1

        # Check exception conditions (spec 2.3, 2.4)
        # Note: We only process unpaid invoices per spec line 60
        reason = None
        if ps in non_automatable_states:
            reason = "Statut non automatisable"
        elif due and due < TODAY:
            reason = "Échéance passée (< aujourd'hui)"
        elif due and inv_date and due == inv_date:
            reason = "Échéance = Date de facturation"

        if reason is not None:
            # Skip if this exception reference already inserted
            if ref_key in inserted_exception_refs:
                continue
            
            # Insert Exception
            sql = (
                'INSERT INTO "Exception"(company_id, category, type, exception_type, criticity, description, amount, sign, reference_type, reference, reference_status, odoo_link, status, created_at) '
                'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)'
            )
            params = (
                company_id, "Vente", ETL_TYPE, "Auto", "Warning", reason, abs(total), sign, ref_type, name, ref_status, odoo_link, "Actif", NOW_ISO,
            )
            cur.execute(sql, params)
            inserted_exception_refs.add(ref_key)
            continue

        # Movement amount decision (residual amount for unpaid invoices)
        # Note: We only fetch unpaid invoices, so residual should always be > 0
        amount_for_movement = abs(residual)

        if amount_for_movement <= 0:
            continue  # Skip if no amount (shouldn't happen for unpaid invoices)

        # Skip if this movement reference already inserted
        if ref_key in inserted_movement_refs:
            continue

        # Insert Movement
        movement_date = (due or inv_date or TODAY).isoformat()
        archive_version = 1
        
        insert_sql = (
            'INSERT INTO movement (company_id, manual_entry_id, category, type, amount, sign, movement_date, reference_type, reference, reference_status, source, note, status, created_at, created_by, odoo_link, updated_at, updated_by, archive_version) '
            'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)'
        )
        params = (
            company_id, None, "Vente", ETL_TYPE, amount_for_movement, sign, movement_date, ref_type, name, ref_status, "Odoo", "", "Actif", NOW_ISO, created_by_id, odoo_link, NOW_ISO, created_by_id, archive_version,
        )
        cur.execute(insert_sql, params)
        inserted_movement_refs.add(ref_key)

    conn.commit()

conn.close()
print(f"Insert completed: {ETL_TYPE}")
print(f"Successfully inserted {len(inserted_movement_refs)} records")
