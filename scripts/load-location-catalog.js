#!/usr/bin/env node
/**
 * Load location catalog into ati_fp_dashboard without PostGIS, then align
 * g2p_region / g2p_zone / g2p_woreda to the eth_* Pcodes.
 *
 * The source SQL stores MultiPolygon geometry via ST_Multi(ST_GeomFromEWKT(...)).
 * Homebrew PostGIS is built for PostgreSQL 17, while this DB runs on 18, so we
 * strip the geom column and keep the admin attributes only.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const ROOT = path.join(__dirname, '..');
const CATALOG_ROOT =
  process.env.CATALOG_DATA_DIR || path.join(ROOT, 'data', 'catalog');
const CATALOG = path.join(CATALOG_ROOT, 'location_catalog');

if (!fs.existsSync(CATALOG)) {
  console.error(`Location catalog not found at: ${CATALOG}`);
  console.error('Set CATALOG_DATA_DIR or place SQL under data/catalog/location_catalog/');
  process.exit(1);
}

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

loadEnvFile();

/**
 * Extract attribute-only value tuples from an INSERT that ends each row with
 * `, ST_Multi(ST_GeomFromEWKT('...'))`.
 */
function extractAttributeRows(sqlText) {
  const rows = [];
  let i = 0;
  while (i < sqlText.length) {
    const start = sqlText.indexOf('\n  (', i);
    if (start === -1) break;
    const geomMarker = sqlText.indexOf(', ST_Multi(ST_GeomFromEWKT(', start);
    if (geomMarker === -1) break;

    const attrs = sqlText.slice(start + 4, geomMarker).trim(); // skip "\n  ("
    // Advance past the ST_Multi(...) call and the closing ");" or "),"
    let depth = 0;
    let j = geomMarker + 2; // at 'S' of ST_Multi
    while (j < sqlText.length) {
      const ch = sqlText[j];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          j++; // past final )
          break;
        }
      } else if (ch === "'") {
        // skip quoted EWKT, handle '' escapes
        j++;
        while (j < sqlText.length) {
          if (sqlText[j] === "'" && sqlText[j + 1] === "'") {
            j += 2;
            continue;
          }
          if (sqlText[j] === "'") {
            j++;
            break;
          }
          j++;
        }
        continue;
      }
      j++;
    }
    rows.push(attrs);
    i = j;
  }
  return rows;
}

async function insertBatch(client, table, columns, valueSqlRows, chunkSize = 200) {
  for (let i = 0; i < valueSqlRows.length; i += chunkSize) {
    const chunk = valueSqlRows.slice(i, i + chunkSize);
    const sql = `INSERT INTO ${table} (${columns}) VALUES\n  (${chunk.join('),\n  (')})`;
    await client.query(sql);
  }
}

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || undefined,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || 'ati_fp_dashboard',
  });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Creating eth_* tables (attributes only, no PostGIS)...');
    await client.query(`
      DROP TABLE IF EXISTS eth_woredas CASCADE;
      DROP TABLE IF EXISTS eth_zones CASCADE;
      DROP TABLE IF EXISTS eth_regions CASCADE;

      CREATE TABLE eth_regions (
        "OBJECTID" INTEGER PRIMARY KEY,
        "admin1Name" TEXT NOT NULL,
        "admin1Pcod" TEXT UNIQUE NOT NULL,
        "admin1RefN" TEXT,
        "admin1AltN" TEXT,
        "admin1Al_1" TEXT,
        "admin0Name" TEXT,
        "admin0Pcod" TEXT,
        "date" DATE,
        "validOn" DATE,
        "validTo" DATE,
        "Shape_Leng" DOUBLE PRECISION,
        "Shape_Area" DOUBLE PRECISION
      );

      CREATE TABLE eth_zones (
        "OBJECTID" INTEGER PRIMARY KEY,
        "admin2Name" TEXT NOT NULL,
        "admin2Pcod" TEXT UNIQUE NOT NULL,
        "admin2RefN" TEXT,
        "admin2AltN" TEXT,
        "admin2Al_1" TEXT,
        "admin1Name" TEXT,
        "admin1Pcod" TEXT REFERENCES eth_regions("admin1Pcod"),
        "admin0Name" TEXT,
        "admin0Pcod" TEXT,
        "date" DATE,
        "validOn" DATE,
        "validTo" DATE,
        "Lat" DOUBLE PRECISION,
        "Long" DOUBLE PRECISION,
        "Shape_Leng" DOUBLE PRECISION,
        "Shape_Area" DOUBLE PRECISION
      );

      -- No FK on admin2Pcod: the shapefile set has 3 special-purpose woredas
      -- whose zone codes (ET0700, ET0725, ET0726) are absent from eth_zones.
      CREATE TABLE eth_woredas (
        "OBJECTID" INTEGER PRIMARY KEY,
        "admin3Name" TEXT NOT NULL,
        "admin3Pcod" TEXT UNIQUE NOT NULL,
        "admin3RefN" TEXT,
        "admin3AltN" TEXT,
        "admin3Al_1" TEXT,
        "admin2Name" TEXT,
        "admin2Pcod" TEXT,
        "admin1Name" TEXT,
        "admin1Pcod" TEXT REFERENCES eth_regions("admin1Pcod"),
        "admin0Name" TEXT,
        "admin0Pcod" TEXT,
        "date" DATE,
        "validOn" DATE,
        "validTo" DATE,
        "Shape_Leng" DOUBLE PRECISION,
        "Shape_Area" DOUBLE PRECISION
      );
    `);

    const regionCols =
      '"OBJECTID", "admin1Name", "admin1Pcod", "admin1RefN", "admin1AltN", "admin1Al_1", "admin0Name", "admin0Pcod", "date", "validOn", "validTo", "Shape_Leng", "Shape_Area"';
    const zoneCols =
      '"OBJECTID", "admin2Name", "admin2Pcod", "admin2RefN", "admin2AltN", "admin2Al_1", "admin1Name", "admin1Pcod", "admin0Name", "admin0Pcod", "date", "validOn", "validTo", "Lat", "Long", "Shape_Leng", "Shape_Area"';
    const woredaCols =
      '"OBJECTID", "admin3Name", "admin3Pcod", "admin3RefN", "admin3AltN", "admin3Al_1", "admin2Name", "admin2Pcod", "admin1Name", "admin1Pcod", "admin0Name", "admin0Pcod", "date", "validOn", "validTo", "Shape_Leng", "Shape_Area"';

    for (const [file, table, cols] of [
      ['eth_regions.sql', 'eth_regions', regionCols],
      ['eth_zones.sql', 'eth_zones', zoneCols],
      ['eth_woredas.sql', 'eth_woredas', woredaCols],
    ]) {
      const filePath = path.join(CATALOG, file);
      console.log(`Parsing ${file} (${(fs.statSync(filePath).size / 1e6).toFixed(1)} MB)...`);
      const sqlText = fs.readFileSync(filePath, 'utf8');
      const rows = extractAttributeRows(sqlText);
      console.log(`  extracted ${rows.length} attribute rows → inserting into ${table}`);
      await insertBatch(client, table, cols, rows, table === 'eth_woredas' ? 100 : 200);
    }

    // Synthesize missing zone rows so g2p_woreda FKs can resolve for SP woredas.
    const stubs = await client.query(`
      INSERT INTO eth_zones (
        "OBJECTID", "admin2Name", "admin2Pcod", "admin1Name", "admin1Pcod",
        "admin0Name", "admin0Pcod"
      )
      SELECT
        900000 + ROW_NUMBER() OVER (ORDER BY w."admin2Pcod"),
        COALESCE(NULLIF(w."admin2Name", ''), w."admin2Pcod" || ' (synthetic)'),
        w."admin2Pcod",
        w."admin1Name",
        w."admin1Pcod",
        w."admin0Name",
        w."admin0Pcod"
      FROM (
        SELECT DISTINCT ON (w."admin2Pcod")
          w."admin2Pcod", w."admin2Name", w."admin1Name", w."admin1Pcod",
          w."admin0Name", w."admin0Pcod"
        FROM eth_woredas w
        LEFT JOIN eth_zones z ON z."admin2Pcod" = w."admin2Pcod"
        WHERE z."admin2Pcod" IS NULL
        ORDER BY w."admin2Pcod"
      ) w
      RETURNING "admin2Pcod", "admin2Name"
    `);
    if (stubs.rows.length) {
      console.log(`Inserted ${stubs.rows.length} synthetic eth_zones for orphan woreda zone codes:`);
      for (const r of stubs.rows) console.log(`  ${r.admin2Pcod} → ${r.admin2Name}`);
    }

    console.log('Aligning g2p_* admin tables to eth_* Pcodes (preserving existing IDs)...');

    // Regions: update names for matching codes, insert any missing
    await client.query(`
      UPDATE g2p_region g
      SET name = e."admin1Name"
      FROM eth_regions e
      WHERE g.code = e."admin1Pcod"
        AND g.name IS DISTINCT FROM e."admin1Name";

      INSERT INTO g2p_region (name, code)
      SELECT e."admin1Name", e."admin1Pcod"
      FROM eth_regions e
      WHERE NOT EXISTS (SELECT 1 FROM g2p_region g WHERE g.code = e."admin1Pcod");
    `);

    await client.query(`
      UPDATE g2p_zone z
      SET name = e."admin2Name",
          region = r.id
      FROM eth_zones e
      JOIN g2p_region r ON r.code = e."admin1Pcod"
      WHERE z.code = e."admin2Pcod"
        AND (z.name IS DISTINCT FROM e."admin2Name" OR z.region IS DISTINCT FROM r.id);

      INSERT INTO g2p_zone (name, code, region)
      SELECT e."admin2Name", e."admin2Pcod", r.id
      FROM eth_zones e
      JOIN g2p_region r ON r.code = e."admin1Pcod"
      WHERE NOT EXISTS (SELECT 1 FROM g2p_zone z WHERE z.code = e."admin2Pcod");
    `);

    await client.query(`
      UPDATE g2p_woreda w
      SET name = e."admin3Name",
          zone = z.id
      FROM eth_woredas e
      JOIN g2p_zone z ON z.code = e."admin2Pcod"
      WHERE w.code = e."admin3Pcod"
        AND (w.name IS DISTINCT FROM e."admin3Name" OR w.zone IS DISTINCT FROM z.id);

      INSERT INTO g2p_woreda (name, code, zone)
      SELECT e."admin3Name", e."admin3Pcod", z.id
      FROM eth_woredas e
      JOIN g2p_zone z ON z.code = e."admin2Pcod"
      WHERE NOT EXISTS (SELECT 1 FROM g2p_woreda w WHERE w.code = e."admin3Pcod");
    `);

    // Helpful indexes for catalog lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS eth_regions_pcod_idx ON eth_regions ("admin1Pcod");
      CREATE INDEX IF NOT EXISTS eth_zones_pcod_idx ON eth_zones ("admin2Pcod");
      CREATE INDEX IF NOT EXISTS eth_zones_region_pcod_idx ON eth_zones ("admin1Pcod");
      CREATE INDEX IF NOT EXISTS eth_woredas_pcod_idx ON eth_woredas ("admin3Pcod");
      CREATE INDEX IF NOT EXISTS eth_woredas_zone_pcod_idx ON eth_woredas ("admin2Pcod");
    `);

    await client.query('COMMIT');

    const counts = await client.query(`
      SELECT 'eth_regions' AS t, COUNT(*)::int AS n FROM eth_regions
      UNION ALL SELECT 'eth_zones', COUNT(*)::int FROM eth_zones
      UNION ALL SELECT 'eth_woredas', COUNT(*)::int FROM eth_woredas
      UNION ALL SELECT 'g2p_region', COUNT(*)::int FROM g2p_region
      UNION ALL SELECT 'g2p_zone', COUNT(*)::int FROM g2p_zone
      UNION ALL SELECT 'g2p_woreda', COUNT(*)::int FROM g2p_woreda
      ORDER BY 1
    `);
    console.log('\nCounts after load + align:');
    for (const row of counts.rows) {
      console.log(`  ${row.t.padEnd(14)} ${row.n}`);
    }

    // Sanity: every eth Pcode should exist in g2p
    const missing = await client.query(`
      SELECT 'region' AS level, e."admin1Pcod" AS code, e."admin1Name" AS name
      FROM eth_regions e
      LEFT JOIN g2p_region g ON g.code = e."admin1Pcod"
      WHERE g.id IS NULL
      UNION ALL
      SELECT 'zone', e."admin2Pcod", e."admin2Name"
      FROM eth_zones e
      LEFT JOIN g2p_zone g ON g.code = e."admin2Pcod"
      WHERE g.id IS NULL
      UNION ALL
      SELECT 'woreda', e."admin3Pcod", e."admin3Name"
      FROM eth_woredas e
      LEFT JOIN g2p_woreda g ON g.code = e."admin3Pcod"
      WHERE g.id IS NULL
      LIMIT 20
    `);
    if (missing.rows.length) {
      console.warn('WARNING: eth rows missing from g2p:', missing.rows);
    } else {
      console.log('All eth_* Pcodes present in g2p_*.');
    }

    // Confirm farmer FKs still valid
    const orphans = await client.query(`
      SELECT COUNT(*)::int AS n FROM res_partner rp
      WHERE rp.region IS NOT NULL AND NOT EXISTS (SELECT 1 FROM g2p_region r WHERE r.id = rp.region)
         OR rp.zone IS NOT NULL AND NOT EXISTS (SELECT 1 FROM g2p_zone z WHERE z.id = rp.zone)
         OR rp.woreda IS NOT NULL AND NOT EXISTS (SELECT 1 FROM g2p_woreda w WHERE w.id = rp.woreda)
    `);
    console.log(`Orphan farmer location FKs: ${orphans.rows[0].n}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Location load failed:', err.message);
  process.exit(1);
});
