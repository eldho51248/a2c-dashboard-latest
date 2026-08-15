"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Globe, Users, Heart, Zap, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { mockData, filterData, aggregateData } from "@/lib/mock-data"

interface KPICardsProps {
  type?: "social" | "economic" | "environment" | "institutions"
  filters?: {
    dateRange: { from: Date | undefined; to: Date | undefined }
    region: string
    sector: string
    gender: string
    timePeriod: string
  }
}

export function KPICards({ type, filters }: KPICardsProps) {
  const cardType = type ?? "economic"
  const filteredData = useMemo(() => {
    if (!filters) return mockData
    return filterData(mockData, filters)
  }, [filters])

  const kpiData = useMemo(() => {
    const getLatestValue = (category: string, subcategory: string) => {
      const categoryData = filteredData.filter((d) => d.category === category && d.subcategory === subcategory)
      if (categoryData.length === 0) return { value: 0, change: 0 }

      const aggregated = aggregateData(categoryData, ["year"])
      const sorted = aggregated.sort((a, b) => b.year - a.year)
      const latest = sorted[0]?.value || 0
      const previous = sorted[1]?.value || latest
      const change = previous !== 0 ? ((latest - previous) / previous) * 100 : 0

      return { value: latest, change }
    }

    const getSocialValue = (subcategory: string) => {
      const data = filteredData.filter((d) => d.category === "social" && d.subcategory === subcategory)
      if (data.length === 0) return { value: 0, change: 0 }

      const aggregated = aggregateData(data, ["year"])
      const sorted = aggregated.sort((a, b) => b.year - a.year)
      const latest = sorted[0]?.value || 0
      const previous = sorted[1]?.value || latest
      const change = previous !== 0 ? ((latest - previous) / previous) * 100 : 0

      return { value: latest, change }
    }

    const getEconomicValue = (category: string) => {
      const data = filteredData.filter((d) => d.category === category)
      if (data.length === 0) return { value: 0, change: 0 }

      const aggregated = aggregateData(data, ["year"])
      const sorted = aggregated.sort((a, b) => b.year - a.year)
      const latest = sorted[0]?.value || 0
      const previous = sorted[1]?.value || latest
      const change = previous !== 0 ? ((latest - previous) / previous) * 100 : 0

      return { value: latest / 1000000000, change } // Convert to billions
    }

    const getEnvironmentValue = (subcategory: string) => {
      return getLatestValue("environment", subcategory)
    }

    const getInstitutionsValue = (subcategory: string) => {
      return getLatestValue("institutions", subcategory)
    }

    switch (cardType) {
      case "social":
        const education = getSocialValue("education")
        const health = getSocialValue("health")
        const employment = getSocialValue("employment")
        const literacy = getSocialValue("literacy")

        return [
          {
            title: "Education Access",
            value: `${education.value.toFixed(1)}%`,
            change: `${education.change > 0 ? "+" : ""}${education.change.toFixed(1)}%`,
            trend: education.change >= 0 ? "up" : "down",
            icon: Heart,
            description: "Population access",
          },
          {
            title: "Health Access",
            value: `${health.value.toFixed(1)}%`,
            change: `${health.change > 0 ? "+" : ""}${health.change.toFixed(1)}%`,
            trend: health.change >= 0 ? "up" : "down",
            icon: Users,
            description: "Healthcare coverage",
          },
          {
            title: "Employment Rate",
            value: `${employment.value.toFixed(1)}%`,
            change: `${employment.change > 0 ? "+" : ""}${employment.change.toFixed(1)}%`,
            trend: employment.change >= 0 ? "up" : "down",
            icon: Globe,
            description: "Labor participation",
          },
          {
            title: "Literacy Rate",
            value: `${literacy.value.toFixed(1)}%`,
            change: `${literacy.change > 0 ? "+" : ""}${literacy.change.toFixed(1)}%`,
            trend: literacy.change >= 0 ? "up" : "down",
            icon: BarChart3,
            description: "Adult literacy",
          },
        ]

      case "economic":
        const gdp = getEconomicValue("gdp")
        const revenue = getEconomicValue("revenue")
        const expenditure = getEconomicValue("expenditure")

        return [
          {
            title: "GDP",
            value: `${gdp.value.toFixed(1)}B ETB`,
            change: `${gdp.change > 0 ? "+" : ""}${gdp.change.toFixed(1)}%`,
            trend: gdp.change >= 0 ? "up" : "down",
            icon: DollarSign,
            description: "Gross Domestic Product",
          },
          {
            title: "Revenue",
            value: `${revenue.value.toFixed(1)}B ETB`,
            change: `${revenue.change > 0 ? "+" : ""}${revenue.change.toFixed(1)}%`,
            trend: revenue.change >= 0 ? "up" : "down",
            icon: BarChart3,
            description: "Government revenue",
          },
          {
            title: "Expenditure",
            value: `${expenditure.value.toFixed(1)}B ETB`,
            change: `${expenditure.change > 0 ? "+" : ""}${expenditure.change.toFixed(1)}%`,
            trend: expenditure.change >= 0 ? "up" : "down",
            icon: TrendingUp,
            description: "Government spending",
          },
          {
            title: "Budget Balance",
            value: `${(revenue.value - expenditure.value).toFixed(1)}B ETB`,
            change: `${revenue.value - expenditure.value > 0 ? "+" : ""}${(revenue.change - expenditure.change).toFixed(1)}%`,
            trend: revenue.value - expenditure.value >= 0 ? "up" : "down",
            icon: Globe,
            description: "Fiscal balance",
          },
        ]

      case "environment":
        const co2 = getEnvironmentValue("co2_emissions")
        const forest = getEnvironmentValue("forest_coverage")
        const renewable = getEnvironmentValue("renewable_energy")

        return [
          {
            title: "CO2 Emissions",
            value: `${co2.value.toFixed(2)} t`,
            change: `${co2.change > 0 ? "+" : ""}${co2.change.toFixed(1)}%`,
            trend: co2.change <= 0 ? "up" : "down", // Lower is better
            icon: Globe,
            description: "Per capita",
          },
          {
            title: "Forest Coverage",
            value: `${forest.value.toFixed(1)}%`,
            change: `${forest.change > 0 ? "+" : ""}${forest.change.toFixed(1)}%`,
            trend: forest.change >= 0 ? "up" : "down",
            icon: BarChart3,
            description: "Land area",
          },
          {
            title: "Renewable Energy",
            value: `${renewable.value.toFixed(1)}%`,
            change: `${renewable.change > 0 ? "+" : ""}${renewable.change.toFixed(1)}%`,
            trend: renewable.change >= 0 ? "up" : "down",
            icon: Zap,
            description: "Energy production",
          },
          {
            title: "Environmental Index",
            value: `${((forest.value + renewable.value) / 2).toFixed(1)}`,
            change: `${(forest.change + renewable.change) / 2 > 0 ? "+" : ""}${((forest.change + renewable.change) / 2).toFixed(1)}%`,
            trend: (forest.change + renewable.change) / 2 >= 0 ? "up" : "down",
            icon: Zap,
            description: "Composite score",
          },
        ]

      case "institutions":
        const governance = getInstitutionsValue("governance_effectiveness")
        const corruption = getInstitutionsValue("corruption_index")
        const ruleOfLaw = getInstitutionsValue("rule_of_law")

        return [
          {
            title: "Governance Effectiveness",
            value: `${governance.value.toFixed(1)}`,
            change: `${governance.change > 0 ? "+" : ""}${governance.change.toFixed(1)}%`,
            trend: governance.change >= 0 ? "up" : "down",
            icon: Users,
            description: "Effectiveness score",
          },
          {
            title: "Corruption Index",
            value: `${corruption.value.toFixed(1)}`,
            change: `${corruption.change > 0 ? "+" : ""}${corruption.change.toFixed(1)}%`,
            trend: corruption.change <= 0 ? "up" : "down", // Lower is better
            icon: BarChart3,
            description: "Transparency score",
          },
          {
            title: "Rule of Law",
            value: `${ruleOfLaw.value.toFixed(1)}`,
            change: `${ruleOfLaw.change > 0 ? "+" : ""}${ruleOfLaw.change.toFixed(1)}%`,
            trend: ruleOfLaw.change >= 0 ? "up" : "down",
            icon: Globe,
            description: "Legal framework",
          },
          {
            title: "Institutional Quality",
            value: `${((governance.value + ruleOfLaw.value) / 2).toFixed(1)}`,
            change: `${(governance.change + ruleOfLaw.change) / 2 > 0 ? "+" : ""}${((governance.change + ruleOfLaw.change) / 2).toFixed(1)}%`,
            trend: (governance.change + ruleOfLaw.change) / 2 >= 0 ? "up" : "down",
            icon: BarChart3,
            description: "Overall quality",
          },
        ]

      default:
        return []
    }
  }, [type, filteredData])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {kpiData.map((kpi, index) => (
        <Card
          key={index}
          className="relative overflow-hidden bg-white/60 dark:bg-card/40 backdrop-blur-md 
                     rounded-2xl border border-white/20 dark:border-white/5 p-5 shadow-lg shadow-primary/5 transition-all duration-300 
                     hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div 
            className="absolute right-4 top-4 h-12 w-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner"
            style={{
              backgroundColor: `color-mix(in srgb, var(--chart-${(index % 5) + 1}) 15%, transparent)`,
              color: `var(--chart-${(index % 5) + 1})`,
              boxShadow: `0 0 15px color-mix(in srgb, var(--chart-${(index % 5) + 1}) 20%, transparent)`
            }}
          >
            <kpi.icon className="h-6 w-6" />
          </div>
          <CardHeader className="p-0 mb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {kpi.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 relative z-10">
            <div className="text-3xl font-extrabold text-foreground tracking-tight mt-2 mb-1">
              {kpi.value}
            </div>
            <div className={cn(
              "text-xs font-medium inline-flex items-center mt-1",
              kpi.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {kpi.trend === "up" ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {kpi.change} from last period
            </div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground/90 mt-1">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
