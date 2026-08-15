-- Phase 1: Database Performance Optimization
-- Add indexes for frequently filtered columns

-- High priority indexes (used in every query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_is_farmer 
  ON res_partner(is_farmer) 
  WHERE is_farmer = 'yes';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_is_registrant 
  ON res_partner(is_registrant) 
  WHERE is_registrant = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_is_group 
  ON res_partner(is_group) 
  WHERE is_group = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_active 
  ON res_partner(active) 
  WHERE active = TRUE;

-- Filter column indexes (used frequently in WHERE clauses)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_region 
  ON res_partner(region);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_zone 
  ON res_partner(zone);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_woreda 
  ON res_partner(woreda);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_kebele 
  ON res_partner(kebele);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_gender 
  ON res_partner(gender);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_farming_type 
  ON res_partner(farming_type);

-- Composite indexes for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_farmer_region 
  ON res_partner(region, is_farmer, is_registrant, is_group) 
  WHERE is_farmer = 'yes' AND is_registrant = TRUE AND is_group = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_farmer_zone 
  ON res_partner(zone, is_farmer, is_registrant, is_group) 
  WHERE is_farmer = 'yes' AND is_registrant = TRUE AND is_group = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_partner_farmer_woreda 
  ON res_partner(woreda, is_farmer, is_registrant, is_group) 
  WHERE is_farmer = 'yes' AND is_registrant = TRUE AND is_group = FALSE;

-- Join optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_group_membership_individual 
  ON g2p_group_membership(individual);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_land_information_partner 
  ON g2p_land_information(partner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_reg_id_partner 
  ON g2p_reg_id(partner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_reg_id_type 
  ON g2p_reg_id(id_type);

-- Indexes for region/zone/woreda/kebele lookup tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_region_code 
  ON g2p_region(code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_zone_code 
  ON g2p_zone(code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_woreda_code 
  ON g2p_woreda(code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_g2p_kebele_code 
  ON g2p_kebele(code);

-- Analyze tables to update statistics
ANALYZE res_partner;
ANALYZE g2p_group_membership;
ANALYZE g2p_land_information;
ANALYZE g2p_reg_id;
ANALYZE g2p_region;
ANALYZE g2p_zone;
ANALYZE g2p_woreda;
ANALYZE g2p_kebele;
