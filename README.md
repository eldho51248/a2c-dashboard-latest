# ATI Farmer Profile Dashboard

Next.js dashboard over a local PostgreSQL database shaped like Odoo / OpenG2P farmer registry tables, plus crop, seed, livestock, and location catalogs.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (`createdb`, `psql` on your `PATH`)

## Getting Started

```bash
npm install
cp .env.example .env   # set DB_USER / DB_PASSWORD if needed
npm run db:setup       # create DB, seed farmers, load catalogs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database scripts

| Command | What it does |
|---------|----------------|
| `npm run db:setup` | Create `ati_fp_dashboard` if missing, seed synthetic farmers, load all catalogs |
| `npm run db:seed` | Apply `scripts/local-schema.sql` and insert synthetic registry data |
| `npm run db:catalog` | Load crop / seed / livestock / location SQL from `data/catalog` |

Optional farmer count:

```bash
npm run db:setup -- --farmers 6000
# or
node scripts/seed-local-db.js --farmers 6000
```

Catalog SQL ships under `data/catalog/`. Override the path with `CATALOG_DATA_DIR` if needed.

### Environment

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=ati_fp_dashboard
```

## Project notes

- Map choropleths use `public/maps/*.topojson.br`, joined to DB admin rows by HDX Pcode (`g2p_*.code`).
- Location catalog geometry is stripped at load time (no PostGIS required); attributes are aligned into `g2p_region` / `g2p_zone` / `g2p_woreda`.
- Docker Compose runs the app only; Postgres is expected on the host (or point `.env` at another instance).
