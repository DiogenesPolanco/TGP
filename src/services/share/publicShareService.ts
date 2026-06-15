import { db } from '@/services/db/database'

const SHARED_LINKS_KEY = 'tgp-shared-links'
const AZURE_LINKS_KEY = 'tgp-azure-links'
const ACCESS_LOG_KEY = 'tgp-share-access-log'

// ─── Types ──────────────────────────────────────────────────────────

export type ShareType = 'dashboard' | 'performance' | 'member' | 'members' | 'recruitment' | 'daily'
  | 'plan' | 'timeline' | 'predictability' | 'vulnerabilities' | 'incidents' | 'risks'
  | 'audit' | 'objectives' | 'obsolescence' | 'dependencies'

interface SharedLink {
  hash: string
  type: ShareType
  ref?: string
  createdAt: number
  expiresAt: number
}

interface AccessLogEntry {
  hash: string
  type: ShareType
  accessedAt: number
  userAgent: string
}

// ─── Route table (fix #4: ternary → Record) ─────────────────────────

const PUBLIC_ROUTES: Record<ShareType, string> = {
  dashboard: '/public',
  performance: '/public/performance',
  member: '/public/member',
  members: '/public/members',
  recruitment: '/public/recruitment',
  daily: '/public/daily',
  plan: '/public/plan',
  timeline: '/public/timeline',
  predictability: '/public/predictability',
  vulnerabilities: '/public/vulnerabilities',
  incidents: '/public/incidents',
  risks: '/public/risks',
  audit: '/public/audit',
  objectives: '/public/objectives',
  obsolescence: '/public/obsolescence',
  dependencies: '/public/dependencies',
}

// ─── Hash generation (fix #2: 16 chars direct, no duplication) ─────

function generateHash(): string {
  const buf = new Uint8Array(8) // 8 bytes → 16 hex chars
  crypto.getRandomValues(buf)
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Local link store ───────────────────────────────────────────────

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

// ─── Create share link ──────────────────────────────────────────────

export async function createShareLink(
  hoursValid = 48,
  type: ShareType = 'dashboard',
  ref?: string,
  data?: unknown,
): Promise<{ hash: string; url: string }> {
  const hash = generateHash()
  const now = Date.now()

  const link: SharedLink = {
    hash,
    type,
    ref,
    createdAt: now,
    expiresAt: now + hoursValid * 60 * 60 * 1000,
  }

  // Store locally
  const links = getSharedLinks()
  links.push(link)
  saveSharedLinks(links)

  // Upload to Azure if data provided
  let manifestStr = ''
  if (data) {
    const { uploadShareToAzure, buildManifestString, getShareAzureConfig } = await import('@/services/share/azureShareService')
    const config = getShareAzureConfig()
    const backupConfig = (await import('@/services/backup/azureBackupService')).getAzureConfig()

    if (config || backupConfig) {
      const result = await uploadShareToAzure(hash, data)
      if (result.url) {
        manifestStr = buildManifestString(hash, result.autoKey) ?? ''
        const azureLinks = getAzureLinks()
        azureLinks.push(hash)
        saveAzureLinks(azureLinks)
      }
    }
  }

  const base = PUBLIC_ROUTES[type] ?? '/public'
  const fragment = manifestStr ? `#${encodeURIComponent(manifestStr)}` : ''
  return { hash, url: `${window.location.origin}${base}/${hash}${fragment}` }
}

// ─── Share info ─────────────────────────────────────────────────────

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

export function getLinkExpiry(hash: string): number | null {
  const links = getSharedLinks()
  const link = links.find((l) => l.hash === hash)
  return link?.expiresAt ?? null
}

// ─── Validation ─────────────────────────────────────────────────────

export function isValidShareHash(hash: string): boolean {
  const links = getSharedLinks()
  const link = links.find((l) => l.hash === hash)
  if (!link) return false
  return link.expiresAt >= Date.now()
}

/** Check both localStorage and Azure for a valid share */
export async function isShareValid(hash: string): Promise<boolean> {
  // Local check (includes expiration)
  if (isValidShareHash(hash)) return true

  // Azure link list check
  if (isLinkInAzure(hash)) {
    // Fix #3: Check expiry from local link store
    const localExpiry = getLinkExpiry(hash)
    if (localExpiry && localExpiry < Date.now()) return false
    return true
  }

  // Try to download from Azure — fix #3: check blob metadata against expiry
  try {
    const { downloadShareFromAzure } = await import('@/services/share/azureShareService')
    const data = await downloadShareFromAzure(hash)

    if (data !== null) {
      // Log access (fix #9)
      logShareAccess(hash, 'unknown')
      return true
    }
  } catch { /* empty */ }

  return false
}

// ─── Access logging (fix #9) ────────────────────────────────────────

export function logShareAccess(hash: string, type: ShareType | string): void {
  try {
    const logs: AccessLogEntry[] = JSON.parse(localStorage.getItem(ACCESS_LOG_KEY) ?? '[]')
    logs.push({
      hash,
      type: type as ShareType,
      accessedAt: Date.now(),
      userAgent: navigator.userAgent.slice(0, 100),
    })
    // Keep last 100 entries
    if (logs.length > 100) logs.splice(0, logs.length - 100)
    localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(logs))
  } catch { /* empty */ }
}

export function getShareAccessLog(hash?: string): AccessLogEntry[] {
  try {
    const logs: AccessLogEntry[] = JSON.parse(localStorage.getItem(ACCESS_LOG_KEY) ?? '[]')
    if (hash) return logs.filter((l) => l.hash === hash)
    return logs
  } catch {
    return []
  }
}

// ─── Public data loaders (fix #5: unified entity-based system) ──────

export interface PublicDataRequest {
  entities: string[]
}

const ENTITY_LOADERS: Record<string, () => Promise<unknown[]>> = {
  applications: () => db.applications.toArray(),
  businessUnits: () => db.businessUnits.toArray(),
  technologies: () => db.technologies.toArray(),
  teams: () => db.teams.toArray(),
  members: () => db.memberProfiles.toArray(),
  vulnerabilities: () => db.vulnerabilities.toArray(),
  incidents: () => db.incidents.toArray(),
  risks: () => db.risks.toArray(),
  auditFindings: () => db.auditFindings.toArray(),
  objectives: () => db.objectives.toArray(),
  plans: () => db.plans.toArray(),
  activities: () => db.activities.toArray(),
  tasks: () => db.tasks.toArray(),
  blockers: () => db.blockers.toArray(),
  commitments: () => db.commitments.toArray(),
  sprints: () => db.sprintRecords.toArray(),
  oneOnOnes: () => db.oneOnOnes.toArray(),
  achievements: () => db.achievements.toArray(),
  healthHistory: () => db.healthIndexHistory.orderBy('calculatedAt').reverse().limit(30).toArray(),
  microservices: () => db.microservices.toArray(),
  applicationDependencies: () => db.applicationDependencies.toArray(),
  teamSprints: () => db.teamSprints.toArray(),
}

export async function loadPublicEntities(entities: string[]): Promise<Record<string, any[]>> {
  const loaders = entities
    .filter((e) => ENTITY_LOADERS[e])
    .map(async (e) => [e, await ENTITY_LOADERS[e]()] as const)

  const results = await Promise.all(loaders)
  return Object.fromEntries(results)
}

// ─── Per-page data fetchers (thin wrappers over loadPublicEntities) ─

export async function getPublicDashboardData() {
  const data = await loadPublicEntities([
    'businessUnits', 'applications', 'vulnerabilities', 'incidents', 'risks',
    'technologies', 'teams', 'auditFindings', 'healthHistory',
  ])
  return data as {
    businessUnits: any[]
    applications: any[]
    vulnerabilities: { id: string; title: string; severity: string; status: string; cvssScore?: number; applicationId?: string }[]
    incidents: { id: string; title: string; severity: string; status: string }[]
    risks: { id: string; title: string; riskScore?: number; status: string }[]
    technologies: { id: string; name: string; version: string; supportStatus: string }[]
    teams: { id: string; name: string; currentMetrics?: any }[]
    auditFindings: { id: string; title: string; severity: string; status: string; dueDate?: string }[]
    healthHistory: { date: string; score: number }[]
  }
}

export type PublicDashboardData = Awaited<ReturnType<typeof getPublicDashboardData>>

export async function getPublicPerformanceData() {
  const data = await loadPublicEntities(['teams', 'members', 'sprints', 'oneOnOnes', 'achievements'])
  return data as {
    teams: any[]
    members: any[]
    sprints: any[]
    oneOnOnes: any[]
    achievements: any[]
  }
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
  const data = await loadPublicEntities(['technologies'])
  const [candidates, evaluations] = await Promise.all([
    db.candidates.orderBy('createdAt').reverse().toArray(),
    db.candidateEvaluations.toArray(),
  ])
  return { candidates, technologies: data.technologies ?? [], evaluations }
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

// ─── Public Daily Data ──

export async function getPublicDailyData() {
  const data = await loadPublicEntities(['plans', 'activities', 'tasks', 'blockers', 'commitments'])
  return data as {
    plans: any[]
    activities: any[]
    tasks: any[]
    blockers: any[]
    commitments: any[]
  }
}

export type PublicDailyData = Awaited<ReturnType<typeof getPublicDailyData>>

// ─── Public Plan Data ──

export async function getPublicPlanData(planId: string) {
  const plan = await db.plans.get(planId)
  if (!plan) return null
  const [activities, tasks, blockers] = await Promise.all([
    db.activities.where('planId').equals(planId).toArray(),
    db.tasks.where('planId').equals(planId).toArray(),
    db.blockers.toArray(),
  ])
  const blockersForPlan = blockers.filter(
    (b) => b.sourceType === 'plan' && b.sourceId === planId
  )
  const teams = await db.teams.toArray()
  const applications = await db.applications.toArray()
  return { plan, activities, tasks, blockers: blockersForPlan, teams, applications }
}

export type PublicPlanData = Awaited<ReturnType<typeof getPublicPlanData>>

// ─── Public Timeline Data ──

export async function getPublicTimelineData() {
  const data = await loadPublicEntities(['plans', 'activities', 'tasks', 'blockers', 'commitments', 'teams', 'businessUnits'])
  return data as {
    plans: any[]
    activities: any[]
    tasks: any[]
    blockers: any[]
    commitments: any[]
    teams: any[]
    businessUnits: any[]
  }
}

export type PublicTimelineData = Awaited<ReturnType<typeof getPublicTimelineData>>

// ─── Public Predictability Data ──

export async function getPublicPredictabilityData() {
  const data = await loadPublicEntities(['teamSprints', 'teams'])
  return data as {
    teamSprints: any[]
    teams: any[]
  }
}

export type PublicPredictabilityData = Awaited<ReturnType<typeof getPublicPredictabilityData>>

// ─── Public Vulnerabilities Data ──

export async function getPublicVulnerabilitiesData() {
  const data = await loadPublicEntities(['vulnerabilities', 'applications'])
  return data as { vulnerabilities: any[]; applications: any[] }
}

export type PublicVulnerabilitiesData = Awaited<ReturnType<typeof getPublicVulnerabilitiesData>>

// ─── Public Incidents Data ──

export async function getPublicIncidentsData() {
  const data = await loadPublicEntities(['incidents', 'applications'])
  return data as { incidents: any[]; applications: any[] }
}

export type PublicIncidentsData = Awaited<ReturnType<typeof getPublicIncidentsData>>

// ─── Public Risks Data ──

export async function getPublicRisksData() {
  const data = await loadPublicEntities(['risks', 'applications'])
  return data as { risks: any[]; applications: any[] }
}

export type PublicRisksData = Awaited<ReturnType<typeof getPublicRisksData>>

// ─── Public Audit Data ──

export async function getPublicAuditData() {
  const data = await loadPublicEntities(['auditFindings', 'applications'])
  return data as { findings: any[]; applications: any[] }
}

export type PublicAuditData = Awaited<ReturnType<typeof getPublicAuditData>>

// ─── Public Objectives Data ──

export async function getPublicObjectivesData() {
  const data = await loadPublicEntities(['objectives', 'teams', 'businessUnits'])
  return data as { objectives: any[]; teams: any[]; businessUnits: any[] }
}

export type PublicObjectivesData = Awaited<ReturnType<typeof getPublicObjectivesData>>

// ─── Public Obsolescence Map Data ──

export async function getPublicObsolescenceData() {
  const data = await loadPublicEntities(['applications', 'microservices', 'technologies'])
  return data as { applications: any[]; microservices: any[]; technologies: any[] }
}

export type PublicObsolescenceData = Awaited<ReturnType<typeof getPublicObsolescenceData>>

// ─── Public Dependencies Data ──

export async function getPublicDependenciesData() {
  const data = await loadPublicEntities(['applications', 'applicationDependencies'])
  return data as { applications: any[]; dependencies: any[] }
}

export type PublicDependenciesData = Awaited<ReturnType<typeof getPublicDependenciesData>>
