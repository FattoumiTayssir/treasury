# file: etl_jobs/achat_importation_upsert.py
import os
import ssl
from datetime import date, datetime, UTC
import xmlrpc.client
from dotenv import load_dotenv

import psycopg2
import psycopg2.extras

load_dotenv()

# --- ENV: Odoo ---
URL = os.getenv("ODOO_URL", "").rstrip("/")
DB = os.getenv("ODOO_DB", "")
USER = os.getenv("ODOO_USERNAME", "")
PASSWORD = os.getenv("ODOO_PASSWORD", "")
COMPANY_ID = 1
DATE_FROM = os.getenv("ODOO_DATE_FROM")  # optional ISO YYYY-MM-DD

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
SYSTEM_USER_EMAIL = os.getenv("SYSTEM_USER_EMAIL", "system@local")
SYSTEM_USER_NAME = os.getenv("SYSTEM_USER_NAME", "System")
SYSTEM_USER_ROLE = os.getenv("SYSTEM_USER_ROLE", "Admin")
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

# --- Domain & fields (Achat Importation) ---
domain = [
    ("move_type", "in", ["in_invoice", "in_refund"]),
    ("state", "in", ["draft", "posted"]),
    ("invoice_origin", "ilike", "CE%"),
    ("payment_state", "!=", "paid"),  # Exclure les factures déjà payées
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
    "invoice_origin",
    "company_id",
    "partner_id",
    "custom_rate",
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
    return "Facture" if mt == "in_invoice" else "Avoir"


def sign_from_move_type(mt: str) -> str:
    return "Sortie" if mt == "in_invoice" else "Entrée"


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

# --- Ensure System user exists and fetch its ID ---
def get_or_create_system_user(cur) -> int:
    cur.execute('SELECT user_id FROM "User" WHERE email = %s', (SYSTEM_USER_EMAIL,))
    row = cur.fetchone()
    if row and row[0]:
        return int(row[0])
    cur.execute(
        'INSERT INTO "User"(display_name, email, role) VALUES (%s,%s,%s) RETURNING user_id',
        (SYSTEM_USER_NAME, SYSTEM_USER_EMAIL, SYSTEM_USER_ROLE),
    )
    new_id_row = cur.fetchone()
    if not new_id_row or new_id_row[0] is None:
        cur.execute('SELECT user_id FROM "User" WHERE email = %s', (SYSTEM_USER_EMAIL,))
        new_id_row = cur.fetchone()
    return int(new_id_row[0])

# --- Delete old data then insert fresh data ---
ETL_TYPE = "Achat Importation"

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
        odoo_id = r.get("id")
        # Use Odoo ID in reference to ensure uniqueness (especially for "/" references)
        base_name = r.get("name") or r.get("ref") or ""
        name = f"{base_name} (ID:{odoo_id})" if odoo_id else base_name
        odoo_link = f"{URL}/web#id={odoo_id}&model=account.move&view_type=form" if odoo_id else ""

        # Récupérer le taux de change et convertir EUR -> TND
        custom_rate = r.get("custom_rate")
        exchange_rate = float(custom_rate) if custom_rate else None
        
        # Convert EUR amount to TND using exchange_rate
        # total from Odoo is in EUR, we need to convert it to TND
        amount_tnd = abs(total * exchange_rate) if exchange_rate and exchange_rate > 0 else abs(total)
        
        reason = None
        if due and due < TODAY:
            reason = "Échéance passée (< aujourd'hui)"
        elif not exchange_rate or exchange_rate == 0:
            reason = "Taux de change manquant ou invalide (custom_rate)"
        # Note: Factures payées sont maintenant exclues dans le domaine Odoo

        reference_type = ref_type_from_move_type(mt)
        sign = sign_from_move_type(mt)
        reference_status = ref_status_from_payment_state(ps)
        
        # Create unique key for tracking duplicates
        ref_key = (company_id, reference_type, name, 1)  # archive_version always 1

        if reason is not None:
            # Skip if this exception reference already inserted
            if ref_key in inserted_exception_refs:
                continue
            
            # Insert Exception with TND amount
            sql = (
                'INSERT INTO "Exception"(company_id, category, type, exception_type, criticity, description, amount, sign, reference_type, reference, reference_status, odoo_link, status, created_at) '
                'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)'
            )
            params = (
                company_id, "Achat", ETL_TYPE, "Auto", "Warning", reason, amount_tnd, sign, reference_type, name, reference_status, odoo_link, "Actif", NOW_ISO,
            )
            cur.execute(sql, params)
            inserted_exception_refs.add(ref_key)
            continue

        # Skip if this movement reference already inserted
        if ref_key in inserted_movement_refs:
            continue
        
        # Insert Movement with TND amount
        movement_date = (due or inv_date or TODAY).isoformat()
        amount = amount_tnd
        archive_version = 1
        
        insert_sql = (
            'INSERT INTO movement (company_id, manual_entry_id, category, type, amount, sign, movement_date, reference_type, reference, reference_status, source, note, status, created_at, created_by, odoo_link, updated_at, updated_by, archive_version, exchange_rate) '
            'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)'
        )
        params = (
            company_id, None, "Achat", ETL_TYPE, amount, sign, movement_date, reference_type, name, reference_status, "Odoo", "", "Actif", NOW_ISO, created_by_id, odoo_link, NOW_ISO, created_by_id, archive_version, exchange_rate,
        )
        cur.execute(insert_sql, params)
        inserted_movement_refs.add(ref_key)

    conn.commit()

conn.close()
print(f"Insert completed: {ETL_TYPE}")
print(f"Successfully inserted {len(inserted_movement_refs)} records")
