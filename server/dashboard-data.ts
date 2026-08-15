import { performance } from 'perf_hooks';
import { CHART_QUERIES, ChartFilters } from '@/lib/chart-queries';
import { pool } from '@/lib/database';
import { getCachedData, setCachedData, generateCacheKey } from './cache';

const filterColumnMap = {
    region: { name: 'rp.region', type: 'integer' },
    recordState: { name: 'rp.state', type: 'string' },
    zone: { name: 'rp.zone', type: 'integer' },
    woreda: { name: 'rp.woreda', type: 'integer' },
    kebele: { name: 'rp.kebele', type: 'integer' },
    farmingType: { name: 'rp.farming_type', type: 'string' },
    // The sidebar sends the raw farming_type label, so compare case-insensitively.
    farmerType: { name: 'rp.farming_type', type: 'stringCI' },
} as const;

type FilterOverrides = Partial<Record<keyof ChartFilters, string>>;

const chartFilterOverrides: Record<string, FilterOverrides> = {
    // Defaults already use rp.*, and those columns exist in the base queries.
    // Keep overrides empty unless a query truly aliases the filtered column.
};

function buildWhereClause(filters: ChartFilters, overrides?: FilterOverrides): { clause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filters)) {
        if (value && value !== 'all') {
            const columnKey = key as keyof typeof filterColumnMap;
            const column = filterColumnMap[columnKey];
            const overrideName = overrides?.[columnKey];
            if (column) {
                const columnName = overrideName || column.name;
                const condition = column.type === 'integer'
                    ? `${columnName} = $${paramIndex++}::integer`
                    : column.type === 'stringCI'
                        ? `LOWER(TRIM(${columnName})) = LOWER(TRIM($${paramIndex++}))`
                        : `${columnName} = $${paramIndex++}`;
                conditions.push(condition);
                values.push(value);
            }
        }
    }

    if (conditions.length === 0) {
        return { clause: '', values: [] };
    }

    return {
        clause: `AND ${conditions.join(' AND ')}`,
        values,
    };
}

async function convertPcodsToIds(filters: any) {
    const convertedFilters = { ...filters };

    try {
        if (filters.region && filters.region !== 'all') {
            const regionResult = await pool.query('SELECT id FROM g2p_region WHERE code = $1', [filters.region]);
            if (regionResult.rows.length > 0) {
                convertedFilters.region = regionResult.rows[0].id;
            }
        }

        if (filters.zone && filters.zone !== 'all') {
            const zoneResult = await pool.query('SELECT id FROM g2p_zone WHERE code = $1', [filters.zone]);
            if (zoneResult.rows.length > 0) {
                convertedFilters.zone = zoneResult.rows[0].id;
            }
        }

        if (filters.woreda && filters.woreda !== 'all') {
            const woredaResult = await pool.query('SELECT id FROM g2p_woreda WHERE code = $1', [filters.woreda]);
            if (woredaResult.rows.length > 0) {
                convertedFilters.woreda = woredaResult.rows[0].id;
            }
        }

        if (filters.kebele && filters.kebele !== 'all') {
            const kebeleResult = await pool.query('SELECT id FROM g2p_kebele WHERE code = $1', [filters.kebele]);
            if (kebeleResult.rows.length > 0) {
                convertedFilters.kebele = kebeleResult.rows[0].id;
            }
        }

        return convertedFilters;
    } catch (error) {
        console.error('Error converting Pcods to IDs:', error);
        return filters;
    }
}

export async function executeChartQuery(chartName: string, filters: ChartFilters) {
    // Check cache first
    const cacheKey = generateCacheKey(`chart:${chartName}`, filters);
    const cached = getCachedData<any>(cacheKey);

    if (cached) {
        return {
            ...cached,
            fromCache: true,
        };
    }

    const startTime = performance.now();

    try {
        const baseQuery = CHART_QUERIES[chartName as keyof typeof CHART_QUERIES];
        if (!baseQuery) {
            throw new Error(`Query for chart "${chartName}" not found.`);
        }

        const convertedFilters = await convertPcodsToIds(filters);
        const overrides = chartFilterOverrides[chartName] || undefined;
        const { clause, values } = buildWhereClause(convertedFilters, overrides);
        const finalSql = baseQuery.replace('--- DYNAMIC_FILTERS ---', clause);

        const { rows } = await pool.query(finalSql, values);
        const executionTime = Math.round(performance.now() - startTime);

        const result = {
            chartName,
            success: true,
            data: rows,
            error: null,
            executionTime,
        };

        // Cache the result
        setCachedData(cacheKey, result);

        return result;
    } catch (error: any) {
        const executionTime = Math.round(performance.now() - startTime);
        console.error(`Error executing ${chartName}:`, error);
        return {
            chartName,
            success: false,
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime,
        };
    }
}

export async function runChartGroup(chartNames: string[], filters: ChartFilters) {
    const resultsArray = await Promise.all(chartNames.map(chartId => executeChartQuery(chartId, filters)));

    const data: Record<string, any[]> = {};
    const errors: Array<{ chart: string; error: string | null }> = [];
    let totalExecutionTime = 0;

    resultsArray.forEach(result => {
        data[result.chartName] = result.data;
        totalExecutionTime += result.executionTime || 0;
        if (!result.success) {
            errors.push({
                chart: result.chartName,
                error: result.error,
            });
        }
    });

    return {
        success: errors.length === 0,
        data,
        errors,
        summary: {
            total: chartNames.length,
            successful: chartNames.length - errors.length,
            failed: errors.length,
            totalExecutionTime,
        },
    };
}
