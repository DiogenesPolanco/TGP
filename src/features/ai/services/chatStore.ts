import { db } from '@/services/db/database'
import type { AiConversation, AiChatMessage } from '../types'

export async function createConversation(title?: string): Promise<AiConversation> {
  const conv: AiConversation = {
    id: crypto.randomUUID(),
    title: title || 'Nueva conversación',
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 0,
  }
  await db.aiConversations.add(conv)
  return conv
}

export async function listConversations(limit = 50): Promise<AiConversation[]> {
  return db.aiConversations
    .orderBy('updatedAt')
    .reverse()
    .limit(limit)
    .toArray()
}

export async function getConversation(id: string): Promise<AiConversation | undefined> {
  return db.aiConversations.get(id)
}

export async function deleteConversation(id: string): Promise<void> {
  await db.aiMessages.where('conversationId').equals(id).delete()
  await db.aiConversations.delete(id)
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await db.aiConversations.update(id, { title, updatedAt: new Date() })
}

export function generateTitle(content: string): string {
  const cleaned = content
    .replace(/^(¿|¡|Cu[áa]l es|Qu[eé] |C[óo]mo |Dime |Mu[eé]strame |List[aeo] |Busca )/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  const maxLen = 55
  if (cleaned.length <= maxLen) return cleaned
  return cleaned.slice(0, maxLen).replace(/\s+\S*$/, '') + '…'
}

export async function loadMessages(conversationId: string): Promise<AiChatMessage[]> {
  return db.aiMessages
    .where('conversationId')
    .equals(conversationId)
    .sortBy('timestamp')
}

export async function saveMessage(msg: AiChatMessage, conversationId: string): Promise<void> {
  // Usamos el mismo patrón que saveMessages para timestamps consistentes
  const toStore: AiChatMessage = { ...msg, conversationId, timestamp: new Date(Date.now()) }
  await db.aiMessages.put(toStore)
  await db.aiConversations.update(conversationId, {
    updatedAt: new Date(),
    messageCount: (await db.aiMessages.where('conversationId').equals(conversationId).count()),
  })
}

export async function saveMessages(messages: AiChatMessage[], conversationId: string, title?: string): Promise<void> {
  // Offset timestamps by index to guarantee deterministic ordering via sortBy('timestamp').
  // Without this, multiple messages created in the same millisecond get arbitrary order.
  const now = Date.now()
  const toStore = messages.map((m, i) => ({
    ...m,
    conversationId,
    timestamp: new Date(now + i),
  }))
  await db.aiMessages.bulkPut(toStore)
  await db.aiConversations.update(conversationId, {
    title: title || undefined,
    updatedAt: new Date(),
    messageCount: toStore.length,
  })
}

export async function getOrCreateActiveConversation(): Promise<AiConversation> {
  const recent = await db.aiConversations
    .orderBy('updatedAt')
    .reverse()
    .limit(1)
    .toArray()

  if (recent.length > 0) {
    return recent[0]
  }

  return createConversation()
}

export async function countMessages(conversationId: string): Promise<number> {
  return db.aiMessages.where('conversationId').equals(conversationId).count()
}

export async function titleUntitledConversations(): Promise<void> {
  const all = await db.aiConversations.toArray()
  const untitled = all.filter((c) => !c.title || c.title === 'Nueva conversación')

  for (const conv of untitled) {
    const msgCount = await db.aiMessages.where('conversationId').equals(conv.id).count()
    const firstUserMsg = msgCount > 0
      ? await db.aiMessages.where('conversationId').equals(conv.id).filter((m) => m.role === 'user').first()
      : null

    const update: Record<string, unknown> = { messageCount: msgCount, updatedAt: new Date() }
    if (firstUserMsg?.content) {
      update.title = generateTitle(firstUserMsg.content)
    } else {
      update.title = 'Conversación vacía'
    }
    await db.aiConversations.update(conv.id, update)
  }
}
