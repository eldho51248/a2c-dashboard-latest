"use client"
import { ChartTooltip } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface IndicatorChartsProps {
  category: "social" | "economic" | "environment" | "institutions"
  dateRange: { from: Date | undefined; to: Date | undefined }
  selectedCountry: string
}

export function IndicatorCharts({ category, dateRange, selectedCountry }: IndicatorChartsProps) {
  const chartData = {
    social: [
      {
        title: "Life Expectancy",
        data: [
          { year: "2018", value: 66.2 },
          { year: "2019", value: 66.6 },
          { year: "2020", value: 67.0 },
          { year: "2021", value: 67.4 },
          { year: "2022", value: 67.6 },
          { year: "2023", value: 67.8 },
        ],
      },
      {
        title: "Poverty Rate ($3/day)",
        data: [
          { year: "2018", value: 72.1 },
          { year: "2019", value: 71.2 },
          { year: "2020", value: 70.3 },
          { year: "2021", value: 68.7 },
          { year: "2022", value: 68.7 },
          { year: "2023", value: 68.7 },
        ],
      },
      {
        title: "Internet Access",
        data: [
          { year: "2018", value: 8.4 },
          { year: "2019", value: 12.1 },
          { year: "2020", value: 15.7 },
          { year: "2021", value: 18.9 },
          { year: "2022", value: 20.5 },
          { year: "2023", value: 21.2 },
        ],
      },
      {
        title: "Human Capital Index",
        data: [
          { year: "2018", value: 0.35 },
          { year: "2019", value: 0.36 },
          { year: "2020", value: 0.37 },
          { year: "2021", value: 0.37 },
          { year: "2022", value: 0.38 },
          { year: "2023", value: 0.38 },
        ],
      },
    ],
    economic: [
      {
        title: "GDP (Current ETB)",
        data: [
          { year: "2018", value: 84.36 },
          { year: "2019", value: 95.91 },
          { year: "2020", value: 107.65 },
          { year: "2021", value: 111.27 },
          { year: "2022", value: 126.78 },
          { year: "2023", value: 145.89 },
          { year: "2024", value: 156.1 },
        ],
      },
      {
        title: "Inflation Rate (Annual %)",
        data: [
          { year: "2018", value: 13.8 },
          { year: "2019", value: 15.8 },
          { year: "2020", value: 20.4 },
          { year: "2021", value: 26.8 },
          { year: "2022", value: 33.9 },
          { year: "2023", value: 28.7 },
          { year: "2024", value: 25.1 },
        ],
      },
      {
        title: "Personal Remittances (% of GDP)",
        data: [
          { year: "2018", value: 4.8 },
          { year: "2019", value: 4.9 },
          { year: "2020", value: 5.1 },
          { year: "2021", value: 5.3 },
          { year: "2022", value: 5.6 },
          { year: "2023", value: 5.8 },
          { year: "2024", value: 6.1 },
        ],
      },
      {
        title: "Foreign Direct Investment (% of GDP)",
        data: [
          { year: "2018", value: 3.2 },
          { year: "2019", value: 2.8 },
          { year: "2020", value: 2.9 },
          { year: "2021", value: 3.4 },
          { year: "2022", value: 3.6 },
          { year: "2023", value: 3.7 },
          { year: "2024", value: 3.8 },
        ],
      },
    ],
    environment: [
      {
        title: "Forest Area (% of Land Area)",
        data: [
          { year: "2018", value: 13.7 },
          { year: "2019", value: 13.5 },
          { year: "2020", value: 13.3 },
          { year: "2021", value: 13.1 },
          { year: "2022", value: 12.9 },
          { year: "2023", value: 12.9 },
        ],
      },
      {
        title: "CO2 Emissions Per Capita (t CO2e)",
        data: [
          { year: "2018", value: 0.26 },
          { year: "2019", value: 0.27 },
          { year: "2020", value: 0.28 },
          { year: "2021", value: 0.29 },
          { year: "2022", value: 0.3 },
          { year: "2023", value: 0.31 },
        ],
      },
      {
        title: "Renewable Energy Production (% excluding hydroelectric)",
        data: [
          { year: "2018", value: 1.8 },
          { year: "2019", value: 1.9 },
          { year: "2020", value: 2.0 },
          { year: "2021", value: 2.1 },
          { year: "2022", value: 2.1 },
          { year: "2023", value: 2.1 },
        ],
      },
      {
        title: "Access to Electricity (% of population)",
        data: [
          { year: "2018", value: 44.3 },
          { year: "2019", value: 45.1 },
          { year: "2020", value: 45.9 },
          { year: "2021", value: 46.7 },
          { year: "2022", value: 47.5 },
          { year: "2023", value: 47.9 },
        ],
      },
    ],
    institutions: [
      {
        title: "Women in Parliament",
        data: [
          { year: "2018", value: 35.2 },
          { year: "2019", value: 36.1 },
          { year: "2020", value: 37.3 },
          { year: "2021", value: 38.1 },
          { year: "2022", value: 38.5 },
          { year: "2023", value: 38.8 },
        ],
      },
      {
        title: "Intentional Homicides (per 100,000 people)",
        data: [
          { year: "2018", value: 8.4 },
          { year: "2019", value: 8.1 },
          { year: "2020", value: 7.9 },
          { year: "2021", value: 7.7 },
          { year: "2022", value: 7.6 },
          { year: "2023", value: 7.56 },
        ],
      },
      {
        title: "Net Migration",
        data: [
          { year: "2018", value: 19.2 },
          { year: "2019", value: 21.8 },
          { year: "2020", value: 22.2 },
          { year: "2021", value: 24.6 },
          { year: "2022", value: 23.2 },
          { year: "2023", value: 24.6 },
        ],
      },
    ],
  }

  // Filter data based on date range
  const filterDataByDate = (data: any[]) => {
    if (!dateRange.from || !dateRange.to) return data
    const fromYear = dateRange.from.getFullYear()
    const toYear = dateRange.to.getFullYear()
    return data.filter((item) => {
      const year = Number.parseInt(item.year)
      return year >= fromYear && year <= toYear
    })
  }

  return (
    <div className="space-y-6">
      {chartData[category].map((chart, index) => (
        <div
          key={index}
          className="bg-white/95 backdrop-blur-sm shadow-lg border border-amber-200 hover:border-amber-300 transition-all duration-300 rounded-lg"
        >
          <div className="p-4 border-b bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-lg">
            <h3 className="text-sm font-medium text-amber-100">{chart.title}</h3>
          </div>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filterDataByDate(chart.data)}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="year" stroke="#000000" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#000000" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", strokeWidth: 2, r: 6, cursor: "pointer" }}
                  activeDot={{ r: 8, stroke: "#f59e0b", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-amber-300">
        <p className="font-semibold text-blue-900">{`Year: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}
