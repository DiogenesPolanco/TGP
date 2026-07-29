import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const hoisted = vi.hoisted(() => ({
  mockSyncTechnologies: vi.fn(),
  mockExportDatabase: vi.fn(),
  mockSaveBackupToStorage: vi.fn(),
  mockGetAzureConfig: vi.fn(),
  mockUploadBackupToAzure: vi.fn(),
  mockNotifyAlerts: vi.fn(),
  mockComputeMobileSnapshot: vi.fn(),
  mockUploadMobileSnapshot: vi.fn(),
  mockGetMobileSnapshotPassphrase: vi.fn(),
  mockHasMobileSnapshotPassphrase: vi.fn(),
}))

vi.mock('@/services/db/database', () => ({
  db: {
    vacationRecords: { toArray: vi.fn() },
    teams: { toArray: vi.fn() },
    technologies: { toArray: vi.fn(), filter: vi.fn() },
    applications: { toArray: vi.fn() },
    microservices: { toArray: vi.fn() },
    memberProfiles: { toArray: vi.fn() },
    commitments: { toArray: vi.fn(), filter: vi.fn() },
    plans: { toArray: vi.fn(), filter: vi.fn() },
    blockers: { filter: vi.fn() },
    activities: { filter: vi.fn() },
    deliverables: { filter: vi.fn() },
  },
}))

vi.mock('@/stores/appStore', () => ({
  useAppStore: {
    getState: vi.fn(),
  },
}))

vi.mock('@/services/sync/endoflifeSyncService', () => ({
  syncTechnologies: hoisted.mockSyncTechnologies,
}))

vi.mock('@/services/export/exportService', () => ({
  exportDatabase: hoisted.mockExportDatabase,
  saveBackupToStorage: hoisted.mockSaveBackupToStorage,
}))

vi.mock('@/services/backup/azureBackupService', async (importOriginal) => {
  const mod: any = await importOriginal()
  return {
    ...mod,
    getAzureConfig: hoisted.mockGetAzureConfig,
    uploadBackupToAzure: hoisted.mockUploadBackupToAzure,
  }
})

vi.mock('@/services/notifications/browserNotificationService', () => ({
  notifyAlerts: hoisted.mockNotifyAlerts,
}))

vi.mock('@/services/share/metricsSnapshotService', () => ({
  computeMobileSnapshot: hoisted.mockComputeMobileSnapshot,
  uploadMobileSnapshot: hoisted.mockUploadMobileSnapshot,
  getMobileSnapshotPassphrase: hoisted.mockGetMobileSnapshotPassphrase,
  hasMobileSnapshotPassphrase: hoisted.mockHasMobileSnapshotPassphrase,
}))

import {
  getDefaultSchedulerConfig,
  getSchedulerConfig,
  saveSchedulerConfig,
  getSchedulerState,
  runAutomatedChecks,
  executeNow,
  startAutomatedChecks,
  stopAutomatedChecks,
} from '../automatedChecksService'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  const emptyResolve = vi.fn().mockResolvedValue([])
  for (const key of Object.keys(db) as Array<keyof typeof db>) {
    const table = db[key] as any
    if (table?.toArray) table.toArray = emptyResolve
    if (table?.filter)
      table.filter = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
  }
})

afterEach(() => {
  stopAutomatedChecks()
})

describe('getDefaultSchedulerConfig', () => {
  it('returns default config', () => {
    expect(getDefaultSchedulerConfig()).toEqual({ time: '02:00', enabled: false })
  })
})

describe('getSchedulerConfig', () => {
  it('returns default when no config stored', () => {
    expect(getSchedulerConfig()).toEqual({ time: '02:00', enabled: false })
  })
  it('returns stored config', () => {
    localStorage.setItem('tgp-scheduler-config', JSON.stringify({ time: '08:00', enabled: true }))
    expect(getSchedulerConfig()).toEqual({ time: '08:00', enabled: true })
  })
  it('returns default for corrupted data', () => {
    localStorage.setItem('tgp-scheduler-config', 'invalid')
    expect(getSchedulerConfig()).toEqual({ time: '02:00', enabled: false })
  })
})

describe('saveSchedulerConfig', () => {
  it('saves config to localStorage', () => {
    saveSchedulerConfig({ time: '06:00', enabled: true })
    const stored = JSON.parse(localStorage.getItem('tgp-scheduler-config')!)
    expect(stored).toEqual({ time: '06:00', enabled: true })
  })
})

describe('getSchedulerState', () => {
  it('returns state with default config', () => {
    const state = getSchedulerState()
    expect(state.config).toEqual({ time: '02:00', enabled: false })
    expect(state.lastRun).toBe(0)
    expect(state.nextRun).toBeNull()
    expect(state.isRunning).toBe(false)
    expect(state.lastResult).toBeNull()
  })
  it('returns lastResult when stored', () => {
    localStorage.setItem(
      'tgp-scheduler-last-result',
      JSON.stringify({ success: true, message: 'ok', timestamp: '2026-01-01T00:00:00.000Z' }),
    )
    const state = getSchedulerState()
    expect(state.lastResult).toEqual({
      success: true,
      message: 'ok',
      timestamp: '2026-01-01T00:00:00.000Z',
    })
  })
  it('returns null lastResult on parse error', () => {
    localStorage.setItem('tgp-scheduler-last-result', 'bad')
    const state = getSchedulerState()
    expect(state.lastResult).toBeNull()
  })
})

describe('calcNextRun', () => {
  function nextRun(time: string, enabled: boolean, lastRun: number): number | null {
    localStorage.setItem('tgp-scheduler-config', JSON.stringify({ time, enabled }))
    if (lastRun > 0) localStorage.setItem('tgp-last-automated-check', String(lastRun))
    return getSchedulerState().nextRun
  }
  it('returns null when disabled', () => {
    expect(nextRun('02:00', false, 0)).toBeNull()
  })
  it('returns a future timestamp when enabled', () => {
    expect(nextRun('02:00', true, 0)).toBeGreaterThan(Date.now())
  })
})

describe('runAutomatedChecks', () => {
  it('runs all 11 checks returning empty', async () => {
    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })
    const result = await runAutomatedChecks()
    expect(result.totalChecks).toBe(11)
    expect(Array.isArray(result.alerts)).toBe(true)
  })
  it('handles when store is not ready', async () => {
    ;(useAppStore.getState as any).mockReturnValue(null)
    const result = await runAutomatedChecks()
    expect(result.totalChecks).toBe(11)
    expect(result.alerts).toEqual([])
  })
  it('sets lastRun timestamp', async () => {
    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })
    await runAutomatedChecks()
    const lastRun = parseInt(localStorage.getItem('tgp-last-automated-check') ?? '0', 10)
    expect(lastRun).toBeGreaterThan(0)
  })
  it('generates alerts for expired commitments, open blockers, overdue activities', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'))

    const pastDate = new Date('2026-06-01')

    ;(db.technologies as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.commitments as any).filter = vi.fn().mockReturnValue({
      toArray: vi
        .fn()
        .mockResolvedValue([
          { id: 'c1', title: 'Expired Commit', commitmentDate: pastDate, status: 'active' },
        ]),
    })
    ;(db.plans as any).filter = vi.fn().mockReturnValue({
      toArray: vi
        .fn()
        .mockResolvedValue([
          { id: 'p1', title: 'Overdue Plan', endDate: pastDate, status: 'active' },
        ]),
    })
    ;(db.blockers as any).filter = vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([
        { id: 'b1', title: 'Critical blocker', severity: 'critical', status: 'open' },
        { id: 'b2', title: 'Escalated blocker', severity: 'high', status: 'escalated' },
      ]),
    })
    ;(db.activities as any).filter = vi.fn().mockReturnValue({
      toArray: vi
        .fn()
        .mockResolvedValue([
          { id: 'a1', title: 'Late activity', dueDate: pastDate, status: 'in_progress' },
        ]),
    })
    ;(db.deliverables as any).filter = vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([
        { id: 'd1', title: 'Late deliverable', dueDate: pastDate, status: 'in_progress' },
        { id: 'd2', title: 'Completed', dueDate: pastDate, status: 'completed' },
      ]),
    })
    ;(db.technologies as any).filter = vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    })
    ;(db.applications as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.microservices as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.memberProfiles as any).toArray = vi.fn().mockResolvedValue([])

    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })

    vi.useRealTimers()

    const result = await runAutomatedChecks()
    expect(result.totalChecks).toBe(11)
    expect(result.alerts.length).toBeGreaterThan(0)
    expect(result.alerts.some((a) => a.message.includes('Compromiso vencido'))).toBe(true)
    expect(result.alerts.some((a) => a.message.includes('Plan vencido'))).toBe(true)
    expect(result.alerts.some((a) => a.message.includes('Bloqueo'))).toBe(true)
    expect(result.alerts.some((a) => a.message.includes('Actividad vencida'))).toBe(true)
    expect(result.alerts.some((a) => a.message.includes('Entregable vencido'))).toBe(true)
  })

  it('generates library vulnerability alerts', async () => {
    const vulnTechs = [
      {
        id: 't-vuln',
        name: 'lodash',
        version: '4.17.21',
        category: 'library',
        cveList: ['CVE-2024-001', 'CVE-2024-002'],
        supportStatus: 'eol',
        metadata: {},
      },
    ]
    const apps = [{ id: 'a1', name: 'App1', technologies: ['t-vuln'] }]

    ;(db.technologies as any).toArray = vi.fn().mockResolvedValue(vulnTechs)
    ;(db.technologies as any).filter = vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue(vulnTechs),
    })
    ;(db.applications as any).toArray = vi.fn().mockResolvedValue(apps)
    ;(db.microservices as any).toArray = vi.fn().mockResolvedValue([])
    // Return empty for other filter-based checks
    ;(db.commitments as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.plans as any).filter = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.blockers as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.activities as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.deliverables as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.memberProfiles as any).toArray = vi.fn().mockResolvedValue([])

    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })

    const result = await runAutomatedChecks()
    expect(result.alerts.some((a) => a.message.includes('CVE'))).toBe(true)
  })

  it('runs backup successfully', async () => {
    hoisted.mockExportDatabase.mockResolvedValue({
      tables: { applications: [{ id: '1' }], teams: [{ id: 'a' }] },
    })
    hoisted.mockSaveBackupToStorage.mockReturnValue(true)

    ;(db.technologies as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.commitments as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.plans as any).filter = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.blockers as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.activities as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.deliverables as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.technologies as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.applications as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.microservices as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.memberProfiles as any).toArray = vi.fn().mockResolvedValue([])

    // Enable scheduler to run backup
    localStorage.setItem('tgp-scheduler-config', JSON.stringify({ time: '02:00', enabled: true }))

    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })

    const result = await runAutomatedChecks()
    expect(result.alerts.some((a) => a.message.includes('Backup automático completado'))).toBe(true)
  })

  it('syncs mobile snapshot when passphrase is set', async () => {
    hoisted.mockComputeMobileSnapshot.mockResolvedValue({
      version: 1,
      updatedAt: '2026-07-01',
      applications: 5,
      thi: { score: 85 },
      alerts: [],
    })
    hoisted.mockUploadMobileSnapshot.mockResolvedValue({
      success: true,
      url: 'https://example.com/share',
    })
    hoisted.mockGetMobileSnapshotPassphrase.mockReturnValue('secret-key')
    hoisted.mockHasMobileSnapshotPassphrase.mockReturnValue(true)

    ;(db.technologies as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.commitments as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.plans as any).filter = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.blockers as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.activities as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.deliverables as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.technologies as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.applications as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.microservices as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.memberProfiles as any).toArray = vi.fn().mockResolvedValue([])

    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })

    const result = await runAutomatedChecks()
    expect(result.totalChecks).toBe(11)
    expect(result.alerts.some((a) => a.message.includes('Mobile snapshot'))).toBe(true)
  })

  it('handles mobile snapshot upload failure', async () => {
    hoisted.mockComputeMobileSnapshot.mockResolvedValue({
      version: 1,
      updatedAt: '2026-07-01',
      applications: 5,
      thi: { score: 70 },
      alerts: [{ type: 'warning', message: 'test' }],
    })
    hoisted.mockUploadMobileSnapshot.mockResolvedValue({ success: false, error: 'storage full' })
    hoisted.mockGetMobileSnapshotPassphrase.mockReturnValue('key')
    hoisted.mockHasMobileSnapshotPassphrase.mockReturnValue(true)

    ;(db.technologies as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.commitments as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.plans as any).filter = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.blockers as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.activities as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.deliverables as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.technologies as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.applications as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.microservices as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.memberProfiles as any).toArray = vi.fn().mockResolvedValue([])

    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })

    const result = await runAutomatedChecks()
    expect(result.alerts.some((a) => a.message.includes('Mobile snapshot falló'))).toBe(true)
  })

  it('triggers tech obsolescence check with EOL technologies', async () => {
    const eolTech = {
      id: 't-eol',
      name: 'jquery',
      version: '1.12',
      supportStatus: 'eol',
      cveList: [],
      metadata: {},
    }
    ;(db.vacationRecords as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.technologies as any).toArray = vi.fn().mockResolvedValue([eolTech])
    ;(db.technologies as any).filter = vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([eolTech]),
    })
    ;(db.applications as any).toArray = vi
      .fn()
      .mockResolvedValue([{ id: 'a1', name: 'App1', technologies: ['t-eol'] }])
    ;(db.microservices as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.memberProfiles as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.teams as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.commitments as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.plans as any).filter = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.blockers as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.activities as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.deliverables as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })

    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })

    const result = await runAutomatedChecks()
    expect(result.alerts.some((a) => a.message.includes('obsoleto'))).toBe(true)
  })

  it('detects active vacations', async () => {
    const today = new Date()
    const start = new Date(today.getTime() - 86400000)
    const end = new Date(today.getTime() + 86400000)

    ;(db.vacationRecords as any).toArray = vi
      .fn()
      .mockResolvedValue([
        { memberId: 'm1', startDate: start.toISOString(), endDate: end.toISOString() },
      ])
    ;(db.teams as any).toArray = vi
      .fn()
      .mockResolvedValue([{ members: [{ id: 'm1', displayName: 'Alice' }] }])
    ;(db.technologies as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.technologies as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.commitments as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.plans as any).filter = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.blockers as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.activities as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.deliverables as any).filter = vi
      .fn()
      .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    ;(db.applications as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.microservices as any).toArray = vi.fn().mockResolvedValue([])
    ;(db.memberProfiles as any).toArray = vi.fn().mockResolvedValue([])

    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })

    const result = await runAutomatedChecks()
    expect(result.alerts.some((a) => a.message.includes('vacaciones'))).toBe(true)
  })
})

describe('executeNow', () => {
  it('returns state after successful run', async () => {
    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })
    const state = await executeNow()
    expect(state.lastResult).not.toBeNull()
    expect(state.lastResult!.success).toBe(true)
  })
  it('captures run failure and stores error result', async () => {
    ;(db.vacationRecords as any).toArray = vi.fn().mockRejectedValue(new Error('db-down'))
    ;(useAppStore.getState as any).mockReturnValue({
      addNotification: vi.fn(),
      setAlerts: vi.fn(),
    })
    const state = await executeNow()
    expect(state.lastResult).not.toBeNull()
    expect(state.lastResult!.success).toBe(false)
  })
})

describe('scheduler lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'setInterval')
    vi.spyOn(globalThis, 'clearInterval')
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  it('startAutomatedChecks sets interval', () => {
    startAutomatedChecks()
    expect(setInterval).toHaveBeenCalled()
    stopAutomatedChecks()
  })
  it('does not double-start', () => {
    startAutomatedChecks()
    startAutomatedChecks()
    expect(setInterval).toHaveBeenCalledTimes(1)
    stopAutomatedChecks()
  })
  it('stopAutomatedChecks clears interval', () => {
    startAutomatedChecks()
    stopAutomatedChecks()
    expect(clearInterval).toHaveBeenCalled()
  })
  it('runs check on start when enabled and cold', () => {
    localStorage.setItem('tgp-scheduler-config', JSON.stringify({ time: '02:00', enabled: true }))
    startAutomatedChecks()
    stopAutomatedChecks()
  })
  it('skips immediate run when already run recently', () => {
    localStorage.setItem('tgp-scheduler-config', JSON.stringify({ time: '02:00', enabled: true }))
    localStorage.setItem('tgp-last-automated-check', String(Date.now()))
    startAutomatedChecks()
    stopAutomatedChecks()
  })

  it('restarts scheduler when config is saved while running', () => {
    vi.spyOn(globalThis, 'clearInterval')
    startAutomatedChecks()
    saveSchedulerConfig({ time: '04:00', enabled: false })
    expect(clearInterval).toHaveBeenCalled()
    stopAutomatedChecks()
  })
})
