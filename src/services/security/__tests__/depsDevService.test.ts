import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  DEPS_SYSTEMS,
  computeSupportStatus,
  severityFromScore,
  clearDepsDevCache,
  lookupDepsPackage,
} from '../depsDevService'
import type { DepsAdvisory } from '../depsDevService'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('DEPS_SYSTEMS', () => {
  it('has 7 package managers', () => {
    expect(DEPS_SYSTEMS).toHaveLength(7)
  })

  it('includes npm', () => {
    expect(DEPS_SYSTEMS.find((s) => s.value === 'npm')).toBeDefined()
  })

  it('includes maven', () => {
    expect(DEPS_SYSTEMS.find((s) => s.value === 'maven')).toBeDefined()
  })
})

describe('computeSupportStatus', () => {
  it('returns eol for deprecated packages', () => {
    expect(computeSupportStatus([], true)).toBe('eol')
  })

  it('returns eol for CRITICAL severity', () => {
    const advisories: DepsAdvisory[] = [{ id: '1', severity: 'CRITICAL' }]
    expect(computeSupportStatus(advisories)).toBe('eol')
  })

  it('returns eol for HIGH severity', () => {
    const advisories: DepsAdvisory[] = [{ id: '1', severity: 'HIGH' }]
    expect(computeSupportStatus(advisories)).toBe('eol')
  })

  it('returns extended for MEDIUM severity', () => {
    const advisories: DepsAdvisory[] = [{ id: '1', severity: 'MEDIUM' }]
    expect(computeSupportStatus(advisories)).toBe('extended')
  })

  it('returns active for LOW severity', () => {
    const advisories: DepsAdvisory[] = [{ id: '1', severity: 'LOW' }]
    expect(computeSupportStatus(advisories)).toBe('active')
  })

  it('returns unknown for no advisories', () => {
    expect(computeSupportStatus([])).toBe('unknown')
  })

  it('returns eol if deprecated regardless of advisory severity', () => {
    const advisories: DepsAdvisory[] = [{ id: '1', severity: 'LOW' }]
    expect(computeSupportStatus(advisories, true)).toBe('eol')
  })

  it('prioritizes CRITICAL over MEDIUM in combined list', () => {
    const advisories: DepsAdvisory[] = [
      { id: '1', severity: 'MEDIUM' },
      { id: '2', severity: 'CRITICAL' },
    ]
    expect(computeSupportStatus(advisories)).toBe('eol')
  })
})

describe('severityFromScore', () => {
  it('returns CRITICAL for score >= 9.0', () => {
    expect(severityFromScore(9.0)).toBe('CRITICAL')
    expect(severityFromScore(10.0)).toBe('CRITICAL')
  })

  it('returns HIGH for score >= 7.0', () => {
    expect(severityFromScore(7.0)).toBe('HIGH')
    expect(severityFromScore(8.9)).toBe('HIGH')
  })

  it('returns MEDIUM for score >= 4.0', () => {
    expect(severityFromScore(4.0)).toBe('MEDIUM')
    expect(severityFromScore(6.9)).toBe('MEDIUM')
  })

  it('returns LOW for score < 4.0', () => {
    expect(severityFromScore(3.9)).toBe('LOW')
    expect(severityFromScore(0)).toBe('LOW')
  })

  it('returns UNKNOWN for undefined score', () => {
    expect(severityFromScore(undefined)).toBe('UNKNOWN')
  })
})

describe('clearDepsDevCache', () => {
  it('clears all tgp-depsdev-cache- entries', () => {
    localStorage.setItem('tgp-depsdev-cache-foo', 'data')
    localStorage.setItem('tgp-depsdev-cache-bar', 'data')
    localStorage.setItem('other-key', 'keep')
    clearDepsDevCache()
    expect(localStorage.getItem('tgp-depsdev-cache-foo')).toBeNull()
    expect(localStorage.getItem('tgp-depsdev-cache-bar')).toBeNull()
    expect(localStorage.getItem('other-key')).toBe('keep')
  })

  it('does nothing when no cache entries', () => {
    localStorage.setItem('other', 'data')
    clearDepsDevCache()
    expect(localStorage.getItem('other')).toBe('data')
  })
})

describe('lookupDepsPackage', () => {
  const pkgResponse = {
    name: 'lodash',
    versions: [{ versionKey: { version: '4.17.20' }, isDefault: true }],
    description: 'Lodash modern library',
  }
  const verResponse = {
    description: 'Lodash v4.17.20',
    licenses: ['MIT'],
    isDeprecated: false,
    advisoryKeys: [],
  }

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if ((url as string).includes('/versions/')) {
        return { ok: true, json: () => Promise.resolve(verResponse) } as any
      }
      if ((url as string).includes('/advisories/')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({ title: 'Test', cvss3Score: 5.0, aliases: [], sourceUrl: '' }),
        } as any
      }
      return { ok: true, json: () => Promise.resolve(pkgResponse) } as any
    })
  })

  it('returns null when package not found (404)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404 } as any)
    const result = await lookupDepsPackage('nonexistent-pkg', 'npm')
    expect(result).toBeNull()
  })

  it('returns null when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
    const result = await lookupDepsPackage('lodash@4.17.20', 'npm')
    expect(result).toBeNull()
  })

  it('looks up a package with version', async () => {
    const result = await lookupDepsPackage('lodash@4.17.20', 'npm')
    expect(result).not.toBeNull()
    expect(result!.name).toBe('lodash')
    expect(result!.version).toBe('4.17.20')
    expect(result!.system).toBe('npm')
    expect(result!.license).toBe('MIT')
  })

  it('looks up a package without version using default', async () => {
    const result = await lookupDepsPackage('lodash', 'npm')
    expect(result).not.toBeNull()
    expect(result!.version).toBe('4.17.20')
  })

  it('caches API results for subsequent calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (url.includes('/versions/')) {
        return { ok: true, json: () => Promise.resolve(verResponse) } as any
      }
      if (url.includes('/advisories/')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({ title: 'Test', cvss3Score: 5.0, aliases: [], sourceUrl: '' }),
        } as any
      }
      return { ok: true, json: () => Promise.resolve(pkgResponse) } as any
    })

    const r1 = await lookupDepsPackage('lodash@4.17.20', 'npm')
    expect(r1).not.toBeNull()

    const callCount = fetchSpy.mock.calls.length

    const r2 = await lookupDepsPackage('lodash@4.17.20', 'npm')
    expect(r2).not.toBeNull()
    expect(fetchSpy.mock.calls.length).toBe(callCount)
  })

  it('handles 403 response as not found', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 403 } as any)
    const result = await lookupDepsPackage('lodash', 'npm')
    expect(result).toBeNull()
  })

  it('recovers from malformed cache entry', async () => {
    localStorage.setItem('tgp-depsdev-cache-/systems/npm/packages/lodash', 'bad-json')

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if ((url as string).includes('/versions/')) {
        return { ok: true, json: () => Promise.resolve(verResponse) } as any
      }
      if ((url as string).includes('/advisories/')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({ title: 'Test', cvss3Score: 5.0, aliases: [], sourceUrl: '' }),
        } as any
      }
      return { ok: true, json: () => Promise.resolve(pkgResponse) } as any
    })

    const result = await lookupDepsPackage('lodash@4.17.20', 'npm')
    expect(result).not.toBeNull()
  })

  it('ignores expired cache entry and re-fetches', async () => {
    const oldData = JSON.stringify({ data: { name: 'cached' }, ts: Date.now() - 99999999 })
    localStorage.setItem('tgp-depsdev-cache-/systems/npm/packages/lodash', oldData)

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if ((url as string).includes('/versions/')) {
        return { ok: true, json: () => Promise.resolve(verResponse) } as any
      }
      if ((url as string).includes('/advisories/')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({ title: 'Test', cvss3Score: 5.0, aliases: [], sourceUrl: '' }),
        } as any
      }
      return { ok: true, json: () => Promise.resolve(pkgResponse) } as any
    })

    const result = await lookupDepsPackage('lodash@4.17.20', 'npm')
    expect(result).not.toBeNull()
  })

  it('handles advisory detail returning null', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if ((url as string).includes('/versions/')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              ...verResponse,
              advisoryKeys: [{ id: 'adv-1' }],
            }),
        } as any
      }
      if ((url as string).includes('/advisories/adv-1')) {
        return { ok: true, json: () => Promise.resolve(null) } as any
      }
      return { ok: true, json: () => Promise.resolve(pkgResponse) } as any
    })

    const result = await lookupDepsPackage('lodash@4.17.20', 'npm')
    expect(result).not.toBeNull()
    expect(result!.advisories).toHaveLength(1)
    expect(result!.advisories[0].id).toBe('adv-1')
  })

  it('handles advisory with CVE aliases', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if ((url as string).includes('/versions/')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              ...verResponse,
              advisoryKeys: [{ id: 'adv-cve' }],
            }),
        } as any
      }
      if (url.includes('/advisories/adv-cve')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              title: 'CVE Test',
              cvss3Score: 9.0,
              aliases: ['CVE-2026-1234', 'GHSA-xxxx'],
              sourceUrl: 'https://example.com',
            }),
        } as any
      }
      return { ok: true, json: () => Promise.resolve(pkgResponse) } as any
    })

    const result = await lookupDepsPackage('lodash@4.17.20', 'npm')
    expect(result!.cveList).toHaveLength(1)
    expect(result!.cveList[0]).toBe('CVE-2026-1234')
  })
})
