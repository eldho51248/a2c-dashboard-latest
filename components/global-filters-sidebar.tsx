"use client"

import { useMemo } from "react"
import {
  EMPTY_A2C_FILTERS,
  a2cRegionOptions,
  a2cWoredaOptions,
  a2cZoneOptions,
  applyA2CFilterChange,
  useA2CFilterOptions,
  type A2CFilters,
} from "@/hooks/use-a2c-filters"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type DashboardType = "a2c"

interface GlobalFiltersSidebarProps {
  isSidebarOpen: boolean
  onSidebarToggle: () => void
  dashboardType: DashboardType
  onDashboardTypeChange: (value: DashboardType) => void
  a2cFilters: A2CFilters
  onA2CFiltersChange: (filters: A2CFilters) => void
}

export function GlobalFiltersSidebar({
  a2cFilters,
  onA2CFiltersChange,
}: GlobalFiltersSidebarProps) {
  const isA2C = true
  const { options: a2cOptions, loading: isA2COptionsLoading } = useA2CFilterOptions(isA2C)

  const a2cRegions = useMemo(() => a2cRegionOptions(a2cOptions.locations), [a2cOptions.locations])

  const a2cZones = useMemo(
    () => a2cZoneOptions(a2cOptions.locations, a2cFilters.region),
    [a2cOptions.locations, a2cFilters.region]
  )

  const a2cWoredas = useMemo(
    () => a2cWoredaOptions(a2cOptions.locations, a2cFilters.region, a2cFilters.zone),
    [a2cOptions.locations, a2cFilters.region, a2cFilters.zone]
  )

  const handleA2CFilterChange = (key: keyof A2CFilters, value: string) => {
    onA2CFiltersChange(applyA2CFilterChange(a2cFilters, key, value))
  }

  const clearA2CFilters = () => onA2CFiltersChange(EMPTY_A2C_FILTERS)

  return (
    <div className="h-screen flex flex-col bg-transparent">
      <div className="flex items-center justify-between p-4 bg-transparent border-b border-white/15">
        <h3 className="text-lg font-bold text-white">Filters</h3>
        <button 
          onClick={clearA2CFilters} 
          className="text-xs text-white/60 hover:text-white hover:bg-white/10 px-2 py-1 rounded"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Credit Provider */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/55">Credit Provider</label>
          <Select
            value={a2cFilters.provider}
            onValueChange={(value) => handleA2CFilterChange("provider", value)}
            disabled={isA2COptionsLoading}
          >
            <SelectTrigger className="w-full bg-white/10 text-white border-white/20 hover:border-white/40 hover:bg-white/15 transition-colors data-[placeholder]:text-white/50 [&_svg]:text-white/70">
              <SelectValue placeholder={isA2COptionsLoading ? "Loading..." : "Select provider"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {a2cOptions.providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                  {provider.status === "ONBOARDING" ? " (onboarding)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Region */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/55">Region</label>
          <Select
            value={a2cFilters.region}
            onValueChange={(value) => handleA2CFilterChange("region", value)}
            disabled={isA2COptionsLoading}
          >
            <SelectTrigger className="w-full bg-white/10 text-white border-white/20 hover:border-white/40 hover:bg-white/15 transition-colors data-[placeholder]:text-white/50 [&_svg]:text-white/70">
              <SelectValue placeholder={isA2COptionsLoading ? "Loading..." : "Select region"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {a2cRegions.map((region) => (
                <SelectItem key={region.code} value={region.code}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zone */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/55">Zone</label>
          <Select
            value={a2cFilters.zone}
            onValueChange={(value) => handleA2CFilterChange("zone", value)}
            disabled={isA2COptionsLoading}
          >
            <SelectTrigger className="w-full bg-white/10 text-white border-white/20 hover:border-white/40 hover:bg-white/15 transition-colors data-[placeholder]:text-white/50 [&_svg]:text-white/70">
              <SelectValue placeholder={isA2COptionsLoading ? "Loading..." : "Select zone"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {a2cZones.map((zone) => (
                <SelectItem key={zone.code} value={zone.code}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Woreda */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/55">Woreda</label>
          <Select
            value={a2cFilters.woreda}
            onValueChange={(value) => handleA2CFilterChange("woreda", value)}
            disabled={isA2COptionsLoading}
          >
            <SelectTrigger className="w-full bg-white/10 text-white border-white/20 hover:border-white/40 hover:bg-white/15 transition-colors data-[placeholder]:text-white/50 [&_svg]:text-white/70">
              <SelectValue placeholder={isA2COptionsLoading ? "Loading..." : "Select woreda"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Woredas</SelectItem>
              {a2cWoredas.map((woreda) => (
                <SelectItem key={woreda.code} value={woreda.code}>
                  {woreda.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs leading-relaxed text-white/45">
          Only the woredas the credit programme currently reaches are listed. Enrolment stops at
          woreda, so there is no kebele level.
        </p>
      </div>
    </div>
  )
}
