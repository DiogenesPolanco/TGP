import { describe, expect, it } from 'vitest'
import { db } from '@/services/db/database'
import { createCostEntry, getCostEntries, updateCostEntry, deleteCostEntry } from '../finOpsService'

describe('FinOps database schema', () => {
  it('expone las tablas costEntries y costBudgets', () => {
    expect(db.costEntries).toBeDefined()
    expect(db.costBudgets).toBeDefined()
  })
})

describe('finOpsService · CRUD partidas', () => {
  it('crea, lista, actualiza y elimina una partida', async () => {
    const id = await createCostEntry({
      applicationId: 'app-1',
      microserviceId: null,
      categoryId: 'cloud',
      amount: 1500,
      currency: 'USD',
      period: '2026-07',
      source: 'manual',
      notes: 'Suscripción mensual',
    })

    let entries = await getCostEntries({ period: '2026-07' })
    expect(entries).toHaveLength(1)
    expect(entries[0].amount).toBe(1500)

    await updateCostEntry(id, { amount: 1600 })
    entries = await getCostEntries({ applicationId: 'app-1' })
    expect(entries[0].amount).toBe(1600)

    await deleteCostEntry(id)
    entries = await getCostEntries({ applicationId: 'app-1' })
    expect(entries).toHaveLength(0)
  })

  it('filtra por categoría y fuente', async () => {
    await createCostEntry({
      applicationId: 'app-1',
      microserviceId: null,
      categoryId: 'cloud',
      amount: 100,
      currency: 'USD',
      period: '2026-07',
      source: 'manual',
      notes: null,
    })
    await createCostEntry({
      applicationId: 'app-1',
      microserviceId: null,
      categoryId: 'licenses',
      amount: 200,
      currency: 'USD',
      period: '2026-07',
      source: 'manual',
      notes: null,
    })

    const cloud = await getCostEntries({ categoryId: 'cloud' })
    expect(cloud).toHaveLength(1)
    const manual = await getCostEntries({ source: 'manual' })
    expect(manual).toHaveLength(2)
  })
})
