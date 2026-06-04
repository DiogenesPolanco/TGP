import type { SupportStatus } from '@/constants/enums'

const API_BASE = 'https://api.deps.dev/v3'
const CACHE_PREFIX = 'tgp-depsdev-cache-'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export type DepsSystem = 'npm' | 'maven' | 'nuget' | 'pypi' | 'go' | 'cargo'

export const DEPS_SYSTEMS: { value: DepsSystem; label: string; placeholder: string }[] = [
  { value: 'npm', label: 'npm', placeholder: 'lodash@4.17.20' },
  { value: 'maven', label: 'Maven', placeholder: 'com.google.guava:guava@32.0.0' },
  { value: 'nuget', label: 'NuGet', placeholder: 'Newtonsoft.Json@13.0.3' },
  { value: 'pypi', label: 'PyPI', placeholder: 'requests@2.31.0' },
  { value: 'go', label: 'Go', placeholder: 'github.com/gin-gonic/gin@v1.9.1' },
  { value: 'cargo', label: 'Cargo', placeholder: 'serde@1.0.0' },
]

export interface DepsAdvisory {
  id: string
  title?: string
  severity?: string
  cvssScore?: number
  aliases?: string[]
  url?: string
}

export interface DepsPackageResult {
  system: DepsSystem
  name: string
  version: string
  description: string
  license: string
  advisories: DepsAdvisory[]
  supportStatus: SupportStatus
  cveList: string[]
  advisoryIds: string[]
}

/* ─── Cache ─── */

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw) as { data: T; ts: number }
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* storage full — ignore */ }
}

/* ─── API helpers ─── */

async function apiFetch<T>(path: string): Promise<T | null> {
  const cached = getCached<T>(path)
  if (cached) return cached

  try {
    const res = await fetch(`${API_BASE}${path}`)
    if (res.status === 404 || res.status === 403) return null
    if (!res.ok) return null
    const data = (await res.json()) as T
    setCache(path, data)
    return data
  } catch {
    return null
  }
}

function encodePackageName(name: string): string {
  return encodeURIComponent(name)
}

/* ─── Advisory helpers ─── */

function computeSupportStatus(advisories: DepsAdvisory[], isDeprecated?: boolean): SupportStatus {
  if (isDeprecated) return 'eol'

  const hasHighOrCritical = advisories.some(
    (a) => a.severity === 'CRITICAL' || a.severity === 'HIGH',
  )
  if (hasHighOrCritical) return 'eol'

  const hasMedium = advisories.some((a) => a.severity === 'MEDIUM')
  if (hasMedium) return 'extended'

  if (advisories.length > 0) return 'active'

  return 'unknown'
}

function severityFromScore(score?: number): string {
  if (score == null) return 'UNKNOWN'
  if (score >= 9.0) return 'CRITICAL'
  if (score >= 7.0) return 'HIGH'
  if (score >= 4.0) return 'MEDIUM'
  return 'LOW'
}

/* ─── Main lookup ─── */

export async function lookupDepsPackage(
  searchTerm: string,
  system: DepsSystem,
): Promise<DepsPackageResult | null> {
  const atIdx = searchTerm.lastIndexOf('@')
  let pkgName = searchTerm
  let pkgVersion = ''

  if (atIdx > 0) {
    pkgName = searchTerm.slice(0, atIdx)
    pkgVersion = searchTerm.slice(atIdx + 1)
  }

  const pkg = await apiFetch<any>(`/systems/${system}/packages/${encodePackageName(pkgName)}`)
  if (!pkg) return null

  if (!pkgVersion) {
    const defaultVer = pkg.versions?.find((v: any) => v.isDefault)
    pkgVersion = defaultVer?.versionKey?.version ?? ''
  }
  if (!pkgVersion) return null

  const ver = await apiFetch<any>(
    `/systems/${system}/packages/${encodePackageName(pkgName)}/versions/${encodeURIComponent(pkgVersion)}`,
  )
  if (!ver) return null

  const rawAdvisoryKeys: { id: string }[] = ver.advisoryKeys ?? []
  const advisoryResults: DepsAdvisory[] = []

  for (const adv of rawAdvisoryKeys) {
    const detail = await apiFetch<any>(`/advisories/${adv.id}`)
    if (detail) {
      advisoryResults.push({
        id: adv.id,
        title: detail.title ?? '',
        severity: severityFromScore(detail.cvss3Score),
        cvssScore: detail.cvss3Score,
        aliases: detail.aliases ?? [],
        url: detail.sourceUrl ?? '',
      })
    } else {
      advisoryResults.push({ id: adv.id })
    }
  }

  const cveAliases = advisoryResults.flatMap(
    (a) => a.aliases?.filter((al) => /^CVE-/i.test(al)) ?? [],
  )

  return {
    system,
    name: pkgName,
    version: pkgVersion,
    description: ver.description ?? pkg.description ?? '',
    license: ver.licenses?.[0] ?? 'unknown',
    advisories: advisoryResults,
    supportStatus: computeSupportStatus(advisoryResults, ver.isDeprecated),
    cveList: cveAliases,
    advisoryIds: advisoryResults.map((a) => a.id),
  }
}

export function clearDepsDevCache(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(CACHE_PREFIX)) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}
