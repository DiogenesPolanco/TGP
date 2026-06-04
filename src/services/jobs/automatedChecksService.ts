import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { syncTechnologies } from '@/services/sync/endoflifeSyncService'
import { exportDatabase, saveBackupToStorage } from '@/services/export/exportService'
import type { DashboardAlert } from '@/stores/appStore'

const STORAGE_KEY = 'tgp-last-automated-check'

function getLastRun(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10)
  } catch {
    return 0
  }
}

function setLastRun() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch { /* noop */ }
}

function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ─── Checks ───────────────────────────────────────────────────────────

async function checkVacations(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = []
  const records = await db.vacationRecords.toArray()
  const now = today()

  for (const r of records) {
    const start = new Date(r.startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(r.endDate)
    end.setHours(23, 59, 59, 999)

    if (now >= start && now <= end) {
      // Look up the member name across teams
      const teams = await db.teams.toArray()
      let memberName = ''
      for (const t of teams) {
        const m = t.members.find((m) => m.id === r.memberId)
        if (m) { memberName = m.displayName; break }
      }
      const label = memberName || r.memberId.slice(0, 8)
      alerts.push({
        type: 'info',
        message: `${label} está de vacaciones (regresa el ${formatDate(end)})`,
      })
    }
  }
  return alerts
}

async function checkTechObsolescence(): Promise<DashboardAlert[]> {
  // Run sync first
  await syncTechnologies()

  // Collect all technology IDs currently in use across the system
  const usedIds = new Set<string>()
  const [apps, microservices, profiles] = await Promise.all([
    db.applications.toArray(),
    db.microservices.toArray(),
    db.memberProfiles.toArray(),
  ])

  for (const app of apps) for (const id of app.technologies) usedIds.add(id)
  for (const ms of microservices) for (const id of ms.technologies) usedIds.add(id)
  for (const p of profiles) for (const id of p.technologies) usedIds.add(id)

  // Only alert for technologies that are actually in use and are EOL
  const eolTechs = await db.technologies
    .filter((t) => usedIds.has(t.id) && t.supportStatus === 'eol')
    .toArray()

  return eolTechs.map((tech) => ({
    type: 'critical' as const,
    message: `${tech.name} v${tech.version} está obsoleto (EOL) y está siendo usado en el sistema`,
  }))
}

async function checkExpiredCommitments(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = []
  const now = new Date()
  const items = await db.commitments
    .filter((c) => {
      if (c.status === 'fulfilled' || c.status === 'cancelled') return false
      return c.commitmentDate < now
    })
    .toArray()

  for (const c of items) {
    alerts.push({
      type: 'warning',
      message: `Compromiso vencido: "${c.title}" — debía cumplirse el ${formatDate(c.commitmentDate)}`,
    })
  }
  return alerts
}

async function checkExpiredPlans(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = []
  const now = new Date()
  const items = await db.plans
    .filter((p) => {
      if (p.status === 'completed' || p.status === 'cancelled') return false
      return p.endDate < now
    })
    .toArray()

  for (const p of items) {
    alerts.push({
      type: 'warning',
      message: `Plan vencido: "${p.title}" — fecha fin fue el ${formatDate(p.endDate)}`,
    })
  }
  return alerts
}

async function checkOpenBlockers(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = []
  const items = await db.blockers
    .filter((b) => b.status === 'open' || b.status === 'escalated')
    .toArray()

  for (const b of items) {
    const severityLabel = b.severity === 'critical' ? 'Crítico' : b.severity === 'high' ? 'Alto' : b.severity
    alerts.push({
      type: b.severity === 'critical' || b.severity === 'high' ? 'critical' : 'warning',
      message: `Bloqueo ${severityLabel}: "${b.title}" — ${b.status === 'escalated' ? 'escalado' : 'sin resolver'}`,
    })
  }
  return alerts
}

async function checkOverdueActivities(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = []
  const now = new Date()
  const items = await db.activities
    .filter((a) => {
      if (a.status === 'completed' || a.status === 'cancelled') return false
      if (!a.dueDate) return false
      return a.dueDate < now
    })
    .toArray()

  for (const a of items) {
    alerts.push({
      type: 'warning',
      message: `Actividad vencida: "${a.title}" — vencía el ${formatDate(a.dueDate!)}`,
    })
  }
  return alerts
}

async function checkOverdueDeliverables(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = []
  const now = new Date()
  const items = await db.deliverables
    .filter((d) => {
      if (d.status === 'completed' || d.status === 'cancelled') return false
      if (!d.dueDate) return false
      return d.dueDate < now
    })
    .toArray()

  for (const d of items) {
    alerts.push({
      type: 'warning',
      message: `Entregable vencido: "${d.title}" — debía entregarse el ${formatDate(d.dueDate!)}`,
    })
  }
  return alerts
}

// ─── Runner ──────────────────────────────────────────────────────────

async function runBackup(): Promise<DashboardAlert[]> {
  try {
    const backup = await exportDatabase()
    const saved = saveBackupToStorage(backup)
    if (saved) {
      return [{
        type: 'success',
        message: `Backup automático completado — ${Object.keys(backup.tables).length} tablas, ${Object.values(backup.tables).reduce((s, t) => s + t.length, 0)} registros`,
      }]
    }
    return [{
      type: 'warning',
      message: 'Backup automático no pudo guardarse (espacio insuficiente)',
    }]
  } catch (err) {
    return [{
      type: 'warning',
      message: `Error en backup automático: ${err instanceof Error ? err.message : String(err)}`,
    }]
  }
}

export async function runAutomatedChecks(): Promise<{
  alerts: DashboardAlert[]
  totalChecks: number
}> {
  const checks = await Promise.all([
    checkVacations(),
    checkTechObsolescence(),
    checkExpiredCommitments(),
    checkExpiredPlans(),
    checkOpenBlockers(),
    checkOverdueActivities(),
    checkOverdueDeliverables(),
    runBackup(),
  ])

  const alerts = checks.flat()
  const totalChecks = 8

  // Fire toast notifications via the store
  const store = useAppStore.getState?.()
  if (store && alerts.length > 0) {
    for (const alert of alerts) {
      store.addNotification({
        type: alert.type === 'critical' ? 'error' : alert.type,
        message: alert.message,
        duration: 8000,
      })
    }
  }

  // Also merge into dashboard alerts (replaces previous run)
  const dashboard = useAppStore.getState?.()
  if (dashboard) {
    dashboard.setAlerts(alerts)
  }

  setLastRun()
  return { alerts, totalChecks }
}

// ─── Scheduler ────────────────────────────────────────────────────────

const INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

let intervalId: ReturnType<typeof setInterval> | null = null

export function startAutomatedChecks() {
  // Don't start if already running
  if (intervalId) return

  // Check if 24h have passed since last run
  const lastRun = getLastRun()
  const elapsed = Date.now() - lastRun
  if (elapsed >= INTERVAL_MS) {
    runAutomatedChecks().catch(console.error)
  }

  // Schedule recurring checks
  intervalId = setInterval(() => {
    runAutomatedChecks().catch(console.error)
  }, INTERVAL_MS)
}

export function stopAutomatedChecks() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
