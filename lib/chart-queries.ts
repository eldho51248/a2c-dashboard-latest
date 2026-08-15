// lib/chart-queries.ts

export interface ChartFilters {
  region?: string;
  recordState?: string;
  zone?: string;
  woreda?: string;
  kebele?: string;
  farmingType?: string;
  farmerType?: string;
  sector?: string;
  dateFrom?: string;
  dateTo?: string;
  timePeriod?: string;
}

export interface ChartQueryResult {
  success: boolean;
  data: any[];
  error?: string | null;
  executionTime?: number;
}

// Base SQL queries for each chart.
// The API route will replace '--- DYNAMIC_FILTERS ---' with an appropriate
// parameterized 'AND ...' clause if filters are applied.
export const CHART_QUERIES: { [key: string]: string } = {
  // === Farmer Dashboard Charts ===
  farmersByZone: `
    SELECT
      COALESCE(z.name, 'Unknown') as zone,
      z.code as zone_code,
      COUNT(DISTINCT rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_zone z ON rp.zone = z.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_GROUP = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY z.name, z.code
    ORDER BY farmers DESC
  `,

  farmersByWoreda: `
    SELECT
      COALESCE(w.name, 'Unknown') as woreda,
      w.code as woreda_code,
      COUNT(DISTINCT rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_woreda w ON rp.woreda = w.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_GROUP = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY w.name, w.code
    ORDER BY farmers DESC
  `,

  farmersByKebele: `
    SELECT
      COALESCE(k.name, 'Unknown') as kebele,
      k.code as kebele_code,
      COUNT(DISTINCT rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_kebele k ON rp.kebele = k.id
    LEFT JOIN g2p_woreda w ON k.woreda = w.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_GROUP = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY k.name, k.code
    ORDER BY farmers DESC
  `,

  householdIncomeSources: `
    SELECT
      COALESCE(inc.name, 'Unknown') as income_source,
      inc.code as income_code,
      COUNT(DISTINCT rpr.res_partner_id) as farmers
    FROM g2p_hh_income_res_partner_rel rpr
    JOIN g2p_hh_income inc ON inc.id = rpr.g2p_hh_income_id
    JOIN res_partner rp ON rp.id = rpr.res_partner_id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_GROUP = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY inc.name, inc.code
    ORDER BY farmers DESC
  `,

  farmersByRegion: `
    SELECT
      COALESCE(reg.name, 'Unknown') as region,
      reg.code as region_code,
      COUNT(DISTINCT rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_GROUP = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY reg.name, reg.code
    ORDER BY farmers DESC
  `,

  farmersByGender: `
    SELECT
      COALESCE(rp.gender, 'Unknown') as gender,
      COUNT(rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      AND rp.is_farmer = 'yes'
      --- DYNAMIC_FILTERS ---
    GROUP BY rp.gender
    ORDER BY farmers DESC
  `,

  farmersByType: `
   SELECT
      COALESCE(rp.farming_type, 'Unknown') as farming_type,
      COUNT(DISTINCT rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_GROUP = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY rp.farming_type
    ORDER BY farmers DESC
  `,

  farmersByAge: `
    SELECT
      CASE
        WHEN rp.age_int < 30 THEN 'Under 30'
        WHEN rp.age_int BETWEEN 30 AND 50 THEN '30-50'
        WHEN rp.age_int BETWEEN 51 AND 65 THEN '51-65'
        WHEN rp.age_int > 65 THEN 'Over 65'
        ELSE 'Unknown'
      END as age_group,
      COALESCE(rp.gender, 'Unknown') as gender,
      COUNT(rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      AND rp.is_farmer = 'yes'
      --- DYNAMIC_FILTERS ---
    GROUP BY age_group, rp.gender
    ORDER BY
      CASE age_group
        WHEN 'Under 30' THEN 1
        WHEN '30-50' THEN 2
        WHEN '51-65' THEN 3
        WHEN 'Over 65' THEN 4
        ELSE 5
      END
  `,


  farmerKpis: `
  WITH partners AS (
      SELECT DISTINCT rp.id, rp.gender, rp.hh_is_household_head, rp.total_land_area, rp.total_land_owned_area
      FROM res_partner rp
      WHERE rp.is_farmer = 'yes'
        AND rp.is_registrant = TRUE
        AND rp.is_group = FALSE
        AND rp.active = TRUE
        --- DYNAMIC_FILTERS ---
  ),
  uids AS (
      SELECT DISTINCT r.partner_id
      FROM g2p_reg_id r
      JOIN g2p_id_type t ON r.id_type = t.id AND t.name = 'UID'
  )
  SELECT
      COUNT(*) AS total_farmers,
      SUM(CASE WHEN LOWER(gender) = 'female' THEN 1 ELSE 0 END) AS female_farmers,
      SUM(CASE WHEN LOWER(gender) = 'male' THEN 1 ELSE 0 END) AS male_farmers,
      COALESCE(SUM(total_land_area), 0) AS total_land_size,
      COALESCE(AVG(total_land_area), 0) AS avg_farm_size,
      SUM(CASE WHEN LOWER(hh_is_household_head) = 'yes' THEN 1 ELSE 0 END) AS household_heads,
      SUM(CASE WHEN total_land_owned_area > 0 THEN 1 ELSE 0 END) AS farmers_with_owned_land,
      COUNT(DISTINCT CASE WHEN id IN (SELECT partner_id FROM uids) THEN id END) AS farmers_with_id,
      COUNT(*) - COUNT(DISTINCT CASE WHEN id IN (SELECT partner_id FROM uids) THEN id END) AS farmers_without_id
  FROM partners;
`,

  farmersByImportStatus: `
    SELECT
      CASE 
        WHEN LOWER(rp.db_import) = 'yes' THEN 'Imported'
        ELSE 'Not Imported'
      END as import_status,
      COUNT(DISTINCT rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_GROUP = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY import_status
    ORDER BY farmers DESC
  `,

  farmersByFarmerId: `
    SELECT
      CASE 
        WHEN rp.farmer_id IS NOT NULL AND rp.farmer_id != '' THEN 'With Farmer ID'
        ELSE 'Without Farmer ID'
      END as id_status,
      COUNT(DISTINCT rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_GROUP = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY id_status
    ORDER BY farmers DESC
  `,

  farmersByEducation: `
    SELECT
      COALESCE(rp.education, 'Unknown') as education,
      COUNT(DISTINCT rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_GROUP = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY rp.education
    ORDER BY farmers DESC
  `,

  farmersByAgeAndGender: `
    SELECT
      age_group,
      gender,
      COUNT(*) as farmers
    FROM (
      SELECT
        CASE
          WHEN rp.age_int < 18 THEN '0-18'
          WHEN rp.age_int >= 18 AND rp.age_int < 30 THEN '18-30'
          WHEN rp.age_int >= 30 AND rp.age_int < 50 THEN '30-50'
          WHEN rp.age_int >= 50 AND rp.age_int < 70 THEN '50-70'
          WHEN rp.age_int >= 70 THEN '70+'
          ELSE 'Unknown'
        END as age_group,
        COALESCE(rp.gender, 'Unknown') as gender,
        rp.id
      FROM res_partner rp
      LEFT JOIN g2p_region reg ON rp.region = reg.id
      WHERE rp.is_farmer = 'yes'
        AND rp.is_registrant = TRUE
        AND rp.is_GROUP = FALSE
        --- DYNAMIC_FILTERS ---
    ) subquery
    GROUP BY age_group, gender
    ORDER BY
      CASE age_group
        WHEN '0-18' THEN 1
        WHEN '18-30' THEN 2
        WHEN '30-50' THEN 3
        WHEN '50-70' THEN 4
        WHEN '70+' THEN 5
        ELSE 6
      END,
      gender
  `,


  // farmerKpis: `
  //     SELECT
  //     COUNT(DISTINCT rp.id) as total_farmers,
  //     COUNT( CASE WHEN rp.gender = 'female' THEN 1 END) as female_farmers,
  //     COUNT( CASE WHEN rp.gender = 'male' THEN 1 END) as male_farmers,
  //     COALESCE(SUM(rp.total_land_area), 0) as total_land_size,
  //     COALESCE(AVG(rp.total_land_area), 0) as avg_farm_size,
  //     COUNT(CASE WHEN rp.hh_is_household_head = 'yes' THEN 1 END) as household_heads,
  //     COUNT( CASE WHEN rp.total_land_owned_area > 0 THEN 1 END) as farmers_with_owned_land,
  //     COUNT(DISTINCT CASE WHEN t.name = 'UID' THEN rp.id END) as farmers_with_id,
  //     COUNT(rp.id) - COUNT(DISTINCT CASE WHEN t.name = 'UID' THEN rp.id END) as farmers_without_id
  //   FROM
  //     res_partner rp
  //   LEFT JOIN
  //     g2p_reg_id r ON r.partner_id = rp.id
  //   LEFT JOIN
  //     g2p_id_type t ON r.id_type = t.id AND t.name = 'UID'
  //   WHERE
  //     rp.is_farmer = 'yes'
  //     AND rp.is_registrant = TRUE
  //     AND rp.is_group = FALSE
  //     AND rp.active = TRUE
  //     --- DYNAMIC_FILTERS ---
  // `,

  // === Land Charts ===
  landOwnershipDistribution: `
    SELECT
      li.ownership_type,
      COUNT(li.id) as farmers,
      SUM(li.total_land_area) as total_area
    FROM g2p_land_information li
    LEFT JOIN res_partner rp ON li.partner_id = rp.id
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      --- DYNAMIC_FILTERS ---
    GROUP BY li.ownership_type
    ORDER BY farmers DESC
  `,

  landAreaByRegion: `
    SELECT
      reg.name as region,
      reg.code as region_code,
      COALESCE(SUM(COALESCE(li.total_land_area, rp.total_land_area)), 0) as total_land_area,
      COALESCE(AVG(COALESCE(li.total_land_area, rp.total_land_area)), 0) as avg_land_area,
      COUNT(DISTINCT li.partner_id) as farmers_with_land
    FROM g2p_region reg
    LEFT JOIN res_partner rp ON rp.region = reg.id AND rp.is_registrant = true AND rp.active = true
    LEFT JOIN g2p_land_information li ON li.partner_id = rp.id
    WHERE 1=1 -- Dummy WHERE to allow safe appending of AND clauses
      --- DYNAMIC_FILTERS ---
    GROUP BY reg.name, reg.code
    HAVING COALESCE(SUM(li.total_land_area), 0) > 0
    ORDER BY total_land_area DESC
  `,

  landStats: `
    SELECT
      COALESCE(SUM(rp.total_land_area), 0) as total_land_area,
      COALESCE(AVG(rp.total_land_area), 0) as avg_land_area,
      (SELECT count(*) FROM g2p_land_information) as total_lands,
      COUNT(CASE WHEN rp.total_land_owned_area > 0 THEN 1 END) as total_land_ownership
    FROM res_partner rp
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      --- DYNAMIC_FILTERS ---
  `,

  // === Demography Charts ===
  registrantsByRegion: `
    SELECT
      reg.name as region,
      COUNT(rp.id) as registrants
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      --- DYNAMIC_FILTERS ---
    GROUP BY reg.name, reg.code
    ORDER BY registrants DESC
  `,

  registrantsByGender: `
    SELECT
      COALESCE(rp.gender, 'Unknown') as gender,
      COUNT(rp.id) as registrants
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      --- DYNAMIC_FILTERS ---
    GROUP BY rp.gender
    ORDER BY registrants DESC
  `,

  // === Missing Chart Queries ===
  demographyStats: `
    SELECT
      COUNT(DISTINCT rp.region) as total_regions,
      COUNT(DISTINCT rp.woreda) as total_woredas,
      COUNT(DISTINCT rp.kebele) as total_kebeles,
      COUNT(rp.id) as total_farmers
    FROM res_partner rp
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      --- DYNAMIC_FILTERS ---
  `,

  farmerPopulationByRegion: `
    SELECT
      COALESCE(reg.name, 'Unknown') as region,
      reg.code as region_code,
      COUNT(rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_GROUP = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY reg.name, reg.code
    ORDER BY farmers DESC
    LIMIT 10
  `,

  genderByRegion: `
    SELECT
      COALESCE(reg.name, 'Unknown') as region,
      reg.code as region_code,
      CASE
        WHEN LOWER(COALESCE(rp.gender, '')) = 'female' THEN 'Female'
        WHEN LOWER(COALESCE(rp.gender, '')) = 'male' THEN 'Male'
        ELSE 'Unknown'
      END as gender,
      COUNT(rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      AND rp.is_farmer = 'yes'
      --- DYNAMIC_FILTERS ---
    GROUP BY reg.name, reg.code,
      CASE
        WHEN LOWER(COALESCE(rp.gender, '')) = 'female' THEN 'Female'
        WHEN LOWER(COALESCE(rp.gender, '')) = 'male' THEN 'Male'
        ELSE 'Unknown'
      END
    ORDER BY region, gender
  `,



  // === Socio-Economic Chart Queries ===
  socioEconomicKpis: `
    SELECT
      COUNT(CASE WHEN rp.gender = 'female' THEN 1 END) as total_female_farmers,
      COUNT(CASE WHEN rp.gender = 'male' THEN 1 END) as total_male_farmers,
      COUNT(DISTINCT CASE WHEN m.individual IS NOT NULL AND rp.gender = 'female' THEN m.individual END) as female_farmers_in_household,
      COUNT(DISTINCT CASE WHEN m.individual IS NOT NULL AND rp.gender = 'male' THEN m.individual END) as male_farmers_in_household,
      COUNT(CASE WHEN rp.hh_is_household_head = 'yes' THEN 1 END) as total_household_heads,
      COUNT(CASE WHEN rp.hh_is_household_head = 'yes' AND rp.gender = 'male' THEN 1 END) as male_household_heads,
      COUNT(CASE WHEN rp.hh_is_household_head = 'yes' AND rp.gender = 'female' THEN 1 END) as female_household_heads
    FROM res_partner rp
    LEFT JOIN g2p_group_membership m ON m.individual = rp.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      --- DYNAMIC_FILTERS ---
  `,

  farmersByPsnpStatus: `
    SELECT
      CASE 
        WHEN rp.is_psnp_user = TRUE THEN 'PSNP User'
        ELSE 'Non-PSNP'
      END as psnp_status,
      COUNT(DISTINCT rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      --- DYNAMIC_FILTERS ---
    GROUP BY psnp_status
    ORDER BY farmers DESC
  `,

  householdStatusByGenderRegion: `
    SELECT
      reg.name as region,
      COALESCE(rp.gender, 'Unknown') as gender,
      CASE
        WHEN gm.status = 'Head' THEN 'Head'
        WHEN gm.status = 'Wife' THEN 'Wife'
        WHEN gm.status = 'Husband' THEN 'Husband'
        WHEN gm.status IS NOT NULL THEN 'Member'
        ELSE 'No Group'
      END as household_status,
      COUNT(rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    LEFT JOIN g2p_group_membership gm ON rp.id = gm.individual
    WHERE rp.is_registrant = true
      AND rp.active = true
      AND rp.is_farmer = 'yes'
      --- DYNAMIC_FILTERS ---
    GROUP BY reg.name, rp.gender, household_status
    ORDER BY region, gender, household_status
  `,

  farmersByAgeGroupGenderRegion: `
    SELECT
      reg.name as region,
      COALESCE(rp.gender, 'Unknown') as gender,
      CASE
        WHEN rp.age_int < 30 THEN 'Under 30'
        WHEN rp.age_int BETWEEN 30 AND 50 THEN '30-50'
        WHEN rp.age_int BETWEEN 51 AND 65 THEN '51-65'
        WHEN rp.age_int > 65 THEN 'Over 65'
        ELSE 'Unknown'
      END as age_group,
      COUNT(rp.id) as farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      AND rp.is_farmer = 'yes'
      --- DYNAMIC_FILTERS ---
    GROUP BY reg.name, rp.gender, age_group
    ORDER BY region, gender, age_group
  `,

  // === Gender and Household Charts ===
  femaleFarmersByRegion: `
    SELECT
      reg.name as region,
      COUNT(CASE WHEN rp.gender = 'female' THEN 1 END) as female_farmers,
      COUNT(CASE WHEN rp.gender = 'male' THEN 1 END) as male_farmers,
      COUNT(rp.id) as total_farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      AND rp.is_farmer = 'yes'
      --- DYNAMIC_FILTERS ---
    GROUP BY reg.name, reg.code
    ORDER BY female_farmers DESC
  `,

  femaleHouseholdHeads: `
    SELECT
      reg.name as region,
      COUNT(CASE WHEN rp.gender = 'female' AND rp.hh_is_household_head = 'yes' THEN 1 END) as female_household_heads,
      COUNT(CASE WHEN rp.gender = 'male' AND rp.hh_is_household_head = 'yes' THEN 1 END) as male_household_heads,
      COUNT(CASE WHEN rp.hh_is_household_head = 'yes' THEN 1 END) as total_household_heads
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      --- DYNAMIC_FILTERS ---
    GROUP BY reg.name, reg.code
    ORDER BY female_household_heads DESC
  `,

  genderDistributionByFarmingType: `
    SELECT
      COALESCE(rp.farming_type, 'Unknown') as farming_type,
      COUNT(CASE WHEN rp.gender = 'female' THEN 1 END) as female_farmers,
      COUNT(CASE WHEN rp.gender = 'male' THEN 1 END) as male_farmers,
      COUNT(rp.id) as total_farmers
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      AND rp.is_farmer = 'yes'
      --- DYNAMIC_FILTERS ---
    GROUP BY rp.farming_type
    ORDER BY female_farmers DESC
  `,





  // === Land Information Charts ===
  landInfoStats: `
    SELECT
      COUNT(li.id) as total_land_parcels,
      COALESCE(SUM(li.total_land_area), 0) as total_land_area,
      COALESCE(AVG(li.total_land_area), 0) as avg_land_area,
      COUNT(CASE WHEN li.ownership_type = 'owner' THEN 1 END) as owned_parcels,
      COUNT(CASE WHEN li.ownership_type = 'rented' THEN 1 END) as rented_parcels,
      COUNT(CASE WHEN li.ownership_type = 'shared' THEN 1 END) as shared_parcels
    FROM g2p_land_information li
    LEFT JOIN res_partner rp ON li.partner_id = rp.id
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      AND rp.is_farmer = 'yes'
      --- DYNAMIC_FILTERS ---
  `,

  // landAreaByRegion: `
  //   SELECT
  //     reg.name as region,
  //     COALESCE(SUM(li.total_land_area), 0) as total_land_area,
  //     COALESCE(AVG(li.total_land_area), 0) as avg_land_area,
  //     COUNT(li.id) as land_parcels,
  //     COUNT(CASE WHEN li.ownership_type = 'owner' THEN 1 END) as owned_parcels,
  //     COUNT(CASE WHEN li.ownership_type = 'rented' THEN 1 END) as rented_parcels
  //   FROM g2p_land_information li
  //   LEFT JOIN res_partner rp ON li.partner_id = rp.id
  //   LEFT JOIN g2p_region reg ON rp.region = reg.id
  //   WHERE rp.is_registrant = true
  //     AND rp.active = true
  //     AND rp.is_farmer = 'yes'
  //     --- DYNAMIC_FILTERS ---
  //   GROUP BY reg.name, reg.code
  //   ORDER BY total_land_area DESC
  // `,

  landOwnershipByType: `
    SELECT
      COALESCE(li.ownership_type, 'Unknown') as ownership_type,
      COUNT(li.id) as land_parcels,
      COALESCE(SUM(li.total_land_area), 0) as total_area,
      COALESCE(AVG(li.total_land_area), 0) as avg_area
    FROM g2p_land_information li
    LEFT JOIN res_partner rp ON li.partner_id = rp.id
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      AND rp.is_farmer = 'yes'
      --- DYNAMIC_FILTERS ---
    GROUP BY li.ownership_type
    ORDER BY land_parcels DESC
  `,

  landAreaByGender: `
    SELECT
      COALESCE(rp.gender, 'Unknown') as gender,
      COUNT(li.id) as land_parcels,
      COALESCE(SUM(li.total_land_area), 0) as total_land_area,
      COALESCE(AVG(li.total_land_area), 0) as avg_land_area
    FROM g2p_land_information li
    LEFT JOIN res_partner rp ON li.partner_id = rp.id
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_registrant = true
      AND rp.active = true
      AND rp.is_farmer = 'yes'
      --- DYNAMIC_FILTERS ---
    GROUP BY rp.gender
    ORDER BY total_land_area DESC
  `,

  // ===================================================================
  // === Crop Sown Registry ============================================
  // ===================================================================

  cropKpis: `
    WITH crop_farmers AS (
      SELECT DISTINCT
        rp.id,
        rp.total_land_area,
        rp.total_land_owned_area,
        rp.primary_commodity_name,
        rp.woreda
      FROM res_partner rp
      WHERE rp.is_farmer = 'yes'
        AND rp.is_registrant = TRUE
        AND rp.is_group = FALSE
        AND rp.active = TRUE
        --- DYNAMIC_FILTERS ---
    )
    SELECT
      COALESCE(SUM(total_land_area), 0) AS total_area,
      COALESCE(SUM(total_land_owned_area), 0) AS owned_area,
      COUNT(*) AS farmers,
      COUNT(DISTINCT NULLIF(TRIM(COALESCE(primary_commodity_name, '')), '')) AS crop_types,
      COUNT(DISTINCT woreda) AS woredas_reporting,
      COALESCE(AVG(NULLIF(total_land_area, 0)), 0) AS avg_plot_size
    FROM crop_farmers
  `,

  cropAreaByCrop: `
    SELECT
      COALESCE(NULLIF(TRIM(rp.primary_commodity_name), ''), 'Unspecified') AS crop,
      COALESCE(SUM(rp.total_land_area), 0) AS area,
      COUNT(DISTINCT rp.id) AS farmers
    FROM res_partner rp
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      AND NULLIF(TRIM(COALESCE(rp.primary_commodity_name, '')), '') IS NOT NULL
      --- DYNAMIC_FILTERS ---
    GROUP BY 1
    HAVING COALESCE(SUM(rp.total_land_area), 0) > 0
    ORDER BY area DESC
  `,

  // The map keys off a numeric "farmers" column, so hectares ride in under that name.
  cropAreaByRegion: `
    SELECT
      COALESCE(reg.name, 'Unknown') AS region,
      reg.code AS region_code,
      ROUND(COALESCE(SUM(rp.total_land_area), 0))::bigint AS farmers,
      COUNT(DISTINCT rp.id) AS farmer_count
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      --- DYNAMIC_FILTERS ---
    GROUP BY reg.name, reg.code
    ORDER BY farmers DESC
  `,

  cropAreaByZone: `
    SELECT
      COALESCE(z.name, 'Unknown') AS zone,
      z.code AS zone_code,
      ROUND(COALESCE(SUM(rp.total_land_area), 0))::bigint AS farmers,
      COUNT(DISTINCT rp.id) AS farmer_count
    FROM res_partner rp
    LEFT JOIN g2p_zone z ON rp.zone = z.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      --- DYNAMIC_FILTERS ---
    GROUP BY z.name, z.code
    ORDER BY farmers DESC
  `,

  cropAreaByWoreda: `
    SELECT
      COALESCE(w.name, 'Unknown') AS woreda,
      w.code AS woreda_code,
      ROUND(COALESCE(SUM(rp.total_land_area), 0))::bigint AS farmers,
      COUNT(DISTINCT rp.id) AS farmer_count
    FROM res_partner rp
    LEFT JOIN g2p_woreda w ON rp.woreda = w.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      --- DYNAMIC_FILTERS ---
    GROUP BY w.name, w.code
    ORDER BY farmers DESC
  `,

  cropAreaByKebele: `
    SELECT
      COALESCE(k.name, 'Unknown') AS kebele,
      k.code AS kebele_code,
      ROUND(COALESCE(SUM(rp.total_land_area), 0))::bigint AS farmers,
      COUNT(DISTINCT rp.id) AS farmer_count
    FROM res_partner rp
    LEFT JOIN g2p_kebele k ON rp.kebele = k.id
    LEFT JOIN g2p_woreda w ON k.woreda = w.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      --- DYNAMIC_FILTERS ---
    GROUP BY k.name, k.code
    ORDER BY farmers DESC
  `,

  cropTopWoredas: `
    SELECT
      COALESCE(w.name, 'Unknown') AS woreda,
      w.code AS woreda_code,
      COALESCE(SUM(rp.total_land_area), 0) AS area,
      COUNT(DISTINCT rp.id) AS farmers
    FROM res_partner rp
    LEFT JOIN g2p_woreda w ON rp.woreda = w.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      AND rp.woreda IS NOT NULL
      --- DYNAMIC_FILTERS ---
    GROUP BY w.name, w.code
    HAVING COALESCE(SUM(rp.total_land_area), 0) > 0
    ORDER BY area DESC
    LIMIT 8
  `,

  // ===================================================================
  // === Livestock Registry ============================================
  // ===================================================================

  livestockKpis: `
    WITH livestock_farmers AS (
      SELECT DISTINCT
        rp.id,
        rp.gender,
        rp.hh_is_household_head,
        rp.total_land_area,
        rp.woreda
      FROM res_partner rp
      WHERE rp.is_farmer = 'yes'
        AND rp.is_registrant = TRUE
        AND rp.is_group = FALSE
        AND rp.active = TRUE
        --- DYNAMIC_FILTERS ---
    )
    SELECT
      COUNT(*) AS farmers,
      SUM(CASE WHEN LOWER(hh_is_household_head) = 'yes' THEN 1 ELSE 0 END) AS households,
      SUM(CASE WHEN LOWER(gender) = 'female' THEN 1 ELSE 0 END) AS female_farmers,
      COUNT(DISTINCT woreda) AS woredas_reporting,
      COALESCE(SUM(total_land_area), 0) AS total_area,
      (SELECT COUNT(*) FROM livestock_catalog) AS species_tracked,
      (SELECT COUNT(*) FROM livestock_breed) AS breeds_tracked
    FROM livestock_farmers
  `,

  // National CSA census reference data - deliberately unfiltered by geography.
  livestockBySpecies: `
    SELECT
      lc.name AS species,
      lp.species_code,
      lp.population_total AS population,
      lp.census_year,
      lc.chart_color
    FROM livestock_population lp
    JOIN livestock_catalog lc ON lc.species_code = lp.species_code
    WHERE lp.census_year = (SELECT MAX(census_year) FROM livestock_population)
    ORDER BY lp.population_total DESC
  `,

  livestockPopulationTrend: `
    SELECT
      lp.census_year,
      SUM(lp.population_total) AS population
    FROM livestock_population lp
    GROUP BY lp.census_year
    ORDER BY lp.census_year
  `,

  livestockTopWoredas: `
    SELECT
      COALESCE(w.name, 'Unknown') AS woreda,
      w.code AS woreda_code,
      COUNT(DISTINCT rp.id) AS farmers
    FROM res_partner rp
    LEFT JOIN g2p_woreda w ON rp.woreda = w.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      AND rp.woreda IS NOT NULL
      --- DYNAMIC_FILTERS ---
    GROUP BY w.name, w.code
    HAVING COUNT(DISTINCT rp.id) > 0
    ORDER BY farmers DESC
    LIMIT 8
  `,

  // ===================================================================
  // === Shared registry panels ========================================
  // ===================================================================

  landTenureSplit: `
    SELECT
      INITCAP(COALESCE(NULLIF(TRIM(li.ownership_type), ''), 'unknown')) AS ownership_type,
      COUNT(li.id) AS parcels,
      COALESCE(SUM(li.total_land_area), 0) AS area
    FROM g2p_land_information li
    JOIN res_partner rp ON li.partner_id = rp.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      --- DYNAMIC_FILTERS ---
    GROUP BY 1
    ORDER BY parcels DESC
  `,

  farmersByRecordState: `
    SELECT
      COALESCE(NULLIF(TRIM(rp.state), ''), 'unknown') AS record_state,
      COUNT(DISTINCT rp.id) AS farmers
    FROM res_partner rp
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      --- DYNAMIC_FILTERS ---
    GROUP BY 1
    ORDER BY farmers DESC
  `,

  recentRegistrations: `
    SELECT
      COALESCE(NULLIF(TRIM(rp.farmer_id), ''), 'FP-' || rp.id::text) AS farmer_ref,
      COALESCE(reg.name, 'Unknown') AS region,
      COALESCE(w.name, 'Unknown') AS woreda,
      TO_CHAR(rp.registration_date, 'DD Mon') AS registered_on,
      COALESCE(NULLIF(TRIM(rp.farming_type), ''), 'Unknown') AS farming_type,
      COALESCE(NULLIF(TRIM(rp.state), ''), 'unknown') AS record_state
    FROM res_partner rp
    LEFT JOIN g2p_region reg ON rp.region = reg.id
    LEFT JOIN g2p_woreda w ON rp.woreda = w.id
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      AND rp.registration_date IS NOT NULL
      --- DYNAMIC_FILTERS ---
    ORDER BY rp.registration_date DESC, rp.id DESC
    LIMIT 6
  `,

  // Registered administrative units against the national totals, for coverage rates.
  registryCoverage: `
    SELECT
      COUNT(DISTINCT rp.region) AS regions_covered,
      COUNT(DISTINCT rp.zone) AS zones_covered,
      COUNT(DISTINCT rp.woreda) AS woredas_covered,
      COUNT(DISTINCT rp.kebele) AS kebeles_covered,
      (SELECT COUNT(*) FROM g2p_region) AS regions_total,
      (SELECT COUNT(*) FROM g2p_zone) AS zones_total,
      (SELECT COUNT(*) FROM g2p_woreda) AS woredas_total,
      (SELECT COUNT(*) FROM g2p_kebele) AS kebeles_total
    FROM res_partner rp
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      --- DYNAMIC_FILTERS ---
  `,

  registryTrendByMonth: `
    SELECT
      TO_CHAR(DATE_TRUNC('month', rp.registration_date), 'YYYY-MM') AS period,
      COUNT(DISTINCT rp.id) AS farmers,
      COALESCE(SUM(rp.total_land_area), 0) AS total_area,
      COALESCE(SUM(rp.total_land_owned_area), 0) AS owned_area
    FROM res_partner rp
    WHERE rp.is_farmer = 'yes'
      AND rp.is_registrant = TRUE
      AND rp.is_group = FALSE
      AND rp.active = TRUE
      AND rp.registration_date IS NOT NULL
      --- DYNAMIC_FILTERS ---
    GROUP BY 1
    ORDER BY 1
  `,
};
