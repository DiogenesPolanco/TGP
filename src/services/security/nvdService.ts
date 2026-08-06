export interface NvdCveResult {
  id: string
  description: string
  severity: string | null
  baseScore: number | null
  published: string | null
}

export interface NvdSearchResult {
  totalResults: number
  results: NvdCveResult[]
  error: string | null
}

const SEARCH_CACHE = new Map<string, NvdSearchResult>()

export async function searchCvesByKeyword(
  keyword: string,
  severityFilter?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  resultsPerPage = 10,
): Promise<NvdSearchResult> {
  const cacheKey = `${keyword}|${severityFilter ?? 'ALL'}|${resultsPerPage}`
  const cached = SEARCH_CACHE.get(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams({
    keywordSearch: keyword,
    resultsPerPage: String(resultsPerPage),
  })
  if (severityFilter) {
    params.set('cvssV3Severity', severityFilter)
  }

  try {
    const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?${params}`)

    if (!res.ok) {
      const result: NvdSearchResult = {
        totalResults: 0,
        results: [],
        error: `Error HTTP ${res.status} al consultar NVD`,
      }
      SEARCH_CACHE.set(cacheKey, result)
      return result
    }

    const json = await res.json()
    const totalResults = json.totalResults ?? 0
    const vulns: {
      cve: {
        id: string
        descriptions: { lang: string; value: string }[]
        metrics?: Record<string, { cvssData?: { baseSeverity?: string; baseScore?: number } }[]>
        published?: string
      }
    }[] = json.vulnerabilities ?? []

    const results: NvdCveResult[] = vulns.map((v) => {
      const cve = v.cve
      const description = cve.descriptions?.find((d) => d.lang === 'en')?.value ?? ''
      let severity: string | null = null
      let baseScore: number | null = null

      const metrics = cve.metrics
      if (metrics) {
        const v31 = metrics['cvssMetricV31']?.[0]?.cvssData
        const v30 = metrics['cvssMetricV30']?.[0]?.cvssData
        const v2 = metrics['cvssMetricV2']?.[0]?.cvssData
        const data = v31 ?? v30 ?? v2
        if (data) {
          severity = data.baseSeverity ?? null
          baseScore = data.baseScore ?? null
        }
      }

      return {
        id: cve.id,
        description: description.length > 120 ? description.slice(0, 120) + '…' : description,
        severity,
        baseScore,
        published: cve.published ?? null,
      }
    })

    const result: NvdSearchResult = { totalResults, results, error: null }
    SEARCH_CACHE.set(cacheKey, result)
    return result
  } catch (err) {
    const message =
      err instanceof TypeError
        ? `Error de red al consultar NVD: sin conexión o timeout`
        : `Error al consultar NVD: ${err instanceof Error ? err.message : 'desconocido'}`
    const result: NvdSearchResult = { totalResults: 0, results: [], error: message }
    SEARCH_CACHE.set(cacheKey, result)
    return result
  }
}
