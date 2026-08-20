"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Camera } from "lucide-react"
import { GlobalFiltersSidebar, type DashboardType } from "@/components/global-filters-sidebar"
import {
  EMPTY_A2C_FILTERS,
  a2cFilterChips,
  applyA2CFilterChange,
  useA2CFilterOptions,
  type A2CFilters,
} from "@/hooks/use-a2c-filters"
import dynamic from "next/dynamic"
import { DashboardSectionSkeleton } from "@/components/ui/dashboard-skeleton"

export default function DashboardClient({ 
  geoJsonData, 
}: { 
  geoJsonData: any;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const dashboardType: DashboardType = 'a2c'
  const isA2C = true

  const [a2cFilters, setA2CFilters] = useState<A2CFilters>(EMPTY_A2C_FILTERS)
  const { options: a2cOptions } = useA2CFilterOptions(isA2C)

  const headerTitle = 'A2C - Access to Credit'

  const handleA2CMapFilterChange = useCallback(
    (mapFilters: { region?: string; zone?: string; woreda?: string }) => {
      setA2CFilters(prev => {
        const next = {
          ...prev,
          region: mapFilters.region ?? 'all',
          zone: mapFilters.zone ?? 'all',
          woreda: mapFilters.woreda ?? 'all',
        }
        const changed = Object.keys(next).some(key => (prev as any)[key] !== (next as any)[key])
        return changed ? next : prev
      })
    },
    []
  )

  const a2cChips = useMemo(() => a2cFilterChips(a2cFilters, a2cOptions), [a2cFilters, a2cOptions])

  const clearA2CFilter = useCallback((key: keyof A2CFilters) => {
    setA2CFilters(prev => applyA2CFilterChange(prev, key, 'all'))
  }, [])

  const captureElementById = useCallback(async (id: string, prefix: string) => {
    try {
      const target = document.getElementById(id)
      if (!target) return
      const { toPng } = await import("html-to-image")

      const hidden: Array<{ el: HTMLElement; prev: string }> = []
      target.querySelectorAll<HTMLElement>('[data-kpi="true"], [data-export-control="true"]').forEach(el => {
        hidden.push({ el, prev: el.style.display })
        el.style.display = 'none'
      })

      const dataUrl = await toPng(target, { cacheBust: true })

      hidden.forEach(({ el, prev }) => { el.style.display = prev })

      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `${prefix}-${new Date().toISOString().split("T")[0]}.png`
      link.click()
    } catch (err) {
      console.error("Capture failed", err)
    }
  }, [])

  return (
    <div id="dashboard-root" className="animate-page-fade max-h-screen overflow-hidden bg-background text-foreground flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="w-full relative overflow-hidden bg-[#0A192F] text-white py-1 px-4 md:px-6 flex-shrink-0 z-10 shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-[240px] bg-[url('/images/ethiopia-flag-wave.svg')] bg-right bg-no-repeat opacity-95 md:block"
          style={{ backgroundSize: 'auto 100%' }}
        />

        <div className="max-w-full grid grid-cols-[auto_1fr_auto] items-center relative z-10 gap-4 md:pr-[110px]">
          <div className="flex items-center">
            <img
              src="/images/ati_small.jpg"
              alt="Agricultural Registry Logo"
              className="h-10 w-10 md:h-12 rounded-full md:w-12 object-contain bg-white shadow-xs p-0.5"
            />
          </div>

          <div className="flex min-w-0 flex-col items-center gap-1">
            <div className="text-center">
              <h1 className="text-lg md:text-xl font-bold text-white">{headerTitle}</h1>
            </div>

            {a2cChips.length > 0 && (
              <div className="hidden md:flex justify-center px-4 gap-2 flex-wrap">
                {a2cChips.map((chip) => (
                  <div
                    key={chip.key}
                    className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-white border border-white/20 flex items-center gap-2"
                  >
                    <span>{chip.label}: {chip.value}</span>
                    <button
                      onClick={() => clearA2CFilter(chip.key)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      aria-label={`Clear ${chip.label} filter`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 justify-self-end">
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 bg-[#0A192F]/80 text-white backdrop-blur-sm hover:bg-[#0A192F] hover:text-white"
              onClick={() => captureElementById('dashboard-a2c', 'a2c-access-to-credit')}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 max-h-screen">
        <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} flex-shrink-0 transition-all duration-300 ease-in-out border-r border-[#112240] bg-[#0A192F] relative h-full`}>
          <div className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 h-full max-h-full overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}>
            <GlobalFiltersSidebar
              isSidebarOpen={isSidebarOpen}
              onSidebarToggle={toggleSidebar}
              dashboardType={dashboardType}
              onDashboardTypeChange={() => {}}
              a2cFilters={a2cFilters}
              onA2CFiltersChange={setA2CFilters}
            />
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`absolute ${isSidebarOpen ? '-right-3' : 'left-2'} top-4 z-50 bg-[#1D4ED8] text-white rounded-full p-1.5 shadow-lg hover:bg-[#2563EB] transition-all duration-300`}
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        <div className="@container flex-1 min-h-0 overflow-hidden bg-[#F5F8F6] p-2 md:p-3">
          <div id="dashboard-a2c" className="h-full min-h-0">
            <A2CDashboard
              filters={a2cFilters}
              geoJsonData={geoJsonData}
              onMapFilterChange={handleA2CMapFilterChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const A2CDashboard = dynamic(
  () => import("@/components/a2c-dashboard").then(mod => mod.A2CDashboard),
  { ssr: false, loading: () => <TabSkeleton /> }
)

function TabSkeleton() {
  return (
    <DashboardSectionSkeleton />
  )
}
