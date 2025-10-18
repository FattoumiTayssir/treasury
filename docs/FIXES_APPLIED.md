# ETL Fixes Applied - October 17, 2025

## Problem Summary
The ETL pipeline was failing with two main issues:
1. **Table name case mismatch**: PostgreSQL tables were created with specific casing but ETL scripts used different casing
2. **Deprecated datetime function**: Using `datetime.utcnow()` which is deprecated in Python 3.12+

## Fixes Applied

### 1. Fixed Table Name Case Sensitivity

PostgreSQL created tables with the following names:
- `"Exception"` (capital E, with quotes - preserves case)
- `"User"` (capital U, with quotes - preserves case)
- `company`, `movement`, `manual_entry`, `user_company` (lowercase, no quotes)

**Issue**: ETL scripts were referencing `exception` (lowercase) but the table exists as `"Exception"` (capital E).

**Solution**: Updated all ETL scripts to use correct table names with proper quoting:

#### Files Modified:
- `/home/mss_ds/treasury/etl_jobs/achat_importation_upsert.py`
- `/home/mss_ds/treasury/etl_jobs/ventes_locales_upsert.py`
- `/home/mss_ds/treasury/etl_jobs/achats_locaux_echeance_upsert.py`

#### Changes Made:
```python
# BEFORE (incorrect)
cur.execute('DELETE FROM exception WHERE type = %s', (ETL_TYPE,))
INSERT INTO exception(company_id, ...) VALUES (...)

# AFTER (correct)
cur.execute('DELETE FROM "Exception" WHERE type = %s', (ETL_TYPE,))
INSERT INTO "Exception"(company_id, ...) VALUES (...)
```

### 2. Fixed Deprecated datetime.utcnow()

**Issue**: Python 3.12+ deprecates `datetime.utcnow()` in favor of timezone-aware datetime objects.

**Solution**: Replaced with `datetime.now(UTC)`:

```python
# BEFORE (deprecated)
from datetime import date, datetime
NOW_ISO = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")

# AFTER (correct)
from datetime import date, datetime, UTC
NOW_ISO = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
```

### 3. Schema Verification

Confirmed the PostgreSQL schema now includes all extended Manual_Entry columns:
- `manual_entry_id` (PRIMARY KEY)
- `frequency` (VARCHAR(20), NOT NULL)
- `dates_list` (JSONB, NOT NULL)
- `start_date` (DATE, nullable) ⭐ NEW
- `timezone` (VARCHAR(64), nullable) ⭐ NEW
- `recurrence` (JSONB, nullable) ⭐ NEW
- `rrule` (VARCHAR(512), nullable) ⭐ NEW
- `metadata` (JSONB, nullable) ⭐ NEW

## Test Results

### ETL Pipeline Execution
```
✓ All ETLs completed successfully
Total ETLs: 3
Successful: 3
Failed: 0
Total Execution Time: 3.44 seconds (0.06 minutes)
```

### Individual ETL Results
- **✓ Achat Importation**: 2.28s (Import purchases with CE invoices)
- **✓ Ventes Locales**: 3.43s (Local sales)
- **✓ Achats Locaux avec Échéance**: 0.76s (Local purchases with due dates)

### Database State
- **Movements**: 109 records inserted
- **Exceptions**: 880 records inserted

## How to Run ETLs

### Prerequisites
1. PostgreSQL database running: `docker-compose up -d postgres`
2. Valid Odoo credentials in `.env` file

### Running ETLs
```bash
# Run all ETLs in parallel
poetry run python run_all_etls.py

# Run individual ETL jobs
poetry run python etl_jobs/achat_importation_upsert.py
poetry run python etl_jobs/ventes_locales_upsert.py
poetry run python etl_jobs/achats_locaux_echeance_upsert.py
```

## PostgreSQL Case Sensitivity Notes

In PostgreSQL:
- **Quoted identifiers** (`"Exception"`, `"User"`) preserve exact case
- **Unquoted identifiers** (`movement`, `company`) are folded to lowercase
- Always use double quotes when referencing case-sensitive table names in queries

## Summary

✅ Schema updated to match treasury_b  
✅ All table name references corrected  
✅ Deprecated datetime function replaced  
✅ All ETL jobs running successfully  
✅ Data properly inserted into PostgreSQL database  

The treasury ETL pipeline is now fully operational and compatible with the new schema!
