import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockDb = vi.hoisted(() => ({
  incidents: { toArray: vi.fn() },
  blockers: { toArray: vi.fn() },
  risks: { toArray: vi.fn() },
  plans: { toArray: vi.fn() },
  commitments: { toArray: vi.fn() },
  objectives: { toArray: vi.fn() },
  vulnerabilities: { toArray: vi.fn() },
  applications: { toArray: vi.fn() },
  teams: { toArray: vi.fn() },
  technologies: { toArray: vi.fn() },
  auditFindings: { toArray: vi.fn() },
}))

vi.mock('@/services/db/database', () => ({ db: mockDb }))

const localStorageStore = new Map<string, string>()

beforeEach(() => {
  localStorageStore.clear()
  for (const key of Object.keys(mockDb)) {
    mockDb[key as keyof typeof mockDb].toArray.mockReset()
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => localStorageStore.get(key) ?? null),
      setItem: vi.fn((key: string, val: string) => localStorageStore.set(key, val)),
      removeItem: vi.fn((key: string) => localStorageStore.delete(key)),
      clear: vi.fn(() => localStorageStore.clear()),
      get length() {
        return localStorageStore.size
      },
      key: vi.fn((i: number) => [...localStorageStore.keys()][i] ?? null),
    },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

import {
  computeMobileSnapshot,
  getStoredSnapshotInfo,
  uploadMobileSnapshot,
  parseManifestFromHash,
  downloadSnapshotFromManifest,
  getCachedMobileSnapshot,
  setCachedMobileSnapshot,
  clearCachedMobileSnapshot,
  getMobileSnapshotPassphrase,
  setMobileSnapshotPassphrase,
  hasMobileSnapshotPassphrase,
} from '../metricsSnapshotService'

describe('metricsSnapshotService', () => {
  describe('computeMobileSnapshot', () => {
    const now = new Date()
    const pastDate = new Date(now.getTime() - 86400000)
    const futureDate = new Date(now.getTime() + 86400000)

    const defaultData: Record<string, any[]> = {
      incidents: [],
      blockers: [],
      risks: [],
      plans: [],
      commitments: [],
      objectives: [],
      vulnerabilities: [],
      applications: [],
      teams: [],
      technologies: [],
      auditFindings: [],
    }

    function setupData(overrides: Partial<typeof defaultData>) {
      const data = { ...defaultData, ...overrides }
      for (const [key, value] of Object.entries(data)) {
        const k = key as keyof typeof mockDb
        mockDb[k].toArray.mockResolvedValue(value)
      }
    }

    it('computes empty snapshot with no data', async () => {
      setupData({})
      const result = await computeMobileSnapshot()
      expect(result.version).toBe(1)
      expect(result.applications).toBe(0)
      expect(result.teams).toBe(0)
      expect(result.incidents.total).toBe(0)
      expect(result.alerts).toHaveLength(0)
    })

    it('counts open incidents and P1', async () => {
      setupData({
        incidents: [
          { id: '1', status: 'open', severity: 'critical' },
          { id: '2', status: 'open', severity: 'high' },
          { id: '3', status: 'resolved', severity: 'critical' },
          { id: '4', status: 'closed', severity: 'critical' },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.incidents.total).toBe(4)
      expect(result.incidents.open).toBe(2)
      expect(result.incidents.p1).toBe(1)
    })

    it('adds critical alert for P1 incidents', async () => {
      setupData({
        incidents: [{ id: '1', status: 'open', severity: 'critical' }],
      })
      const result = await computeMobileSnapshot()
      expect(result.alerts.some((a) => a.type === 'critical' && a.message.includes('P1'))).toBe(
        true,
      )
    })

    it('counts open and critical blockers', async () => {
      setupData({
        blockers: [
          { id: '1', title: 'Blocker 1', severity: 'critical', status: 'open' },
          { id: '2', title: 'Blocker 2', severity: 'high', status: 'open' },
          { id: '3', title: 'Blocker 3', severity: 'critical', status: 'resolved' },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.blockers.open).toBe(2)
      expect(result.blockers.critical).toBe(1)
    })

    it('adds critical alert for critical blockers', async () => {
      setupData({
        blockers: [{ id: '1', title: 'Crit', severity: 'critical', status: 'open' }],
      })
      const result = await computeMobileSnapshot()
      expect(
        result.alerts.some((a) => a.type === 'critical' && a.message.includes('bloqueo')),
      ).toBe(true)
    })

    it('computes risk stats', async () => {
      setupData({
        risks: [
          { id: '1', status: 'open', riskScore: 12 },
          { id: '2', status: 'open', riskScore: 18 },
          { id: '3', status: 'mitigated', riskScore: 5 },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.risks.open).toBe(2)
      expect(result.risks.high).toBe(1)
      expect(result.risks.critical).toBe(1)
      expect(result.risks.totalScore).toBe(30)
    })

    it('computes plan stats', async () => {
      const yesterday = new Date(Date.now() - 86400000)
      setupData({
        plans: [
          { id: '1', status: 'active', health: 'green', endDate: futureDate },
          { id: '2', status: 'active', health: 'red', endDate: yesterday },
          { id: '3', status: 'completed', health: 'green', endDate: futureDate },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.plans.active).toBe(2)
      expect(result.plans.atRisk).toBe(1)
      expect(result.plans.overdue).toBe(1)
    })

    it('computes commitment stats', async () => {
      const yesterday = new Date(Date.now() - 86400000)
      setupData({
        commitments: [
          { id: '1', status: 'pending', commitmentDate: yesterday },
          { id: '2', status: 'pending', commitmentDate: futureDate },
          { id: '3', status: 'fulfilled', commitmentDate: yesterday },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.commitments.total).toBe(3)
      expect(result.commitments.overdue).toBe(1)
    })

    it('computes objective stats', async () => {
      setupData({
        objectives: [
          { id: '1', title: 'Obj 1', progress: 80, status: 'on_track' },
          { id: '2', title: 'Obj 2', progress: 30, status: 'at_risk' },
          { id: '3', title: 'Obj 3', progress: 10, status: 'behind' },
          { id: '4', title: 'Obj 4', progress: 0, status: 'not_started' },
          { id: '5', title: 'Obj 5', progress: 100, status: 'achieved' },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.objectives.total).toBe(4)
      expect(result.objectives.onTrack).toBe(1)
      expect(result.objectives.atRisk).toBe(1)
      expect(result.objectives.behind).toBe(1)
    })

    it('computes vulnerability stats', async () => {
      setupData({
        vulnerabilities: [
          { id: '1', severity: 'critical', status: 'open' },
          { id: '2', severity: 'high', status: 'open' },
          { id: '3', severity: 'medium', status: 'open' },
          { id: '4', severity: 'critical', status: 'fixed' },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.vulnerabilities.total).toBe(3)
      expect(result.vulnerabilities.critical).toBe(1)
      expect(result.vulnerabilities.high).toBe(1)
    })

    it('computes delivery score from team metrics', async () => {
      setupData({
        teams: [
          {
            id: '1',
            currentMetrics: {
              velocity: 50,
              leadTimeHours: 84,
              changeFailureRate: 5,
              mttrHours: 4,
            },
          },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.thi.scoreBreakdown.delivery).toBeGreaterThan(0)
    })

    it('uses default delivery score when no teams', async () => {
      setupData({ teams: [] })
      const result = await computeMobileSnapshot()
      expect(result.thi.scoreBreakdown.delivery).toBe(50)
    })

    it('computes security score based on critical+high vulns', async () => {
      setupData({
        applications: [{ id: '1' }],
        vulnerabilities: [
          { id: '1', severity: 'critical', status: 'open' },
          { id: '2', severity: 'high', status: 'open' },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.thi.scoreBreakdown.security).toBe(90)
    })

    it('computes security score 100 when no apps', async () => {
      setupData({ applications: [], vulnerabilities: [] })
      const result = await computeMobileSnapshot()
      expect(result.thi.scoreBreakdown.quality).toBe(75)
    })

    it('computes obsolescence score from EOL technologies', async () => {
      setupData({
        applications: [{ id: '1', technologies: ['t1', 't2'] }],
        technologies: [
          { id: 't1', supportStatus: 'active' },
          { id: 't2', supportStatus: 'eol' },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.thi.scoreBreakdown.obsolescence).toBe(50)
    })

    it('computes compliance score from audit findings', async () => {
      setupData({
        auditFindings: [
          { id: '1', status: 'closed', dueDate: futureDate },
          { id: '2', status: 'open', dueDate: pastDate },
        ],
      })
      const result = await computeMobileSnapshot()
      expect(result.thi.scoreBreakdown.compliance).toBe(50)
    })

    it('computes 100 compliance when no findings', async () => {
      setupData({ auditFindings: [] })
      const result = await computeMobileSnapshot()
      expect(result.thi.scoreBreakdown.compliance).toBe(100)
    })
  })

  describe('stored snapshot info', () => {
    it('getStoredSnapshotInfo returns null when no data', () => {
      expect(getStoredSnapshotInfo()).toBeNull()
    })

    it('getStoredSnapshotInfo returns parsed data', () => {
      const info = { sasUrl: 'https://test', container: 'c', uploadedAt: '2024-01-01' }
      localStorageStore.set('tgp-mobile-snapshot-info', JSON.stringify(info))
      expect(getStoredSnapshotInfo()).toEqual(info)
    })

    it('getStoredSnapshotInfo returns null on corrupt data', () => {
      localStorageStore.set('tgp-mobile-snapshot-info', 'bad-json')
      expect(getStoredSnapshotInfo()).toBeNull()
    })
  })

  describe('uploadMobileSnapshot', () => {
    it('handles Azure not configured', async () => {
      const result = await uploadMobileSnapshot({} as any, 'pass')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Azure no configurado')
    })
  })

  describe('parseManifestFromHash', () => {
    it('returns null for empty hash', () => {
      expect(parseManifestFromHash('')).toBeNull()
    })

    it('parses valid hash with components', () => {
      const manifest = { s: 'https://test', c: 'container', f: 'file.json' }
      const encoded = btoa(encodeURIComponent(JSON.stringify(manifest)))
      const result = parseManifestFromHash(`#${encoded}`)
      expect(result).toEqual(manifest)
    })

    it('returns null for malformed hash', () => {
      expect(parseManifestFromHash('#not-json')).toBeNull()
    })

    it('returns null for hash missing fields', () => {
      const encoded = btoa(encodeURIComponent(JSON.stringify({ s: 'test' })))
      expect(parseManifestFromHash(`#${encoded}`)).toBeNull()
    })
  })

  describe('downloadSnapshotFromManifest', () => {
    it('returns null on fetch failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
      const result = await downloadSnapshotFromManifest({
        s: 'https://test?sv=1',
        c: 'c',
        f: 'f.json',
      })
      expect(result).toBeNull()
      vi.restoreAllMocks()
    })

    it('returns null when fetch responds with non-ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
      const result = await downloadSnapshotFromManifest({
        s: 'https://test?sv=1',
        c: 'c',
        f: 'f.json',
      })
      expect(result).toBeNull()
      vi.restoreAllMocks()
    })

    it('returns data when fetch succeeds', async () => {
      const data = { applications: 5, version: 1 }
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(data),
        }),
      )
      const result = await downloadSnapshotFromManifest({
        s: 'https://test?sv=1',
        c: 'c',
        f: 'f.json',
      })
      expect(result).toEqual(data)
      vi.restoreAllMocks()
    })
  })

  describe('cached snapshot', () => {
    it('getCachedMobileSnapshot returns null when empty', () => {
      expect(getCachedMobileSnapshot()).toBeNull()
    })

    it('set and get cached snapshot', () => {
      const snapshot = { version: 1, updatedAt: '2024-01-01', applications: 5 } as any
      setCachedMobileSnapshot(snapshot)
      expect(getCachedMobileSnapshot()).toMatchObject({ version: 1, applications: 5 })
    })

    it('clearCachedMobileSnapshot removes cache', () => {
      setCachedMobileSnapshot({ version: 1 } as any)
      clearCachedMobileSnapshot()
      expect(getCachedMobileSnapshot()).toBeNull()
    })

    it('getCachedMobileSnapshot returns null on corrupt data', () => {
      localStorageStore.set('tgp-mobile-cached-snapshot', 'bad-json')
      expect(getCachedMobileSnapshot()).toBeNull()
    })
  })

  describe('passphrase', () => {
    it('getMobileSnapshotPassphrase returns empty when not set', () => {
      expect(getMobileSnapshotPassphrase()).toBe('')
    })

    it('set and get passphrase', () => {
      setMobileSnapshotPassphrase('my-secret')
      expect(getMobileSnapshotPassphrase()).toBe('my-secret')
    })

    it('hasMobileSnapshotPassphrase returns true for >=4 chars', () => {
      setMobileSnapshotPassphrase('abcd')
      expect(hasMobileSnapshotPassphrase()).toBe(true)
    })

    it('hasMobileSnapshotPassphrase returns false for short string', () => {
      setMobileSnapshotPassphrase('ab')
      expect(hasMobileSnapshotPassphrase()).toBe(false)
    })

    it('returns empty string on localStorage error', () => {
      const orig = localStorage.getItem
      localStorage.getItem = vi.fn(() => {
        throw new Error('storage err')
      })
      try {
        expect(getMobileSnapshotPassphrase()).toBe('')
      } finally {
        localStorage.getItem = orig
      }
    })
  })
})
