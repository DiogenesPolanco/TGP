import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/db/database', () => ({
  db: {
    applications: {
      get: vi.fn(),
    },
    microservices: {
      where: vi.fn(),
    },
  },
}))

import { formatDuration, computeAppTechMap, getAppTechnologyIds } from '../technologyUtils'
import { db } from '@/services/db/database'

describe('formatDuration', () => {
  it('returns "Hoy" for 0 days', () => {
    expect(formatDuration(0)).toBe('Hoy')
  })

  it('returns singular "día" for 1 day', () => {
    expect(formatDuration(1)).toBe('1 día')
  })

  it('returns plural "días" for multiple days', () => {
    expect(formatDuration(15)).toBe('15 días')
  })

  it('returns "mes" for 30 days (approximately 1 month)', () => {
    expect(formatDuration(30)).toBe('1 mes')
  })

  it('returns "meses" for 60 days (approximately 2 months)', () => {
    expect(formatDuration(60)).toBe('2 meses')
  })

  it('returns "meses" for 364 days (approximately 12 months)', () => {
    expect(formatDuration(364)).toBe('12 meses')
  })

  it('returns "año" for 365 days (approximately 1 year)', () => {
    expect(formatDuration(365)).toBe('1 año')
  })

  it('returns "años" for 730 days (approximately 2 years)', () => {
    expect(formatDuration(730)).toBe('2 años')
  })

  it('handles negative values by using absolute value', () => {
    expect(formatDuration(-15)).toBe('15 días')
  })

  it('handles negative months', () => {
    expect(formatDuration(-60)).toBe('2 meses')
  })

  it('handles large values', () => {
    expect(formatDuration(1000)).toBe('3 años')
  })
})

describe('computeAppTechMap', () => {
  it('computes tech map for apps without microservices', () => {
    const apps = [
      { id: 'app1', technologies: ['tech1', 'tech2'] },
      { id: 'app2', technologies: ['tech3'] },
    ]
    const microservices: { applicationId: string; technologies: string[] }[] = []

    const result = computeAppTechMap(apps, microservices)

    expect(result.get('app1')).toEqual(['tech1', 'tech2'])
    expect(result.get('app2')).toEqual(['tech3'])
  })

  it('computes tech map with microservices', () => {
    const apps = [{ id: 'app1', technologies: ['tech1'] }]
    const microservices = [{ applicationId: 'app1', technologies: ['tech2', 'tech3'] }]

    const result = computeAppTechMap(apps, microservices)

    expect(result.get('app1')).toEqual(['tech1', 'tech2', 'tech3'])
  })

  it('deduplicates technologies between app and microservices', () => {
    const apps = [{ id: 'app1', technologies: ['tech1', 'tech2'] }]
    const microservices = [{ applicationId: 'app1', technologies: ['tech2', 'tech3'] }]

    const result = computeAppTechMap(apps, microservices)

    expect(result.get('app1')).toEqual(['tech1', 'tech2', 'tech3'])
  })

  it('handles multiple microservices for same app', () => {
    const apps = [{ id: 'app1', technologies: ['tech1'] }]
    const microservices = [
      { applicationId: 'app1', technologies: ['tech2'] },
      { applicationId: 'app1', technologies: ['tech3'] },
    ]

    const result = computeAppTechMap(apps, microservices)

    expect(result.get('app1')).toEqual(['tech1', 'tech2', 'tech3'])
  })

  it('handles apps with no direct technologies', () => {
    const apps = [{ id: 'app1', technologies: [] }]
    const microservices = [{ applicationId: 'app1', technologies: ['tech1'] }]

    const result = computeAppTechMap(apps, microservices)

    expect(result.get('app1')).toEqual(['tech1'])
  })

  it('returns empty array for apps with no microservices and no techs', () => {
    const apps = [{ id: 'app1', technologies: [] }]
    const microservices: { applicationId: string; technologies: string[] }[] = []

    const result = computeAppTechMap(apps, microservices)

    expect(result.get('app1')).toEqual([])
  })

  it('handles empty apps array', () => {
    const apps: { id: string; technologies: string[] }[] = []
    const microservices = [{ applicationId: 'app1', technologies: ['tech1'] }]

    const result = computeAppTechMap(apps, microservices)

    expect(result.size).toBe(0)
  })
})

describe('getAppTechnologyIds', () => {
  it('returns empty when app not found', async () => {
    vi.mocked(db.applications.get).mockResolvedValue(undefined)
    const result = await getAppTechnologyIds('nonexistent')
    expect(result).toEqual([])
  })

  it('returns direct techs when no microservices', async () => {
    vi.mocked(db.applications.get).mockResolvedValue({
      id: 'a1',
      technologies: ['t1', 't2'],
    } as any)
    vi.mocked(db.microservices.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as any)
    const result = await getAppTechnologyIds('a1')
    expect(result).toEqual(['t1', 't2'])
  })

  it('includes inherited techs from microservices', async () => {
    vi.mocked(db.applications.get).mockResolvedValue({ id: 'a1', technologies: ['t1'] } as any)
    vi.mocked(db.microservices.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { id: 'ms1', applicationId: 'a1', technologies: ['t2', 't3'] },
          { id: 'ms2', applicationId: 'a1', technologies: ['t3', 't4'] },
        ]),
      }),
    } as any)
    const result = await getAppTechnologyIds('a1')
    expect(result).toEqual(['t1', 't2', 't3', 't4'])
  })
})
