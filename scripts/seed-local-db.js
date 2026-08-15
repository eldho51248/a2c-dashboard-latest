#!/usr/bin/env node

// Seeds a local Postgres database with a synthetic dataset shaped like the
// Odoo/OpenG2P tables the dashboard queries. Geography is derived from the
// topojson in public/maps so region/zone/woreda codes match the choropleth.
//
// Usage: node scripts/seed-local-db.js [--farmers 6000]

const fs = require('fs');
const path = require('path');
const { brotliDecompressSync } = require('zlib');
const { Pool } = require('pg');

const ROOT = path.join(__dirname, '..');

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

const argv = process.argv.slice(2);
const farmerArgIndex = argv.indexOf('--farmers');
const FARMER_COUNT = farmerArgIndex !== -1 ? parseInt(argv[farmerArgIndex + 1], 10) : 6000;
// Registrants who are not farmers, so farmer counts differ from registrant counts.
const NON_FARMER_COUNT = Math.round(FARMER_COUNT * 0.18);

// Deterministic RNG keeps reruns reproducible.
let seedState = 0x9e3779b9;
function random() {
  seedState |= 0;
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const randInt = (min, max) => min + Math.floor(random() * (max - min + 1));
const pick = (arr) => arr[Math.floor(random() * arr.length)];

function weightedPick(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function readTopoProperties(fileName) {
  const buf = fs.readFileSync(path.join(ROOT, 'public', 'maps', fileName));
  const topo = JSON.parse(brotliDecompressSync(buf).toString('utf8'));
  const key = Object.keys(topo.objects)[0];
  return topo.objects[key].geometries.map((g) => g.properties);
}

const FARMING_TYPES = [
  ['Crop Production', 42],
  ['Mixed Farming', 28],
  ['Livestock Rearing', 18],
  ['Agroforestry', 7],
  ['Beekeeping', 5],
];
const EDUCATION_LEVELS = [
  ['No Formal Education', 34],
  ['Primary Education', 30],
  ['Secondary Education', 20],
  ['TVET', 9],
  ['Diploma', 5],
  ['Degree', 2],
];
const RECORD_STATES = [
  ['approved', 46],
  ['pending', 24],
  ['draft', 18],
  ['under_review', 8],
  ['rejected', 4],
];
const OWNERSHIP_TYPES = [
  ['owner', 62],
  ['rented', 26],
  ['shared', 12],
];
const MEMBERSHIP_STATUSES = [
  ['Head', 45],
  ['Wife', 22],
  ['Husband', 8],
  ['Son', 13],
  ['Daughter', 12],
];
const INCOME_SOURCES = [
  ['Crop Sales', 'INC01'],
  ['Livestock Sales', 'INC02'],
  ['Wage Labour', 'INC03'],
  ['Petty Trade', 'INC04'],
  ['Remittance', 'INC05'],
  ['Safety Net Transfer', 'INC06'],
  ['Beekeeping Products', 'INC07'],
];
const COMMODITIES = ['Teff', 'Maize', 'Wheat', 'Sorghum', 'Barley', 'Coffee', 'Sesame', 'Haricot Bean'];

const FIRST_NAMES = [
  'Abebe', 'Almaz', 'Bekele', 'Birtukan', 'Chala', 'Desta', 'Eyob', 'Fatuma', 'Genet', 'Girma',
  'Hana', 'Hailu', 'Kebede', 'Lemlem', 'Mulugeta', 'Meseret', 'Nigatu', 'Rahel', 'Solomon', 'Tigist',
  'Tadesse', 'Workneh', 'Yeshi', 'Zenebe', 'Aster', 'Dawit', 'Selam', 'Getachew',
];
const LAST_NAMES = [
  'Tesfaye', 'Mekonnen', 'Alemu', 'Gebre', 'Wolde', 'Haile', 'Assefa', 'Tadesse', 'Bekele',
  'Negash', 'Kassa', 'Abera', 'Demeke', 'Fikru', 'Getahun', 'Mamo',
];

async function insertBatch(client, sql, columnCount, rows, chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const placeholders = chunk
      .map((_, r) => `(${Array.from({ length: columnCount }, (_, c) => `$${r * columnCount + c + 1}`).join(',')})`)
      .join(',');
    await client.query(sql.replace('__VALUES__', placeholders), chunk.flat());
  }
}

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || undefined,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || undefined,
  });

  const client = await pool.connect();
  try {
    console.log('Applying schema...');
    await client.query(fs.readFileSync(path.join(__dirname, 'local-schema.sql'), 'utf8'));

    // --- Geography, taken from the bundled map files ---
    const regionProps = readTopoProperties('regions.topojson.br');
    const zoneProps = readTopoProperties('zones.topojson.br');
    const woredaProps = readTopoProperties('woredas.topojson.br');

    const regionRows = regionProps.map((p) => [p.admin1Name, p.admin1Pcod]);
    await insertBatch(client, 'INSERT INTO g2p_region (name, code) VALUES __VALUES__', 2, regionRows);
    const regionIdByCode = new Map(
      (await client.query('SELECT id, code FROM g2p_region')).rows.map((r) => [r.code, r.id])
    );

    const zoneRows = zoneProps
      .filter((p) => regionIdByCode.has(p.admin1Pcod))
      .map((p) => [p.admin2Name, p.admin2Pcod, regionIdByCode.get(p.admin1Pcod)]);
    await insertBatch(client, 'INSERT INTO g2p_zone (name, code, region) VALUES __VALUES__', 3, zoneRows);
    const zoneIdByCode = new Map(
      (await client.query('SELECT id, code FROM g2p_zone')).rows.map((r) => [r.code, r.id])
    );

    const woredaRows = woredaProps
      .filter((p) => zoneIdByCode.has(p.admin2Pcod))
      .map((p) => [p.admin3Name, p.admin3Pcod, zoneIdByCode.get(p.admin2Pcod)]);
    await insertBatch(client, 'INSERT INTO g2p_woreda (name, code, zone) VALUES __VALUES__', 3, woredaRows);
    const woredas = (await client.query('SELECT id, name, code, zone FROM g2p_woreda')).rows;

    // Kebeles have no map layer, so synthesise a few per woreda.
    const kebeleRows = [];
    for (const w of woredas) {
      for (let i = 1; i <= 3; i++) {
        kebeleRows.push([`${w.name} Kebele ${i}`, `${w.code}${String(i).padStart(2, '0')}`, w.id]);
      }
    }
    await insertBatch(client, 'INSERT INTO g2p_kebele (name, code, woreda) VALUES __VALUES__', 3, kebeleRows);

    console.log(
      `Geography: ${regionRows.length} regions, ${zoneRows.length} zones, ${woredaRows.length} woredas, ${kebeleRows.length} kebeles`
    );

    // Lookup tables
    await client.query("INSERT INTO g2p_id_type (name) VALUES ('UID'), ('Farmer ID'), ('Passport')");
    const uidTypeId = (await client.query("SELECT id FROM g2p_id_type WHERE name = 'UID'")).rows[0].id;
    await insertBatch(client, 'INSERT INTO g2p_hh_income (name, code) VALUES __VALUES__', 2, INCOME_SOURCES);
    const incomeIds = (await client.query('SELECT id FROM g2p_hh_income ORDER BY id')).rows.map((r) => r.id);

    // Build a zone -> region and woreda -> zone lookup for consistent assignment.
    const zoneById = new Map(
      (await client.query('SELECT id, region FROM g2p_zone')).rows.map((r) => [r.id, r.region])
    );
    const kebelesByWoreda = new Map();
    for (const k of (await client.query('SELECT id, woreda FROM g2p_kebele')).rows) {
      if (!kebelesByWoreda.has(k.woreda)) kebelesByWoreda.set(k.woreda, []);
      kebelesByWoreda.get(k.woreda).push(k.id);
    }

    // Give each woreda a persistent weight so some areas are denser than others.
    const woredaWeights = woredas.map((w) => [w, 1 + random() * 9]);

    console.log(`Generating ${FARMER_COUNT} farmers and ${NON_FARMER_COUNT} non-farmer registrants...`);
    const partnerRows = [];

    function buildPartner(isFarmer) {
      const woreda = weightedPick(woredaWeights);
      const zoneId = woreda.zone;
      const regionId = zoneById.get(zoneId);
      const kebeleId = pick(kebelesByWoreda.get(woreda.id));
      const gender = random() < 0.41 ? 'female' : 'male';
      const age = weightedPick([
        [randInt(18, 29), 22],
        [randInt(30, 49), 40],
        [randInt(50, 64), 26],
        [randInt(65, 88), 12],
      ]);
      const isHead = random() < (gender === 'male' ? 0.72 : 0.31);
      const totalLand = isFarmer ? Math.round((0.25 + random() * 9.75) * 100) / 100 : null;
      const ownedLand = isFarmer && random() < 0.68 ? Math.round(totalLand * (0.3 + random() * 0.7) * 100) / 100 : 0;
      const state = weightedPick(RECORD_STATES);
      const year = weightedPick([[2021, 8], [2022, 14], [2023, 22], [2024, 30], [2025, 26]]);
      const registrationDate = new Date(year, randInt(0, 11), randInt(1, 28));

      return [
        `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        gender,
        true,
        true,
        false,
        isFarmer ? 'yes' : 'no',
        isFarmer ? weightedPick(FARMING_TYPES) : null,
        weightedPick(EDUCATION_LEVELS),
        isFarmer ? 'Farmer' : pick(['Trader', 'Teacher', 'Labourer', 'Driver']),
        age,
        randInt(1, 11),
        totalLand,
        ownedLand,
        isHead ? 'yes' : 'no',
        random() < 0.06 ? 'yes' : 'no',
        random() < 0.72 ? 'yes' : 'no',
        isFarmer ? pick(COMMODITIES) : null,
        random() < 0.22,
        random() < 0.63 ? 'yes' : 'no',
        random() < 0.78 ? `FRM-${randInt(100000, 999999)}` : null,
        state,
        state,
        registrationDate,
        regionId,
        zoneId,
        woreda.id,
        kebeleId,
      ];
    }

    for (let i = 0; i < FARMER_COUNT; i++) partnerRows.push(buildPartner(true));
    for (let i = 0; i < NON_FARMER_COUNT; i++) partnerRows.push(buildPartner(false));

    const partnerSql = `INSERT INTO res_partner (
      name, gender, active, is_registrant, is_group, is_farmer, farming_type, education, occupation,
      age_int, size_of_family, total_land_area, total_land_owned_area, hh_is_household_head,
      is_disabled, has_national_id, primary_commodity_name, is_psnp_user, db_import, farmer_id,
      state, imported_record_state, registration_date, region, zone, woreda, kebele
    ) VALUES __VALUES__`;
    await insertBatch(client, partnerSql, 27, partnerRows, 200);

    const farmers = (await client.query(
      "SELECT id, total_land_area FROM res_partner WHERE is_farmer = 'yes' ORDER BY id"
    )).rows;

    // Land parcels
    const landRows = [];
    for (const f of farmers) {
      if (random() > 0.82) continue;
      const parcels = weightedPick([[1, 55], [2, 30], [3, 15]]);
      const totalArea = Number(f.total_land_area) || 1;
      for (let i = 0; i < parcels; i++) {
        landRows.push([f.id, Math.round((totalArea / parcels) * 100) / 100, weightedPick(OWNERSHIP_TYPES)]);
      }
    }
    await insertBatch(
      client,
      'INSERT INTO g2p_land_information (partner_id, total_land_area, ownership_type) VALUES __VALUES__',
      3,
      landRows,
      400
    );

    // National IDs (UID) drive the "farmers with ID" KPI
    const regIdRows = farmers
      .filter(() => random() < 0.66)
      .map((f) => [f.id, uidTypeId, `UID${String(f.id).padStart(8, '0')}`]);
    await insertBatch(client, 'INSERT INTO g2p_reg_id (partner_id, id_type, value) VALUES __VALUES__', 3, regIdRows, 400);

    // Household membership
    const membershipRows = farmers
      .filter(() => random() < 0.84)
      .map((f) => [f.id, randInt(1, Math.ceil(FARMER_COUNT / 4)), weightedPick(MEMBERSHIP_STATUSES)]);
    await insertBatch(
      client,
      'INSERT INTO g2p_group_membership (individual, "group", status) VALUES __VALUES__',
      3,
      membershipRows,
      400
    );

    // Household income sources (many-to-many)
    const incomeRelRows = [];
    for (const f of farmers) {
      const count = weightedPick([[1, 50], [2, 33], [3, 17]]);
      const chosen = new Set();
      while (chosen.size < count) chosen.add(pick(incomeIds));
      for (const incomeId of chosen) incomeRelRows.push([incomeId, f.id]);
    }
    await insertBatch(
      client,
      'INSERT INTO g2p_hh_income_res_partner_rel (g2p_hh_income_id, res_partner_id) VALUES __VALUES__',
      2,
      incomeRelRows,
      400
    );

    await client.query('ANALYZE');

    console.log('\nSeed complete:');
    for (const table of [
      'g2p_region', 'g2p_zone', 'g2p_woreda', 'g2p_kebele', 'res_partner',
      'g2p_land_information', 'g2p_reg_id', 'g2p_group_membership', 'g2p_hh_income_res_partner_rel',
    ]) {
      const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
      console.log(`  ${table.padEnd(32)} ${rows[0].n}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
