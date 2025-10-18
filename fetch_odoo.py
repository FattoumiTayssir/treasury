# file: fetch_invoices_xmlrpc.py
import os
from dotenv import load_dotenv
import xmlrpc.client
import ssl

load_dotenv()

URL = os.getenv("ODOO_URL", "")
DB = os.getenv("ODOO_DB", "")
USER = os.getenv("ODOO_USERNAME", "")
PASSWORD = os.getenv("ODOO_PASSWORD", "")
COMPANY_ID = 1
if COMPANY_ID:
    COMPANY_ID = int(COMPANY_ID)

if not all([URL, DB, USER, PASSWORD]):
    raise RuntimeError("Missing Odoo env vars. Check .env")
context = ssl._create_unverified_context()

# --- Authenticate ---
common = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/common", context=context)
uid = common.authenticate(DB, USER, PASSWORD, {})
if not uid:
    raise RuntimeError("Auth failed. Check creds")

models = xmlrpc.client.ServerProxy(f"{URL}/xmlrpc/2/object")

# --- Build a search domain ---
domain = [
    ("move_type", "in", ["out_invoice", "out_refund"]),   # customer invoices + refunds
    ("state", "=", "posted"),                              # only posted
]
if COMPANY_ID:
    domain.append(("company_id", "=", COMPANY_ID))

# Optional: add date range
# domain += [("invoice_date", ">=", "2025-01-01"), ("invoice_date", "<=", "2025-09-13")]

# --- Fields to fetch ---
fields = [
    "partner_id",
   
]

# --- Query IDs (with pagination) ---
limit = 50
offset = 0
all_invoices = []

while True:
    ids = models.execute_kw(
        DB, uid, PASSWORD,
        "account.move", "search",
        [domain],
        {"limit": limit, "offset": offset, "order": "invoice_date desc, id desc"}
    )
    if not ids:
        break

    # Read records
    records = models.execute_kw(
        DB, uid, PASSWORD,
        "account.move", "read",
        [ids],
        {"fields": fields}
    )
    all_invoices.extend(records)
    if len(ids) < limit:
        break
    offset += limit

# --- Minimal printout ---
for inv in all_invoices:
    partner_name = inv["partner_id"][1] if inv["partner_id"] else None
    print(f"{partner_name}")

print(f"Fetched {len(all_invoices)} invoices.")
