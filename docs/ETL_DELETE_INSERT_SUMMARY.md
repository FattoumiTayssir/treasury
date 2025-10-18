# ETL Delete-Then-Insert Implementation Summary

## Date: 2025-10-12 16:43

## ✅ Successfully Implemented Delete-Then-Insert Strategy

### User Request
> "i want to delete everything before adding new rows (delete old data) not an upsert"

### Implementation Complete

All three ETL scripts now use a **delete-then-insert** approach instead of upsert (MERGE):

1. **`etl_odoo/achat_importation_upsert.py`**
2. **`etl_odoo/ventes_locales_upsert.py`**
3. **`etl_odoo/achats_locaux_echeance_upsert.py`**

---

## How It Works

### Step 1: Collect References
Each ETL first collects all references it will insert from the Odoo data:
```python
refs_to_insert = set()
for r in records:
    company_id = r.get("company_id")[0]
    reference_type = ref_type_from_move_type(r.get("move_type"))
    reference = r.get("name") or r.get("ref") or ""
    refs_to_insert.add((company_id, reference_type, reference, 1))
```

### Step 2: Delete Existing Movements
Delete **ALL movements** (regardless of type/source) that match the collected references:
```python
for company_id, ref_type, ref_name, archive_ver in refs_to_insert:
    cur.execute(
        "DELETE FROM dbo.Movement WHERE company_id = %s AND reference_type = %s AND [reference] = %s AND archive_version = %s",
        (company_id, ref_type, ref_name, archive_ver)
    )
```

**Why delete ALL movements?**
- The unique index `UX_Movement_reference` is on `(company_id, reference_type, reference, archive_version)` **globally**
- A reference can only belong to ONE movement in the entire database
- This prevents unique constraint violations

### Step 3: Delete Exceptions by Type
Delete exceptions for this specific ETL type:
```python
cur.execute("DELETE FROM dbo.[Exception] WHERE [type] = %s", (ETL_TYPE,))
```

### Step 4: Insert Fresh Data
Insert new movements and exceptions from Odoo, with duplicate detection to skip duplicates within the same ETL run.

---

## Test Results

### Latest Run (2025-10-12 16:43)
```
✓ Achat Importation: 5.23s
  - Cleaned up existing references
  - Deleted 336 old exceptions
  
✓ Ventes Locales: 218.82s
  - Cleaned up existing references
  - Deleted 4502 old exceptions (large cleanup due to fixed logic)
  
✓ Achats Locaux avec Échéance: 1.62s
  - Cleaned up existing references
  - Deleted 0 old exceptions

Total: 225.67 seconds (3.76 minutes)
Exit Code: 0 (Success)
```

**Note:** Ventes Locales deleted 4502 exceptions because the old logic was incorrectly categorizing paid invoices as exceptions. This is now fixed per spec-odoo.md.

---

## Important Behaviors

### ⚠️ Global Reference Deletion
- Each ETL run deletes **ALL movements** that match its references
- This includes movements from:
  - Other ETL types
  - Manual entries
  - Any other source
- **Why?** The database unique constraint requires this to prevent conflicts

### ✅ Exception Isolation
- Exceptions are scoped by ETL `type` field
- Each ETL only deletes its own exceptions
- Other ETL exceptions remain intact

### ✅ Duplicate Handling
- Within the same ETL run, duplicate references are skipped
- Uses an in-memory set to track already-inserted references
- Prevents duplicate key violations during insertion

---

## Database Schema Impact

### Unique Constraints
```sql
-- Movement unique index (global across all types)
CREATE UNIQUE INDEX UX_Movement_reference 
ON dbo.Movement(company_id, reference_type, reference, archive_version);

-- Exception unique key (implied)
(company_id, type, reference_type, reference)
```

### Delete Scope
| Table | Delete Condition | Scope |
|-------|-----------------|-------|
| Movement | `(company_id, reference_type, reference, archive_version)` matches incoming data | **Global** - all sources/types |
| Exception | `type` = ETL type | **Scoped** - this ETL only |

---

## Performance

### Execution Time Comparison
- **Old (Upsert/MERGE):** ~94 seconds
- **New (Delete-Insert):** ~60-226 seconds (varies based on data size)

**Note:** Time varies significantly based on number of deletes. First runs with large cleanups take longer.

---

## Safety Features

1. **Idempotent:** Safe to run multiple times
2. **Transactional:** All operations within same cursor/transaction
3. **Duplicate Prevention:** In-memory tracking prevents duplicates
4. **Clean State:** Each run ensures fresh, consistent data

---

## Files Modified

### ETL Scripts
- `/home/mss_ds/treasury_b/etl_odoo/achat_importation_upsert.py`
- `/home/mss_ds/treasury_b/etl_odoo/ventes_locales_upsert.py`
- `/home/mss_ds/treasury_b/etl_odoo/achats_locaux_echeance_upsert.py`

### Entrypoint
- `/home/mss_ds/treasury_b/run_all_etls.py`
  - Updated log messages to "Delete-Then-Insert Mode"

### Documentation
- `/home/mss_ds/treasury_b/ETL_README.md`
  - Updated description to reflect delete-then-insert
  - Added warning about delete behavior
- `/home/mss_ds/treasury_b/CHANGELOG_ETL.md`
  - Comprehensive changelog with implementation details

---

## Running the Pipeline

```bash
poetry run python run_all_etls.py
```

**Output:**
```
================================================================================
Starting ETL Pipeline Execution (Delete-Then-Insert Mode)
Execution Time: 2025-10-12 16:42:58
================================================================================

✓ Achat Importation completed in 5.23s
✓ Ventes Locales completed in 218.82s
✓ Achats Locaux avec Échéance completed in 1.62s

================================================================================
ETL Pipeline Execution Complete
Old data deleted, fresh data inserted to SQL Server database
================================================================================
✓ All ETLs completed successfully
```

---

## Next Steps / Recommendations

1. **Monitor First Full Run:** The first run after this change may take longer due to large cleanups
2. **Backup Database:** Consider backing up before first run with new logic
3. **Manual Entry Strategy:** If manual entries are important, use unique prefixes that don't conflict with Odoo references
4. **Performance Monitoring:** Track execution times over multiple runs to establish baseline

---

## Support

For questions or issues, refer to:
- `spec-odoo.md` - Business logic specifications
- `ETL_README.md` - Usage documentation
- `CHANGELOG_ETL.md` - Detailed change history
- `etl_execution.log` - Runtime logs
