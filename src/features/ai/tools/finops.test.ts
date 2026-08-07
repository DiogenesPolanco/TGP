import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { consultarCostosTool } from './finops'

describe('consultarCostosTool', () => {
  beforeEach(async () => {
    await db.applications.clear()
    await db.costEntries.clear()
  })

  it('resume el costo de una app en un periodo', async () => {
    await db.applications.add({
      id: 'app-x',
      businessUnitId: 'bu-1',
      name: 'App X',
      description: '',
      ownerId: 'u1',
      ownerName: 'O',
      criticality: 'high',
      architecture: 'monolithic',
      status: 'active',
      supportEndDate: null,
      technologies: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)
    await db.costEntries.add({
      id: 'c1',
      applicationId: 'app-x',
      microserviceId: null,
      categoryId: 'cloud',
      amount: 2500,
      currency: 'USD',
      period: '2026-07',
      source: 'manual',
      notes: null,
      createdAt: '',
      updatedAt: '',
    } as never)

    const out = await consultarCostosTool.execute({ applicationId: 'app-x', period: '2026-07' })
    expect(out).toContain('2500')
  })

  it('informa si no hay datos', async () => {
    await db.applications.add({
      id: 'app-vacia',
      businessUnitId: 'bu-1',
      name: 'App Vacía',
      description: '',
      ownerId: 'u1',
      ownerName: 'O',
      criticality: 'low',
      architecture: 'monolithic',
      status: 'active',
      supportEndDate: null,
      technologies: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    const out = await consultarCostosTool.execute({ applicationId: 'app-vacia', period: '2026-07' })
    expect(out).toContain('sin datos')
  })
})
