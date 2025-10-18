# Treasury ETL Pipeline

This directory contains ETL scripts to extract financial data from Odoo and insert directly to PostgreSQL database (delete old data before inserting fresh data).

## Overview

The ETL pipeline implements three financial metrics as defined in `spec-odoo.md`:

1. **Achat Importation** - Import purchases (invoices starting with "CE")
2. **Ventes Locales** - Local sales
3. **Achats Locaux avec Échéance** - Local purchases with due dates

Each ETL **deletes old data** for its type, then **inserts fresh data** to the PostgreSQL database:
- `Movement` table - Valid financial movements
- `Exception` table - Records requiring manual review

**Important:** Each ETL run deletes all existing records for that specific ETL type before inserting new data. This ensures data consistency and removes stale records.

## Quick Start

### Prerequisites

1. Install dependencies using Poetry (this project uses Poetry for dependency management):
```bash
poetry install
```

2. Configure environment variables in `.env`:
```bash
# Odoo Configuration
ODOO_URL=https://your-odoo-instance.com
ODOO_DB=your_database_name
ODOO_USERNAME=your_username
ODOO_PASSWORD=your_password
ODOO_COMPANY_ID=1
ODOO_DATE_FROM=2024-01-01  # Optional: filter by date

# PostgreSQL Configuration
PGHOST=127.0.0.1
PGPORT=5432
DB_NAME=appdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# System User (for audit trail)
SYSTEM_USER_EMAIL=system@local
SYSTEM_USER_NAME=System
SYSTEM_USER_ROLE=Admin
```

### Run All ETLs

Execute the main entrypoint to run all ETLs **in parallel** (using Poetry):

```bash
poetry run python run_all_etls.py
```

**Note:** All three ETLs run concurrently using asyncio. Total execution time is limited by the longest-running ETL (~9 seconds).

### Run Individual ETLs

You can also run ETLs individually:

```bash
poetry run python etl_jobs/achat_importation_upsert.py
poetry run python etl_jobs/ventes_locales_upsert.py
poetry run python etl_jobs/achats_locaux_echeance_upsert.py
```

## Output

### Database Tables

Data is upserted directly to PostgreSQL:
- `Movement` - Financial movements
- `Exception` - Records requiring manual review
- `Company` - Company reference data (auto-created if missing)
- `User` - System user for audit trail (auto-created if missing)

### Logging

The entrypoint script generates detailed logs:

- **Console output**: Real-time progress and summary
- **etl_execution.log**: Full execution log with timestamps

Log information includes:
- Execution time for each ETL
- Success/failure status
- Error messages if any ETL fails
- Database upsert confirmation

### Example Output

```
================================================================================
Starting ETL Pipeline Execution (Parallel Mode)
Execution Time: 2025-10-12 17:06:05
Running 3 ETLs in parallel...
================================================================================

--------------------------------------------------------------------------------
Starting ETL: Achat Importation
Description: Import purchases (invoices starting with CE)
Script: etl_jobs/achat_importation_upsert.py
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
Starting ETL: Ventes Locales
Description: Local sales
Script: etl_jobs/ventes_locales_upsert.py
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
Starting ETL: Achats Locaux avec Échéance
Description: Local purchases with due dates
Script: etl_jobs/achats_locaux_echeance_upsert.py
--------------------------------------------------------------------------------

✓ Achats Locaux avec Échéance completed successfully in 1.36 seconds
  Output: Cleaned up existing references and deleted 0 old exceptions
✓ Achat Importation completed successfully in 5.07 seconds
  Output: Cleaned up existing references and deleted 336 old exceptions
✓ Ventes Locales completed successfully in 8.67 seconds
  Output: Cleaned up existing references and deleted 533 old exceptions

================================================================================
ETL Pipeline Execution Summary
================================================================================
Total ETLs: 3
Successful: 3
Failed: 0
Total Execution Time: 8.67 seconds (0.14 minutes)

✓ SUCCESS | Achat Importation
  Duration: 5.07s

✓ SUCCESS | Ventes Locales
  Duration: 8.67s

✓ SUCCESS | Achats Locaux avec Échéance
  Duration: 1.36s

================================================================================
ETL Pipeline Execution Complete
Old data deleted, fresh data inserted to PostgreSQL database
================================================================================
✓ All ETLs completed successfully
```

**Note:** ETLs run in parallel. Total execution time equals the longest-running ETL (Ventes Locales at 8.67s), not the sum of all ETLs.

## Exception Handling

The entrypoint script handles errors gracefully:

- Each ETL runs independently
- If one ETL fails, others continue
- Failed ETLs are reported in the summary
- Exit code 1 if any ETL fails, 0 if all succeed

## Automation

### Scheduled Execution

For automated execution, use cron (Linux) or Task Scheduler (Windows):

**Cron example (daily at 6 AM):**
```bash
0 6 * * * cd /path/to/treasury && poetry run python run_all_etls.py >> cron.log 2>&1
```

### Docker

If running in Docker, ensure the container has:
- Network access to Odoo instance
- Network access to PostgreSQL database
- Proper SSL certificate handling (scripts use unverified context)
- Volume mount for logs

## Troubleshooting

### Common Issues

**Odoo Authentication Failed**
- Verify Odoo credentials in `.env` (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD)
- Check if user has API access enabled
- Ensure database name exists on Odoo server

**PostgreSQL Connection Failed**
- Verify PostgreSQL is running and accessible
- Check PostgreSQL credentials (PGHOST, PGPORT, POSTGRES_PASSWORD)
- Ensure database exists
- Verify network connectivity between ETL host and PostgreSQL
- Check firewall rules

**SSL Certificate Errors**
- Scripts use `ssl._create_unverified_context()` to bypass SSL verification
- For production, consider proper certificate validation

**Empty Results**
- Check `ODOO_DATE_FROM` filter
- Verify ODOO_COMPANY_ID matches your Odoo setup
- Review domain filters in individual ETL scripts

**Database Constraint Errors**
- Ensure Company table has matching company_id
- Check that foreign key constraints are satisfied
- Verify User table has system user

**Timeout Errors**
- Default timeout is 10 minutes per ETL
- Adjust in `run_all_etls.py` if needed for large datasets

## Monitoring

Monitor ETL health by checking:
1. Exit code (0 = success, 1 = failure)
2. `etl_execution.log` for errors
3. Database row counts in `Movement` and `Exception` tables
4. Execution time trends
5. PostgreSQL database performance metrics

## Support

For issues or questions:
- Review `spec-odoo.md` for business rules
- Check individual ETL script comments
- Examine `etl_execution.log` for detailed error messages
