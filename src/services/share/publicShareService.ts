import { db } from '@/services/db/database'

const SHARED_LINKS_KEY = 'tgp-shared-links'

interface SharedLink {
  hash: string
  createdAt: number
  expiresAt: number
}

function generateHash(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function getSharedLinks(): SharedLink[] {
  try {
    return JSON.parse(localStorage.getItem(SHARED_LINKS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveSharedLinks(links: SharedLink[]) {
  localStorage.setItem(SHARED_LINKS_KEY, JSON.stringify(links))
}

export function createShareLink(hoursValid = 48): { hash: string; url: string } {
  const links = getSharedLinks()
  const hash = generateHash()
  const link: SharedLink = {
    hash,
    createdAt: Date.now(),
    expiresAt: Date.now() + hoursValid * 60 * 60 * 1000,
  }
  links.push(link)
  saveSharedLinks(links)
  return { hash, url: `${window.location.origin}/public/${hash}` }
}

export function getSharedLinksList(): (SharedLink & { url: string })[] {
  return getSharedLinks()
    .filter((l) => l.expiresAt > Date.now())
    .map((l) => ({ ...l, url: `${window.location.origin}/public/${l.hash}` }))
}

export function revokeShareLink(hash: string) {
  const links = getSharedLinks().filter((l) => l.hash !== hash)
  saveSharedLinks(links)
}

export function isValidShareHash(hash: string): boolean {
  const links = getSharedLinks()
  const link = links.find((l) => l.hash === hash)
  if (!link) return false
  if (link.expiresAt < Date.now()) return false
  return true
}

export async function getPublicDashboardData() {
  const [businessUnits, applications, vulnerabilities, incidents, risks, technologies, teams, healthHistory] =
    await Promise.all([
      db.businessUnits.toArray(),
      db.applications.toArray(),
      db.vulnerabilities.toArray(),
      db.incidents.toArray(),
      db.risks.toArray(),
      db.technologies.toArray(),
      db.teams.toArray(),
      db.healthIndexHistory.orderBy('calculatedAt').reverse().limit(30).toArray(),
    ])

  return {
    businessUnits,
    applications,
    vulnerabilities: vulnerabilities.map(({ id, title, severity, status, cvssScore }) => ({ id, title, severity, status, cvssScore })),
    incidents: incidents.map(({ id, title, severity, status }) => ({ id, title, severity, status })),
    risks: risks.map(({ id, title, riskScore, status }) => ({ id, title, riskScore, status })),
    technologies: technologies.map(({ id, name, version, supportStatus }) => ({ id, name, version, supportStatus })),
    teams: teams.map(({ id, name, currentMetrics }) => ({ id, name, currentMetrics })),
    healthHistory: healthHistory.map((h) => ({ date: h.calculatedAt, score: h.overallScore })),
  }
}

export type PublicDashboardData = Awaited<ReturnType<typeof getPublicDashboardData>>
