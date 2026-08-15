// components/server/kpi-cards.tsx
// Server Component - No "use client" directive
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { formatCompactNumber } from "@/lib/number-format"

interface KPICardProps {
  title: string
  value: number | string
  subtitle: string
  icon: string
  iconAlt: string
}

export function KPICard({ title, value, subtitle, icon, iconAlt }: KPICardProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-background to-card/80 dark:from-card/90 dark:to-card/70 rounded-xl border border-border/30 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:translate-y-[-2px]">
      <CardContent className="px-2 py-1.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <div className="text-lg font-semibold text-foreground">
              {typeof value === 'number' ? formatCompactNumber(value) : value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <Image src={icon} alt={iconAlt} width={24} height={24} className="opacity-80" />
        </div>
      </CardContent>
    </Card>
  )
}

interface KPIGridProps {
  cards: KPICardProps[]
  className?: string
}

export function KPIGrid({ cards, className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" }: KPIGridProps) {
  return (
    <div className={className}>
      {cards.map((card, index) => (
        <KPICard key={index} {...card} />
      ))}
    </div>
  )
}
