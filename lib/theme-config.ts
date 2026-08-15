// lib/theme-config.ts
// Centralized theme configuration for all charts, KPI cards, and UI elements

export interface ThemeColors {
  primary: string
  secondary: string
  success: string
  warning: string
  danger: string
  info: string
  light: string
  dark: string
}

export interface ChartColors {
  primary: string
  secondary: string
  tertiary: string
  quaternary: string
  success: string
  warning: string
  danger: string
  info: string
}

export interface KPICardTheme {
  background: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  iconColor: string
}

export interface KPICardThemes {
  primary: KPICardTheme
  secondary: KPICardTheme
  success: KPICardTheme
  warning: KPICardTheme
  danger: KPICardTheme
  info: KPICardTheme
  accent1: KPICardTheme
  accent2: KPICardTheme
}

// Main color palette - customize these to change the entire theme
// Main color palette - customize these to change the entire theme
export const THEME_COLORS: ThemeColors = {
  primary: '#059669',    // Vibrant Emerald Green
  secondary: '#FCDB04',  // User requested Yellow
  success: '#059669',    // Emerald
  warning: '#FAA71A',    // User requested Amber
  danger: '#DD2828',     // User requested Red
  info: '#06B6D4',       // Cyan (for "colorful" variety)
  light: '#F8FAFC',      // Light gray
  dark: '#1E293B',       // Dark gray
}

// Chart color palette - used for bars, lines, pie slices, etc.
export const CHART_COLORS: ChartColors = {
  primary: THEME_COLORS.primary,
  secondary: THEME_COLORS.secondary,
  tertiary: THEME_COLORS.danger,
  quaternary: THEME_COLORS.warning,
  success: THEME_COLORS.success,
  warning: THEME_COLORS.warning,
  danger: THEME_COLORS.danger,
  info: THEME_COLORS.info,
}

// Extended color palette for charts with many data points
export const EXTENDED_CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

// KPI Card themes with modern translucent backgrounds
export const KPI_CARD_THEMES: KPICardThemes = {
  primary: {
    background: `linear-gradient(135deg, rgba(0, 76, 0, 0.1) 0%, rgba(0, 51, 0, 0.15) 100%)`,
    textPrimary: 'text-green-800',
    textSecondary: 'text-green-900',
    textTertiary: 'text-green-700',
    iconColor: 'text-green-600',
  },
  secondary: {
    background: `linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, rgba(234, 179, 8, 0.15) 100%)`,
    textPrimary: 'text-yellow-700',
    textSecondary: 'text-yellow-800',
    textTertiary: 'text-yellow-600',
    iconColor: 'text-yellow-600',
  },
  success: {
    background: `linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(4, 120, 87, 0.15) 100%)`,
    textPrimary: 'text-emerald-700',
    textSecondary: 'text-emerald-800',
    textTertiary: 'text-emerald-600',
    iconColor: 'text-emerald-600',
  },
  warning: {
    background: `linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.15) 100%)`,
    textPrimary: 'text-orange-700',
    textSecondary: 'text-orange-800',
    textTertiary: 'text-orange-600',
    iconColor: 'text-orange-600',
  },
  danger: {
    background: `linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(185, 28, 28, 0.15) 100%)`,
    textPrimary: 'text-red-700',
    textSecondary: 'text-red-800',
    textTertiary: 'text-red-600',
    iconColor: 'text-red-500',
  },
  info: {
    background: `linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.15) 100%)`,
    textPrimary: 'text-blue-700',
    textSecondary: 'text-blue-800',
    textTertiary: 'text-blue-600',
    iconColor: 'text-blue-500',
  },
  accent1: {
    background: `linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(13, 148, 136, 0.15) 100%)`,
    textPrimary: 'text-teal-700',
    textSecondary: 'text-teal-800',
    textTertiary: 'text-teal-600',
    iconColor: 'text-teal-600',
  },
  accent2: {
    background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.15) 100%)`,
    textPrimary: 'text-purple-700',
    textSecondary: 'text-purple-800',
    textTertiary: 'text-purple-600',
    iconColor: 'text-purple-500',
  },
}

// Legacy solid backgrounds (for backward compatibility or different themes)
export const SOLID_KPI_BACKGROUNDS = {
  primary: 'linear-gradient(135deg, #004c00 0%, #003300 100%)',
  secondary: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
  success: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
  warning: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  danger: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
  info: 'linear-gradient(135deg, #3B82F6 0%, #2563eb 100%)',
  accent1: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  accent2: 'linear-gradient(135deg, #8B5CF6 0%, #7c3aed 100%)',
}

// Chart configuration presets
export const CHART_CONFIG_PRESETS = {
  bar: {
    fill: CHART_COLORS.primary,
    radius: [4, 4, 0, 0],
  },
  pie: {
    colors: EXTENDED_CHART_COLORS,
    outerRadius: 80,
    labelFormat: ({ name, percent, value }: any) =>
      `${name}: ${value} (${percent ? (percent * 100).toFixed(0) : 0}%)`,
  },
  line: {
    stroke: CHART_COLORS.primary,
    strokeWidth: 3,
    dot: { fill: CHART_COLORS.primary, strokeWidth: 2 },
  },
  area: {
    fill: CHART_COLORS.primary,
    stroke: CHART_COLORS.primary,
    fillOpacity: 0.6,
  },
}

// Gender-specific colors
// Gender-specific colors
export const GENDER_COLORS = {
  male: CHART_COLORS.primary,     // Green
  female: '#FAA71A',              // Amber (High contrast vs Green)
  unknown: '#94A3B8',             // Neutral Gray
}

// Age group colors
export const AGE_GROUP_COLORS = {
  'Under 30': CHART_COLORS.info,      // Blue
  '30-50': CHART_COLORS.primary,      // Green
  '50-65': CHART_COLORS.warning,      // Amber
  '65+': CHART_COLORS.danger,         // Red
}

// Household status colors
export const HOUSEHOLD_STATUS_COLORS = {
  head: CHART_COLORS.primary,         // Green
  member: CHART_COLORS.secondary,     // Yellow
  male_head: CHART_COLORS.primary,    // Green
  female_head: CHART_COLORS.danger,   // Red
  male_member: CHART_COLORS.info,     // Blue
  female_member: CHART_COLORS.warning, // Amber
}

// Farming type colors
export const FARMING_TYPE_COLORS = {
  livestock_farming: CHART_COLORS.primary,   // Green
  crop_farming: CHART_COLORS.secondary,      // Yellow
  mixed_farming: CHART_COLORS.danger,        // Red
}

// Utility functions for theme customization
export const getKPICardStyle = (theme: keyof KPICardThemes) => ({
  background: KPI_CARD_THEMES[theme].background,
  backdropFilter: 'blur(10px)',
})

export const getKPICardClasses = (theme: keyof KPICardThemes) => ({
  textPrimary: KPI_CARD_THEMES[theme].textPrimary,
  textSecondary: KPI_CARD_THEMES[theme].textSecondary,
  textTertiary: KPI_CARD_THEMES[theme].textTertiary,
  iconColor: KPI_CARD_THEMES[theme].iconColor,
})

// Chart theme utilities
export const getChartColor = (index: number) =>
  EXTENDED_CHART_COLORS[index % EXTENDED_CHART_COLORS.length]

export const getGenderColor = (gender: string) => {
  const normalizedGender = gender.toLowerCase()
  if (normalizedGender === 'male') return GENDER_COLORS.male
  if (normalizedGender === 'female') return GENDER_COLORS.female
  return GENDER_COLORS.unknown
}

export const getFarmingTypeColor = (type: string) => {
  return FARMING_TYPE_COLORS[type as keyof typeof FARMING_TYPE_COLORS] || CHART_COLORS.primary
}

export const getAgeGroupColor = (ageGroup: string) => {
  return AGE_GROUP_COLORS[ageGroup as keyof typeof AGE_GROUP_COLORS] || CHART_COLORS.primary
}

export const getHouseholdStatusColor = (status: string) => {
  return HOUSEHOLD_STATUS_COLORS[status as keyof typeof HOUSEHOLD_STATUS_COLORS] || CHART_COLORS.primary
}

// Export everything for easy importing
export default {
  THEME_COLORS,
  CHART_COLORS,
  EXTENDED_CHART_COLORS,
  KPI_CARD_THEMES,
  SOLID_KPI_BACKGROUNDS,
  CHART_CONFIG_PRESETS,
  GENDER_COLORS,
  AGE_GROUP_COLORS,
  HOUSEHOLD_STATUS_COLORS,
  FARMING_TYPE_COLORS,
  getKPICardStyle,
  getKPICardClasses,
  getChartColor,
  getGenderColor,
  getFarmingTypeColor,
  getAgeGroupColor,
  getHouseholdStatusColor,
}
