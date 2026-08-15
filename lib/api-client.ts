const apiBase = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '')

function buildUrl(path: string) {
  if (path.startsWith('http')) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${apiBase}${normalizedPath}`
}

export function apiUrl(path: string) {
  return buildUrl(path)
}

export async function apiFetch(input: string, init?: RequestInit) {
  const url = buildUrl(input)
  return fetch(url, init)
}
