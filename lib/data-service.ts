// new

// lib/data-service.ts
// Main data service for MOF Dashboard - handles all data operations
import { DataPoint, filterData, aggregateData, exportToCSV, exportToExcel } from './mock-data'
import {
  fetchFarmersData,
  fetchAggregatedStats,
  testConnection,
  fetchRegions,
  fetchRecordStatuses,
  fetchFarmerTypes,
  fetchZones,
  fetchWoredas,
  fetchKebeles,
} from './database'
import { CACHE_CONFIG } from './config'

// Configuration
// USE_DATABASE is no longer needed as mock data is fully deprecated in the service
// and the service now handles database unavailability gracefully.

// Cache configuration using centralized config
let cachedData: DataPoint[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = CACHE_CONFIG.duration

/**
 * Main data service class - Singleton pattern
 * Handles all data operations for the dashboard
 * Easy to extend with new methods for different data needs
 */
export class DataService {
  private static instance: DataService
  private isInitialized = false
  private isDatabaseAvailable = false

  private constructor() { }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }

  /**
   * Initialize the data service and test database connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.isDatabaseAvailable = await testConnection()
    } catch (error) {
      console.error('Failed to test database connection:', error)
      this.isDatabaseAvailable = false
    }

    this.isInitialized = true
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    // Attempt to reconnect if database was previously unavailable
    if (!this.isDatabaseAvailable) {
      console.log('Database previously unavailable, retrying connection...')
      try {
        this.isDatabaseAvailable = await testConnection()
        if (this.isDatabaseAvailable) {
          console.log('Database connection recovered!')
        }
      } catch (error) {
        console.error('Retry connection failed:', error)
      }
    }

    if (!this.isDatabaseAvailable) {
      throw new Error('Database connection is not available')
    }
  }

  async getData(): Promise<DataPoint[]> {
    await this.ensureInitialized()
    return this.getDatabaseData()
  }

  private async getDatabaseData(): Promise<DataPoint[]> {
    const now = Date.now()

    // Return cached data if caching is enabled and data is still fresh
    if (CACHE_CONFIG.enabled && cachedData && now - cacheTimestamp < CACHE_DURATION) {
      return cachedData
    }

    const data = await fetchFarmersData()

    // Update cache if caching is enabled
    if (CACHE_CONFIG.enabled) {
      cachedData = data
      cacheTimestamp = now
    }

    return data
  }

  async getFilteredData(filters: any): Promise<DataPoint[]> {
    // Note: The current filterData function is from mock-data and might need
    // to be replaced with a more efficient server-side filtering implementation
    // for production. For now, we fetch all data then filter on the client.
    const data = await this.getData()
    return filterData(data, filters)
  }

  async getAggregatedData(groupBy: string[]): Promise<any[]> {
    const data = await this.getData()
    return aggregateData(data, groupBy)
  }

  async getStats(): Promise<any> {
    await this.ensureInitialized()
    return await fetchAggregatedStats()
  }

  // REFACTOR: Added methods to fetch dynamic filter options
  async getRegions() {
    await this.ensureInitialized()
    return await fetchRegions()
  }

  async getRecordStatuses() {
    await this.ensureInitialized()
    return await fetchRecordStatuses()
  }

  async getFarmerTypes() {
    await this.ensureInitialized()
    return await fetchFarmerTypes()
  }

  // Location hierarchy methods for cascading dropdowns
  async getZones(regionId: number) {
    await this.ensureInitialized()
    return await fetchZones(regionId)
  }

  async getWoredas(zoneId: number) {
    await this.ensureInitialized()
    return await fetchWoredas(zoneId)
  }

  async getKebeles(woredaId: number) {
    await this.ensureInitialized()
    return await fetchKebeles(woredaId)
  }

  // Clear cache manually if needed
  clearCache(): void {
    cachedData = null
    cacheTimestamp = 0
  }

  // Get data source info
  getDataSourceInfo(): { source: string; isDatabaseAvailable: boolean; cacheStatus: string } {
    const now = Date.now()
    const cacheAge = cachedData ? now - cacheTimestamp : 0
    const cacheStatus = cachedData ? `Cached ${Math.round(cacheAge / 1000)}s ago` : 'No cache'

    return {
      source: 'database',
      isDatabaseAvailable: this.isDatabaseAvailable,
      cacheStatus,
    }
  }

  // Export functions
  async exportToCSV(filters: any, filename: string): Promise<void> {
    const data = await this.getFilteredData(filters)
    exportToCSV(data, filename)
  }

  async exportToExcel(filters: any, filename: string): Promise<void> {
    const data = await this.getFilteredData(filters)
    exportToExcel(data, filename)
  }
}

// Export singleton instance
export const dataService = DataService.getInstance()

// Export utility functions for backward compatibility
export { filterData, aggregateData, exportToCSV, exportToExcel }
export type { DataPoint }
