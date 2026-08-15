"use client"
import { useState, useEffect } from "react"
import { ChartTooltip } from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { KPICards } from "@/components/kpi-cards"

interface ChartData {
  year?: string
  region?: string
  farming_type?: string
  women?: number
  target?: number
  regional?: number
  homicides?: number
  male?: number
  female?: number
  female_farmers?: number
  male_farmers?: number
  total_farmers?: number
  female_household_heads?: number
  male_household_heads?: number
  total_household_heads?: number
  voice?: number
  rule?: number
  control?: number
  effectiveness?: number
  perception?: number
  rank?: number
}

const mockGovernanceData: ChartData[] = []

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-amber-300">
        <p className="font-semibold text-blue-900">{`Year: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.dataKey}: ${entry.value}${
              entry.dataKey.includes("women") ||
              entry.dataKey.includes("target") ||
              entry.dataKey.includes("regional") ||
              entry.dataKey.includes("voice") ||
              entry.dataKey.includes("rule") ||
              entry.dataKey.includes("control") ||
              entry.dataKey.includes("effectiveness") ||
              entry.dataKey.includes("perception")
                ? "%"
                : entry.dataKey.includes("homicides") ||
                    entry.dataKey.includes("male") ||
                    entry.dataKey.includes("female")
                  ? " per 100k"
                  : entry.dataKey.includes("rank")
                    ? " (rank)"
                    : ""
            }`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const handleDotClick = (data: any, dataKey: string) => {
  const value = data[dataKey]
  const unit =
    dataKey.includes("women") ||
    dataKey.includes("target") ||
    dataKey.includes("regional") ||
    dataKey.includes("voice") ||
    dataKey.includes("rule") ||
    dataKey.includes("control") ||
    dataKey.includes("effectiveness") ||
    dataKey.includes("perception")
      ? "%"
      : dataKey.includes("homicides") || dataKey.includes("male") || dataKey.includes("female")
        ? " per 100k"
        : dataKey.includes("rank")
          ? " (rank)"
          : ""

  alert(`${dataKey}: ${value}${unit} (Year: ${data.year})`)
}

interface GovernanceChartsProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
  selectedRegion: string
  selectedIndicator: string
}

export function GovernanceCharts({
  dateRange,
  selectedRegion,
  selectedIndicator,
}: GovernanceChartsProps) {
  const [femaleFarmersData, setFemaleFarmersData] = useState<ChartData[]>([])
  const [femaleHouseholdHeadsData, setFemaleHouseholdHeadsData] = useState<ChartData[]>([])
  const [genderByFarmingTypeData, setGenderByFarmingTypeData] = useState<ChartData[]>([])
  const [homicideRateData, setHomicideRateData] = useState<ChartData[]>([])
  const [governanceData, setGovernanceData] = useState<ChartData[]>([])
  const [corruptionData, setCorruptionData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        
        // Fetch female farmers by region data
        const femaleFarmersResponse = await fetch('/api/charts/femaleFarmersByRegion')
        const femaleFarmersApiData = await femaleFarmersResponse.json()
        
        if (femaleFarmersApiData.success) {
          setFemaleFarmersData(femaleFarmersApiData.data)
        }

        // Fetch female household heads data
        const femaleHouseholdResponse = await fetch('/api/charts/femaleHouseholdHeads')
        const femaleHouseholdApiData = await femaleHouseholdResponse.json()
        
        if (femaleHouseholdApiData.success) {
          setFemaleHouseholdHeadsData(femaleHouseholdApiData.data)
        }

        // Fetch gender distribution by farming type data
        const genderFarmingResponse = await fetch('/api/charts/genderDistributionByFarmingType')
        const genderFarmingApiData = await genderFarmingResponse.json()
        
        if (genderFarmingApiData.success) {
          setGenderByFarmingTypeData(genderFarmingApiData.data)
        }

        // Fetch homicide rate data
        const homicideResponse = await fetch('/api/charts/intentionalHomicides')
        const homicideApiData = await homicideResponse.json()
        
        if (homicideApiData.success) {
          const formattedHomicideData = homicideApiData.data.map((item: any) => ({
            year: item.year.toString(),
            homicides: item.homicide_rate,
            male: item.male_rate,
            female: item.female_rate,
          }))
          setHomicideRateData(formattedHomicideData)
        }

        // Set error for governance data not being available
        setError("Governance indicators data is not available in the current database. Please configure governance indicators in your database to display this data.")

        // Clear all data since we're showing error
        setGovernanceData([])
        setCorruptionData([])

        
        const mockCorruptionData = [
          { year: "2018", perception: 34, rank: 114, regional: 32 },
          { year: "2019", perception: 37, rank: 96, regional: 33 },
          { year: "2020", perception: 38, rank: 94, regional: 34 },
          { year: "2021", perception: 39, rank: 87, regional: 35 },
          { year: "2022", perception: 38, rank: 94, regional: 36 },
          { year: "2023", perception: 38, rank: 94, regional: 37 },
        ]
        
        setGovernanceData(mockGovernanceData)
        setCorruptionData(mockCorruptionData)
        
        
      } catch (err) {
        console.error('❌ Error fetching governance chart data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, selectedRegion, selectedIndicator])

  // Filter data based on date range
  const filterDataByDate = (data: ChartData[]) => {
    if (!dateRange.from || !dateRange.to) return data
    const fromYear = dateRange.from.getFullYear()
    const toYear = dateRange.to.getFullYear()
    return data.filter((item) => {
      const year = Number.parseInt(item.year ?? "0", 10)
      if (Number.isNaN(year)) return false
      return year >= fromYear && year <= toYear
    })
  }

  const filteredFemaleFarmersData = femaleFarmersData // No date filtering for region-based data
  const filteredFemaleHouseholdHeadsData = femaleHouseholdHeadsData // No date filtering for region-based data
  const filteredGenderByFarmingTypeData = genderByFarmingTypeData // No date filtering for type-based data
  const filteredHomicideRateData = filterDataByDate(homicideRateData)
  const filteredGovernanceData = filterDataByDate(governanceData)
  const filteredCorruptionData = filterDataByDate(corruptionData)

  if (loading) {
    return (
      <div className="space-y-6">
        <KPICards type="institutions" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading governance data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <KPICards type="institutions" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold">Error loading data</p>
            <p className="text-gray-600 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <KPICards type="institutions" />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Female Farmers by Region */}
        <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-amber-200 hover:border-amber-300 transition-all duration-300 rounded-lg">
          <div className="p-4 border-b bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-lg">
            <h3 className="text-sm font-medium text-amber-100">Female Farmers by Region</h3>
            <p className="text-xs mt-1 text-amber-200">
              Real data from farmer database
            </p>
          </div>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredFemaleFarmersData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="region" stroke="#1e3a8a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#1e3a8a" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Bar dataKey="female_farmers" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="male_farmers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Female Household Heads by Region */}
        <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-amber-200 hover:border-amber-300 transition-all duration-300 rounded-lg">
          <div className="p-4 border-b bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-lg">
            <h3 className="text-sm font-medium text-amber-100">Female Household Heads by Region</h3>
            <p className="text-xs mt-1 text-amber-200">
              Real data from farmer database
            </p>
          </div>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredFemaleHouseholdHeadsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="region" stroke="#1e3a8a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#1e3a8a" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Bar dataKey="female_household_heads" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="male_household_heads" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution by Farming Type */}
        <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-amber-200 hover:border-amber-300 transition-all duration-300 rounded-lg">
          <div className="p-4 border-b bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-lg">
            <h3 className="text-sm font-medium text-amber-100">Gender by Farming Type</h3>
            <p className="text-xs mt-1 text-amber-200">
              Real data from farmer database
            </p>
          </div>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredGenderByFarmingTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="farming_type" stroke="#1e3a8a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#1e3a8a" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Bar dataKey="female_farmers" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="male_farmers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intentional Homicides */}
        <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-amber-200 hover:border-amber-300 transition-all duration-300 rounded-lg">
          <div className="p-4 border-b bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-lg">
            <h3 className="text-sm font-medium text-amber-100">Intentional Homicides (per 100,000 people)</h3>
            {/* <p className="text-xs mt-1 text-amber-200">
              Query: SELECT year, homicide_rate, male_rate, female_rate FROM crime_data WHERE country_code = 'ETH'
            </p> */}
          </div>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredHomicideRateData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="year" stroke="#1e3a8a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#1e3a8a" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="male" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                <Area type="monotone" dataKey="female" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
                <Line
                  type="monotone"
                  dataKey="homicides"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{
                    fill: "#dc2626",
                    strokeWidth: 2,
                    r: 6,
                    cursor: "pointer",
                    onClick: (data: any) => handleDotClick(data.payload, "homicides"),
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Governance Indicators */}
        <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-amber-200 hover:border-amber-300 transition-all duration-300 rounded-lg">
          <div className="p-4 border-b bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-lg">
            <h3 className="text-sm font-medium text-amber-100">Governance Indicators (Percentile Rank)</h3>
            {/* <p className="text-xs mt-1 text-amber-200">
              Query: SELECT year, voice_accountability, rule_of_law, control_corruption, government_effectiveness FROM
              governance WHERE country_code = 'ETH'
            </p> */}
          </div>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredGovernanceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="year" stroke="#1e3a8a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 50]} stroke="#1e3a8a" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="voice"
                  stroke="#1e3a8a"
                  strokeWidth={3}
                  dot={{
                    fill: "#1e3a8a",
                    strokeWidth: 2,
                    r: 6,
                    cursor: "pointer",
                  onClick: (data: any) => handleDotClick(data.payload, "voice"),
                  }}
                  activeDot={{ r: 8, stroke: "#1e3a8a", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="rule"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{
                    fill: "#059669",
                    strokeWidth: 2,
                    r: 5,
                    cursor: "pointer",
                  onClick: (data: any) => handleDotClick(data.payload, "rule"),
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="control"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{
                    fill: "#f59e0b",
                    strokeWidth: 2,
                    r: 5,
                    cursor: "pointer",
                  onClick: (data: any) => handleDotClick(data.payload, "control"),
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="effectiveness"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{
                    fill: "#2563eb",
                    strokeWidth: 2,
                    r: 5,
                    cursor: "pointer",
                  onClick: (data: any) => handleDotClick(data.payload, "effectiveness"),
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Corruption Perception Index */}
        <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-amber-200 hover:border-amber-300 transition-all duration-300 rounded-lg">
          <div className="p-4 border-b bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-lg">
            <h3 className="text-sm font-medium text-amber-100">Corruption Perception Index</h3>
            {/* <p className="text-xs mt-1 text-amber-200">
              Query: SELECT year, perception_score, global_rank, regional_average FROM corruption_data WHERE
              country_code = 'ETH'
            </p> */}
          </div>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredCorruptionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="year" stroke="#1e3a8a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#1e3a8a" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Bar dataKey="perception" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="regional" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
