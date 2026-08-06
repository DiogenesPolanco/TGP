import { db } from '@/services/db/database'
import type { CatalogEntry } from '@/types/system'

export async function getCatalog(category: string): Promise<CatalogEntry[]> {
  return db.catalogs
    .where('category')
    .equals(category)
    .filter((e) => e.enabled)
    .sortBy('sortOrder')
}

export async function getCatalogMap(category: string): Promise<Record<string, string>> {
  const entries = await getCatalog(category)
  const map: Record<string, string> = {}
  for (const e of entries) {
    map[e.value] = e.label
  }
  return map
}

export async function getCatalogValue(category: string, value: string): Promise<string | null> {
  const entry = await db.catalogs.where('[category+value]').equals([category, value]).first()
  return entry?.label ?? null
}

export async function getAllCategories(): Promise<string[]> {
  const entries = await db.catalogs.toArray()
  return [...new Set(entries.map((e) => e.category))].sort()
}

export async function upsertCatalogEntry(
  id: string | undefined,
  entry: Omit<CatalogEntry, 'id' | 'updatedAt'>,
): Promise<string> {
  const now = new Date().toISOString()
  if (id) {
    await db.catalogs.update(id, { ...entry, updatedAt: now })
    return id
  }
  const newId = crypto.randomUUID()
  await db.catalogs.add({ id: newId, ...entry, updatedAt: now })
  return newId
}

export async function deleteCatalogEntry(id: string): Promise<void> {
  await db.catalogs.delete(id)
}

export async function bulkUpsertCatalog(
  category: string,
  entries: {
    value: string
    label: string
    sortOrder?: number
    metadata?: Record<string, unknown>
  }[],
): Promise<void> {
  const existing = await db.catalogs.where('category').equals(category).toArray()
  const existingMap = new Map(existing.map((e) => [e.value, e]))

  await db.transaction('rw', db.catalogs, async () => {
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]
      const match = existingMap.get(e.value)
      const now = new Date().toISOString()
      if (match) {
        await db.catalogs.update(match.id, {
          label: e.label,
          sortOrder: e.sortOrder ?? i,
          metadata: e.metadata,
          enabled: true,
          updatedAt: now,
        })
      } else {
        await db.catalogs.add({
          id: crypto.randomUUID(),
          category,
          value: e.value,
          label: e.label,
          sortOrder: e.sortOrder ?? i,
          metadata: e.metadata,
          enabled: true,
          updatedAt: now,
        })
      }
    }
  })
}
