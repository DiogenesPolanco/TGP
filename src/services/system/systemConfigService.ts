import { db } from '@/services/db/database'
import type { SystemConfig } from '@/types/system'

export async function getConfig<T = unknown>(key: string): Promise<T | null> {
  const entry = await db.systemConfig.get(key)
  return entry ? (entry.value as T) : null
}

export async function setConfig<T = unknown>(key: string, value: T, description?: string): Promise<void> {
  await db.systemConfig.put({
    key,
    value,
    description: description ?? '',
    updatedAt: new Date().toISOString(),
  })
}

export async function getAllConfigs(): Promise<SystemConfig[]> {
  return db.systemConfig.toArray()
}

export async function deleteConfig(key: string): Promise<void> {
  await db.systemConfig.delete(key)
}

export async function getConfigOrDefault<T>(key: string, defaultValue: T): Promise<T> {
  const val = await getConfig<T>(key)
  return val ?? defaultValue
}
