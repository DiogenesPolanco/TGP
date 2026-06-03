import { db } from '@/services/db/database'
import type { Technology, SupportStatus } from '@/types/domain'

interface EolCycle {
  cycle: string
  releaseDate?: string
  eol: string | boolean
  latest?: string
  latestReleaseDate?: string
  lts?: string | boolean
  support?: string | boolean
  extendedSupport?: boolean
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

/**
 * Name-to-slug mapping for endoflife.date API.
 * Key = normalized technology name, Value = API product slug
 */
const NAME_TO_SLUG: Record<string, string> = {
  // Languages
  'java': 'oracle-jdk',
  'python': 'python',
  'go': 'go',
  'rust': 'rust',
  'php': 'php',
  'ruby': 'ruby',

  // Frameworks
  '.net framework': 'dotnetfx',
  'angular': 'angular',
  'react': 'react',
  'vue.js': 'vue',
  'next.js': 'nextjs',
  'spring boot': 'spring-boot',
  'express': 'express',
  'django': 'django',
  'laravel': 'laravel',
  'ruby on rails': 'rails',
  'symfony': 'symfony',

  // Databases
  'postgresql': 'postgresql',
  'mysql': 'mysql',
  'mariadb': 'mariadb',
  'sql server': 'mssqlserver',
  'oracle database': 'oracle-database',
  'mongodb': 'mongodb',
  'cockroachdb': 'cockroachdb',
  'elasticsearch': 'elasticsearch',
  'opensearch': 'opensearch',
  'redis': 'redis',
  'memcached': 'memcached',
  'sqlite': 'sqlite',

  // Message Brokers
  'rabbitmq': 'rabbitmq',
  'apache kafka': 'apache-kafka',
  'apache activemq': 'apache-activemq',

  // Runtimes
  'node.js': 'nodejs',
  'bun': 'bun',
  'deno': 'deno',

  // Web Servers
  'nginx': 'nginx',
  'apache http server': 'apache-http-server',
  'caddy': 'caddy',
  'tomcat': 'tomcat',

  // Operating Systems
  'ubuntu': 'ubuntu',
  'windows server': 'windows-server',
  'rhel': 'rhel',
  'debian': 'debian',
  'alpine linux': 'alpine-linux',
  'centos': 'centos',
  'rocky linux': 'rocky-linux',
  'opensuse': 'opensuse',
  'sles': 'sles',
  'oracle linux': 'oracle-linux',

  // Containers & Orchestration
  'docker engine': 'docker-engine',
  'docker': 'docker-engine',
  'kubernetes': 'kubernetes',
  'podman': 'podman',
  'containerd': 'containerd',

  // Infrastructure as Code
  'terraform': 'terraform',
  'ansible': 'ansible',

  // CI/CD
  'jenkins': 'jenkins',

  // Monitoring
  'prometheus': 'prometheus',
  'grafana': 'grafana',

  // Libraries
  'tailwind css': 'tailwind-css',
  'jquery': 'jquery',
  'jquery ui': 'jquery-ui',

  // Other
  'bootstrap': 'bootstrap',
  'vault': 'hashicorp-vault',
  'consul': 'consul',
  'etcd': 'etcd',
  'istio': 'istio',
  'envoy': 'envoy',
  'haproxy': 'haproxy',
  'postfix': 'postfix',
  'openssl': 'openssl',
  'powershell': 'powershell',
  'chef': 'chef-infra-client',
  'puppet': 'puppet',
}

const SAAS_ONLY = new Set([
  'amazon web services', 'microsoft azure', 'google cloud platform',
  'cloudflare', 'datadog', 'github actions', 'gitlab ci', 'azure devops',
  'amazon sqs', 'sentry', 'new relic',
])

/** Products we know don't have EOL data in endoflife.date */
const SLUG_BLACKLIST = new Set<string>()

/**
 * Fetch EOL data from endoflife.date for a given product slug.
 * Returns null if the product is not found or fetch fails.
 */
async function fetchEolData(slug: string): Promise<EolCycle[] | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`https://endoflife.date/api/${encodeURIComponent(slug)}.json`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Try to match our version string against API cycle versions.
 * Returns the best matching cycle or null.
 */
function matchCycle(cycles: EolCycle[], version: string): EolCycle | null {
  const vLower = version.toLowerCase()

  // Exact match first
  const exact = cycles.find((c) => c.cycle.toLowerCase() === vLower)
  if (exact) return exact

  // Match if version starts with cycle (e.g., version "22.11.0" matches cycle "22")
  const startsWith = cycles.find((c) => vLower.startsWith(c.cycle.toLowerCase() + '.') || vLower.startsWith(c.cycle.toLowerCase() + '-'))
  if (startsWith) return startsWith

  // Match if cycle starts with version (e.g., version "3" matches cycle "3.13")
  const cycleStartsWith = cycles.find((c) => c.cycle.toLowerCase().startsWith(vLower + '.') || c.cycle.toLowerCase().startsWith(vLower + '-'))
  if (cycleStartsWith) return cycleStartsWith

  // For versions like "1.x", try to match major version
  if (vLower.endsWith('.x')) {
    const major = vLower.replace('.x', '')
    const majorMatch = cycles.find((c) => c.cycle.toLowerCase().startsWith(major + '.') || c.cycle === major)
    if (majorMatch) return majorMatch
  }

  return null
}

/**
 * Determine support status from API cycle data.
 */
function computeSupportStatus(cycle: EolCycle): { status: SupportStatus; eolDate: Date | null } {
  const now = new Date()

  // Check EOL
  if (cycle.eol === true) {
    return { status: 'eol', eolDate: null }
  }

  if (typeof cycle.eol === 'string') {
    const eolDate = new Date(cycle.eol)
    if (eolDate < now) {
      return { status: 'eol', eolDate }
    }
  }

  // Check support/maintenance end
  if (typeof cycle.support === 'string') {
    const supportDate = new Date(cycle.support)
    if (supportDate < now) {
      // Support ended but EOL not yet reached — extended support
      const eolDate = typeof cycle.eol === 'string' ? new Date(cycle.eol) : null
      return { status: 'extended', eolDate }
    }
  }

  // Check extended support flag
  if (cycle.extendedSupport === true && typeof cycle.support === 'string') {
    const now = new Date()
    const supportDate = new Date(cycle.support)
    if (supportDate < now) {
      const eolDate = typeof cycle.eol === 'string' ? new Date(cycle.eol) : null
      return { status: 'extended', eolDate }
    }
  }

  // Active support
  const eolDate = typeof cycle.eol === 'string' ? new Date(cycle.eol) : null
  return { status: 'active', eolDate }
}

/**
 * Synchronize technologies with endoflife.date API.
 *
 * For each technology in the DB:
 * - Looks up the corresponding API product
 * - Fetches EOL cycles
 * - Updates eolDate and supportStatus from API data
 *
 * Returns a detailed sync result.
 */
export async function syncTechnologies(): Promise<SyncResult> {
  const startTime = Date.now()
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
    if (!cycles || cycles.length === 0) {
      for (const t of techs) {
        result.details.push({ name: t.name, version: t.version, action: 'error', error: `API not found for slug: ${slug}` })
        result.errors++
      }
      continue
    }

    for (const tech of techs) {
      const cycle = matchCycle(cycles, tech.version)
      if (!cycle) {
        result.details.push({
          name: tech.name,
          version: tech.version,
          action: 'not_found',
          error: `Version ${tech.version} not found in API data for ${slug}`,
        })
        result.notFound++
        continue
      }

      const { status: newStatus, eolDate: newEolDate } = computeSupportStatus(cycle)
      const previousStatus = tech.supportStatus
      const previousEol = tech.eolDate?.toISOString().split('T')[0]

      await db.technologies.update(tech.id, {
        supportStatus: newStatus,
        eolDate: newEolDate,
        metadata: {
          ...tech.metadata,
          lastSyncFromEol: new Date().toISOString(),
          eolApiSlug: slug,
          eolApiLatest: cycle.latest ?? null,
          eolApiCycle: cycle.cycle,
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
  return result
}
