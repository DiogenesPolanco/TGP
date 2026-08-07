import { describe, expect, it } from 'vitest'
import { db } from '@/services/db/database'

describe('FinOps database schema', () => {
  it('expone las tablas costEntries y costBudgets', () => {
    expect(db.costEntries).toBeDefined()
    expect(db.costBudgets).toBeDefined()
  })
})
