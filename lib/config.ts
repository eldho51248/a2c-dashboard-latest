// lib/config.ts
// Configuration file for MOF Dashboard
// Centralized place to manage all configuration settings

/**
 * Database Configuration
 * Modify these settings to connect to different databases
 */

export const DATABASE_CONFIG = {
  host: process.env.DB_HOST || undefined,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME || undefined,
  max: 20,
  // Give connections more time to establish and stay alive to avoid drops under load
  idleTimeoutMillis: 30000,
  // Keep connect timeout short to fail fast instead of hanging the request
  connectionTimeoutMillis: 3000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
}

/**
 * Cache Configuration
 * Adjust cache duration based on your data update frequency
 */
export const CACHE_CONFIG = {
  duration: 5 * 60 * 1000, // 5 minutes in milliseconds
  enabled: true,
}

/**
 * Data Processing Configuration
 */
export const DATA_CONFIG = {
  maxRecords: 1000, // Maximum records to fetch in one query
  defaultSector: 'agriculture', // Default sector for records without sector info
  unknownValueLabel: 'unknown', // Label for unknown/null values
}

/**
 * API Configuration
 */
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
}

/**
 * Export Configuration
 */
export const EXPORT_CONFIG = {
  csvDelimiter: ',',
  excelSheetName: 'MOF Dashboard Data',
  maxExportRecords: 10000,
}

/**
 * Environment-based settings
 */
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  enableDebugLogs: process.env.DEBUG_LOGS === 'true',
}

/**
 * Feature flags
 * Use these to enable/disable features easily
 */
export const FEATURES = {
  enableCaching: true,
  enableExport: true,
  enableRealTimeUpdates: false,
  enableAdvancedFiltering: true,
}

/**
 * Default filter values
 */
export const DEFAULT_FILTERS = {
  region: 'all',
  sector: 'all',
  gender: 'all',
  timePeriod: 'all',
  dateRange: {
    from: new Date(2020, 0, 1),
    to: new Date(2025, 11, 31),
  },
}

/**
 * Chart configuration
 */
export const CHART_CONFIG = {
  defaultColors: [
    '#10B981', // Green
    '#3B82F6', // Blue  
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
  ],
  animationDuration: 300,
  responsive: true,
}




/**
 * Utility function to get environment variable with fallback
 */
export function getEnvVar(key: string, fallback: string = ''): string {
  return process.env[key] || fallback
}

/**
 * Utility function to validate configuration
 */
export function validateConfig(): boolean {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
  const missing = required.filter(key => !process.env[key] && !DATABASE_CONFIG[key.toLowerCase().replace('db_', '') as keyof typeof DATABASE_CONFIG])
  
  if (missing.length > 0) {
    console.warn('Missing configuration for:', missing.join(', '))
    return false
  }
  
  return true
}
