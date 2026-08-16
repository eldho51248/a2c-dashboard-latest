"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts"
import Image from "next/image"
import { CHART_COLORS } from "@/lib/theme-config"
import { formatCompactNumber, formatFullNumber } from "@/lib/number-format"
import { KPICard } from "@/components/kpi-card"
import { useChartGroupData } from "@/hooks/use-data"
import { DashboardSectionSkeleton } from "@/components/ui/dashboard-skeleton"

interface AdminChartsProps {
  filters: {
    region: string
    zone: string
    woreda: string
    kebele: string
    farmerType: string
    recordState: string
    farmingType: string
  }
  onMapFilterChange?: (filters: { region?: string; zone?: string; woreda?: string }) => void
  geoJsonData?: any
  initialData?: any // SSR seed; client refetch keeps filters fresh
}

export function AdminCharts({ filters, onMapFilterChange, geoJsonData, initialData }: AdminChartsProps) {
  const [showFullKpi, setShowFullKpi] = useState(false)

  const chartNames = [
    'farmerKpis',
    'farmersByFarmerId',
    'farmersByRegion',
  ]
  const { data: dashboardData, loading, error } = useChartGroupData(chartNames, filters, initialData)
  const errorMessage = error || dashboardData?.errors?.[0]?.error || null;
  const pruneUnknownZero = (items: any[], labelKey: string, valueKey: string) =>
    (items || []).filter(item => {
      const label = (item[labelKey] || '').toString().toLowerCase().trim()
      const value = parseInt(item[valueKey] || 0, 10)
      return !(label === 'unknown' && value === 0)
    })

  const charts = dashboardData?.data || {}
  const kpiData = charts.farmerKpis ? charts.farmerKpis[0] : null
  const farmerIdData = pruneUnknownZero(charts.farmersByFarmerId || [], 'id_status', 'farmers')
  const farmersByRegionData = pruneUnknownZero(charts.farmersByRegion || [], 'region', 'farmers')
  const errorBanner = errorMessage ? (
    <Card className="shadow-md border border-red-200">
      <CardContent className="p-4">
        <p className="text-sm font-medium text-red-600">Failed to load admin data</p>
        <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
      </CardContent>
    </Card>
  ) : null

  // Farmer ID data from API
  const farmerIdChartData = useMemo(() => {
    return farmerIdData.map((d) => ({
      status: d.id_status,
      farmers: parseInt(d.farmers),
    }))
  }, [farmerIdData])

  const totalFarmersWithId = useMemo(() => {
    const withId = farmerIdData.find(d => d.id_status === 'With Farmer ID')
    return withId ? parseInt(withId.farmers) : 0
  }, [farmerIdData])

  const totalFarmersWithoutId = useMemo(() => {
    const withoutId = farmerIdData.find(d => d.id_status === 'Without Farmer ID')
    return withoutId ? parseInt(withoutId.farmers) : 0
  }, [farmerIdData])

  const totalFarmersForId = totalFarmersWithId + totalFarmersWithoutId

  // Real identification data from API
  const identificationData = useMemo(() => {
    if (!kpiData) return []
    const withId = parseInt(kpiData.farmers_with_id || 0)
    const withoutId = parseInt(kpiData.farmers_without_id || 0)
    return [
      { status: "With UID", farmers: withId },
      { status: "Without UID", farmers: withoutId },
    ]
  }, [kpiData])

  const displayNumber = (value: number | string | null | undefined) =>
    showFullKpi ? formatFullNumber(value) : formatCompactNumber(value)

  if (loading && !dashboardData) {
    return <DashboardSectionSkeleton />
  }

  return (
    <div className="space-y-6">
      {errorBanner}
      
      {/* KPI Card for Uniquely Identified Farmers */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onClick={() => setShowFullKpi(!showFullKpi)}
        title="Click to toggle full numbers"
      >
        <KPICard
          title="Farmers with National ID(UID)"
          value={displayNumber(kpiData?.farmers_with_id || 0)}
          loading={loading}
          error={errorMessage}
          subtext={(loading ? "..." : `${((parseInt(kpiData?.farmers_with_id || 0) / parseInt(kpiData?.total_farmers || 1)) * 100 || 0).toFixed(1)}% Identified`)}
          subtextColor="text-emerald-600 dark:text-emerald-400"
          iconSrc="/images/01_Profile.png"
          iconAlt="Profile/ID"
          iconColorClass="text-primary bg-primary/10"
        />

        <KPICard
          title="Farmers without National ID(UID)"
          value={displayNumber(kpiData?.farmers_without_id || 0)}
          loading={loading}
          error={errorMessage}
          subtext={(loading ? "..." : `${((parseInt(kpiData?.farmers_without_id || 0) / parseInt(kpiData?.total_farmers || 1)) * 100 || 0).toFixed(1)}% Not Identified`)}
          subtextColor="text-rose-600 dark:text-rose-400"
          iconSrc="/images/01_Profile.png"
          iconAlt="Profile/ID"
          iconColorClass="text-danger bg-danger/10"
        />
      </div>


      {/* Uniquely Identified Farmers Chart */}
      <Card className="border border-white/20 dark:border-white/5 bg-white/60 dark:bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-4">
          <h3 className="text-sm text-center  text-muted-foreground mb-3">Uniquely Identified Farmers (NIDP)</h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-black">Loading...</div>
            </div>
          ) : (
            <ChartContainer
              config={{
                with_uid: { label: "With UID", color: CHART_COLORS.primary },
                without_uid: { label: "Without UID", color: CHART_COLORS.secondary },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={identificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => `${name}: ${value.toLocaleString()} (${percent ? (percent * 100).toFixed(0) : 0}%)`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="farmers"
                    nameKey="status"
                    fontSize={14}
                    fontWeight="bold"
                  >
                    {identificationData.map((entry, index) => {
                      const colors = [CHART_COLORS.primary, CHART_COLORS.secondary];
                      return (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      );
                    })}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Farmer ID KPI Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onClick={() => setShowFullKpi(!showFullKpi)}
        title="Click to toggle full numbers"
      >
        <Card className="relative overflow-hidden bg-white/60 dark:bg-card/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-center  text-muted-foreground mb-3">Farmers with Farmer ID</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? "..." : displayNumber(totalFarmersWithId)}
                </div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1">
                  {loading ? "..." : `${((totalFarmersWithId / (totalFarmersForId || 1)) * 100 || 0).toFixed(1)}% Have ID`}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Image src="/images/01_Profile.png" alt="Farmer ID" width={24} height={24} className="opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white/60 dark:bg-card/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-center  text-muted-foreground mb-3">Farmers without Farmer ID</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? "..." : displayNumber(totalFarmersWithoutId)}
                </div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1">
                  {loading ? "..." : `${((totalFarmersWithoutId / (totalFarmersForId || 1)) * 100 || 0).toFixed(1)}% No ID`}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                <Image src="/images/01_Profile.png" alt="No Farmer ID" width={24} height={24} className="opacity-80" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farmer ID Bar Chart */}
      <Card className="border border-white/20 dark:border-white/5 bg-white/60 dark:bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-4">
          <h3 className="text-sm text-center  text-muted-foreground mb-3">Farmers by Farmer ID Status</h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-black">Loading...</div>
            </div>
          ) : (
            <ChartContainer
              config={{
                with_id: { label: "With Farmer ID", color: CHART_COLORS.primary },
                without_id: { label: "Without Farmer ID", color: CHART_COLORS.secondary },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={farmerIdChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => `${name}: ${value.toLocaleString()} (${percent ? (percent * 100).toFixed(0) : 0}%)`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="farmers"
                    nameKey="status"
                    fontSize={14}
                    fontWeight="bold"
                  >
                    {farmerIdChartData.map((entry, index) => {
                      const colors = [CHART_COLORS.primary, CHART_COLORS.secondary];
                      return (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      );
                    })}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
