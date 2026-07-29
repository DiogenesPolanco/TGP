import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/db/database', () => ({
  db: {
    technologies: {
      toArray: vi.fn(),
      add: vi.fn(),
    },
  },
}))

import { seedTechnologies } from '../seedTechnologies'
import { db } from '@/services/db/database'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('seedTechnologies', () => {
  it('seeds technologies when none exist', async () => {
    ;(db.technologies.toArray as any).mockResolvedValue([])
    ;(db.technologies.add as any).mockResolvedValue(undefined)

    const result = await seedTechnologies()

    expect(result.added).toBeGreaterThan(0)
    expect(result.skipped).toBe(0)
    expect(result.total).toBeGreaterThan(0)
    expect(db.technologies.add).toHaveBeenCalledTimes(result.added)
  })

  it('skips already existing technologies', async () => {
    ;(db.technologies.toArray as any).mockResolvedValue([
      { name: 'Java', version: '21' },
      { name: 'Java', version: '17' },
    ])
    ;(db.technologies.add as any).mockResolvedValue(undefined)

    const result = await seedTechnologies()
    expect(result.skipped).toBeGreaterThan(0)
    expect(result.added).toBeLessThan(result.total)
  })

  it('returns correct total', async () => {
    ;(db.technologies.toArray as any).mockResolvedValue([])
    ;(db.technologies.add as any).mockResolvedValue(undefined)

    const result = await seedTechnologies()
    expect(result.total).toBe(result.added)
    expect(result.total).toBeGreaterThan(0)
  })
})
