// lib/chart-data-service.ts
// Service for parallel chart data fetching with error handling
import { CHART_QUERIES as chartQueries, ChartFilters, ChartQueryResult } from './chart-queries'

export interface ChartDataResult {
  chartId: string
  success: boolean
  data: any[]
  error?: string
  loading: boolean
  executionTime?: number
  filters?: ChartFilters
}

export interface AllChartsResult {
  results: Record<string, ChartDataResult>
  summary: {
    total: number
    successful: number
    failed: number
    totalExecutionTime: number
  }
}

type QuerySource = string | ((filters: ChartFilters) => Promise<ChartQueryResult>)

type ChartConfig = {
  id: string
  name: string
  queryFunction: QuerySource
  priority: number
}

// Chart configuration
export const CHART_CONFIGS: Record<string, ChartConfig> = {
  farmersByRegion: {
    id: 'farmersByRegion',
    name: 'Farmers by Region',
    queryFunction: chartQueries.farmersByRegion,
    priority: 1,
  },
  farmersByType: {
    id: 'farmersByType',
    name: 'Farmers by Type',
    queryFunction: chartQueries.farmersByType,
    priority: 1,
  },
  farmerKPIs: {
    id: 'farmerKPIs',
    name: 'Farmer KPIs',
    queryFunction: chartQueries.farmerKPIs,
    priority: 1,
  },
  genderDistribution: {
    id: 'genderDistribution',
    name: 'Gender Distribution',
    queryFunction: chartQueries.genderDistribution,
    priority: 2,
  },
  landAreaByRegion: {
    id: 'landAreaByRegion',
    name: 'Land Area by Region',
    queryFunction: chartQueries.landAreaByRegion,
    priority: 2,
  },
  avgFarmSizeByType: {
    id: 'avgFarmSizeByType',
    name: 'Average Farm Size by Type',
    queryFunction: chartQueries.avgFarmSizeByType,
    priority: 2,
  },
  incomeDistribution: {
    id: 'incomeDistribution',
    name: 'Income Distribution',
    queryFunction: chartQueries.incomeDistribution,
    priority: 3,
  },
  registrationTimeline: {
    id: 'registrationTimeline',
    name: 'Registration Timeline',
    queryFunction: chartQueries.registrationTimeline,
    priority: 3,
  },
}

// Single chart data fetcher
export async function fetchSingleChartData(
  chartId: string, 
  filters: ChartFilters = {}
): Promise<ChartDataResult> {
  const startTime = Date.now()
  
  
  const config = CHART_CONFIGS[chartId as keyof typeof CHART_CONFIGS]
  
  if (!config) {
    console.error(`❌ Unknown chart ID: ${chartId}`)
    return {
      chartId,
      success: false,
      data: [],
      error: `Unknown chart ID: ${chartId}`,
      loading: false,
      executionTime: Date.now() - startTime,
      filters,
    }
  }

  try {
    let queryResult: ChartQueryResult

    if (typeof config.queryFunction === 'function') {
      queryResult = await config.queryFunction(filters)
    } else {
      queryResult = {
        success: false,
        data: [],
        error: 'Query function not implemented',
      }
    }

    const executionTime = Date.now() - startTime
    
    
    if (!queryResult.success) {
      console.error(`❌ ${config.name} query failed:`, queryResult.error)
    }
    
    return {
      chartId,
      success: queryResult.success,
      data: queryResult.data,
      error: queryResult.error || undefined,
      loading: false,
      executionTime,
      filters,
    }
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error(`❌ ${config.name} fetch failed after ${executionTime}ms:`, error)
    
    return {
      chartId,
      success: false,
      data: [],
      error: errorMessage,
      loading: false,
      executionTime,
      filters,
    }
  }
}

// Parallel chart data fetcher
export async function fetchAllChartsData(
  filters: ChartFilters = {},
  chartIds?: string[]
): Promise<AllChartsResult> {
  const startTime = Date.now()
  
  // Use provided chart IDs or all available charts
  const targetChartIds = chartIds || Object.keys(CHART_CONFIGS)
  
  
  // Create promises for all charts
  const chartPromises = targetChartIds.map(chartId => 
    fetchSingleChartData(chartId, filters)
  )
  
  // Execute all queries in parallel
  const results = await Promise.allSettled(chartPromises)
  
  // Process results
  const chartResults: Record<string, ChartDataResult> = {}
  let successful = 0
  let failed = 0
  
  results.forEach((result, index) => {
    const chartId = targetChartIds[index]
    
    if (result.status === 'fulfilled') {
      chartResults[chartId] = result.value
      if (result.value.success) {
        successful++
      } else {
        failed++
      }
    } else {
      // Promise was rejected
      console.error(`❌ Promise rejected for chart ${chartId}:`, result.reason)
      chartResults[chartId] = {
        chartId,
        success: false,
        data: [],
        error: result.reason?.message || 'Promise rejected',
        loading: false,
        executionTime: 0,
        filters,
      }
      failed++
    }
  })
  
  const totalExecutionTime = Date.now() - startTime
  
  
  // Log individual chart results
  Object.entries(chartResults).forEach(([chartId, result]) => {
    const config = CHART_CONFIGS[chartId as keyof typeof CHART_CONFIGS]
    const status = result.success ? '✅' : '❌'
    if (!result.success) {
    }
  })
  
  return {
    results: chartResults,
    summary: {
      total: targetChartIds.length,
      successful,
      failed,
      totalExecutionTime,
    }
  }
}

// Priority-based chart fetcher (fetch high priority charts first)
export async function fetchChartsByPriority(
  filters: ChartFilters = {}
): Promise<AllChartsResult> {
  
  // Group charts by priority
  const chartsByPriority: Record<number, string[]> = {}
  
  Object.entries(CHART_CONFIGS).forEach(([chartId, config]) => {
    if (!chartsByPriority[config.priority]) {
      chartsByPriority[config.priority] = []
    }
    chartsByPriority[config.priority].push(chartId)
  })
  
  const priorities = Object.keys(chartsByPriority).map(Number).sort()
  
  const allResults: Record<string, ChartDataResult> = {}
  let totalSuccessful = 0
  let totalFailed = 0
  const overallStartTime = Date.now()
  
  // Fetch each priority group sequentially, but charts within each group in parallel
  for (const priority of priorities) {
    const chartIds = chartsByPriority[priority]
    
    const priorityResult = await fetchAllChartsData(filters, chartIds)
    
    // Merge results
    Object.assign(allResults, priorityResult.results)
    totalSuccessful += priorityResult.summary.successful
    totalFailed += priorityResult.summary.failed
  }
  
  const totalExecutionTime = Date.now() - overallStartTime
  
  return {
    results: allResults,
    summary: {
      total: Object.keys(CHART_CONFIGS).length,
      successful: totalSuccessful,
      failed: totalFailed,
      totalExecutionTime,
    }
  }
}

// Utility function to validate filters
export function validateFilters(filters: ChartFilters): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate date range
  if (filters.dateFrom && filters.dateTo) {
    const fromDate = new Date(filters.dateFrom)
    const toDate = new Date(filters.dateTo)
    
    if (isNaN(fromDate.getTime())) {
      errors.push('Invalid dateFrom format')
    }
    if (isNaN(toDate.getTime())) {
      errors.push('Invalid dateTo format')
    }
    if (fromDate > toDate) {
      errors.push('dateFrom must be before dateTo')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export type { ChartFilters }
