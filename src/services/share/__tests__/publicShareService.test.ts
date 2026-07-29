import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/share/azureShareService', () => ({
  getShareAzureConfig: vi.fn(),
  uploadShareToAzure: vi.fn(),
  buildManifestString: vi.fn(),
}))

vi.mock('@/services/backup/azureBackupService', () => ({
  getAzureConfig: vi.fn(),
}))
import {
  isLinkInAzure,
  getShareInfo,
  getShareType,
  getSharedLinksList,
  revokeShareLink,
  getLinkExpiry,
  isValidShareHash,
  logShareAccess,
  getShareAccessLog,
  loadPublicEntities,
  createShareLink,
  isShareValid,
  getPublicDashboardData,
  getPublicPerformanceData,
  getPublicMemberData,
  getPublicRecruitmentData,
  getPublicDailyData,
  getPublicPlanData,
  getPublicTimelineData,
  getPublicPredictabilityData,
  getPublicVulnerabilitiesData,
  getPublicIncidentsData,
  getPublicRisksData,
  getPublicAuditData,
  getPublicObjectivesData,
  getPublicObsolescenceData,
  getPublicDependenciesData,
  fetchAzureShareData,
} from '../publicShareService'
import type { ShareType } from '../publicShareService'
import { db } from '@/services/db/database'

const SHARED_LINKS_KEY = 'tgp-shared-links'
const AZURE_LINKS_KEY = 'tgp-azure-links'
const ACCESS_LOG_KEY = 'tgp-share-access-log'

const mockDbFns = vi.hoisted(() => {
  // Fully chainable Dexie mock — covers .where().equals().toArray()
  // and .orderBy().reverse().limit().toArray()
  function chainable() {
    const c = {
      equals: vi.fn(),
      reverse: vi.fn(),
      limit: vi.fn(),
      toArray: vi.fn().mockResolvedValue([]),
    }
    c.equals.mockReturnValue(c)
    c.reverse.mockReturnValue(c)
    c.limit.mockReturnValue(c)
    return { fn: vi.fn().mockReturnValue(c), chain: c }
  }
  return {
    actWhere: chainable(),
    taskWhere: chainable(),
    sprintWhere: chainable(),
    oneOnOneWhere: chainable(),
    achWhere: chainable(),
    candOrder: chainable(),
    healthOrder: chainable(),
  }
})

vi.mock('@/services/db/database', () => ({
  db: {
    applications: { toArray: vi.fn().mockResolvedValue([]) },
    businessUnits: { toArray: vi.fn().mockResolvedValue([]) },
    technologies: { toArray: vi.fn().mockResolvedValue([]) },
    teams: { toArray: vi.fn().mockResolvedValue([]) },
    memberProfiles: {
      get: vi.fn().mockResolvedValue(undefined),
      toArray: vi.fn().mockResolvedValue([]),
    },
    vulnerabilities: { toArray: vi.fn().mockResolvedValue([]) },
    incidents: { toArray: vi.fn().mockResolvedValue([]) },
    risks: { toArray: vi.fn().mockResolvedValue([]) },
    auditFindings: { toArray: vi.fn().mockResolvedValue([]) },
    objectives: { toArray: vi.fn().mockResolvedValue([]) },
    plans: { get: vi.fn().mockResolvedValue(undefined), toArray: vi.fn().mockResolvedValue([]) },
    activities: { where: mockDbFns.actWhere.fn, toArray: vi.fn().mockResolvedValue([]) },
    tasks: { where: mockDbFns.taskWhere.fn, toArray: vi.fn().mockResolvedValue([]) },
    blockers: { toArray: vi.fn().mockResolvedValue([]) },
    commitments: { toArray: vi.fn().mockResolvedValue([]) },
    sprintRecords: {
      where: mockDbFns.sprintWhere.fn,
      orderBy: vi.fn(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    oneOnOnes: { where: mockDbFns.oneOnOneWhere.fn, toArray: vi.fn().mockResolvedValue([]) },
    achievements: { where: mockDbFns.achWhere.fn, toArray: vi.fn().mockResolvedValue([]) },
    healthIndexHistory: { orderBy: mockDbFns.healthOrder.fn },
    microservices: { toArray: vi.fn().mockResolvedValue([]) },
    applicationDependencies: { toArray: vi.fn().mockResolvedValue([]) },
    teamSprints: { toArray: vi.fn().mockResolvedValue([]) },
    equipment: { toArray: vi.fn().mockResolvedValue([]) },
    equipmentAssignments: { toArray: vi.fn().mockResolvedValue([]) },
    equipmentTickets: { toArray: vi.fn().mockResolvedValue([]) },
    candidates: { orderBy: mockDbFns.candOrder.fn },
    candidateEvaluations: { toArray: vi.fn().mockResolvedValue([]) },
  },
}))

function makeLink(hash: string, type: ShareType = 'dashboard') {
  return { hash, type, ref: undefined, createdAt: Date.now(), expiresAt: Date.now() + 48 * 3600000 }
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  globalThis.window = { location: { origin: 'http://localhost:5173' } } as any
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: (buf: Uint8Array) => {
        buf.fill(0xab)
        return buf
      },
    },
    writable: false,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'vitest' },
    writable: true,
    configurable: true,
  })
})

describe('isLinkInAzure', () => {
  it('returns false when no azure links', () => expect(isLinkInAzure('abc')).toBe(false))
  it('returns true when hash is in azure links', () => {
    localStorage.setItem(AZURE_LINKS_KEY, JSON.stringify(['abc']))
    expect(isLinkInAzure('abc')).toBe(true)
  })
})

describe('getShareInfo', () => {
  it('returns null for missing link', () => expect(getShareInfo('x')).toBeNull())
  it('finds link by hash', () => {
    localStorage.setItem(SHARED_LINKS_KEY, JSON.stringify([makeLink('abc123', 'risks')]))
    expect(getShareInfo('abc123')?.type).toBe('risks')
  })
})

describe('getShareType', () => {
  it('returns type for valid hash', () => {
    localStorage.setItem(SHARED_LINKS_KEY, JSON.stringify([makeLink('h1', 'audit')]))
    expect(getShareType('h1')).toBe('audit')
  })
  it('returns null for unknown', () => expect(getShareType('x')).toBeNull())
})

describe('getSharedLinksList', () => {
  it('returns empty when no links', () => expect(getSharedLinksList()).toEqual([]))
  it('filters expired links', () => {
    localStorage.setItem(
      SHARED_LINKS_KEY,
      JSON.stringify([{ ...makeLink('old'), expiresAt: Date.now() - 1 }, makeLink('new', 'risks')]),
    )
    expect(getSharedLinksList()).toHaveLength(1)
  })
})

describe('revokeShareLink', () => {
  it('removes link', () => {
    localStorage.setItem(SHARED_LINKS_KEY, JSON.stringify([makeLink('a'), makeLink('b')]))
    revokeShareLink('a')
    expect(JSON.parse(localStorage.getItem(SHARED_LINKS_KEY)!)).toHaveLength(1)
  })
})

describe('getLinkExpiry', () => {
  it('returns expiry for existing link', () => {
    const link = makeLink('h')
    localStorage.setItem(SHARED_LINKS_KEY, JSON.stringify([link]))
    expect(getLinkExpiry('h')).toBe(link.expiresAt)
  })
  it('returns null for unknown', () => expect(getLinkExpiry('x')).toBeNull())
})

describe('isValidShareHash', () => {
  it('returns true for active link', () => {
    localStorage.setItem(SHARED_LINKS_KEY, JSON.stringify([makeLink('h')]))
    expect(isValidShareHash('h')).toBe(true)
  })
  it('returns false for expired', () => {
    localStorage.setItem(
      SHARED_LINKS_KEY,
      JSON.stringify([{ ...makeLink('h'), expiresAt: Date.now() - 1 }]),
    )
    expect(isValidShareHash('h')).toBe(false)
  })
})

describe('logShareAccess', () => {
  it('logs entry', () => {
    logShareAccess('h1', 'dashboard')
    expect(JSON.parse(localStorage.getItem(ACCESS_LOG_KEY)!)).toHaveLength(1)
  })
  it('handles storage error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error()
    })
    expect(() => logShareAccess('h1', 'd')).not.toThrow()
  })
})

describe('getShareAccessLog', () => {
  it('returns filtered by hash', () => {
    localStorage.setItem(
      ACCESS_LOG_KEY,
      JSON.stringify([
        { hash: 'a', type: 'dashboard', accessedAt: 1, userAgent: '' },
        { hash: 'b', type: 'risks', accessedAt: 2, userAgent: '' },
      ]),
    )
    expect(getShareAccessLog('a')).toHaveLength(1)
  })
  it('returns empty on parse error', () => {
    localStorage.setItem(ACCESS_LOG_KEY, 'bad')
    expect(getShareAccessLog()).toEqual([])
  })
})

describe('loadPublicEntities', () => {
  it('returns empty for empty input', async () => expect(await loadPublicEntities([])).toEqual({}))
  it('loads known entities', async () => {
    const r = await loadPublicEntities(['applications', 'teams'])
    expect(r.applications).toEqual([])
    expect(r.teams).toEqual([])
  })
  it('ignores unknown entities', async () => expect(await loadPublicEntities(['x'])).toEqual({}))
  it('loads all entity types', async () => {
    const all = await loadPublicEntities([
      'applications',
      'businessUnits',
      'technologies',
      'teams',
      'members',
      'vulnerabilities',
      'incidents',
      'risks',
      'auditFindings',
      'objectives',
      'plans',
      'activities',
      'tasks',
      'blockers',
      'commitments',
      'sprints',
      'oneOnOnes',
      'achievements',
      'healthHistory',
      'microservices',
      'applicationDependencies',
      'teamSprints',
      'equipment',
      'equipmentAssignments',
      'equipmentTickets',
    ])
    expect(Object.keys(all).length).toBeGreaterThan(20)
  })
})

describe('createShareLink', () => {
  it('creates a link with default expiry', async () => {
    const result = await createShareLink()
    expect(result.hash).toHaveLength(16)
    expect(result.url).toContain('http://localhost:5173/public/')
    expect(result.url).toContain(result.hash)
  })

  it('creates a link with custom type and ref', async () => {
    const result = await createShareLink(24, 'risks', 'risk-123')
    expect(result.hash).toHaveLength(16)
    expect(result.url).toContain('/public/risks/')
  })

  it('stores link in localStorage', async () => {
    const { hash } = await createShareLink(48, 'dashboard')
    const links = JSON.parse(localStorage.getItem(SHARED_LINKS_KEY)!)
    expect(links).toHaveLength(1)
    expect(links[0].hash).toBe(hash)
  })

  it('uploads to Azure when share config exists', async () => {
    const { getShareAzureConfig, uploadShareToAzure, buildManifestString } =
      await import('@/services/share/azureShareService')
    vi.mocked(getShareAzureConfig).mockReturnValue({
      sasUrl: 'https://test?sv=1',
      containerName: 'c',
    })
    vi.mocked(uploadShareToAzure).mockResolvedValue({ url: 'https://azure/test', autoKey: 'key' })
    vi.mocked(buildManifestString).mockReturnValue('encoded-manifest')

    const result = await createShareLink(48, 'dashboard', undefined, { test: true })
    expect(result.url).toContain('#encoded-manifest')
    expect(uploadShareToAzure).toHaveBeenCalled()
  })
})

describe('isShareValid', () => {
  it('returns true for valid local link', async () => {
    localStorage.setItem(SHARED_LINKS_KEY, JSON.stringify([makeLink('abc123')]))
    expect(await isShareValid('abc123')).toBe(true)
  })

  it('returns false for expired local link', async () => {
    localStorage.setItem(
      SHARED_LINKS_KEY,
      JSON.stringify([{ ...makeLink('abc123'), expiresAt: Date.now() - 1 }]),
    )
    expect(await isShareValid('abc123')).toBe(false)
  })

  it('returns true for azure link with valid expiry', async () => {
    localStorage.setItem(AZURE_LINKS_KEY, JSON.stringify(['abc123']))
    localStorage.setItem(SHARED_LINKS_KEY, JSON.stringify([makeLink('abc123')]))
    expect(await isShareValid('abc123')).toBe(true)
  })
})

describe('fetchAzureShareData', () => {
  it('returns null when module import fails', async () => {
    const result = await fetchAzureShareData('nonexistent')
    expect(result).toBeNull()
  })
})

describe('getPublicDashboardData', () => {
  it('returns dashboard data from db', async () => {
    vi.mocked(db.businessUnits.toArray).mockResolvedValue([{ id: 'bu1' }])
    vi.mocked(db.applications.toArray).mockResolvedValue([{ id: 'app1' }])
    const data = await getPublicDashboardData()
    expect(data.businessUnits).toHaveLength(1)
    expect(data.applications).toHaveLength(1)
  })
})

describe('getPublicPerformanceData', () => {
  it('returns performance data from db', async () => {
    vi.mocked(db.teams.toArray).mockResolvedValue([{ id: 't1' }])
    vi.mocked(db.memberProfiles.toArray).mockResolvedValue([{ id: 'm1' }])
    const data = await getPublicPerformanceData()
    expect(data.teams).toHaveLength(1)
    expect(data.members).toHaveLength(1)
  })
})

describe('getPublicMemberData', () => {
  it('returns null when member not found', async () => {
    vi.mocked(db.memberProfiles.get).mockResolvedValue(undefined)
    expect(await getPublicMemberData('nonexistent')).toBeNull()
  })

  it('returns member data with team info', async () => {
    vi.mocked(db.memberProfiles.get).mockResolvedValue({
      id: 'm1',
      email: 'alice@test.com',
      teamId: 't1',
    } as any)
    vi.mocked(db.teams.toArray).mockResolvedValue([
      { id: 't1', name: 'Alpha', members: [{ id: 'm1', displayName: 'Alice' }] },
    ] as any)
    const result = await getPublicMemberData('m1')
    expect(result).not.toBeNull()
    expect(result!.displayName).toBe('Alice')
    expect(result!.team?.name).toBe('Alpha')
  })

  it('falls back to email prefix when no displayName', async () => {
    vi.mocked(db.memberProfiles.get).mockResolvedValue({
      id: 'm2',
      email: 'bob@test.com',
      teamId: 't1',
    } as any)
    vi.mocked(db.teams.toArray).mockResolvedValue([
      { id: 't1', name: 'Alpha', members: [{ id: 'm2' }] },
    ] as any)
    const result = await getPublicMemberData('m2')
    expect(result!.displayName).toBe('bob')
  })

  it('falls back to Miembro when email is empty', async () => {
    vi.mocked(db.memberProfiles.get).mockResolvedValue({
      id: 'm3',
      email: '',
      teamId: 't1',
    } as any)
    vi.mocked(db.teams.toArray).mockResolvedValue([{ id: 't1', name: 'Alpha' }] as any)
    const result = await getPublicMemberData('m3')
    expect(result!.displayName).toBe('Miembro')
  })
})

describe('getPublicRecruitmentData', () => {
  it('returns recruitment data', async () => {
    vi.mocked(db.candidateEvaluations.toArray).mockResolvedValue([{ id: 'ev1' }])
    const data = await getPublicRecruitmentData()
    expect(data.candidates).toBeDefined()
    expect(data.evaluations).toHaveLength(1)
  })
})

describe('getPublicPlanData', () => {
  it('returns null when plan not found', async () => {
    vi.mocked(db.plans.get).mockResolvedValue(undefined)
    expect(await getPublicPlanData('nonexistent')).toBeNull()
  })

  it('returns plan with related data', async () => {
    vi.mocked(db.plans.get).mockResolvedValue({ id: 'p1', title: 'Plan A' } as any)
    vi.mocked(db.blockers.toArray).mockResolvedValue([] as any)
    vi.mocked(db.teams.toArray).mockResolvedValue([] as any)
    vi.mocked(db.applications.toArray).mockResolvedValue([] as any)
    const result = await getPublicPlanData('p1')
    expect(result).not.toBeNull()
    expect(result!.plan.title).toBe('Plan A')
    expect(result!.blockers).toEqual([])
  })
})

describe('getPublicDailyData', () => {
  it('returns daily data from db', async () => {
    const data = await getPublicDailyData()
    expect(data).toHaveProperty('plans')
    expect(data).toHaveProperty('activities')
    expect(data).toHaveProperty('tasks')
  })
})

describe('getPublicTimelineData', () => {
  it('returns timeline data from db', async () => {
    const data = await getPublicTimelineData()
    expect(data).toHaveProperty('plans')
    expect(data).toHaveProperty('teams')
  })
})

describe('getPublicPredictabilityData', () => {
  it('returns predictability data', async () => {
    const data = await getPublicPredictabilityData()
    expect(data).toHaveProperty('teamSprints')
    expect(data).toHaveProperty('teams')
  })
})

describe('getPublicVulnerabilitiesData', () => {
  it('returns vulns data', async () => {
    const data = await getPublicVulnerabilitiesData()
    expect(data).toHaveProperty('vulnerabilities')
    expect(data).toHaveProperty('applications')
  })
})

describe('getPublicIncidentsData', () => {
  it('returns incidents data', async () => {
    const data = await getPublicIncidentsData()
    expect(data).toHaveProperty('incidents')
    expect(data).toHaveProperty('applications')
  })
})

describe('getPublicRisksData', () => {
  it('returns risks data', async () => {
    const data = await getPublicRisksData()
    expect(data).toHaveProperty('risks')
    expect(data).toHaveProperty('applications')
  })
})

describe('getPublicAuditData', () => {
  it('returns audit data', async () => {
    const data = await getPublicAuditData()
    expect(data).toHaveProperty('auditFindings')
    expect(data).toHaveProperty('applications')
  })
})

describe('getPublicObjectivesData', () => {
  it('returns objectives data', async () => {
    const data = await getPublicObjectivesData()
    expect(data).toHaveProperty('objectives')
    expect(data).toHaveProperty('teams')
  })
})

describe('getPublicObsolescenceData', () => {
  it('returns obsolescence data', async () => {
    const data = await getPublicObsolescenceData()
    expect(data).toHaveProperty('applications')
    expect(data).toHaveProperty('microservices')
    expect(data).toHaveProperty('technologies')
  })
})

describe('getPublicDependenciesData', () => {
  it('returns dependencies data', async () => {
    const data = await getPublicDependenciesData()
    expect(data).toHaveProperty('applications')
    expect(data).toHaveProperty('applicationDependencies')
  })
})
