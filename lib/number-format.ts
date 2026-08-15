export function formatCompactNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0'
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(num)) return '0'
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(num)
}

export function formatFullNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0'
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(num)) return '0'
  return num.toLocaleString()
}
