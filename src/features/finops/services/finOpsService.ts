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

// ─── Métricas dashboard ───

export interface DashboardMetrics {
  total: number
  previousTotal: number
  variationPct: number | null
  budgetPct: number | null
  byCategory: { categoryId: string; total: number }[]
  byBusinessUnit: { businessUnitId: string; name: string; total: number }[]
  topApps: { applicationId: string; name: string; total: number }[]
  trend12m: { period: string; total: number }[]
}

export function previousPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 2, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function shiftPeriod(period: string, offsetMonths: number): string {
  const [y, m] = period.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + offsetMonths, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function getDashboardMetrics(period: string): Promise<DashboardMetrics> {
  const entries = await db.costEntries.toArray()
  const current = entries.filter((e) => e.period === period)
  const prev = previousPeriod(period)
  const previous = entries.filter((e) => e.period === prev)

  const total = current.reduce((s, e) => s + e.amount, 0)
  const previousTotal = previous.reduce((s, e) => s + e.amount, 0)
  const variationPct =
    previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null

  const budgets = await getCostBudgets(period)
  const budgetTotal = budgets.reduce((s, b) => s + b.amount, 0)
  const budgetPct = budgetTotal > 0 ? Math.round((total / budgetTotal) * 100) : null

  const byCategoryMap = new Map<string, number>()
  const byAppMap = new Map<string, number>()
  for (const e of current) {
    byCategoryMap.set(e.categoryId, (byCategoryMap.get(e.categoryId) ?? 0) + e.amount)
    byAppMap.set(e.applicationId, (byAppMap.get(e.applicationId) ?? 0) + e.amount)
  }
  // rollup de microservicios hacia la app
  const apps = await db.applications.toArray()
  const appNames = new Map(apps.map((a) => [a.id, a.name]))
  const buNames = new Map(apps.map((a) => [a.id, a.businessUnitId]))
  const buNameMap = new Map<string, string>()
  const businessUnits = await db.businessUnits.toArray()
  businessUnits.forEach((b) => buNameMap.set(b.id, b.name))
  for (const e of entries) {
    if (e.microserviceId && e.period === period) {
      const micro = await db.microservices.get(e.microserviceId)
      if (micro && byAppMap.has(micro.applicationId)) {
        byAppMap.set(micro.applicationId, (byAppMap.get(micro.applicationId) ?? 0) + e.amount)
      }
    }
  }

  const byCategory = [...byCategoryMap.entries()]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total)

  const byBusinessUnitMap = new Map<string, number>()
  for (const [appId, appTotal] of byAppMap) {
    const buId = buNames.get(appId)
    if (!buId) continue
    byBusinessUnitMap.set(buId, (byBusinessUnitMap.get(buId) ?? 0) + appTotal)
  }
  const byBusinessUnit = [...byBusinessUnitMap.entries()].map(([businessUnitId, total]) => ({
    businessUnitId,
    name: buNameMap.get(businessUnitId) ?? 'Sin unidad',
    total,
  }))

  const topApps = [...byAppMap.entries()]
    .map(([applicationId, total]) => ({
      applicationId,
      name: appNames.get(applicationId) ?? 'App sin nombre',
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const trend12m: { period: string; total: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const p = shiftPeriod(period, -i)
    const pTotal = entries.filter((e) => e.period === p).reduce((s, e) => s + e.amount, 0)
    trend12m.push({ period: p, total: pTotal })
  }

  return {
    total,
    previousTotal,
    variationPct,
    budgetPct,
    byCategory,
    byBusinessUnit,
    topApps,
    trend12m,
  }
}

// ─── Distribución (prorrateo) ───

export interface DistributeCostInput {
  period: string
  totalAmount: number
  method: 'equal' | 'weighted' | 'byMicroserviceCount'
  appIds: string[]
  weights?: Record<string, number>
  notes?: string | null
}

export async function distributeCost(input: DistributeCostInput): Promise<number> {
  const { period, totalAmount, method, appIds, weights, notes } = input
  if (totalAmount <= 0) throw new Error('El monto total debe ser mayor a 0')
  if (appIds.length === 0) throw new Error('Selecciona al menos una aplicación')

  const amounts = new Map<string, number>()

  if (method === 'equal') {
    const each = totalAmount / appIds.length
    for (const appId of appIds) amounts.set(appId, each)
  } else if (method === 'weighted') {
    const w = weights ?? {}
    const entries = appIds.map((appId) => ({ appId, weight: w[appId] ?? 0 }))
    const totalWeight = entries.reduce((s, e) => s + e.weight, 0)
    if (totalWeight <= 0) throw new Error('Los pesos deben sumar más de 0')
    for (const e of entries) {
      amounts.set(e.appId, Math.round(((totalAmount * e.weight) / totalWeight) * 100) / 100)
    }
  } else {
    let totalMicros = 0
    const counts = new Map<string, number>()
    for (const appId of appIds) {
      const ids = await getAppMicroserviceIds(appId)
      counts.set(appId, ids.length)
      totalMicros += ids.length
    }
    if (totalMicros <= 0) {
      throw new Error('Ninguna aplicación tiene microservicios para prorratear')
    }
    for (const appId of appIds) {
      const c = counts.get(appId) ?? 0
      amounts.set(appId, Math.round(((totalAmount * c) / totalMicros) * 100) / 100)
    }
  }

  // corregir drift de redondeo en la última app
  const allocated = [...amounts.values()].reduce((s, v) => s + v, 0)
  const last = appIds[appIds.length - 1]
  amounts.set(last, Math.round(((amounts.get(last) ?? 0) + (totalAmount - allocated)) * 100) / 100)

  const entries: CostEntryInput[] = appIds.map((appId) => ({
    applicationId: appId,
    microserviceId: null,
    categoryId: 'distribution',
    amount: amounts.get(appId) ?? 0,
    currency: 'USD',
    period,
    source: 'allocation',
    notes: notes ?? `Distribución ${method}`,
  }))

  return bulkCreateCostEntries(entries)
}
