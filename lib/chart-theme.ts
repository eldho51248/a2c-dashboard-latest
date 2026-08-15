// lib/chart-theme.ts
// Centralized color configuration for all charts and UI components

export const chartTheme = {
  // Primary color palette for charts
  colors: {
    primary: "#0B9147",      // Green
    secondary: "#DD2828",    // Red  
    accent: "#FCDB04",       // Yellow
    warning: "#FAA71A",      // Orange
    success: "#91AD3D",      // Olive
    info: "#059669",         // Emerald
    muted: "#6B7280",        // Gray
    danger: "#DC2626",       // Dark Red
  },

  // Chart color arrays for multi-series data
  chartColors: [
    "#0B9147", // Green
    "#DD2828", // Red
    "#FCDB04", // Yellow
    "#FAA71A", // Orange
    "#91AD3D", // Olive
    "#059669", // Emerald
    "#F59E0B", // Amber
    "#DC2626", // Dark Red
  ],

  // KPI Card backgrounds (modern translucent style)
  kpiCards: {
    primary: {
      background: "linear-gradient(135deg, rgba(11, 145, 71, 0.1) 0%, rgba(10, 125, 62, 0.15) 100%)",
      textPrimary: "text-green-800",
      textSecondary: "text-green-700", 
      textMuted: "text-green-600",
      icon: "text-green-500",
    },
    secondary: {
      background: "linear-gradient(135deg, rgba(221, 40, 40, 0.1) 0%, rgba(194, 35, 35, 0.15) 100%)",
      textPrimary: "text-red-800",
      textSecondary: "text-red-700",
      textMuted: "text-red-600", 
      icon: "text-red-500",
    },
    accent: {
      background: "linear-gradient(135deg, rgba(252, 219, 4, 0.1) 0%, rgba(230, 196, 4, 0.15) 100%)",
      textPrimary: "text-yellow-800",
      textSecondary: "text-yellow-700",
      textMuted: "text-yellow-600",
      icon: "text-yellow-600",
    },
    warning: {
      background: "linear-gradient(135deg, rgba(250, 167, 26, 0.1) 0%, rgba(224, 149, 22, 0.15) 100%)",
      textPrimary: "text-amber-800", 
      textSecondary: "text-amber-700",
      textMuted: "text-amber-600",
      icon: "text-amber-600",
    },
    success: {
      background: "linear-gradient(135deg, rgba(145, 173, 61, 0.1) 0%, rgba(125, 150, 53, 0.15) 100%)",
      textPrimary: "text-green-800",
      textSecondary: "text-green-700",
      textMuted: "text-green-600", 
      icon: "text-green-600",
    },
    info: {
      background: "linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(4, 120, 87, 0.15) 100%)",
      textPrimary: "text-emerald-800",
      textSecondary: "text-emerald-700",
      textMuted: "text-emerald-600",
      icon: "text-emerald-500",
    },
  },

  // Tab navigation colors
  tabs: {
    active: {
      background: "bg-gradient-to-r from-green-800 to-green-700",
      text: "text-yellow-100",
    },
    inactive: {
      background: "bg-transparent",
      text: "text-gray-600",
      hover: "hover:text-green-700",
    },
  },

  // Chart-specific configurations
  charts: {
    bar: {
      fill: "#0B9147",
      stroke: "#0a7d3e",
      radius: [4, 4, 0, 0],
    },
    pie: {
      colors: [
        "#0B9147", // Green
        "#DD2828", // Red
        "#FCDB04", // Yellow
        "#FAA71A", // Orange
        "#91AD3D", // Olive
        "#059669", // Emerald
        "#F59E0B", // Amber
        "#DC2626", // Dark Red
      ],
    },
    line: {
      stroke: "#0B9147",
      strokeWidth: 2,
      dot: "#0B9147",
    },
    grid: {
      stroke: "#E5E7EB",
      strokeDasharray: "3 3",
    },
    axis: {
      stroke: "#666",
      fontSize: 12,
    },
  },

  // Card borders and backgrounds
  cards: {
    background: "bg-white",
    border: "border-gray-200",
    shadow: "shadow-lg",
    borderRadius: "rounded-lg",
  },

  // Loading states
  loading: {
    text: "...",
    skeleton: "bg-gray-200",
    animation: "animate-pulse",
  },
}

// Helper functions for easy access
export const getChartColor = (index: number): string => {
  return chartTheme.chartColors[index % chartTheme.chartColors.length]
}

export const getKPICardStyle = (variant: keyof typeof chartTheme.kpiCards) => {
  return chartTheme.kpiCards[variant]
}

export const getPieChartColors = () => {
  return chartTheme.charts.pie.colors
}

// Export individual color arrays for backward compatibility
export const COLORS = chartTheme.chartColors
export const PIE_COLORS = chartTheme.charts.pie.colors
