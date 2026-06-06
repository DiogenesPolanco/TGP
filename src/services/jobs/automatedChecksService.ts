import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { syncTechnologies } from '@/services/sync/endoflifeSyncService'
import { exportDatabase, saveBackupToStorage } from '@/services/export/exportService'
import { getAzureConfig, uploadBackupToAzure } from '@/services/backup/azureBackupService'
import { notifyAlerts } from '@/services/notifications/browserNotificationService'
import type { DashboardAlert } from '@/stores/appStore'

const STORAGE_KEY = 'tgp-last-automated-check'
const SCHEDULER_CONFIG_KEY = 'tgp-scheduler-config'
const SCHEDULER_RESULT_KEY = 'tgp-scheduler-last-result'

export interface SchedulerConfig {
  time: string   // HH:MM formato 24h, ej: "02:00"
  enabled: boolean
}

export interface SchedulerState {
  config: SchedulerConfig
  lastRun: number
  nextRun: number | null
  isRunning: boolean
  lastResult: { success: boolean; message: string; timestamp: string } | null
}

export function getDefaultSchedulerConfig(): SchedulerConfig {
  return { time: '02:00', enabled: false }
}

export function getSchedulerConfig(): SchedulerConfig {
  try {
    const raw = localStorage.getItem(SCHEDULER_CONFIG_KEY)
    if (!raw) return getDefaultSchedulerConfig()
    return JSON.parse(raw) as SchedulerConfig
  } catch {
    return getDefaultSchedulerConfig()
  }
}

export function saveSchedulerConfig(config: SchedulerConfig): void {
  localStorage.setItem(SCHEDULER_CONFIG_KEY, JSON.stringify(config))
  restartScheduler()
}

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

function setLastResult(success: boolean, message: string) {
  try {
    localStorage.setItem(SCHEDULER_RESULT_KEY, JSON.stringify({
      success,
      message,
      timestamp: new Date().toISOString(),
    }))
  } catch { /* noop */ }
}

function getLastResult(): SchedulerState['lastResult'] {
  try {
    const raw = localStorage.getItem(SCHEDULER_RESULT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Calcula el próximo timestamp (epoch ms) en que debería ejecutarse
 * basado en la hora configurada y el último run.
 */
function calcNextRun(config: SchedulerConfig, lastRun: number): number | null {
  if (!config.enabled) return null

  const now = Date.now()
  const [hours, minutes] = config.time.split(':').map(Number)

  // Crear fecha para hoy a la hora configurada
  const today = new Date()
  today.setHours(hours, minutes, 0, 0)
  let candidate = today.getTime()

  // Si ya pasó la hora de hoy, candidate es mañana
  if (candidate <= now) {
    candidate += 24 * 60 * 60 * 1000
  }

  // Si el último run fue después del candidate, avanzar 24h
  if (lastRun > 0 && lastRun >= candidate) {
    candidate = lastRun + 24 * 60 * 60 * 1000
  }

  return candidate
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

async function checkLibraryVulnerabilities(): Promise<DashboardAlert[]> {
  const usedIds = new Set<string>()
  const [apps, microservices] = await Promise.all([
    db.applications.toArray(),
    db.microservices.toArray(),
  ])
  for (const app of apps) for (const id of app.technologies) usedIds.add(id)
  for (const ms of microservices) for (const id of ms.technologies) usedIds.add(id)

  const vulnerableLibs = await db.technologies
    .filter((t) => t.category === 'library' && t.cveList.length > 0 && usedIds.has(t.id))
    .toArray()

  const alerts: DashboardAlert[] = []

  for (const tech of vulnerableLibs) {
    const appNames: string[] = []
    for (const app of apps) {
      if (app.technologies.includes(tech.id)) appNames.push(app.name)
    }
    for (const ms of microservices) {
      if (ms.technologies.includes(tech.id)) appNames.push(`${ms.name} (ms)`)
    }

    const locations = appNames.slice(0, 3).join(', ')
    const suffix = appNames.length > 3 ? ` y ${appNames.length - 3} más` : ''

    alerts.push({
      type: tech.supportStatus === 'eol' ? 'critical' : 'warning',
      message: `${tech.name} v${tech.version} tiene ${tech.cveList.length} CVE y se usa en ${locations}${suffix}`,
    })
  }

  return alerts
}

// ─── Runner ──────────────────────────────────────────────────────────

async function runBackup(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = []
  // Only run backup if scheduler is explicitly enabled
  if (!getSchedulerConfig().enabled) return alerts
  try {
    const backup = await exportDatabase()
    const saved = saveBackupToStorage(backup)
    if (saved) {
      alerts.push({
        type: 'success',
        message: `Backup automático completado — ${Object.keys(backup.tables).length} tablas, ${Object.values(backup.tables).reduce((s, t) => s + t.length, 0)} registros`,
      })
    } else {
      alerts.push({
        type: 'warning',
        message: 'Backup automático no pudo guardarse (espacio insuficiente)',
      })
    }
  } catch (err) {
    alerts.push({
      type: 'warning',
      message: `Error en backup automático: ${err instanceof Error ? err.message : String(err)}`,
    })
  }

  if (getAzureConfig()) {
    try {
      const { blobName } = await uploadBackupToAzure()
      alerts.push({
        type: 'success',
        message: `Backup subido a Azure: ${blobName}`,
      })
    } catch (err) {
      alerts.push({
        type: 'warning',
        message: `Backup a Azure falló: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }

  return alerts
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
    checkLibraryVulnerabilities(),
    runBackup(),
  ])

  const alerts = checks.flat()
  const totalChecks = 9

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

  if (alerts.length > 0) {
    notifyAlerts(alerts)
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

const POLL_MS = 60_000  // revisar cada minuto si debe ejecutar
const MIN_INTERVAL_MS = 30 * 60 * 1000 // mínimo 30 min entre ejecuciones
const INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours default

let checkIntervalId: ReturnType<typeof setInterval> | null = null
let _isRunning = false

export function getSchedulerState(): SchedulerState {
  const config = getSchedulerConfig()
  const lastRun = getLastRun()
  return {
    config,
    lastRun,
    nextRun: calcNextRun(config, lastRun),
    isRunning: _isRunning,
    lastResult: getLastResult(),
  }
}

export async function executeNow(): Promise<SchedulerState> {
  if (_isRunning) return getSchedulerState()

  _isRunning = true
  try {
    const result = await runAutomatedChecks()
    const totalAlerts = result.alerts.length
    const successMsg = `Ejecución completada: ${result.totalChecks} verificaciones, ${totalAlerts} alertas`
    setLastResult(true, successMsg)
    return getSchedulerState()
  } catch (err) {
    const errMsg = `Error: ${err instanceof Error ? err.message : 'desconocido'}`
    setLastResult(false, errMsg)
    return getSchedulerState()
  } finally {
    _isRunning = false
  }
}

function shouldRunNow(config: SchedulerConfig, lastRun: number): boolean {
  if (!config.enabled) return false

  const now = Date.now()

  // No ejecutar si ya pasó muy poco tiempo
  if (lastRun > 0 && (now - lastRun) < MIN_INTERVAL_MS) return false

  const [hours, minutes] = config.time.split(':').map(Number)
  const currentDate = new Date()
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes()
  const targetMinutes = hours * 60 + minutes

  // Coincide la hora (con tolerancia de 2 min para no saltarse)
  const diff = Math.abs(currentMinutes - targetMinutes)
  if (diff > 2) return false

  // Si ya se ejecutó hoy a esta hora, no repetir
  if (lastRun > 0) {
    const lastRunDate = new Date(lastRun)
    const isToday = lastRunDate.toDateString() === currentDate.toDateString()
    const sameHour = lastRunDate.getHours() === hours
    if (isToday && sameHour) return false
  }

  return true
}

function checkAndRun() {
  const config = getSchedulerConfig()
  if (!config.enabled) return

  const lastRun = getLastRun()

  // Legacy: si no hay config de hora, usar el intervalo de 24h
  if (lastRun > 0 && (Date.now() - lastRun) >= INTERVAL_MS) {
    runAutomatedChecks().catch(console.error)
    return
  }

  // Por hora configurada
  if (shouldRunNow(config, lastRun)) {
    runAutomatedChecks().catch(console.error)
  }
}

export function startAutomatedChecks() {
  if (checkIntervalId) return

  const config = getSchedulerConfig()

  // Legacy: ejecutar inmediatamente si está habilitado y han pasado 24h
  if (config.enabled) {
    const lastRun = getLastRun()
    if (lastRun === 0 || (Date.now() - lastRun) >= INTERVAL_MS) {
      runAutomatedChecks().catch(console.error)
    }
  }

  // Polling cada minuto para verificar hora programada
  checkIntervalId = setInterval(checkAndRun, POLL_MS)
}

function restartScheduler() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId)
    checkIntervalId = null
  }
  startAutomatedChecks()
}

export function stopAutomatedChecks() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId)
    checkIntervalId = null
  }
}
