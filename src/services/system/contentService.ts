import { db } from '@/services/db/database'
import type { ContentBlock } from '@/types/system'

export async function getContent<T = unknown>(key: string): Promise<T | null> {
  const entry = await db.contentBlocks.get(key)
  return entry ? (entry.content as T) : null
}

export async function setContent<T = unknown>(
  key: string,
  content: T,
  description?: string,
): Promise<void> {
  await db.contentBlocks.put({
    key,
    content,
    description: description ?? '',
    updatedAt: new Date().toISOString(),
  })
}

export async function getAllContent(): Promise<ContentBlock[]> {
  return db.contentBlocks.toArray()
}

export async function deleteContent(key: string): Promise<void> {
  await db.contentBlocks.delete(key)
}

export async function getContentOrDefault<T>(key: string, defaultValue: T): Promise<T> {
  const val = await getContent<T>(key)
  return val ?? defaultValue
}
