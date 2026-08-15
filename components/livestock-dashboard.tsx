"use client"

// Livestock Registry view. Rendered in place of the tabbed dashboard whenever the
// Farming Type filter is set to livestock farming.

import { useMemo } from "react"
import { Home, Layers, MapPinned, Users } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useChartGroupData } from "@/hooks/use-data"
import { MapWhenVisible } from "@/components/lazy/map-when-visible"
import {
  BarList,
  BRIGHT,
  BRIGHT_SOFT,
  EmptyPanel,
  RankList,
  REGISTRY_COLORS,
  RegistryCard,
  RegistryDonut,
  RegistryKpi,
  formatCompact,
  formatFull,
} from "@/components/registry/registry-ui"
import {
  RegistryFilters,
  buildTrend,
  monthLabel,
  toNumber,
  useRegistryTrend,
} from "@/components/registry/registry-data"

const CHART_NAMES = [
  "livestockKpis",
  "livestockBySpecies",
  "farmersByRegion",
  "livestockTopWoredas",
  "landTenureSplit",
  "registryTrendByMonth",
]

const TENURE_COLORS: Record<string, string> = {
  Owner: BRIGHT.green,
  Rented: BRIGHT.amber,
  Shared: BRIGHT.tealSoft,
  Unknown: "#94A3B8",
}

export function LivestockDashboard({
  filters,
  geoJsonData,
  onMapFilterChange,
}: {
  filters: RegistryFilters
  geoJsonData?: any
  onMapFilterChange?: (filters: Record<string, string>) => void
}) {
  const { data, loading, error } = useChartGroupData(CHART_NAMES, filters as any)
  const charts = data?.data || {}

  const kpis = charts.livestockKpis?.[0] || null
  const farmers = toNumber(kpis?.farmers)
  const households = toNumber(kpis?.households)
  const speciesTracked = toNumber(kpis?.species_tracked)
  const breedsTracked = toNumber(kpis?.breeds_tracked)
  const totalArea = toNumber(kpis?.total_area)
  const woredasReporting = toNumber(kpis?.woredas_reporting)

  const trend = useRegistryTrend(charts.registryTrendByMonth)

  const speciesRows = charts.livestockBySpecies || []
  const censusYear = speciesRows[0]?.census_year

  const speciesItems = useMemo(
    () =>
      speciesRows.map((row: any) => ({
        name: row.species,
        value: toNumber(row.population),
      })),
    [speciesRows]
  )

  const farmersByRegion = useMemo(
    () =>
      (charts.farmersByRegion || []).map((row: any) => ({
        region: row.region,
        region_code: row.region_code,
        farmers: toNumber(row.farmers),
      })),
    [charts.farmersByRegion]
  )

  const topWoredas = useMemo(
    () =>
      (charts.livestockTopWoredas || []).slice(0, 5).map((row: any) => ({
        name: row.woreda,
        value: toNumber(row.farmers),
      })),
    [charts.livestockTopWoredas]
  )

  const tenureSegments = useMemo(
    () =>
      (charts.landTenureSplit || [])
        .map((row: any) => ({
          name: row.ownership_type,
          value: toNumber(row.parcels),
          color: TENURE_COLORS[row.ownership_type] || BRIGHT.violet,
          sub: `${formatFull(Math.round(toNumber(row.area)))} ha`,
        }))
        .filter((segment: { value: number }) => segment.value > 0),
    [charts.landTenureSplit]
  )

  const tenureParcels = tenureSegments.reduce((acc: number, segment: { value: number }) => acc + segment.value, 0)

  // Cumulative registrations reproduce the reference dashboard's climbing area curve.
  const registrationSeries = useMemo(() => {
    let running = 0
    return trend.series.map((point) => {
      running += point.farmers
      return { period: monthLabel(point.period), registered: running }
    })
  }, [trend.series])

  const recentRegistrations = useMemo(() => registrationSeries.slice(-12), [registrationSeries])

  const farmerTrend = buildTrend(trend.series, "farmers", { cumulative: true })
  const areaTrend = buildTrend(trend.series, "totalArea", { cumulative: true })

  if (error) {
    return (
      <RegistryCard title="Livestock Registry">
        <div className="px-4 pb-5 pt-3 text-[12px] text-[#B42318]">Failed to load registry data: {error}</div>
      </RegistryCard>
    )
  }

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-start gap-3">
        <div>
          <h2 className="text-[23px] font-bold leading-tight tracking-[-0.4px]" style={{ color: REGISTRY_COLORS.ink }}>
            Livestock Registry
          </h2>
          <p className="mt-0.5 text-[12.5px]" style={{ color: REGISTRY_COLORS.muted }}>
            National Livestock Registry Module
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 @[560px]:grid-cols-2 @[1080px]:grid-cols-4">
        <RegistryKpi
          icon={<Users className="h-8 w-8" strokeWidth={2.4} />}
          iconBg={BRIGHT_SOFT.blue}
          iconColor={BRIGHT.blue}
          tint="blue"
          value={formatFull(farmers)}
          label="Livestock Keepers Registered"
          delta={farmerTrend.delta}
          spark={farmerTrend.spark}
          sparkColor={BRIGHT.blue}
          loading={loading}
        />
        <RegistryKpi
          icon={<Home className="h-8 w-8" strokeWidth={2.4} />}
          iconBg={BRIGHT_SOFT.green}
          iconColor={BRIGHT.green}
          tint="green"
          value={formatFull(households)}
          label="Registered Households"
          delta={farmerTrend.delta}
          spark={farmerTrend.spark}
          sparkColor={BRIGHT.green}
          loading={loading}
        />
        <RegistryKpi
          icon={<Layers className="h-8 w-8" strokeWidth={2.4} />}
          iconBg={BRIGHT_SOFT.orange}
          iconColor={BRIGHT.orange}
          tint="peach"
          value={formatFull(speciesTracked)}
          label={`Species Tracked · ${formatFull(breedsTracked)} breeds`}
          spark={Array(12).fill(speciesTracked || 1)}
          sparkColor={BRIGHT.orange}
          loading={loading}
        />
        <RegistryKpi
          icon={<MapPinned className="h-8 w-8" strokeWidth={2.4} />}
          iconBg={BRIGHT_SOFT.violet}
          iconColor={BRIGHT.violet}
          tint="violet"
          value={formatFull(Math.round(totalArea))}
          unit="ha"
          label="Holding Land Registered"
          delta={areaTrend.delta}
          spark={areaTrend.spark}
          sparkColor={BRIGHT.violet}
          loading={loading}
        />
      </section>

      <section className="grid grid-cols-1 items-start gap-3 @[900px]:grid-cols-[minmax(0,1fr)_336px]">
        <RegistryCard
          title="Livestock Keepers by Region"
          subtitle={
            loading
              ? "Loading coverage…"
              : `${formatFull(woredasReporting)} woreda${woredasReporting === 1 ? "" : "s"} reporting · click to drill down`
          }
          className="overflow-hidden"
        >
          <MapWhenVisible
            minHeight="380px"
            variant="registry"
            valueLabel="keepers"
            valueFormatter={(value: number) => formatCompact(value)}
            currentFilters={{
              region: filters.region !== "all" ? filters.region : undefined,
              zone: filters.zone !== "all" ? filters.zone : undefined,
              woreda: filters.woreda !== "all" ? filters.woreda : undefined,
              farmingType: filters.farmingType !== "all" ? filters.farmingType : undefined,
            }}
            onFilterChange={(mapFilters: any) => onMapFilterChange?.(mapFilters)}
            farmerData={farmersByRegion}
            geoJsonData={geoJsonData}
          />
        </RegistryCard>

        <div className="grid gap-3">
          <RegistryCard
            title="Livestock by Species"
            subtitle={censusYear ? `National herd, ${censusYear} census` : undefined}
          >
            <BarList
              items={speciesItems}
              unitLabel="Number of animals"
              formatter={(value) => formatCompact(value)}
              emptyMessage="Species census unavailable"
            />
          </RegistryCard>

          <RegistryCard title="Holding Tenure">
            <RegistryDonut
              segments={tenureSegments}
              centerValue={formatCompact(tenureParcels)}
              centerLabel="Holdings"
              totalLabel="Total"
              totalValue={`${formatFull(tenureParcels)} holdings`}
            />
          </RegistryCard>

          <RegistryCard title="Top Woredas">
            <RankList items={topWoredas} nameHeader="Woreda" valueHeader="Keepers registered" />
          </RegistryCard>
        </div>
      </section>

      <RegistryCard
        title="Registrations Over Time"
        subtitle="Cumulative registered livestock keepers"
      >
        {recentRegistrations.length === 0 ? (
          <EmptyPanel message="No registrations in range" className="px-4 pb-5" />
        ) : (
          <div className="px-2 pb-3 pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={recentRegistrations} margin={{ top: 16, right: 20, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="livestockRegistrations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRIGHT.blueSoft} stopOpacity={0.38} />
                    <stop offset="100%" stopColor={BRIGHT.blueSoft} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={REGISTRY_COLORS.line2} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: REGISTRY_COLORS.muted }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fontSize: 10, fill: REGISTRY_COLORS.muted }}
                  tickFormatter={(value: number) => formatCompact(value)}
                />
                <Tooltip
                  cursor={{ stroke: REGISTRY_COLORS.line, strokeWidth: 1 }}
                  contentStyle={{
                    borderRadius: 10,
                    border: `1px solid ${REGISTRY_COLORS.line}`,
                    fontSize: 12,
                  }}
                  formatter={(value: any) => [formatFull(toNumber(value)), "Registered keepers"]}
                />
                <Area
                  type="monotone"
                  dataKey="registered"
                  stroke={BRIGHT.blue}
                  strokeWidth={2}
                  fill="url(#livestockRegistrations)"
                  dot={{ r: 3, fill: "#fff", stroke: BRIGHT.blue, strokeWidth: 1.8 }}
                  activeDot={{ r: 4.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </RegistryCard>

      <p className="pb-2 text-center text-[10.5px]" style={{ color: REGISTRY_COLORS.muted }}>
        Boundaries: geoBoundaries gbOpen ETH ADM1/ADM3 (CC BY 4.0). Species totals come from the national livestock
        census and are not filtered by area.
      </p>
    </div>
  )
}
