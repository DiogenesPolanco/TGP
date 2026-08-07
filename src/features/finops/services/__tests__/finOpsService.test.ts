import { describe, expect, it, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import {
  createCostEntry,
  getCostEntries,
  updateCostEntry,
  deleteCostEntry,
  getAppCost,
  rollupAppCosts,
} from '../finOpsService'

beforeEach(async () => {
  await db.costEntries.clear()
  await db.costBudgets.clear()
  await db.microservices.clear()
})

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

describe('finOpsService · rollup app + microservicios', () => {
  it('suma partidas propias y de sus microservicios', async () => {
    await db.microservices.add({
      id: 'ms-1',
      applicationId: 'app-1',
      name: 'MS Facturación',
      description: '',
      technologies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await createCostEntry({
      applicationId: 'app-1',
      microserviceId: null,
      categoryId: 'cloud',
      amount: 1000,
      currency: 'USD',
      period: '2026-07',
      source: 'manual',
      notes: null,
    })
    await createCostEntry({
      applicationId: 'app-1',
      microserviceId: 'ms-1',
      categoryId: 'cloud',
      amount: 500,
      currency: 'USD',
      period: '2026-07',
      source: 'manual',
      notes: null,
    })
    await createCostEntry({
      applicationId: 'app-1',
      microserviceId: 'ms-1',
      categoryId: 'cloud',
      amount: 300,
      currency: 'USD',
      period: '2026-06',
      source: 'manual',
      notes: null,
    })

    const cost = await getAppCost('app-1', '2026-07')
    expect(cost).toBe(1500) // 1000 propia + 500 ms (la de 2026-06 queda fuera)

    const rollup = await rollupAppCosts('app-1')
    expect(rollup['2026-07']).toBe(1500)
    expect(rollup['2026-06']).toBe(300)
  })
})
