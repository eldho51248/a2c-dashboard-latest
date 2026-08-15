"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Globe, Users, Heart, Zap } from "lucide-react"

interface IndicatorKPICardsProps {
  category: "social" | "economic" | "environment" | "institutions"
  selectedCountry: string
}

export function IndicatorKPICards({ category, selectedCountry }: IndicatorKPICardsProps) {
  const kpiData = {
    social: [
      {
        title: "Life Expectancy",
        value: "67.8 years",
        change: "+2.1%",
        trend: "up",
        icon: Heart,
        description: "2024 vs 2020",
      },
      {
        title: "Poverty Rate ($3/day)",
        value: "68.7%",
        change: "-3.2%",
        trend: "down",
        icon: Users,
        description: "2021 PPP",
      },
      {
        title: "Internet Access",
        value: "21.2%",
        change: "+15.8%",
        trend: "up",
        icon: Globe,
        description: "Population coverage",
      },
      {
        title: "Human Capital Index",
        value: "0.38",
        change: "+0.03",
        trend: "up",
        icon: BarChart3,
        description: "Scale 0-1",
      },
    ],
    economic: [
      {
        title: "GDP (Current ETB)",
        value: "Br156.1B",
        change: "+8.4%",
        trend: "up",
        icon: DollarSign,
        description: "2024 estimate",
      },
      {
        title: "GDP Per Capita",
        value: "Br1,289",
        change: "+5.2%",
        trend: "up",
        icon: BarChart3,
        description: "Current ETB",
      },
      {
        title: "GDP Growth",
        value: "6.3%",
        change: "-1.2%",
        trend: "down",
        icon: TrendingUp,
        description: "Annual growth",
      },
      {
        title: "FDI Inflows",
        value: "3.8%",
        change: "+0.9%",
        trend: "up",
        icon: Globe,
        description: "% of GDP",
      },
    ],
    environment: [
      {
        title: "Forest Coverage",
        value: "12.9%",
        change: "-0.8%",
        trend: "down",
        icon: Globe,
        description: "% of land area",
      },
      {
        title: "CO2 Emissions",
        value: "0.31 t",
        change: "+0.05",
        trend: "up",
        icon: BarChart3,
        description: "Per capita",
      },
      {
        title: "Renewable Energy",
        value: "2.1%",
        change: "+0.3%",
        trend: "up",
        icon: Zap,
        description: "Excl. hydroelectric",
      },
      {
        title: "Electricity Access",
        value: "47.9%",
        change: "+12.4%",
        trend: "up",
        icon: Zap,
        description: "Population access",
      },
    ],
    institutions: [
      {
        title: "Women in Parliament",
        value: "38.8%",
        change: "+2.1%",
        trend: "up",
        icon: Users,
        description: "Seats held",
      },
      {
        title: "Homicide Rate",
        value: "7.56",
        change: "-0.8",
        trend: "down",
        icon: BarChart3,
        description: "Per 100,000 people",
      },
      {
        title: "Voice & Accountability",
        value: "24.6%",
        change: "+1.2%",
        trend: "up",
        icon: Globe,
        description: "Percentile rank",
      },
      {
        title: "Rule of Law",
        value: "31.2%",
        change: "+0.8%",
        trend: "up",
        icon: BarChart3,
        description: "Percentile rank",
      },
    ],
  }

  const kpis = kpiData[category]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <Card
          key={index}
          className="bg-card/95 dark:bg-card/90 border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl resize overflow-auto min-h-[120px]"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
            <kpi.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            <div className="flex items-center space-x-2 mt-2">
              {kpi.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${kpi.trend === "up" ? "text-green-600" : "text-red-500"}`}>
                {kpi.change}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
