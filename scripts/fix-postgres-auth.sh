#!/usr/bin/env bash
set -euo pipefail

PGVER=18
HBA_CONF="/etc/postgresql/${PGVER}/main/pg_hba.conf"
DB_NAME="ati_fp_dashboard"
DB_PASS="postgres123"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "======================================================"
echo " ATI Dashboard — PostgreSQL Setup"
echo "======================================================"
echo "This will ask for your SYSTEM (eldho) sudo password:"
echo ""

sudo bash -c "
  su -c \"psql -c \\\"ALTER USER postgres WITH PASSWORD '${DB_PASS}';\\\"\" postgres &&
  echo 'host all all 127.0.0.1/32 md5' >> '${HBA_CONF}' &&
  pg_ctlcluster ${PGVER} main reload &&
  echo '✅ Auth configured.'
"

sleep 1

cd "$ROOT"
export DB_HOST=127.0.0.1 DB_PORT=5432 DB_USER=postgres DB_PASSWORD="${DB_PASS}" DB_NAME="${DB_NAME}"
export PGPASSWORD="${DB_PASS}" PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres

psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || createdb "$DB_NAME"
echo "=== Seeding farmers ===" && node "$ROOT/scripts/seed-local-db.js"
echo "=== Catalog data ===" && "$ROOT/scripts/load-catalog-data.sh"
echo "=== A2C data ===" && "$ROOT/scripts/load-a2c-data.sh"
echo "=== DevOps data ===" && "$ROOT/scripts/load-devops-data.sh"
echo ""
echo "✅ Done! Refresh http://localhost:9000"
