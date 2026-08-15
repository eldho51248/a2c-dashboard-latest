#!/usr/bin/env bash
# Load all Catalog Data SQL into the local ati_fp_dashboard database.
# Crop / seed / livestock load as-is. Location is transformed (no PostGIS)
# and aligned into g2p_region / g2p_zone / g2p_woreda by Pcode.
#
# Usage: ./scripts/load-catalog-data.sh
# Optional: CATALOG_DATA_DIR=/path/to/catalog ./scripts/load-catalog-data.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CATALOG="${CATALOG_DATA_DIR:-$ROOT/data/catalog}"

# Prefer Homebrew Postgres if present, otherwise use whatever `psql` is on PATH.
if [[ -d /opt/homebrew/opt/postgresql@18/bin ]]; then
  export PATH="/opt/homebrew/opt/postgresql@18/bin:${PATH}"
elif [[ -d /opt/homebrew/opt/postgresql@17/bin ]]; then
  export PATH="/opt/homebrew/opt/postgresql@17/bin:${PATH}"
elif [[ -d /usr/local/opt/postgresql@18/bin ]]; then
  export PATH="/usr/local/opt/postgresql@18/bin:${PATH}"
fi

# shellcheck disable=SC1091
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^[A-Z0-9_]+=' "$ROOT/.env")
  set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ati_fp_dashboard}"
DB_USER="${DB_USER:-$USER}"
PSQL=(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1)

if [[ -n "${DB_PASSWORD:-}" ]]; then
  export PGPASSWORD="$DB_PASSWORD"
fi

if [[ ! -d "$CATALOG/crop_catalog" ]]; then
  echo "Catalog data not found at: $CATALOG" >&2
  echo "Expected crop_catalog/, seed_catalog/, livestock_catalog/, location_catalog/" >&2
  echo "Set CATALOG_DATA_DIR or place SQL under data/catalog/." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install PostgreSQL client tools and retry." >&2
  exit 1
fi

echo "Loading catalogs into ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo "Source: ${CATALOG}"

echo ""
echo "=== Crop catalog ==="
(cd "$CATALOG/crop_catalog" && "${PSQL[@]}" -f run_all.sql)

echo ""
echo "=== Seed catalog ==="
(cd "$CATALOG/seed_catalog" && "${PSQL[@]}" -f run_all.sql)

echo ""
echo "=== Livestock catalog ==="
(cd "$CATALOG/livestock_catalog" && "${PSQL[@]}" -f run_all.sql)

echo ""
echo "=== Location catalog (aligned into eth_* + g2p_*) ==="
CATALOG_DATA_DIR="$CATALOG" node "$ROOT/scripts/load-location-catalog.js"

echo ""
echo "Done."
