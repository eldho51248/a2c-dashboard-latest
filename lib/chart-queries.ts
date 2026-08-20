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
  /** A2C only: id of the credit provider (bank) to narrow the dashboard to. */
  provider?: string;
}

export interface ChartQueryResult {
  success: boolean;
  data: any[];
  error?: string | null;
  executionTime?: number;
}

// Every A2C panel is built on this scope so that one provider or location
// selection narrows the whole dashboard the same way. A2C stores HDX P-codes
// directly rather than g2p ids, so it gets its own placeholders that the API
// fills with the raw codes; with nothing selected both collapse to empty and
// the scope is the full programme.
//
// Filtering the base tables once here also keeps the panel queries free of
// filter plumbing — they just read from the scoped_* views below.
const A2C_SCOPE = `
  WITH scoped_farmer AS (
    SELECT *
    FROM a2c_farmer
    WHERE TRUE
      --- A2C_GEO_FILTERS ---
  ),
  scoped_provider AS (
    SELECT *
    FROM a2c_credit_provider
    WHERE TRUE
      --- A2C_PROVIDER_FILTERS ---
  ),
  scoped_consent AS (
    SELECT c.*
    FROM a2c_consent_request c
    JOIN scoped_farmer f ON f.farmer_ref = c.farmer_ref
    JOIN scoped_provider p ON p.id = c.provider_id
  ),
  scoped_application AS (
    SELECT a.*
    FROM a2c_loan_application a
    JOIN scoped_farmer f ON f.farmer_ref = a.farmer_ref
    JOIN scoped_provider p ON p.id = a.provider_id
  ),
  scoped_share AS (
    SELECT s.*
    FROM a2c_registry_data_share s
    JOIN scoped_application a ON a.id = s.application_id
  )
`

// Base SQL queries for each chart.
// The API route will replace '--- DYNAMIC_FILTERS ---' with an appropriate
// parameterized 'AND ...' clause if filters are applied.
export const CHART_QUERIES: { [key: string]: string } = {
  // === A2C (Access to Credit) dashboard ==============================
  // ===================================================================
  // Backed by data/a2c/*.sql (sample data — no live A2C feed yet). Each panel
  // reads from the A2C_SCOPE views above, so the credit provider and the
  // region/zone/woreda selection narrow every figure on the dashboard.

  a2cKpis: `
    ${A2C_SCOPE}
    SELECT
      (SELECT COUNT(*) FROM scoped_provider WHERE status = 'ACTIVE') AS providers_onboarded,
      (SELECT COUNT(*) FROM scoped_provider WHERE status = 'ONBOARDING') AS providers_onboarding,
      (SELECT COUNT(*) FROM scoped_provider) AS providers_total,
      (SELECT COUNT(*) FROM scoped_consent) AS consent_requests,
      (SELECT COUNT(*) FROM scoped_consent WHERE status = 'APPROVED') AS consents_approved,
      (SELECT COUNT(*) FROM scoped_consent WHERE status = 'PENDING') AS consents_pending,
      (SELECT COUNT(*) FROM scoped_consent WHERE status = 'DECLINED') AS consents_declined,
      (SELECT COUNT(*) FROM scoped_application) AS applications_total,
      (SELECT COUNT(*) FROM scoped_application WHERE status = 'IN_PROGRESS') AS applications_in_progress,
      (SELECT COUNT(*) FROM scoped_application WHERE status = 'APPROVED') AS loans_approved,
      (SELECT COUNT(*) FROM scoped_application WHERE status = 'DECLINED') AS loans_declined,
      (SELECT COUNT(*) FROM scoped_application WHERE status = 'PENDING') AS loans_pending,
      (SELECT COUNT(*) FROM scoped_share) AS data_shares_total,
      (SELECT COUNT(*) FROM scoped_share WHERE status = 'DELIVERED') AS data_shares_delivered,
      (SELECT COUNT(*) FROM scoped_share WHERE status = 'FAILED') AS data_shares_failed,
      (SELECT COUNT(*) FROM scoped_share WHERE status = 'PENDING') AS data_shares_pending,
      (SELECT COALESCE(SUM(record_count), 0) FROM scoped_share WHERE status = 'DELIVERED') AS records_shared,
      (SELECT COALESCE(SUM(amount_approved), 0) FROM scoped_application WHERE status = 'APPROVED') AS loan_value_approved,
      (SELECT COALESCE(SUM(amount_requested), 0) FROM scoped_application) AS loan_value_requested,
      (SELECT COUNT(*) FROM scoped_farmer) AS farmers_enrolled,
      (SELECT COUNT(DISTINCT farmer_ref) FROM scoped_application) AS farmers_with_application
  `,

  // Correlated subqueries rather than joins: joining consents and applications
  // in one pass would multiply the loan value by the consent count.
  a2cProviders: `
    ${A2C_SCOPE}
    SELECT
      p.short_name,
      p.name,
      p.provider_type,
      p.status,
      p.integration,
      p.onboarded_on,
      (SELECT COUNT(*) FROM scoped_consent c WHERE c.provider_id = p.id) AS consent_requests,
      (SELECT COUNT(*) FROM scoped_consent c WHERE c.provider_id = p.id AND c.status = 'APPROVED') AS consents_approved,
      (SELECT COUNT(*) FROM scoped_application a WHERE a.provider_id = p.id) AS applications,
      (SELECT COUNT(*) FROM scoped_application a WHERE a.provider_id = p.id AND a.status = 'APPROVED') AS loans_approved,
      (SELECT COALESCE(SUM(a.amount_approved), 0) FROM scoped_application a
        WHERE a.provider_id = p.id AND a.status = 'APPROVED') AS loan_value,
      (SELECT COUNT(*) FROM scoped_share s
         JOIN scoped_application a ON a.id = s.application_id
        WHERE a.provider_id = p.id AND s.status = 'FAILED') AS share_faults
    FROM scoped_provider p
    ORDER BY loan_value DESC, applications DESC, p.name
  `,

  // Map choropleth series. The map reads its metric from a column literally
  // named "farmers", so approved loan value (ETB) is aliased to it.
  a2cLoansByRegion: `
    ${A2C_SCOPE}
    SELECT
      f.region_name AS region,
      f.region_pcode AS region_code,
      COALESCE(SUM(a.amount_approved), 0) AS farmers
    FROM scoped_farmer f
    LEFT JOIN scoped_application a
      ON a.farmer_ref = f.farmer_ref AND a.status = 'APPROVED'
    GROUP BY 1, 2
    ORDER BY farmers DESC
  `,

  a2cLoansByZone: `
    ${A2C_SCOPE}
    SELECT
      f.zone_name AS zone,
      f.zone_pcode AS zone_code,
      COALESCE(SUM(a.amount_approved), 0) AS farmers
    FROM scoped_farmer f
    LEFT JOIN scoped_application a
      ON a.farmer_ref = f.farmer_ref AND a.status = 'APPROVED'
    GROUP BY 1, 2
    ORDER BY farmers DESC
  `,

  a2cLoansByWoreda: `
    ${A2C_SCOPE}
    SELECT
      f.woreda_name AS woreda,
      f.woreda_pcode AS woreda_code,
      COALESCE(SUM(a.amount_approved), 0) AS farmers
    FROM scoped_farmer f
    LEFT JOIN scoped_application a
      ON a.farmer_ref = f.farmer_ref AND a.status = 'APPROVED'
    GROUP BY 1, 2
    ORDER BY farmers DESC
  `,

  // A2C enrolment stops at woreda, but the map still asks for a kebele series
  // when it drills that far. Answer with an empty, correctly shaped result.
  a2cLoansByKebele: `
    SELECT NULL::text AS kebele, NULL::text AS kebele_code, 0 AS farmers
    WHERE FALSE
  `,

  a2cLocationSummary: `
    ${A2C_SCOPE}
    SELECT
      f.region_name AS region,
      f.zone_name AS zone,
      f.zone_pcode AS zone_code,
      f.woreda_name AS woreda,
      f.woreda_pcode AS woreda_code,
      COUNT(DISTINCT f.farmer_ref) AS farmers,
      COUNT(a.id) AS applications,
      COUNT(a.id) FILTER (WHERE a.status = 'APPROVED') AS loans_approved,
      COUNT(a.id) FILTER (WHERE a.status = 'IN_PROGRESS') AS applications_in_progress,
      COUNT(a.id) FILTER (WHERE a.status = 'PENDING') AS loans_pending,
      COUNT(a.id) FILTER (WHERE a.status = 'DECLINED') AS loans_declined,
      COALESCE(SUM(a.amount_approved), 0) AS loan_value
    FROM scoped_farmer f
    LEFT JOIN scoped_application a ON a.farmer_ref = f.farmer_ref
    GROUP BY 1, 2, 3, 4, 5
    ORDER BY farmers DESC
  `,

  a2cApplicationStatus: `
    ${A2C_SCOPE}
    SELECT
      status,
      COUNT(*) AS applications,
      COALESCE(SUM(amount_requested), 0) AS requested_value,
      COALESCE(SUM(amount_approved), 0) AS approved_value
    FROM scoped_application
    GROUP BY 1
    ORDER BY CASE status
      WHEN 'APPROVED' THEN 1
      WHEN 'IN_PROGRESS' THEN 2
      WHEN 'PENDING' THEN 3
      ELSE 4
    END
  `,

  a2cConsentStatus: `
    ${A2C_SCOPE}
    SELECT
      status,
      COUNT(*) AS requests
    FROM scoped_consent
    GROUP BY 1
    ORDER BY CASE status
      WHEN 'APPROVED' THEN 1
      WHEN 'PENDING' THEN 2
      ELSE 3
    END
  `,

  a2cLoanProducts: `
    ${A2C_SCOPE}
    SELECT
      product,
      COUNT(*) AS applications,
      COUNT(*) FILTER (WHERE status = 'APPROVED') AS loans_approved,
      COALESCE(SUM(amount_approved), 0) AS loan_value
    FROM scoped_application
    GROUP BY 1
    ORDER BY loan_value DESC
  `,

  a2cLoanTrend: `
    ${A2C_SCOPE}
    SELECT
      TO_CHAR(DATE_TRUNC('month', applied_on), 'Mon') AS month,
      DATE_TRUNC('month', applied_on) AS month_start,
      COUNT(*) AS applications,
      COUNT(*) FILTER (WHERE status = 'APPROVED') AS loans_approved,
      COALESCE(SUM(amount_approved), 0) AS loan_value
    FROM scoped_application
    GROUP BY 2
    ORDER BY 2
  `,

  a2cDataShares: `
    ${A2C_SCOPE}
    SELECT
      dataset,
      COUNT(*) AS shares,
      COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
      COUNT(*) FILTER (WHERE status = 'FAILED') AS failed,
      COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
      COALESCE(SUM(record_count) FILTER (WHERE status = 'DELIVERED'), 0) AS records
    FROM scoped_share
    GROUP BY 1
    ORDER BY shares DESC, dataset
  `,

  // Failed payloads, grouped for the fault panel.
  a2cDataShareFaults: `
    ${A2C_SCOPE}
    SELECT
      s.fault_reason AS fault,
      p.short_name AS provider,
      s.dataset,
      COUNT(*) AS records,
      MAX(s.shared_on) AS last_seen
    FROM scoped_share s
    JOIN scoped_application a ON a.id = s.application_id
    JOIN scoped_provider p ON p.id = a.provider_id
    WHERE s.status = 'FAILED'
    GROUP BY 1, 2, 3
    ORDER BY records DESC, fault
  `,

  a2cDeclineReasons: `
    ${A2C_SCOPE}
    SELECT
      decline_reason AS reason,
      COUNT(*) AS applications,
      COALESCE(SUM(amount_requested), 0) AS requested_value
    FROM scoped_application
    WHERE status = 'DECLINED' AND decline_reason IS NOT NULL
    GROUP BY 1
    ORDER BY applications DESC, reason
  `,

  // --- A2C filter options -------------------------------------------
  // Deliberately unscoped: the dropdowns must keep offering every choice
  // regardless of what is currently selected.

  a2cFilterProviders: `
    SELECT
      p.id,
      p.short_name,
      p.name,
      p.status,
      (SELECT COUNT(*) FROM a2c_loan_application a WHERE a.provider_id = p.id) AS applications
    FROM a2c_credit_provider p
    ORDER BY
      CASE p.status WHEN 'ACTIVE' THEN 1 WHEN 'ONBOARDING' THEN 2 ELSE 3 END,
      p.name
  `,

  // The programme footprint is a handful of woredas, so the sidebar takes the
  // whole tree in one go and cascades client-side. Listing only places A2C
  // actually reaches keeps the user from picking a region with no loans in it.
  a2cFilterLocations: `
    SELECT
      region_name,
      region_pcode,
      zone_name,
      zone_pcode,
      woreda_name,
      woreda_pcode,
      COUNT(*) AS farmers
    FROM a2c_farmer
    GROUP BY 1, 2, 3, 4, 5, 6
    ORDER BY region_name, zone_name, woreda_name
  `,

  // ===================================================================
  };
