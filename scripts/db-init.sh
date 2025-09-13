#!/usr/bin/env bash
set -euo pipefail

: "${SA_PASSWORD:?SA_PASSWORD environment variable must be set}"
: "${DB_NAME:=appdb}"
: "${SQL_HOST:=sql}"
: "${SQL_PORT:=1433}"

SQLCMD=/opt/mssql-tools18/bin/sqlcmd
if ! command -v "$SQLCMD" >/dev/null 2>&1; then
  # Fallback for older tools path
  SQLCMD=/opt/mssql-tools/bin/sqlcmd
fi

if ! command -v "$SQLCMD" >/dev/null 2>&1; then
  echo "sqlcmd not found in container. Ensure mcr.microsoft.com/mssql-tools image is used."
  exit 1
fi

# Determine encryption flag: v18 uses encryption by default and supports -C to trust cert
ENC_FLAG=""
if [[ "$SQLCMD" == *"tools18"* ]]; then
  ENC_FLAG="-C"
fi

# Wait for SQL Server to accept connections
echo "Waiting for SQL Server at ${SQL_HOST}:${SQL_PORT} to be ready..."
ATTEMPTS=90
for i in $(seq 1 "$ATTEMPTS"); do
  if "$SQLCMD" -S "${SQL_HOST},${SQL_PORT}" -U sa -P "$SA_PASSWORD" ${ENC_FLAG} -l 2 -Q "SELECT 1" >/dev/null 2>&1; then
    echo "SQL Server is ready."
    break
  fi
  echo "Attempt ${i}/${ATTEMPTS}: SQL not ready yet..."
  sleep 3
  if [[ "$i" -eq "$ATTEMPTS" ]]; then
    echo "ERROR: SQL Server did not become ready in time." >&2
    exit 1
  fi
done

set -x
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

# Prepend :setvar DB_NAME to each SQL file to avoid reliance on -v (works across sqlcmd versions)
for f in "/init/00-create-database.sql" "/init/10-schema.sql" "/init/20-seed.sql"; do
  base="$(basename "$f")"
  {
    printf ':setvar DB_NAME %s\n' "$DB_NAME"
    cat "$f"
  } >"$TMPDIR/$base"
done

"$SQLCMD" -S "${SQL_HOST},${SQL_PORT}" -U sa -P "$SA_PASSWORD" ${ENC_FLAG} -b -l 30 -i "$TMPDIR/00-create-database.sql"
"$SQLCMD" -S "${SQL_HOST},${SQL_PORT}" -U sa -P "$SA_PASSWORD" ${ENC_FLAG} -b -l 60 -i "$TMPDIR/10-schema.sql"
"$SQLCMD" -S "${SQL_HOST},${SQL_PORT}" -U sa -P "$SA_PASSWORD" ${ENC_FLAG} -b -l 120 -i "$TMPDIR/20-seed.sql"
set +x

echo "Initialization completed successfully."
