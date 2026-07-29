import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  matchCycle,
  computeSupportStatus,
  syncTechnologies,
  latestString,
  detectDepsSystem,
} from '../endoflifeSyncService'

vi.mock('@/services/db/database', () => ({
  db: {
    technologies: {
      toArray: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue(undefined),
      filter: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
    },
  },
}))

vi.mock('@/services/demo/seedTechnologies', () => ({
  seedTechnologies: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/security/depsDevService', () => ({
  lookupDepsPackage: vi.fn().mockResolvedValue(null),
  DEPS_SYSTEMS: [{ value: 'npm', label: 'npm' }] as any,
}))

describe('matchCycle', () => {
  const cycles = [
    { name: '18', isEol: false, latest: null },
    { name: '20', isEol: false, latest: null },
    { name: '21', isEol: false, latest: null },
    { name: '22', isEol: false, latest: null },
  ] as any

  it('matches exact version', () => {
    const result = matchCycle(cycles, '18')
    expect(result?.name).toBe('18')
  })

  it('matches version with dot prefix', () => {
    const result = matchCycle(cycles, '20.0.1')
    expect(result?.name).toBe('20')
  })

  it('matches version with dash prefix', () => {
    const result = matchCycle(cycles, '20-lts')
    expect(result?.name).toBe('20')
  })

  it('matches when version is a cycle prefix (e.g. "20" → "20.0.1")', () => {
    const result = matchCycle(cycles, '20.0.1')
    expect(result?.name).toBe('20')
  })

  it('matches .x suffix with major version', () => {
    const result = matchCycle(cycles, '22.x')
    expect(result?.name).toBe('22')
  })

  it('returns null when no match', () => {
    const result = matchCycle(cycles, '99')
    expect(result).toBeNull()
  })

  it('handles .x with no exact major match', () => {
    const result = matchCycle([{ name: '6.5', isEol: false, latest: null }] as any, '6.x')
    expect(result?.name).toBe('6.5')
  })
})

describe('computeSupportStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns eol+eolDate when release.isEol and no eoes', () => {
    const release = { isEol: true, eolFrom: '2025-01-01' } as any
    const result = computeSupportStatus(release)
    expect(result.status).toBe('eol')
    expect(result.eolDate).toBeInstanceOf(Date)
  })

  it('returns extended when eoes is in the future', () => {
    const release = { isEol: true, eolFrom: '2025-01-01', eoesFrom: '2027-01-01' } as any
    const result = computeSupportStatus(release)
    expect(result.status).toBe('extended')
  })

  it('returns eol when eoes is in the past', () => {
    const release = { isEol: true, eolFrom: '2025-01-01', eoesFrom: '2026-01-01' } as any
    const result = computeSupportStatus(release)
    expect(result.status).toBe('eol')
  })

  it('returns active when eolFrom is in future', () => {
    const release = { isEol: false, eolFrom: '2027-01-01' } as any
    const result = computeSupportStatus(release)
    expect(result.status).toBe('active')
  })

  it('returns eol when eolFrom is past and not maintained', () => {
    const release = { isEol: false, eolFrom: '2025-01-01', isMaintained: false } as any
    const result = computeSupportStatus(release)
    expect(result.status).toBe('eol')
  })

  it('returns extended when eolFrom past but maintained with future eoes', () => {
    const release = {
      isEol: false,
      eolFrom: '2025-01-01',
      isMaintained: true,
      eoesFrom: '2027-01-01',
    } as any
    const result = computeSupportStatus(release)
    expect(result.status).toBe('extended')
  })

  it('returns active when no dates provided', () => {
    const release = { isEol: false } as any
    const result = computeSupportStatus(release)
    expect(result.status).toBe('active')
    expect(result.eolDate).toBeNull()
  })

  it('returns active when eolFrom past but maintained with no eoes', () => {
    const release = { isEol: false, eolFrom: '2025-01-01', isMaintained: true } as any
    const result = computeSupportStatus(release)
    expect(result.status).toBe('active')
    expect(result.eolDate).toEqual(new Date('2025-01-01'))
  })

  it('returns eol with null eolDate when isEol with no eolFrom', () => {
    const release = { isEol: true } as any
    const result = computeSupportStatus(release)
    expect(result.status).toBe('eol')
    expect(result.eolDate).toBeNull()
  })
})

describe('latestString', () => {
  it('returns null when latest is null', () => {
    expect(latestString(null)).toBeNull()
  })
  it('returns string when latest is a string', () => {
    expect(latestString('v1.0')).toBe('v1.0')
  })
  it('returns name when latest is an object', () => {
    expect(latestString({ name: 'v2.0' })).toBe('v2.0')
  })
  it('returns null when latest object has no name', () => {
    expect(latestString({} as any)).toBeNull()
  })
})

describe('detectDepsSystem', () => {
  it('returns system from metadata', () => {
    const tech = { metadata: { system: 'npm' }, vendor: '' } as any
    expect(detectDepsSystem(tech)).toBe('npm')
  })
  it('returns null for unknown metadata system', () => {
    const tech = { metadata: { system: 'unknown' }, vendor: '' } as any
    expect(detectDepsSystem(tech)).toBeNull()
  })
  it('detects system from vendor name', () => {
    const tech = { metadata: {}, vendor: 'npm', name: 'lodash', version: '1.0' } as any
    expect(detectDepsSystem(tech)).toBe('npm')
  })
  it('returns null when no vendor or metadata match', () => {
    const tech = { metadata: {}, vendor: 'unknown', name: 'foo', version: '1.0' } as any
    expect(detectDepsSystem(tech)).toBeNull()
  })
  it('returns null when no vendor or metadata', () => {
    const tech = { metadata: {}, name: 'foo', version: '1.0' } as any
    expect(detectDepsSystem(tech)).toBeNull()
  })
})

describe('syncTechnologies', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15'))
  })

  afterEach(() => vi.useRealTimers())

  it('returns sync result with zeros when no technologies', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404 } as Response)
    const result = await syncTechnologies()
    expect(result.total).toBe(0)
    expect(result.updated).toBe(0)
    expect(result.notFound).toBe(0)
    expect(result.errors).toBe(0)
    expect(result.duration).toBeGreaterThanOrEqual(0)
  })

  it('handles technologies with SAAS-only names', async () => {
    const techs = [
      {
        id: 't1',
        name: 'Amazon Web Services',
        version: 'latest',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: {},
        cveList: [],
        category: 'infrastructure',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(techs as any)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404 } as Response)
    const result = await syncTechnologies()
    expect(result.total).toBe(1)
    expect(result.notFound).toBe(1)
    expect(result.updated).toBe(0)
  })

  it('handles technologies with no slug mapping', async () => {
    const techs = [
      {
        id: 't2',
        name: 'unknown-tech',
        version: '1.0',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: {},
        cveList: [],
        category: 'library',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(techs as any)

    const result = await syncTechnologies()
    expect(result.total).toBe(1)
    expect(result.notFound).toBe(1)
  })

  it('handles API failure for a known slug', async () => {
    const techs = [
      {
        id: 't3',
        name: 'node.js',
        version: '20',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: {},
        cveList: [],
        category: 'runtime',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(techs as any)

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('API unavailable'))
    const result = await syncTechnologies()
    expect(result.total).toBe(1)
    expect(result.errors).toBe(1)
  })

  it('handles API returning empty data', async () => {
    const techs = [
      {
        id: 't4',
        name: 'node.js',
        version: '20',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: {},
        cveList: [],
        category: 'runtime',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(techs as any)
    vi.mocked(db.technologies.filter).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as any)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          schema_version: '1',
          generated_at: '',
          last_modified: '',
          result: { name: 'nodejs', releases: [] },
        }),
    } as Response)
    const result = await syncTechnologies()
    expect(result.errors).toBe(1)
  })

  it('handles 404 from EOL API', async () => {
    const techs = [
      {
        id: 't4b',
        name: 'node.js',
        version: '20',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: {},
        cveList: [],
        category: 'runtime',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(techs as any)
    vi.mocked(db.technologies.filter).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as any)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404 } as Response)
    const result = await syncTechnologies()
    expect(result.errors).toBe(1)
  })

  it('handles 500 from EOL API', async () => {
    const techs = [
      {
        id: 't4c',
        name: 'node.js',
        version: '20',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: {},
        cveList: [],
        category: 'runtime',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(techs as any)
    vi.mocked(db.technologies.filter).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as any)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response)
    const result = await syncTechnologies()
    expect(result.errors).toBe(1)
  })

  it('updates technology when API returns matching cycle', async () => {
    const techs = [
      {
        id: 't5',
        name: 'node.js',
        version: '20',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: {},
        cveList: [],
        category: 'runtime',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(techs as any)
    vi.mocked(db.technologies.filter).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as any)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          schema_version: '1',
          generated_at: '',
          last_modified: '',
          result: {
            name: 'nodejs',
            releases: [{ name: '20', isEol: false, eolFrom: '2029-04-30', isLts: true }],
          },
        }),
    } as Response)
    const result = await syncTechnologies()
    expect(result.updated).toBe(1)
    expect(vi.mocked(db.technologies.update).mock.calls[0][0]).toBe('t5')
  })

  it('handles version not found in API cycles', async () => {
    const techs = [
      {
        id: 't6',
        name: 'node.js',
        version: '0.99',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: {},
        cveList: [],
        category: 'runtime',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(techs as any)
    vi.mocked(db.technologies.filter).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as any)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          schema_version: '1',
          generated_at: '',
          last_modified: '',
          result: {
            name: 'nodejs',
            releases: [{ name: '20', isEol: false, eolFrom: '2029-04-30' }],
          },
        }),
    } as Response)
    const result = await syncTechnologies()
    expect(result.total).toBe(1)
    expect(result.notFound).toBe(1)
    expect(result.updated).toBe(0)
  })

  it('handles multiple techs with same name grouping', async () => {
    const techs = [
      {
        id: 't7a',
        name: 'node.js',
        version: '20',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: {},
        cveList: [],
        category: 'runtime',
      },
      {
        id: 't7b',
        name: 'node.js',
        version: '22',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: {},
        cveList: [],
        category: 'runtime',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(techs as any)
    vi.mocked(db.technologies.filter).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as any)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          schema_version: '1',
          generated_at: '',
          last_modified: '',
          result: {
            name: 'nodejs',
            releases: [
              { name: '20', isEol: false, eolFrom: '2029-04-30', latest: '20.15.0' },
              { name: '22', isEol: false, eolFrom: '2030-10-01', latest: '22.4.0' },
            ],
          },
        }),
    } as Response)
    const result = await syncTechnologies()
    expect(result.total).toBe(2)
    expect(result.updated).toBe(2)
  })

  it('triggers deps.dev sync for library technologies with known system', async () => {
    const libTechs = [
      {
        id: 't8',
        name: 'lodash',
        version: '4.17.21',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: { system: 'npm' },
        cveList: [],
        category: 'library',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(libTechs as any)
    vi.mocked(db.technologies.filter as any).mockReturnValue({
      toArray: vi.fn().mockResolvedValue(libTechs),
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          schema_version: '1',
          generated_at: '',
          last_modified: '',
          result: {
            name: 'nodejs',
            releases: [{ name: '20', isEol: false }],
          },
        }),
    } as Response)
    const result = await syncTechnologies()
    expect(result.total).toBe(1)
    expect(result.details.some((d) => d.action === 'not_found')).toBe(true)
  })

  it('updates library via deps.dev when package found', async () => {
    const depsModule = await import('@/services/security/depsDevService')
    vi.mocked(depsModule.lookupDepsPackage).mockResolvedValue({
      supportStatus: 'active',
      cveList: [],
      license: 'MIT',
      description: 'Test library',
      advisories: [],
      advisoryIds: [],
      system: 'npm',
      name: 'lodash',
      version: '4.17.21',
    })

    const libTechs = [
      {
        id: 't9',
        name: 'lodash',
        version: '4.17.21',
        supportStatus: 'active' as const,
        eolDate: null,
        metadata: { system: 'npm' },
        cveList: [],
        category: 'library',
      },
    ]
    const { db } = await import('@/services/db/database')
    vi.mocked(db.technologies.toArray).mockResolvedValue(libTechs as any)
    vi.mocked(db.technologies.filter as any).mockReturnValue({
      toArray: vi.fn().mockResolvedValue(libTechs),
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          schema_version: '1',
          generated_at: '',
          last_modified: '',
          result: {
            name: 'nodejs',
            releases: [{ name: '20', isEol: false }],
          },
        }),
    } as Response)
    const result = await syncTechnologies()
    expect(result.details.some((d) => d.action === 'updated')).toBe(true)
  })
})
