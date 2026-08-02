import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  updateConversationTitle,
  generateTitle,
  loadMessages,
  saveMessage,
  saveMessages,
  getOrCreateActiveConversation,
  countMessages,
  titleUntitledConversations,
} from '../services/chatStore'
import type { AiChatMessage } from '../types'

beforeEach(async () => {
  await db.aiConversations.clear()
  await db.aiMessages.clear()
})

const userMsg = (content: string, overrides: Partial<AiChatMessage> = {}): AiChatMessage => ({
  id: crypto.randomUUID(),
  role: 'user',
  content,
  timestamp: new Date(),
  ...overrides,
})

describe('generateTitle', () => {
  it('keeps short titles unchanged', () => {
    expect(generateTitle('Estado de Core Banking')).toBe('Estado de Core Banking')
  })

  it('strips common Spanish question prefixes', () => {
    expect(generateTitle('Cuál es el estado de la app?')).toBe('el estado de la app?')
    expect(generateTitle('Qué aplicaciones hay?')).toBe('aplicaciones hay?')
    expect(generateTitle('Cómo va el sprint?')).toBe('va el sprint?')
    expect(generateTitle('Dime los riesgos')).toBe('los riesgos')
    expect(generateTitle('Muéstrame las vulnerabilidades')).toBe('las vulnerabilidades')
    expect(generateTitle('Lista los candidatos')).toBe('los candidatos')
    expect(generateTitle('Busca aplicaciones por nombre')).toBe('aplicaciones por nombre')
  })

  it('strips the opening question mark but keeps the interrogative word', () => {
    expect(generateTitle('¿Cuál es el estado de la app?')).toBe('Cuál es el estado de la app?')
    expect(generateTitle('¿Cómo va el sprint?')).toBe('Cómo va el sprint?')
  })

  it('collapses whitespace', () => {
    expect(generateTitle('   múltiples    espacios   ')).toBe('múltiples espacios')
  })

  it('truncates titles longer than 55 chars at a word boundary', () => {
    const long =
      'Estamos revisando el estado de todas las aplicaciones del catalogo empresarial completo'
    const title = generateTitle(long)
    expect(title.length).toBeLessThanOrEqual(56)
    expect(title.endsWith('…')).toBe(true)
    expect(title).toBe('Estamos revisando el estado de todas las aplicaciones…')
  })
})

describe('conversation CRUD', () => {
  it('createConversation creates with default title and zero messages', async () => {
    const conv = await createConversation()
    expect(conv.id).toBeTruthy()
    expect(conv.title).toBe('Nueva conversación')
    expect(conv.messageCount).toBe(0)
    expect(conv.createdAt).toBeInstanceOf(Date)
  })

  it('createConversation honors an explicit title', async () => {
    const conv = await createConversation('Mi conversación')
    expect(conv.title).toBe('Mi conversación')
  })

  it('getConversation returns undefined for unknown id', async () => {
    expect(await getConversation('nope')).toBeUndefined()
  })

  it('listConversations orders by updatedAt desc', async () => {
    await db.aiConversations.bulkAdd([
      {
        id: 'conv-a',
        title: 'A',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        messageCount: 0,
      },
      {
        id: 'conv-b',
        title: 'B',
        createdAt: new Date('2026-01-01T00:00:01Z'),
        updatedAt: new Date('2026-01-01T00:00:01Z'),
        messageCount: 0,
      },
    ])
    await updateConversationTitle('conv-a', 'A updated')
    const list = await listConversations()
    expect(list.map((c) => c.id)).toEqual(['conv-a', 'conv-b'])
  })

  it('listConversations respects the limit', async () => {
    await createConversation('A')
    await createConversation('B')
    const list = await listConversations(1)
    expect(list).toHaveLength(1)
  })
})

describe('message persistence', () => {
  it('saveMessage stores a message and updates conversation count', async () => {
    const conv = await createConversation()
    await saveMessage(userMsg('hola'), conv.id)
    expect(await countMessages(conv.id)).toBe(1)
    const loaded = await loadMessages(conv.id)
    expect(loaded).toHaveLength(1)
    expect(loaded[0].content).toBe('hola')
    const updated = await getConversation(conv.id)
    expect(updated?.messageCount).toBe(1)
  })

  it('saveMessages offsets timestamps for deterministic ordering', async () => {
    const conv = await createConversation()
    await saveMessages(
      [userMsg('primero'), userMsg('segundo'), userMsg('tercero')],
      conv.id,
      'Título',
    )
    const loaded = await loadMessages(conv.id)
    expect(loaded.map((m) => m.content)).toEqual(['primero', 'segundo', 'tercero'])
    const ts = loaded.map((m) => m.timestamp.getTime())
    expect(ts[1] - ts[0]).toBe(1)
    expect(ts[2] - ts[1]).toBe(1)
    const convAfter = await getConversation(conv.id)
    expect(convAfter?.messageCount).toBe(3)
    expect(convAfter?.title).toBe('Título')
  })

  it('deleteConversation removes messages too', async () => {
    const conv = await createConversation()
    await saveMessages([userMsg('x'), userMsg('y')], conv.id)
    await deleteConversation(conv.id)
    expect(await getConversation(conv.id)).toBeUndefined()
    expect(await countMessages(conv.id)).toBe(0)
  })

  it('getOrCreateActiveConversation reuses the most recent conversation', async () => {
    await db.aiConversations.bulkAdd([
      {
        id: 'conv-old',
        title: 'Primera',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        messageCount: 0,
      },
      {
        id: 'conv-recent',
        title: 'Segunda',
        createdAt: new Date('2026-01-01T00:00:05Z'),
        updatedAt: new Date('2026-01-01T00:00:05Z'),
        messageCount: 0,
      },
    ])
    const active = await getOrCreateActiveConversation()
    expect(active.id).toBe('conv-recent')
  })

  it('getOrCreateActiveConversation creates one when none exist', async () => {
    const active = await getOrCreateActiveConversation()
    expect(active.id).toBeTruthy()
    const all = await listConversations()
    expect(all).toHaveLength(1)
  })

  it('titleUntitledConversations titles conversations from first user message', async () => {
    const conv = await createConversation()
    await saveMessages([userMsg('¿Cuál es el estado del sprint?')], conv.id)
    await titleUntitledConversations()
    const updated = await getConversation(conv.id)
    expect(updated?.title).toBe('Cuál es el estado del sprint?')
  })

  it('titleUntitledConversations marks empty conversations as vacía', async () => {
    await createConversation()
    await titleUntitledConversations()
    const all = await listConversations()
    expect(all[0].title).toBe('Conversación vacía')
  })

  it('titleUntitledConversations leaves titled conversations alone', async () => {
    const conv = await createConversation('Ya tiene título')
    await saveMessages([userMsg('mensaje')], conv.id)
    await titleUntitledConversations()
    const updated = await getConversation(conv.id)
    expect(updated?.title).toBe('Ya tiene título')
  })
})
