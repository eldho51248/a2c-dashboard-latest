-- Local development schema for the Farmer Profile Dashboard.
-- This is a minimal stand-in for the Odoo/OpenG2P tables the dashboard reads.
-- It only models the columns referenced by lib/chart-queries.ts and lib/database.ts.

DROP TABLE IF EXISTS g2p_hh_income_res_partner_rel CASCADE;
DROP TABLE IF EXISTS g2p_hh_income CASCADE;
DROP TABLE IF EXISTS g2p_group_membership CASCADE;
DROP TABLE IF EXISTS g2p_land_information CASCADE;
DROP TABLE IF EXISTS g2p_reg_id CASCADE;
DROP TABLE IF EXISTS g2p_id_type CASCADE;
DROP TABLE IF EXISTS res_partner CASCADE;
DROP TABLE IF EXISTS g2p_kebele CASCADE;
DROP TABLE IF EXISTS g2p_woreda CASCADE;
DROP TABLE IF EXISTS g2p_zone CASCADE;
DROP TABLE IF EXISTS g2p_region CASCADE;

-- Administrative hierarchy. `code` holds the HDX Pcode (ET01, ET0101, ET010101)
-- so it joins against the bundled topojson in public/maps.
CREATE TABLE g2p_region (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE
);

CREATE TABLE g2p_zone (
  id     SERIAL PRIMARY KEY,
  name   TEXT NOT NULL,
  code   TEXT UNIQUE,
  region INTEGER REFERENCES g2p_region(id)
);

CREATE TABLE g2p_woreda (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  zone INTEGER REFERENCES g2p_zone(id)
);

CREATE TABLE g2p_kebele (
  id     SERIAL PRIMARY KEY,
  name   TEXT NOT NULL,
  code   TEXT UNIQUE,
  woreda INTEGER REFERENCES g2p_woreda(id)
);

CREATE TABLE res_partner (
  id                     SERIAL PRIMARY KEY,
  name                   TEXT,
  gender                 TEXT,
  active                 BOOLEAN DEFAULT TRUE,
  is_registrant          BOOLEAN DEFAULT TRUE,
  is_group               BOOLEAN DEFAULT FALSE,
  is_farmer              TEXT,
  farming_type           TEXT,
  education              TEXT,
  occupation             TEXT,
  age_int                INTEGER,
  size_of_family         INTEGER,
  total_land_area        NUMERIC(12, 4),
  total_land_owned_area  NUMERIC(12, 4),
  hh_is_household_head   TEXT,
  is_disabled            TEXT,
  has_national_id        TEXT,
  primary_commodity_name TEXT,
  is_psnp_user           BOOLEAN DEFAULT FALSE,
  db_import              TEXT,
  farmer_id              TEXT,
  -- The filter builder writes to rp.state while the filter dropdown is populated
  -- from rp.imported_record_state, so both are kept in sync by the seeder.
  state                  TEXT,
  imported_record_state  TEXT,
  registration_date      TIMESTAMP,
  create_date            TIMESTAMP DEFAULT NOW(),
  region                 INTEGER REFERENCES g2p_region(id),
  zone                   INTEGER REFERENCES g2p_zone(id),
  woreda                 INTEGER REFERENCES g2p_woreda(id),
  kebele                 INTEGER REFERENCES g2p_kebele(id)
);

CREATE TABLE g2p_id_type (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE g2p_reg_id (
  id         SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES res_partner(id) ON DELETE CASCADE,
  id_type    INTEGER REFERENCES g2p_id_type(id),
  value      TEXT
);

CREATE TABLE g2p_land_information (
  id              SERIAL PRIMARY KEY,
  partner_id      INTEGER REFERENCES res_partner(id) ON DELETE CASCADE,
  total_land_area NUMERIC(12, 4),
  ownership_type  TEXT
);

CREATE TABLE g2p_group_membership (
  id         SERIAL PRIMARY KEY,
  individual INTEGER REFERENCES res_partner(id) ON DELETE CASCADE,
  "group"    INTEGER,
  status     TEXT
);

CREATE TABLE g2p_hh_income (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT
);

CREATE TABLE g2p_hh_income_res_partner_rel (
  g2p_hh_income_id INTEGER REFERENCES g2p_hh_income(id) ON DELETE CASCADE,
  res_partner_id   INTEGER REFERENCES res_partner(id) ON DELETE CASCADE,
  PRIMARY KEY (g2p_hh_income_id, res_partner_id)
);
