// Minimal types and helpers retained for compatibility; no mock datasets are provided.
export interface DataPoint {
  id: string
  year: number
  category: string
  subcategory: string
  value: number
  region: string
  sector: string
  gender?: string
  unit: string
  farmingType?: string
  householdStatus?: string
  identificationStatus?: string
  landSize?: number
  zone?: string
  woreda?: string
  kebele?: string
  recordState?: string
  income?: number
  registrantId?: number
}

export const mockData: DataPoint[] = []

export function filterData(data: DataPoint[], _filters: any): DataPoint[] {
  return data
}

export function aggregateData(data: DataPoint[], _groupBy: string[]): any[] {
  return data
}

export function exportToCSV(_data: DataPoint[], _filename: string): void {
  return
}

export function exportToExcel(_data: DataPoint[], _filename: string): void {
  return
}

export const timePeriods = [
  { code: "all", name: "All Years", dateRange: { from: new Date(2020, 0, 1), to: new Date(2025, 11, 31) } },
  { code: "recent", name: "Recent (2023-2025)", dateRange: { from: new Date(2023, 0, 1), to: new Date(2025, 11, 31) } },
  {
    code: "covid",
    name: "COVID Period (2020-2022)",
    dateRange: { from: new Date(2020, 0, 1), to: new Date(2022, 11, 31) },
  },
  { code: "2024", name: "2024", dateRange: { from: new Date(2024, 0, 1), to: new Date(2024, 11, 31) } },
  { code: "2023", name: "2023", dateRange: { from: new Date(2023, 0, 1), to: new Date(2023, 11, 31) } },
]
