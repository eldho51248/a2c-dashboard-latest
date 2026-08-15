// components/server/static-bar-chart.tsx
// Server Component - Renders chart as static HTML/SVG
import { Card, CardContent } from "@/components/ui/card"

interface BarData {
  label: string
  value: number
  color?: string
}

interface StaticBarChartProps {
  title: string
  data: BarData[]
  height?: number
  showValues?: boolean
  color?: string
}

export function StaticBarChart({ 
  title, 
  data, 
  height = 300, 
  showValues = true,
  color = "#0B9147" 
}: StaticBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  const barWidth = 100 / data.length
  
  return (
    <Card className="border border-border/50 shadow-none">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="relative" style={{ height: `${height}px` }}>
          <div className="flex items-end justify-around h-full gap-2">
            {data.map((item, index) => {
              const barHeight = (item.value / maxValue) * 100
              const barColor = item.color || color
              
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center flex-1 h-full justify-end"
                >
                  {showValues && (
                    <span 
                      className="text-xs font-medium mb-1" 
                      style={{ color: barColor }}
                    >
                      {item.value.toLocaleString()}
                    </span>
                  )}
                  <div 
                    className="w-full rounded-t transition-all hover:opacity-80"
                    style={{ 
                      height: `${barHeight}%`,
                      backgroundColor: barColor,
                      minHeight: item.value > 0 ? '2px' : '0'
                    }}
                    title={`${item.label}: ${item.value.toLocaleString()}`}
                  />
                  <span 
                    className="text-xs mt-2 text-center text-muted-foreground transform -rotate-45 origin-top-left whitespace-nowrap"
                    style={{ fontSize: '10px' }}
                  >
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
