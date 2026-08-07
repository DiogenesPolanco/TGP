import { db } from '@/services/db/database'
import type { CostEntry, CostBudget } from '@/types/domain'

function generateId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

export interface CostEntryInput {
  applicationId: string
  microserviceId: string | null
  categoryId: string
  amount: number
  currency: string
  period: string
  source: CostEntry['source']
  notes: string | null
}

// ─── Partidas ───

export async function getCostEntries(
  filters: {
    period?: string
    applicationId?: string
    microserviceId?: string
    categoryId?: string
    source?: CostEntry['source']
  } = {},
): Promise<CostEntry[]> {
  let collection = db.costEntries.toCollection()
  if (filters.period) collection = collection.and((e) => e.period === filters.period)
  if (filters.applicationId)
    collection = collection.and((e) => e.applicationId === filters.applicationId)
  if (filters.microserviceId !== undefined)
    collection = collection.and((e) => e.microserviceId === filters.microserviceId)
  if (filters.categoryId) collection = collection.and((e) => e.categoryId === filters.categoryId)
  if (filters.source) collection = collection.and((e) => e.source === filters.source)
  return collection.sortBy('period')
}

export async function getCostEntry(id: string): Promise<CostEntry | undefined> {
  return db.costEntries.get(id)
}

export async function createCostEntry(data: CostEntryInput): Promise<string> {
  const id = generateId()
  const ts = nowIso()
  await db.costEntries.add({ ...data, id, createdAt: ts, updatedAt: ts })
  return id
}

export async function updateCostEntry(id: string, data: Partial<CostEntryInput>): Promise<void> {
  await db.costEntries.update(id, { ...data, updatedAt: nowIso() })
}

export async function deleteCostEntry(id: string): Promise<void> {
  await db.costEntries.delete(id)
}

export async function bulkCreateCostEntries(entries: CostEntryInput[]): Promise<number> {
  const ts = nowIso()
  const withIds = entries.map((e) => ({ ...e, id: generateId(), createdAt: ts, updatedAt: ts }))
  await db.costEntries.bulkAdd(withIds)
  return withIds.length
}

// ─── Rollup app + microservicios ───

export async function getAppMicroserviceIds(applicationId: string): Promise<string[]> {
  const micros = await db.microservices.where('applicationId').equals(applicationId).toArray()
  return micros.map((m) => m.id)
}

export async function getAppCost(applicationId: string, period?: string): Promise<number> {
  const own = await getCostEntries({ applicationId, period, microserviceId: null })
  const microIds = await getAppMicroserviceIds(applicationId)
  let total = own.reduce((sum, e) => sum + e.amount, 0)
  if (microIds.length > 0) {
    const all = await db.costEntries.toArray()
    for (const e of all) {
      if (e.microserviceId && microIds.includes(e.microserviceId)) {
        if (!period || e.period === period) total += e.amount
      }
    }
  }
  return total
}

export async function rollupAppCosts(applicationId: string): Promise<Record<string, number>> {
  const own = await getCostEntries({ applicationId, microserviceId: null })
  const microIds = await getAppMicroserviceIds(applicationId)
  const byPeriod: Record<string, number> = {}
  const add = (e: CostEntry) => {
    byPeriod[e.period] = (byPeriod[e.period] ?? 0) + e.amount
  }
  own.forEach(add)
  if (microIds.length > 0) {
    const all = await db.costEntries.toArray()
    for (const e of all) {
      if (e.microserviceId && microIds.includes(e.microserviceId)) add(e)
    }
  }
  return byPeriod
}

// ─── Presupuestos ───

export async function upsertCostBudget(
  applicationId: string,
  period: string,
  amount: number,
): Promise<string> {
  const existing = await db.costBudgets
    .where('applicationId')
    .equals(applicationId)
    .and((b) => b.period === period)
    .first()
  const ts = nowIso()
  if (existing) {
    await db.costBudgets.update(existing.id, { amount, updatedAt: ts })
    return existing.id
  }
  const id = generateId()
  await db.costBudgets.add({ id, applicationId, period, amount, createdAt: ts, updatedAt: ts })
  return id
}

export async function getCostBudgets(period?: string): Promise<CostBudget[]> {
  let collection = db.costBudgets.toCollection()
  if (period) collection = collection.and((b) => b.period === period)
  return collection.toArray()
}
