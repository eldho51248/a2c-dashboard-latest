"use client"

// Crop Sown Registry view. Rendered in place of the tabbed dashboard whenever the
// Farming Type filter is set to crop farming.

import { useMemo } from "react"
import { Ruler, Sprout, Users, Wheat } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  "cropKpis",
  "cropAreaByCrop",
  "cropAreaByRegion",
  "cropTopWoredas",
  "landTenureSplit",
  "registryTrendByMonth",
]

// Module scope keeps the reference stable so the map's drill-down effect doesn't loop.
const CROP_CHILD_CHARTS = {
  zones: "cropAreaByZone",
  woredas: "cropAreaByWoreda",
  kebeles: "cropAreaByKebele",
}

const TENURE_COLORS: Record<string, string> = {
  Owner: BRIGHT.green,
  Rented: BRIGHT.amber,
  Shared: BRIGHT.tealSoft,
  Unknown: "#9CA3AF",
}

export function CropSownDashboard({
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

  const kpis = charts.cropKpis?.[0] || null
  const totalArea = toNumber(kpis?.total_area)
  const ownedArea = toNumber(kpis?.owned_area)
  const farmers = toNumber(kpis?.farmers)
  const cropTypes = toNumber(kpis?.crop_types)
  const avgPlotSize = toNumber(kpis?.avg_plot_size)
  const woredasReporting = toNumber(kpis?.woredas_reporting)

  const trend = useRegistryTrend(charts.registryTrendByMonth)

  const areaByCrop = useMemo(
    () =>
      (charts.cropAreaByCrop || []).map((row: any) => ({
        name: row.crop,
        value: toNumber(row.area),
      })),
    [charts.cropAreaByCrop]
  )

  const areaByRegion = useMemo(
    () =>
      (charts.cropAreaByRegion || []).map((row: any) => ({
        region: row.region,
        region_code: row.region_code,
        farmers: toNumber(row.farmers),
      })),
    [charts.cropAreaByRegion]
  )

  const topWoredas = useMemo(
    () =>
      (charts.cropTopWoredas || []).slice(0, 5).map((row: any) => ({
        name: row.woreda,
        value: toNumber(row.area),
      })),
    [charts.cropTopWoredas]
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

  // The seeded registry runs to the end of 2025, so anchor on the newest month
  // that actually has rows rather than on today's date.
  const recentMonths = useMemo(() => trend.series.slice(-12), [trend.series])

  const timeChartData = useMemo(
    () =>
      recentMonths.map((point) => ({
        period: monthLabel(point.period),
        registered: Math.round(point.totalArea),
        owned: Math.round(point.ownedArea),
      })),
    [recentMonths]
  )

  const areaTrend = buildTrend(trend.series, "totalArea", { cumulative: true })
  const farmerTrend = buildTrend(trend.series, "farmers", { cumulative: true })
  const plotTrend = buildTrend(trend.series, "avgArea")

  if (error) {
    return (
      <RegistryCard title="Crop Sown Registry">
        <div className="px-4 pb-5 pt-3 text-[12px] text-[#B42318]">Failed to load registry data: {error}</div>
      </RegistryCard>
    )
  }

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-start gap-3">
        <div>
          <h2 className="text-[23px] font-bold leading-tight tracking-[-0.4px]" style={{ color: REGISTRY_COLORS.ink }}>
            Crop Sown Registry
          </h2>
          <p className="mt-0.5 text-[12.5px]" style={{ color: REGISTRY_COLORS.muted }}>
            National Crop Sown Registry Module
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 @[560px]:grid-cols-2 @[1080px]:grid-cols-4">
        <RegistryKpi
          icon={<Sprout className="h-8 w-8" strokeWidth={2.4} />}
          iconBg={BRIGHT_SOFT.green}
          iconColor={BRIGHT.green}
          tint="green"
          value={formatFull(Math.round(totalArea))}
          unit="ha"
          label="Hectares Sown"
          delta={areaTrend.delta}
          spark={areaTrend.spark}
          sparkColor={BRIGHT.green}
          loading={loading}
        />
        <RegistryKpi
          icon={<Users className="h-8 w-8" strokeWidth={2.4} />}
          iconBg={BRIGHT_SOFT.blue}
          iconColor={BRIGHT.blue}
          tint="blue"
          value={formatFull(farmers)}
          label="Farmers Reporting"
          delta={farmerTrend.delta}
          spark={farmerTrend.spark}
          sparkColor={BRIGHT.blue}
          loading={loading}
        />
        <RegistryKpi
          icon={<Wheat className="h-8 w-8" strokeWidth={2.4} />}
          iconBg={BRIGHT_SOFT.orange}
          iconColor={BRIGHT.orange}
          tint="peach"
          value={formatFull(cropTypes)}
          label="Crop Types"
          spark={Array(12).fill(cropTypes || 1)}
          sparkColor={BRIGHT.orange}
          loading={loading}
        />
        <RegistryKpi
          icon={<Ruler className="h-8 w-8" strokeWidth={2.4} />}
          iconBg={BRIGHT_SOFT.violet}
          iconColor={BRIGHT.violet}
          tint="violet"
          value={avgPlotSize.toFixed(1)}
          unit="ha"
          label="Average Plot Size"
          delta={plotTrend.delta}
          spark={plotTrend.spark}
          sparkColor={BRIGHT.violet}
          loading={loading}
        />
      </section>

      <section className="grid grid-cols-1 items-start gap-3 @[900px]:grid-cols-[minmax(0,1fr)_336px]">
        <RegistryCard
          title="Hectares Sown by Region"
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
            valueLabel="hectares"
            valueFormatter={(value: number) => formatCompact(value)}
            childChartKeys={CROP_CHILD_CHARTS}
            currentFilters={{
              region: filters.region !== "all" ? filters.region : undefined,
              zone: filters.zone !== "all" ? filters.zone : undefined,
              woreda: filters.woreda !== "all" ? filters.woreda : undefined,
              farmingType: filters.farmingType !== "all" ? filters.farmingType : undefined,
            }}
            onFilterChange={(mapFilters: any) => onMapFilterChange?.(mapFilters)}
            farmerData={areaByRegion}
            geoJsonData={geoJsonData}
          />
        </RegistryCard>

        <div className="grid gap-3">
          <RegistryCard title="Area Sown by Crop">
            <BarList items={areaByCrop} unitLabel="Hectares" />
          </RegistryCard>

          <RegistryCard title="Land Tenure of Sown Plots">
            <RegistryDonut
              segments={tenureSegments}
              centerValue={formatCompact(tenureParcels)}
              centerLabel="Parcels"
              totalLabel="Total"
              totalValue={`${formatFull(tenureParcels)} parcels`}
            />
          </RegistryCard>

          <RegistryCard title="Top Producing Woredas">
            <RankList items={topWoredas} nameHeader="Woreda" valueHeader="Hectares" />
          </RegistryCard>
        </div>
      </section>

      <RegistryCard
        title="Registered vs Owned Area by Month"
        subtitle={
          recentMonths.length
            ? `${monthLabel(recentMonths[0].period)} – ${monthLabel(recentMonths[recentMonths.length - 1].period)}`
            : undefined
        }
      >
        {timeChartData.length === 0 ? (
          <EmptyPanel message="No registrations in range" className="px-4 pb-5" />
        ) : (
          <div className="px-2 pb-3 pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={timeChartData} margin={{ top: 16, right: 16, left: 4, bottom: 4 }} barGap={4}>
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
                  cursor={{ fill: REGISTRY_COLORS.g50 }}
                  contentStyle={{
                    borderRadius: 10,
                    border: `1px solid ${REGISTRY_COLORS.line}`,
                    fontSize: 12,
                  }}
                  formatter={(value: any, name: any) => [`${formatFull(toNumber(value))} ha`, String(name)]}
                />
                <Legend
                  align="right"
                  verticalAlign="top"
                  height={26}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: REGISTRY_COLORS.ink2 }}
                />
                <Bar dataKey="registered" name="Registered Area (ha)" fill={BRIGHT.blue} radius={[2, 2, 0, 0]} />
                <Bar dataKey="owned" name="Owned Area (ha)" fill={BRIGHT.amber} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </RegistryCard>

      <p className="pb-2 text-center text-[10.5px]" style={{ color: REGISTRY_COLORS.muted }}>
        Boundaries: geoBoundaries gbOpen ETH ADM1/ADM3 (CC BY 4.0). Figures reflect registered farmer profiles for the
        selected filters.
      </p>
    </div>
  )
}
