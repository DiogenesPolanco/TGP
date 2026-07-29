import { db } from '@/services/db/database'
import { seedTechnologies } from '@/services/demo/seedTechnologies'
import { lookupDepsPackage } from '@/services/security/depsDevService'
import { DEPS_SYSTEMS } from '@/services/security/depsDevService'
import type { DepsSystem } from '@/services/security/depsDevService'
import type { Technology, SupportStatus } from '@/types/domain'

interface V1Release {
  name: string
  codename?: string | null
  label?: string | null
  releaseDate?: string | null
  isLts?: boolean | null
  ltsFrom?: string | null
  isEol: boolean
  eolFrom?: string | null
  isEoes?: boolean | null
  eoesFrom?: string | null
  isMaintained?: boolean | null
  latest?: { name: string; date?: string; link?: string } | string | null
  custom?: unknown
}

interface V1Response {
  schema_version: string
  generated_at: string
  last_modified: string
  result: {
    name: string
    aliases?: string[]
    label?: string
    category?: string
    tags?: string[]
    releases: V1Release[]
  }
}

interface SyncResultItem {
  name: string
  version: string
  action: 'updated' | 'not_found' | 'error'
  error?: string
  previousEol?: string
  newEol?: string
  previousStatus?: SupportStatus
  newStatus?: SupportStatus
}

export interface SyncResult {
  total: number
  updated: number
  notFound: number
  errors: number
  details: SyncResultItem[]
  duration: number
}

const NAME_TO_SLUG: Record<string, string> = {
  java: 'oracle-jdk',
  kotlin: 'kotlin',
  python: 'python',
  go: 'go',
  rust: 'rust',
  php: 'php',
  ruby: 'ruby',
  '.net': 'dotnet',
  '.net framework': 'dotnetfx',
  angular: 'angular',
  react: 'react',
  'vue.js': 'vue',
  'next.js': 'nextjs',
  'spring boot': 'spring-boot',
  express: 'express',
  django: 'django',
  laravel: 'laravel',
  'ruby on rails': 'rails',
  symfony: 'symfony',
  postgresql: 'postgresql',
  mysql: 'mysql',
  mariadb: 'mariadb',
  'sql server': 'mssqlserver',
  'oracle database': 'oracle-database',
  mongodb: 'mongodb',
  cockroachdb: 'cockroachdb',
  elasticsearch: 'elasticsearch',
  opensearch: 'opensearch',
  redis: 'redis',
  memcached: 'memcached',
  sqlite: 'sqlite',
  rabbitmq: 'rabbitmq',
  'apache kafka': 'apache-kafka',
  'apache activemq': 'apache-activemq',
  'node.js': 'nodejs',
  bun: 'bun',
  deno: 'deno',
  nginx: 'nginx',
  'apache http server': 'apache-http-server',
  caddy: 'caddy',
  tomcat: 'tomcat',
  ubuntu: 'ubuntu',
  'windows server': 'windows-server',
  rhel: 'rhel',
  debian: 'debian',
  'alpine linux': 'alpine-linux',
  centos: 'centos',
  'rocky linux': 'rocky-linux',
  opensuse: 'opensuse',
  sles: 'sles',
  'oracle linux': 'oracle-linux',
  'docker engine': 'docker-engine',
  docker: 'docker-engine',
  kubernetes: 'kubernetes',
  podman: 'podman',
  containerd: 'containerd',
  terraform: 'terraform',
  ansible: 'ansible',
  jenkins: 'jenkins',
  prometheus: 'prometheus',
  grafana: 'grafana',
  'tailwind css': 'tailwind-css',
  jquery: 'jquery',
  'jquery ui': 'jquery-ui',
  bootstrap: 'bootstrap',
  vault: 'hashicorp-vault',
  consul: 'consul',
  etcd: 'etcd',
  istio: 'istio',
  envoy: 'envoy',
  haproxy: 'haproxy',
  postfix: 'postfix',
  openssl: 'openssl',
  powershell: 'powershell',
  chef: 'chef-infra-client',
  puppet: 'puppet',
}

const SAAS_ONLY = new Set([
  'amazon web services',
  'microsoft azure',
  'google cloud platform',
  'cloudflare',
  'datadog',
  'github actions',
  'gitlab ci',
  'azure devops',
  'amazon sqs',
  'sentry',
  'new relic',
])

const SLUG_BLACKLIST = new Set<string>()

async function fetchEolData(slug: string): Promise<V1Release[] | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const response = await fetch(
      `https://endoflife.date/api/v1/products/${encodeURIComponent(slug)}`,
      {
        signal: controller.signal,
      },
    )
    clearTimeout(timeout)
    if (!response.ok) {
      if (response.status === 404) return []
      return null
    }
    const data: V1Response = await response.json()
    return data.result.releases ?? []
  } catch (err) {
    console.error(`[endoflifeSync] Failed to fetch ${slug}:`, err)
    return null
  }
}

export function latestString(latest: V1Release['latest']): string | null {
  if (!latest) return null
  if (typeof latest === 'string') return latest
  if (typeof latest === 'object' && 'name' in latest) return latest.name ?? null
  return null
}

export function matchCycle(cycles: V1Release[], version: string): V1Release | null {
  const vLower = version.toLowerCase()
  const exact = cycles.find((c) => c.name.toLowerCase() === vLower)
  if (exact) return exact
  const startsWith = cycles.find(
    (c) =>
      vLower.startsWith(c.name.toLowerCase() + '.') ||
      vLower.startsWith(c.name.toLowerCase() + '-'),
  )
  if (startsWith) return startsWith
  const cycleStartsWith = cycles.find(
    (c) =>
      c.name.toLowerCase().startsWith(vLower + '.') ||
      c.name.toLowerCase().startsWith(vLower + '-'),
  )
  if (cycleStartsWith) return cycleStartsWith
  if (vLower.endsWith('.x')) {
    const major = vLower.replace('.x', '')
    const majorMatch = cycles.find(
      (c) => c.name.toLowerCase().startsWith(major + '.') || c.name === major,
    )
    if (majorMatch) return majorMatch
  }
  return null
}

export function computeSupportStatus(release: V1Release): {
  status: SupportStatus
  eolDate: Date | null
} {
  const now = new Date()
  const eolFrom = release.eolFrom ?? null
  const eoesFrom = release.eoesFrom ?? null
  const isMaintained = release.isMaintained ?? false

  if (release.isEol) {
    if (typeof eoesFrom === 'string') {
      const extEnd = new Date(eoesFrom)
      if (extEnd > now) {
        return { status: 'extended', eolDate: eolFrom ? new Date(eolFrom) : null }
      }
    }
    return { status: 'eol', eolDate: eolFrom ? new Date(eolFrom) : null }
  }

  if (typeof eolFrom === 'string') {
    const eolDate = new Date(eolFrom)
    if (eolDate < now && !isMaintained) {
      return { status: 'eol', eolDate }
    }
    if (eolDate < now && isMaintained && typeof eoesFrom === 'string') {
      const extEnd = new Date(eoesFrom)
      if (extEnd > now) {
        return { status: 'extended', eolDate }
      }
    }
    return { status: 'active', eolDate }
  }

  return { status: 'active', eolDate: null }
}

export async function syncTechnologies(): Promise<SyncResult> {
  const startTime = Date.now()

  // Seed any missing technologies from catalog before syncing
  // seedTechnologies is idempotent — it only adds technologies not already in DB (matched by name+version)
  await seedTechnologies()
  const technologies = await db.technologies.toArray()

  const result: SyncResult = {
    total: technologies.length,
    updated: 0,
    notFound: 0,
    errors: 0,
    details: [],
    duration: 0,
  }

  const byName = new Map<string, Technology[]>()
  for (const tech of technologies) {
    const key = tech.name.toLowerCase().trim()
    if (!byName.has(key)) byName.set(key, [])
    byName.get(key)!.push(tech)
  }

  for (const [nameLower, techs] of byName) {
    if (SAAS_ONLY.has(nameLower)) {
      for (const t of techs) {
        result.details.push({ name: t.name, version: t.version, action: 'not_found' })
        result.notFound++
      }
      continue
    }

    const slug = NAME_TO_SLUG[nameLower]
    if (!slug || SLUG_BLACKLIST.has(slug)) {
      for (const t of techs) {
        result.details.push({ name: t.name, version: t.version, action: 'not_found' })
        result.notFound++
      }
      continue
    }

    const cycles = await fetchEolData(slug)
    if (cycles === null) {
      for (const t of techs) {
        result.details.push({
          name: t.name,
          version: t.version,
          action: 'error',
          error: `API request failed for slug: ${slug}`,
        })
        result.errors++
      }
      continue
    }

    if (cycles.length === 0) {
      for (const t of techs) {
        result.details.push({
          name: t.name,
          version: t.version,
          action: 'error',
          error: `API returned no data for slug: ${slug}`,
        })
        result.errors++
      }
      continue
    }

    for (const tech of techs) {
      const release = matchCycle(cycles, tech.version)
      if (!release) {
        result.details.push({
          name: tech.name,
          version: tech.version,
          action: 'not_found',
          error: `Version ${tech.version} not found in API data for ${slug}`,
        })
        result.notFound++
        continue
      }

      const { status: newStatus, eolDate: newEolDate } = computeSupportStatus(release)
      const previousStatus = tech.supportStatus
      const previousEol = tech.eolDate?.toISOString().split('T')[0]

      await db.technologies.update(tech.id, {
        supportStatus: newStatus,
        eolDate: newEolDate,
        metadata: {
          ...tech.metadata,
          lastSyncFromEol: new Date().toISOString(),
          eolApiSlug: slug,
          eolApiLatest: latestString(release.latest),
          eolApiCycle: release.name,
        },
      })

      result.updated++
      result.details.push({
        name: tech.name,
        version: tech.version,
        action: 'updated',
        previousEol: previousEol ?? undefined,
        newEol: newEolDate?.toISOString().split('T')[0] ?? undefined,
        previousStatus,
        newStatus,
      })
    }
  }

  result.duration = Date.now() - startTime

  // ── 2nd pass: deps.dev sync for libraries ──
  const depsResults = await syncLibrariesFromDepsDev()
  for (const dr of depsResults) {
    result.details.push(dr)
    if (dr.action === 'updated') result.updated++
    else if (dr.action === 'not_found') result.notFound++
    else if (dr.action === 'error') result.errors++
  }

  result.duration = Date.now() - startTime
  return result
}

/* ─── deps.dev helpers ─── */

export function detectDepsSystem(tech: Technology): DepsSystem | null {
  const sysFromMeta = tech.metadata?.system as string | undefined
  if (sysFromMeta && ['npm', 'maven', 'nuget', 'pypi', 'go', 'cargo'].includes(sysFromMeta)) {
    return sysFromMeta as DepsSystem
  }

  const vendor = tech.vendor?.toLowerCase() ?? ''
  const known = DEPS_SYSTEMS.map((s) => s.label.toLowerCase())
  if (known.includes(vendor)) {
    return DEPS_SYSTEMS.find((s) => s.label.toLowerCase() === vendor)!.value
  }

  return null
}

async function syncLibrariesFromDepsDev(): Promise<SyncResultItem[]> {
  const libraries = await db.technologies.filter((t) => t.category === 'library').toArray()

  const results: SyncResultItem[] = []

  for (const tech of libraries) {
    const system = detectDepsSystem(tech)
    if (!system) continue

    const searchTerm = tech.version ? `${tech.name}@${tech.version}` : tech.name
    const depsResult = await lookupDepsPackage(searchTerm, system)

    if (!depsResult) {
      results.push({
        name: tech.name,
        version: tech.version,
        action: 'not_found',
        error: `${system}: no encontrado en deps.dev`,
      })
      continue
    }

    const previousStatus = tech.supportStatus
    const previousCveCount = tech.cveList.length

    await db.technologies.update(tech.id, {
      supportStatus: depsResult.supportStatus,
      cveList: depsResult.cveList,
      metadata: {
        ...tech.metadata,
        system,
        license: depsResult.license,
        description: depsResult.description,
        advisories: depsResult.advisories,
        advisoryIds: depsResult.advisoryIds,
        lastSyncFromDepsDev: new Date().toISOString(),
      },
    })

    results.push({
      name: tech.name,
      version: tech.version,
      action: 'updated',
      previousStatus,
      newStatus: depsResult.supportStatus,
      error:
        previousCveCount !== depsResult.cveList.length
          ? `CVEs: ${previousCveCount} → ${depsResult.cveList.length}`
          : undefined,
    })
  }

  return results
}
