# Spec Note Implementation: Unpaid Invoices Only

## Date: 2025-10-12 16:55

## Spec Note (Line 60)
```
Note : On parle toujours des factures non payés que ce soit les factures prise en compte ou mis en exception
```

**Translation:** "We always talk about unpaid invoices whether they are taken into account or put as exceptions"

---

## Implementation

### Change Made
Added domain filter to `etl_odoo/ventes_locales_upsert.py`:

```python
# --- Domain & fields (Ventes locales) ---
# Note from spec line 60: "On parle toujours des factures non payés" (We always talk about unpaid invoices)
domain = [
    ("move_type", "in", ["out_invoice", "out_refund"]),
    ("state", "in", ["draft", "posted"]),
    ("payment_state", "!=", "paid"),  # ONLY unpaid invoices per spec note
]
```

### What This Means
- **Before:** Fetched ALL invoices (paid and unpaid), then filtered out paid invoices during processing
- **After:** Only fetches **unpaid invoices** from Odoo (payment_state != "paid")

### Payment States in Odoo
- `not_paid` - Not paid at all
- `partial` - Partially paid
- `in_payment` - Payment in progress
- `paid` - Fully paid ← **NOW EXCLUDED**
- `reversed` - Reversed/cancelled
- `cancelled` - Cancelled

---

## Performance Impact

### Execution Times

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Ventes Locales ETL | 218.82s | 9.41s | **95.7% faster** |
| Total Pipeline | 225.67s | 15.32s | **93.2% faster** |

### Why So Fast?
- **Reduced data volume:** Only fetching unpaid invoices dramatically reduces the number of records retrieved from Odoo
- **Less processing:** No need to check payment_state and filter during processing
- **Fewer deletes:** Fewer references to clean up in the database

---

## Data Impact

### Exception Count
- **Before:** Deleted 4502 old exceptions
- **After:** Deleted 533 old exceptions
- **Why?** Paid invoices with date issues were previously being marked as exceptions. Now they're completely excluded.

### Movements
- Only **unpaid invoices** with future due dates will create movements
- Paid invoices are never fetched, never processed, never stored

---

## Code Changes

### 1. Domain Filter (Line 56)
```python
("payment_state", "!=", "paid"),  # ONLY unpaid invoices per spec note
```

### 2. Removed Unnecessary Logic (Lines 255-260)
**Before:**
```python
# Movement amount decision
if ps == "paid":
    amount_for_movement = 0.0
elif ps in {"partial", "in_payment", "not_paid"}:
    amount_for_movement = abs(residual)
else:
    amount_for_movement = abs(residual)
```

**After:**
```python
# Movement amount decision (residual amount for unpaid invoices)
# Note: We only fetch unpaid invoices, so residual should always be > 0
amount_for_movement = abs(residual)
```

### 3. Updated Comments (Lines 228-229, 235-236)
Removed references to "Reg. Reçu" (paid) invoice handling since they're now excluded at the source.

---

## Spec Compliance

### Section 2.3: Factures présentes – Statut Reg. Non Reçu
✅ **Compliant:** Only processes unpaid invoices ("Reg. Non Reçu" = payment not received)

### Section 2.4: Autres statuts
✅ **Compliant:** The note clarifies that all sections only apply to unpaid invoices
- "En paiement / Extourné / Hist. facturation / Reg. Impayé" → Exception
- ~~"Reg. Reçu"~~ → **NO LONGER PROCESSED** (excluded by filter)
- ~~"Reg. Partiel Reçu"~~ → Treated as unpaid (partial payment state is not "paid")

---

## Testing

### Test Run (2025-10-12 16:55)
```bash
poetry run python run_all_etls.py
```

**Results:**
```
✓ Achat Importation: 5.17s
✓ Ventes Locales: 9.41s ← Dramatic improvement from 218.82s
✓ Achats Locaux avec Échéance: 0.74s

Total: 15.32 seconds (0.26 minutes)
Exit Code: 0 (Success)
```

### Verification
To verify only unpaid invoices are being processed:
```python
# Check the domain being sent to Odoo
domain = [
    ("move_type", "in", ["out_invoice", "out_refund"]),
    ("state", "in", ["draft", "posted"]),
    ("payment_state", "!=", "paid"),  # ← Excludes paid invoices
]
```

Query Odoo to confirm no invoices with `payment_state == "paid"` are returned.

---

## Breaking Changes

### ⚠️ Behavioral Change
- **Before:** Paid invoices with date issues were stored as exceptions
- **After:** Paid invoices are completely ignored (not fetched, not processed, not stored)

### Impact Assessment
This is the **correct behavior** according to the spec note. If your business logic previously relied on seeing paid invoices as exceptions, you will need to:
1. Query Odoo directly for paid invoices with date issues
2. Or remove the payment_state filter if you need to see all invoices

---

## Recommendations

### For Production Use
1. ✅ **Keep this change** - It aligns with the spec note and dramatically improves performance
2. ✅ **Document behavior** - Ensure stakeholders know paid invoices are excluded
3. ✅ **Monitor first run** - Verify the reduced exception count is expected

### If You Need Paid Invoice Visibility
If you need to see paid invoices for audit purposes:
- Create a separate read-only query/report in Odoo
- Do NOT include paid invoices in the treasury movement ETL (per spec)

---

## Summary

✅ **Spec compliance:** Implemented note at line 60
✅ **Performance:** 93% faster pipeline execution
✅ **Code quality:** Simplified logic, removed unnecessary conditionals
✅ **Data accuracy:** Only processes unpaid invoices as specified

The Ventes Locales ETL now strictly follows the spec: "On parle toujours des factures non payés" (We always talk about unpaid invoices).
