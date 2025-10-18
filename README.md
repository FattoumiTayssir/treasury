# Treasury ETL

This project contains ETL scripts to fetch financial data from Odoo and load it into a PostgreSQL database.

- Postgres schema: `init/postgres/10-schema.sql`
- CSV extractors: `etl_achat_importation_to_csv.py`, `etl_ventes_locales_to_csv.py`
- DB jobs: package `etl_jobs/`

Run with Poetry:

- `poetry install`
- `poetry run python -m etl_jobs.job_achat_importation`
- `poetry run python -m etl_jobs.job_ventes_locales`
