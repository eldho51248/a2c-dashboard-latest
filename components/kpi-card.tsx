import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  loading?: boolean
  error?: string | null
  subtext?: React.ReactNode
  subtextColor?: string
  iconSrc: string
  iconAlt?: string
  iconColorClass?: string // Expects "text-color bg-color/10"
  className?: string
  onClick?: () => void
}

export function KPICard({
  title,
  value,
  loading = false,
  error = null,
  subtext,
  subtextColor,
  iconSrc,
  iconAlt,
  iconColorClass = "text-primary bg-primary/10",
  className,
  onClick
}: KPICardProps) {
  return (
    <Card 
      data-kpi="true"
      className={cn(
        "relative overflow-hidden bg-white/60 dark:bg-card/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold text-foreground mt-1">
              {loading ? "..." : error ? "Error" : value}
            </div>
            {subtext && (
              <p className={cn("text-xs font-medium mt-1", subtextColor || "text-muted-foreground")}>
                {subtext}
              </p>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", iconColorClass)}>
            <Image 
              src={iconSrc} 
              alt={iconAlt || title} 
              width={24} 
              height={24} 
              className="opacity-90" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
