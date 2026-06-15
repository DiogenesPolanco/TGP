import { db } from '@/services/db/database'

// ─── Snapshot type ──────────────────────────────────────────────────

export interface MobileSnapshot {
  version: number
  updatedAt: string
  thi: {
    score: number
    label: string
    scoreBreakdown: {
      delivery: number
      quality: number
      security: number
      availability: number
      obsolescence: number
      risk: number
      compliance: number
    }
  }
  incidents: {
    p1: number
    open: number
    total: number
  }
  blockers: {
    open: number
    critical: number
    list: { id: string; title: string; severity: string }[]
  }
  risks: {
    open: number
    high: number
    critical: number
    totalScore: number
  }
  plans: {
    active: number
    atRisk: number
    overdue: number
  }
  commitments: {
    overdue: number
    total: number
  }
  objectives: {
    total: number
    onTrack: number
    atRisk: number
    behind: number
    items: { id: string; title: string; progress: number; status: string }[]
  }
  alerts: {
    type: 'critical' | 'warning' | 'success' | 'info'
    message: string
  }[]
  vulnerabilities: {
    critical: number
    high: number
    total: number
  }
  applications: number
  teams: number
}

// ─── Snapshot builder ───────────────────────────────────────────────

export async function computeMobileSnapshot(): Promise<MobileSnapshot> {
  const now = new Date()

  const [
    incidents,
    blockers,
    risks,
    plans,
    commitments,
    objectives,
    vulnerabilities,
    applications,
    teams,
    technologies,
    auditFindings,
  ] = await Promise.all([
    db.incidents.toArray(),
    db.blockers.toArray(),
    db.risks.toArray(),
    db.plans.toArray(),
    db.commitments.toArray(),
    db.objectives.toArray(),
    db.vulnerabilities.toArray(),
    db.applications.toArray(),
    db.teams.toArray(),
    db.technologies.toArray(),
    db.auditFindings.toArray(),
  ])

  const openIncidents = incidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'closed'
  )
  const p1Incidents = incidents.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed'
  )

  const openBlockers = blockers.filter((b) => b.status === 'open' || b.status === 'escalated')
  const criticalBlockers = openBlockers.filter((b) => b.severity === 'critical')

  const openRisks = risks.filter((r) => r.status === 'open')
  const highRisks = openRisks.filter((r) => r.riskScore >= 10 && r.riskScore < 15)
  const criticalRisks = openRisks.filter((r) => r.riskScore >= 15)
  const totalRiskScore = openRisks.reduce((s, r) => s + r.riskScore, 0)

  const activePlans = plans.filter((p) => p.status !== 'completed' && p.status !== 'cancelled')
  const atRiskPlans = activePlans.filter((p) => p.health === 'red' || p.health === 'yellow')
  const overduePlans = activePlans.filter((p) => p.endDate < now)

  const openCommitments = commitments.filter(
    (c) => c.status !== 'fulfilled' && c.status !== 'cancelled'
  )
  const overdueCommitments = openCommitments.filter((c) => c.commitmentDate < now)

  const activeObjectives = objectives.filter(
    (o) => o.status === 'on_track' || o.status === 'at_risk' || o.status === 'behind' || o.status === 'not_started'
  )
  const onTrack = activeObjectives.filter((o) => o.status === 'on_track')
  const atRiskObjs = activeObjectives.filter((o) => o.status === 'at_risk')
  const behindObjs = activeObjectives.filter((o) => o.status === 'behind')

  const openVulns = vulnerabilities.filter((v) => v.status !== 'fixed')
  const criticalVulns = openVulns.filter((v) => v.severity === 'critical')
  const highVulns = openVulns.filter((v) => v.severity === 'high')

  // Derive alerts from computed data
  const alerts: MobileSnapshot['alerts'] = []
  if (p1Incidents.length > 0) {
    alerts.push({ type: 'critical', message: `${p1Incidents.length} incidente${p1Incidents.length > 1 ? 's' : ''} P1 activo${p1Incidents.length > 1 ? 's' : ''}` })
  }
  if (criticalBlockers.length > 0) {
    alerts.push({ type: 'critical', message: `${criticalBlockers.length} bloqueo${criticalBlockers.length > 1 ? 's' : ''} crítico${criticalBlockers.length > 1 ? 's' : ''} sin resolver` })
  }
  if (criticalVulns.length > 0) {
    alerts.push({ type: 'critical', message: `${criticalVulns.length} vulnerabilidad${criticalVulns.length > 1 ? 'es' : ''} crítica${criticalVulns.length > 1 ? 's' : ''} sin corregir` })
  }
  if (criticalRisks.length > 0) {
    alerts.push({ type: 'warning', message: `${criticalRisks.length} riesgo${criticalRisks.length > 1 ? 's' : ''} crítico${criticalRisks.length > 1 ? 's' : ''} sin mitigar` })
  }
  if (overdueCommitments.length > 0) {
    alerts.push({ type: 'warning', message: `${overdueCommitments.length} compromiso${overdueCommitments.length > 1 ? 's' : ''} vencido${overdueCommitments.length > 1 ? 's' : ''}` })
  }
  if (atRiskPlans.length > 0) {
    alerts.push({ type: 'warning', message: `${atRiskPlans.length} plan${atRiskPlans.length > 1 ? 'es' : ''} en riesgo${atRiskPlans.length > 1 ? 's' : ''}` })
  }

  // THI calculation (same 7-dimension formula as desktop dashboard)
  const deliveryScore = teams.length === 0 ? 50
    : Math.round(
        teams.reduce((s, t) => {
          const m = t.currentMetrics
          if (!m) return s + 50
          return s + (Math.min(m.velocity / 50, 1) * 100 + Math.max(0, 100 - (m.leadTimeHours / 168) * 100) + Math.max(0, 100 - m.changeFailureRate * 5) + Math.max(0, 100 - (m.mttrHours / 24) * 100)) / 4
        }, 0) / teams.length
      )

  const qualityScore = 75

  const criticalHighOpen = openVulns.filter((v) => v.severity === 'critical' || v.severity === 'high').length
  const securityScore = applications.length === 0 ? 100 : Math.max(0, 100 - Math.min(criticalHighOpen * 5, 80))

  const totalDowntime = incidents.filter((i) => i.status === 'resolved').reduce((s, i) => s + (i.downtimeMinutes ?? 0), 0)
  const availabilityScore = applications.length === 0 ? 100 : Math.max(0, 100 - Math.min(totalDowntime / 60, 50))

  const usedTechIds = new Set<string>()
  for (const app of applications) for (const tId of app.technologies ?? []) usedTechIds.add(tId)
  const usedTechs = technologies.filter((t) => usedTechIds.has(t.id))
  const eolTechs = usedTechs.filter((t) => t.supportStatus === 'eol')
  const obsolescenceScore = usedTechs.length === 0 ? 100 : Math.round((1 - eolTechs.length / usedTechs.length) * 100)

  const activeRiskScore = openRisks.reduce((s, r) => s + r.riskScore, 0)
  const riskDimensionScore = applications.length === 0 ? 100 : Math.max(0, 100 - Math.min(activeRiskScore / 5, 80))

  const closedOnTime = auditFindings.filter((f) =>
    (f.status === 'closed' || f.status === 'resolved') && new Date(f.dueDate) >= now
  ).length
  const complianceScore = auditFindings.length === 0 ? 100 : Math.round((closedOnTime / auditFindings.length) * 100)

  const overallScore = Math.round(
    (deliveryScore * 20 + qualityScore * 15 + securityScore * 20 + availabilityScore * 15 + obsolescenceScore * 10 + riskDimensionScore * 10 + complianceScore * 10) / 100
  )

  const thiLabel = overallScore >= 90 ? 'Excelente' : overallScore >= 70 ? 'Saludable' : overallScore >= 50 ? 'Regular' : overallScore >= 30 ? 'En Riesgo' : 'Crítico'

  const snapshot: MobileSnapshot = {
    version: 1,
    updatedAt: now.toISOString(),
    thi: {
      score: overallScore,
      label: thiLabel,
      scoreBreakdown: {
        delivery: deliveryScore,
        quality: qualityScore,
        security: securityScore,
        availability: availabilityScore,
        obsolescence: obsolescenceScore,
        risk: riskDimensionScore,
        compliance: complianceScore,
      },
    },
    incidents: { p1: p1Incidents.length, open: openIncidents.length, total: incidents.length },
    blockers: {
      open: openBlockers.length, critical: criticalBlockers.length,
      list: criticalBlockers.slice(0, 10).map((b) => ({ id: b.id, title: b.title, severity: b.severity })),
    },
    risks: { open: openRisks.length, high: highRisks.length, critical: criticalRisks.length, totalScore: totalRiskScore },
    plans: { active: activePlans.length, atRisk: atRiskPlans.length, overdue: overduePlans.length },
    commitments: { overdue: overdueCommitments.length, total: commitments.length },
    objectives: {
      total: activeObjectives.length, onTrack: onTrack.length, atRisk: atRiskObjs.length, behind: behindObjs.length,
      items: activeObjectives.slice(0, 10).map((o) => ({ id: o.id, title: o.title, progress: o.progress, status: o.status })),
    },
    alerts,
    vulnerabilities: { critical: criticalVulns.length, high: highVulns.length, total: openVulns.length },
    applications: applications.length,
    teams: teams.length,
  }

  return snapshot
}

// ─── Upload snapshot to Azure ─────────────────────────────────────

const BLOB_NAME = 'mobile-snapshot.json'
const MOBILE_SNAPSHOT_KEY = 'tgp-mobile-snapshot-info'

export function getStoredSnapshotInfo(): {
  sasUrl: string
  container: string
  uploadedAt: string
} | null {
  try {
    const raw = localStorage.getItem(MOBILE_SNAPSHOT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function storeSnapshotInfo(sasUrl: string, container: string) {
  localStorage.setItem(MOBILE_SNAPSHOT_KEY, JSON.stringify({
    sasUrl, container, uploadedAt: new Date().toISOString(),
  }))
}

export async function uploadMobileSnapshot(
  snapshot: MobileSnapshot,
  passphrase: string
): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    const { encryptData } = await import('@/services/share/encryptionService')
    const encrypted = await encryptData(snapshot, passphrase)

    const { getShareAzureConfig, getAzureBackupConfig } = await import('@/services/share/azureShareService')
    const config = getShareAzureConfig() ?? getAzureBackupConfig()
    if (!config?.sasUrl || !config.containerName) {
      return { success: false, error: 'Azure no configurado' }
    }

    const qi = config.sasUrl.indexOf('?')
    const params = qi >= 0 ? config.sasUrl.substring(qi) : ''
    const base = qi >= 0 ? config.sasUrl.substring(0, qi) : config.sasUrl
    const u = new URL(base)
    const blobUrl = `${u.protocol}//${u.hostname}/${config.containerName}/${BLOB_NAME}${params}`

    const resp = await fetch(blobUrl, {
      method: 'PUT',
      body: JSON.stringify(encrypted),
      headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'application/json' },
    })

    if (!resp.ok) {
      return { success: false, error: `HTTP ${resp.status}: ${resp.statusText}` }
    }

    // Store info for generating share URLs
    storeSnapshotInfo(config.sasUrl, config.containerName)

    // Generate share URL with Azure info embedded in hash
    const hashData = JSON.stringify({ s: config.sasUrl, c: config.containerName, f: BLOB_NAME })
    const encodedHash = btoa(encodeURIComponent(hashData))
    const shareUrl = `/mobile/dashboard#${encodedHash}`

    return { success: true, url: shareUrl }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─── Download snapshot using URL hash fragment ─────────────────────

export interface MobileSnapshotManifest {
  s: string  // sasUrl
  c: string  // container
  f: string  // filename
}

export function parseManifestFromHash(hash: string): MobileSnapshotManifest | null {
  try {
    const raw = hash.replace(/^#/, '')
    if (!raw) return null
    const decoded = JSON.parse(decodeURIComponent(atob(raw)))
    if (decoded && typeof decoded.s === 'string' && typeof decoded.c === 'string' && typeof decoded.f === 'string') {
      return decoded as MobileSnapshotManifest
    }
    return null
  } catch {
    return null
  }
}

export async function downloadSnapshotFromManifest(manifest: MobileSnapshotManifest): Promise<unknown | null> {
  try {
    const qi = manifest.s.indexOf('?')
    const params = qi >= 0 ? manifest.s.substring(qi) : ''
    const base = qi >= 0 ? manifest.s.substring(0, qi) : manifest.s
    const u = new URL(base)
    const blobUrl = `${u.protocol}//${u.hostname}/${manifest.c}/${manifest.f}${params}`

    const resp = await fetch(blobUrl)
    if (!resp.ok) return null
    return await resp.json()
  } catch {
    return null
  }
}

// ─── Caching last snapshot locally ────────────────────────────────

const CACHED_SNAPSHOT_KEY = 'tgp-mobile-cached-snapshot'

export function getCachedMobileSnapshot(): MobileSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHED_SNAPSHOT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as MobileSnapshot
  } catch { return null }
}

export function setCachedMobileSnapshot(snapshot: MobileSnapshot): void {
  try { localStorage.setItem(CACHED_SNAPSHOT_KEY, JSON.stringify(snapshot)) } catch { /* noop */ }
}

export function clearCachedMobileSnapshot(): void {
  localStorage.removeItem(CACHED_SNAPSHOT_KEY)
}

// ─── Passphrase management (desktop only) ──────────────────────────

const MOBILE_SNAPSHOT_PASSPHRASE_KEY = 'tgp-mobile-snapshot-passphrase'

export function getMobileSnapshotPassphrase(): string {
  try { return localStorage.getItem(MOBILE_SNAPSHOT_PASSPHRASE_KEY) ?? '' } catch { return '' }
}
export function setMobileSnapshotPassphrase(passphrase: string): void {
  localStorage.setItem(MOBILE_SNAPSHOT_PASSPHRASE_KEY, passphrase)
}
export function hasMobileSnapshotPassphrase(): boolean {
  return getMobileSnapshotPassphrase().length >= 4
}
