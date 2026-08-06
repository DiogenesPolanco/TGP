export interface CveData {
  cveId: string
  datePublic: string | null
  description: string | null
  assignerShortName: string | null
}

export interface CveLookupResult {
  data: CveData | null
  error: string | null
}

const CACHE = new Map<string, CveLookupResult>()

function isCveId(value: string): boolean {
  return /^CVE-\d{4}-\d{4,}$/i.test(value.trim())
}

export async function lookupCve(cveId: string): Promise<CveLookupResult> {
  const id = cveId.trim().toUpperCase()

  if (!isCveId(id)) {
    return { data: null, error: `ID inválido: "${cveId}" no es un CVE válido` }
  }

  // Return cached result if available
  const cached = CACHE.get(id)
  if (cached) return cached

  try {
    const res = await fetch(`https://cveawg.mitre.org/api/cve/${id}`)

    if (res.status === 404) {
      const result: CveLookupResult = { data: null, error: `CVE no encontrado: ${id}` }
      CACHE.set(id, result)
      return result
    }

    if (!res.ok) {
      const result: CveLookupResult = {
        data: null,
        error: `Error HTTP ${res.status} al consultar ${id}`,
      }
      CACHE.set(id, result)
      return result
    }

    const json = await res.json()
    const cna = json.containers?.cna

    const description =
      cna?.descriptions?.find((d: { lang: string; value: string }) => d.lang === 'en')?.value ??
      null

    const data: CveData = {
      cveId: id,
      datePublic: cna?.datePublic ?? json.cveMetadata?.datePublished ?? null,
      description,
      assignerShortName: json.cveMetadata?.assignerShortName ?? null,
    }

    const result: CveLookupResult = { data, error: null }
    CACHE.set(id, result)
    return result
  } catch (err) {
    const message =
      err instanceof TypeError
        ? `Error de red al consultar ${id}: sin conexión o timeout`
        : `Error al consultar ${id}: ${err instanceof Error ? err.message : 'desconocido'}`

    const result: CveLookupResult = { data: null, error: message }
    CACHE.set(id, result)
    return result
  }
}

export function getCveCacheSize(): number {
  return CACHE.size
}

export function clearCveCache(): void {
  CACHE.clear()
}
