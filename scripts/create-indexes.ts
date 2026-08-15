import { pool } from '../lib/database'

type IndexSpec = { name: string; sql: string }

// Highest-impact indexes for the dashboard queries.
// Run with: bun x tsx scripts/create-indexes.ts
const INDEXES: IndexSpec[] = [
  // Core farmer filters used by nearly every chart
  {
    name: 'idx_res_partner_farmer_filters',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_farmer_filters
      ON res_partner (region, zone, woreda, kebele)
      WHERE is_farmer = 'yes' AND is_registrant = TRUE AND is_group = FALSE;
    `,
  },
  {
    name: 'idx_res_partner_farmer_gender',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_farmer_gender
      ON res_partner (gender)
      WHERE is_farmer = 'yes' AND is_registrant = TRUE AND is_group = FALSE;
    `,
  },
  {
    name: 'idx_res_partner_farmer_farming_type',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_farmer_farming_type
      ON res_partner (farming_type)
      WHERE is_farmer = 'yes' AND is_registrant = TRUE AND is_group = FALSE;
    `,
  },
  {
    name: 'idx_res_partner_farmer_state',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_farmer_state
      ON res_partner (state)
      WHERE is_farmer = 'yes' AND is_registrant = TRUE AND is_group = FALSE;
    `,
  },
  {
    name: 'idx_res_partner_farmer_age',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_farmer_age
      ON res_partner (age_int)
      WHERE is_farmer = 'yes' AND is_registrant = TRUE AND is_group = FALSE;
    `,
  },

  // Lookup tables used for code->id conversion and drilldowns
  {
    name: 'idx_g2p_region_code',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_region_code
      ON g2p_region (code);
    `,
  },
  {
    name: 'idx_g2p_zone_code_region',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_zone_code_region
      ON g2p_zone (code, region);
    `,
  },
  {
    name: 'idx_g2p_woreda_code_zone',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_woreda_code_zone
      ON g2p_woreda (code, zone);
    `,
  },
  {
    name: 'idx_g2p_kebele_code_woreda',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_kebele_code_woreda
      ON g2p_kebele (code, woreda);
    `,
  },

  // High-cardinality joins in chart queries
  {
    name: 'idx_g2p_hh_income_rel_partner',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_hh_income_rel_partner
      ON g2p_hh_income_res_partner_rel (res_partner_id, g2p_hh_income_id);
    `,
  },
  {
    name: 'idx_g2p_group_membership_individual',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_group_membership_individual
      ON g2p_group_membership (individual, status);
    `,
  },
  {
    name: 'idx_g2p_land_information_partner',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_land_information_partner
      ON g2p_land_information (partner_id);
    `,
  },
]

async function main() {
  for (const index of INDEXES) {
    const label = index.name
    process.stdout.write(`Creating ${label}... `)
    try {
      await pool.query(index.sql)
      console.log('done')
    } catch (err) {
      console.error(`failed:`, err instanceof Error ? err.message : err)
    }
  }

  await pool.end()
}

main().catch(err => {
  console.error('Index creation failed:', err)
  process.exitCode = 1
})
