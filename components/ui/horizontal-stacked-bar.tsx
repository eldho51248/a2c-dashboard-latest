"use client"

import React from "react"
import { CHART_COLORS } from "@/lib/theme-config"

interface HorizontalStackedBarProps {
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  colors?: string[]
  height?: number
  showPercentages?: boolean
  showLabels?: boolean
  showLegend?: boolean
  className?: string
  title?: string
}

export function HorizontalStackedBar({
  data,
  colors = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.warning,
    CHART_COLORS.danger,
    CHART_COLORS.info,
  ],
  height = 48,
  showPercentages = true,
  showLabels = true,
  showLegend = true,
  className = "",
  title
}: HorizontalStackedBarProps) {
  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithPercentages = data.map((item, index) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
    color: item.color || colors[index % colors.length]
  }))

  let cumulativeWidth = 0

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h4 className="text-sm font-semibold text-black">{title}</h4>
      )}
      
      <div className="relative">
        <div 
          className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200"
          style={{ height: `${height}px` }}
        >
          {dataWithPercentages.map((item, index) => {
            const width = item.percentage
            const left = cumulativeWidth
            cumulativeWidth += width

            return (
              <div
                key={`${item.name}-${index}`}
                className="absolute top-0 h-full flex items-center justify-center transition-all duration-300 hover:opacity-80"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: item.color,
                }}
              >
                {showPercentages && width > 15 && (
                  <span className="text-white text-sm font-bold drop-shadow-sm">
                    {width.toFixed(0)}%
                  </span>
                )}
              </div>
            )
          })}

          {/* Labels below the bar */}
          {showLabels && (
            <div className="absolute -bottom-8 left-0 right-0 flex">
              {(() => {
                let labelCumulative = 0
                return dataWithPercentages.map((item, index) => {
                  const width = item.percentage
                  const left = labelCumulative + (width / 2)
                  labelCumulative += width

                  return width > 10 ? (
                    <div
                      key={`label-${item.name}-${index}`}
                      className="absolute text-xs font-medium text-black transform -translate-x-1/2"
                      style={{ left: `${left}%` }}
                    >
                      {item.name.length > 12 ? `${item.name.substring(0, 10)}...` : item.name}
                    </div>
                  ) : null
                })
              })()}
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-wrap gap-4 mt-8">
            {dataWithPercentages.map((item, index) => (
              <div key={`legend-${item.name}-${index}`} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-black">
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-black ml-1">
                    ({item.value.toLocaleString()} - {item.percentage.toFixed(1)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
