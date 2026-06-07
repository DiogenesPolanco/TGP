import { db } from '@/services/db/database'

const SHARED_LINKS_KEY = 'tgp-shared-links'
const AZURE_LINKS_KEY = 'tgp-azure-links'

type ShareType = 'dashboard' | 'performance' | 'member' | 'members' | 'recruitment'

interface SharedLink {
  hash: string
  type: ShareType
  ref?: string
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

function getAzureLinks(): string[] {
  try {
    return JSON.parse(localStorage.getItem(AZURE_LINKS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveAzureLinks(links: string[]) {
  localStorage.setItem(AZURE_LINKS_KEY, JSON.stringify(links))
}

export function isLinkInAzure(hash: string): boolean {
  return getAzureLinks().includes(hash)
}

export async function createShareLink(
  hoursValid = 48,
  type: ShareType = 'dashboard',
  ref?: string,
  data?: unknown,
): Promise<{ hash: string; url: string }> {
  const links = getSharedLinks()
  const hash = generateHash()
  const link: SharedLink = {
    hash,
    type,
    ref,
    createdAt: Date.now(),
    expiresAt: Date.now() + hoursValid * 60 * 60 * 1000,
  }
  links.push(link)
  saveSharedLinks(links)

  // Also store the short hash (first 16 chars) for URL matching
  const shortHash = hash.slice(0, 16)
  if (shortHash !== hash) {
    const shortLink: SharedLink = { ...link, hash: shortHash }
    links.push(shortLink)
    saveSharedLinks(links)
  }

  let manifestStr = ''

  // If Azure is configured and data is provided, upload data and build manifest
  if (data) {
    const { uploadShareToAzure, buildManifestString, getAzureConfig } = await import('@/services/share/azureShareService')
    const config = getAzureConfig()
    if (config) {
      const url = await uploadShareToAzure(hash, data)
      if (url) {
        const m = buildManifestString(hash)
        if (m) manifestStr = m
        const azureLinks = getAzureLinks()
        azureLinks.push(hash)
        saveAzureLinks(azureLinks)
      }
    }
  }

  const base = type === 'performance' ? '/public/performance' : type === 'member' ? '/public/member' : type === 'members' ? '/public/members' : '/public'
  const fragment = manifestStr ? `#${encodeURIComponent(manifestStr)}` : ''
  return { hash: shortHash, url: `${window.location.origin}${base}/${shortHash}${fragment}` }
}

export function getShareInfo(hash: string): { type: ShareType; ref?: string } | null {
  const links = getSharedLinks()
  const link = links.find((l) => l.hash === hash || l.hash.startsWith(hash))
  if (!link) return null
  return { type: link.type, ref: link.ref }
}

export function getShareType(hash: string): ShareType | null {
  return getShareInfo(hash)?.type ?? null
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

/** Check both localStorage and Azure for a valid share */
export async function isShareValid(hash: string): Promise<boolean> {
  if (isValidShareHash(hash)) return true
  if (isLinkInAzure(hash)) return true
  try {
    const { downloadShareFromAzure } = await import('@/services/share/azureShareService')
    const data = await downloadShareFromAzure(hash)
    return data !== null
  } catch {
    return false
  }
}

export async function getPublicDashboardData() {
  const [businessUnits, applications, vulnerabilities, incidents, risks, technologies, teams, auditFindings, healthHistory] =
    await Promise.all([
      db.businessUnits.toArray(),
      db.applications.toArray(),
      db.vulnerabilities.toArray(),
      db.incidents.toArray(),
      db.risks.toArray(),
      db.technologies.toArray(),
      db.teams.toArray(),
      db.auditFindings.toArray(),
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
    auditFindings: auditFindings.map(({ id, title, severity, status, dueDate }) => ({ id, title, severity, status, dueDate })),
    healthHistory: healthHistory.map((h) => ({ date: h.calculatedAt, score: h.overallScore })),
  }
}

export type PublicDashboardData = Awaited<ReturnType<typeof getPublicDashboardData>>

export async function getPublicPerformanceData() {
  const [teams, members, sprints, oneOnOnes, achievements] = await Promise.all([
    db.teams.toArray(),
    db.memberProfiles.toArray(),
    db.sprintRecords.toArray(),
    db.oneOnOnes.toArray(),
    db.achievements.toArray(),
  ])

  return { teams, members, sprints, oneOnOnes, achievements }
}

export type PublicPerformanceData = Awaited<ReturnType<typeof getPublicPerformanceData>>

export async function getPublicMemberData(memberId: string) {
  const [member, teams, sprints, oneOnOnes, achievements] = await Promise.all([
    db.memberProfiles.get(memberId),
    db.teams.toArray(),
    db.sprintRecords.where('memberId').equals(memberId).toArray(),
    db.oneOnOnes.where('memberId').equals(memberId).toArray(),
    db.achievements.where('memberId').equals(memberId).toArray(),
  ])
  if (!member) return null
  const memberTeam = teams.find((t) => t.id === member.teamId)
  const displayName = memberTeam?.members?.find((tm) => tm.id === memberId)?.displayName ?? member.email.split('@')[0] ?? 'Miembro'
  return { member, displayName, team: memberTeam ?? null, sprints, oneOnOnes, achievements }
}

export type PublicMemberData = Awaited<ReturnType<typeof getPublicMemberData>>

export async function getPublicRecruitmentData() {
  const [candidates, technologies, evaluations] = await Promise.all([
    db.candidates.orderBy('createdAt').reverse().toArray(),
    db.candidateTechnologies.toArray(),
    db.candidateEvaluations.toArray(),
  ])
  return { candidates, technologies, evaluations }
}

export type PublicRecruitmentData = Awaited<ReturnType<typeof getPublicRecruitmentData>>

export async function fetchAzureShareData<T = unknown>(hash: string): Promise<T | null> {
  try {
    const { downloadShareFromAzure } = await import('@/services/share/azureShareService')
    return await downloadShareFromAzure(hash) as T | null
  } catch {
    return null
  }
}
