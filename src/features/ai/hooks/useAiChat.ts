import { useState, useCallback, useEffect, useRef } from 'react'
import type { AiChatMessage, AiProviderConfig, AiConversation } from '../types'
import { normalizeParams } from '../types'
import { createProvider, buildSystemPrompt } from '../services/AiProvider'
import { getEnabledTools } from '../tools/registry'
import {
  createConversation,
  listConversations,
  loadMessages,
  saveMessage,
  saveMessages,
  getOrCreateActiveConversation,
  deleteConversation,
  updateConversationTitle,
  generateTitle,
  titleUntitledConversations,
} from '../services/chatStore'

const MAX_ITERATIONS = 5

function stripToolCallJson(content: string): string {
  // Solo limpiamos si el contenido completo es un JSON tipo tool call
  // (tiene name + arguments), no para objetos JSON arbitrarios en medio del texto
  const trimmed = content.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && parsed.name && parsed.arguments) {
        return ''
      }
    } catch {
      // No es JSON válido, devolver el texto original
    }
  }
  return trimmed
}

// Ventana deslizante: mantiene system + user original + últimas N rondas de asistentes+tool
function pruneMessages(msgs: AiChatMessage[]): AiChatMessage[] {
  const MAX_ROUNDS = 3
  const systemMsg = msgs.find((m) => m.role === 'system')
  const firstUserIdx = msgs.findIndex((m) => m.role === 'user' && !m.toolCallId)
  const firstUser = firstUserIdx >= 0 ? msgs[firstUserIdx] : null

  // Tomar los últimos N bloques assistant+tool desde el final
  const suffix: AiChatMessage[] = []
  let rounds = 0
  for (let i = msgs.length - 1; i >= 0 && rounds < MAX_ROUNDS; i--) {
    const m = msgs[i]
    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      rounds++
    }
    suffix.unshift(m)
    if (rounds >= MAX_ROUNDS) break
  }

  const result: AiChatMessage[] = []
  if (systemMsg) result.push(systemMsg)
  if (firstUser && !result.some((m) => m.id === firstUser.id)) result.push(firstUser)
  // Evitar duplicar el user message si ya está en el suffix
  for (const m of suffix) {
    if (!result.some((r) => r.id === m.id)) result.push(m)
  }
  return result
}

interface UseAiChatOptions {
  config: AiProviderConfig
}

interface UseAiChatReturn {
  messages: AiChatMessage[]
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean
  error: string | null
  clearMessages: () => void
  conversations: AiConversation[]
  activeConversation: AiConversation | null
  switchConversation: (id: string) => Promise<void>
  newConversation: () => Promise<void>
  deleteConv: (id: string) => Promise<void>
}

export function useAiChat({ config }: UseAiChatOptions): UseAiChatReturn {
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<AiConversation | null>(null)
  const loadedConvRef = useRef<string | null>(null)
  const isSendingRef = useRef(false)

  useEffect(() => {
    (async () => {
      try {
        await titleUntitledConversations()
      } catch (e) {
        console.warn('Error titling conversations:', e)
      }
      const list = await listConversations()
      setConversations(list)
      const conv = await getOrCreateActiveConversation()
      setActiveConversation(conv)
      const msgs = await loadMessages(conv.id)
      setMessages(msgs)
      loadedConvRef.current = conv.id
    })()
  }, [])

  const refreshConversations = useCallback(async () => {
    const list = await listConversations()
    setConversations(list)
  }, [])

  const switchConversation = useCallback(async (id: string) => {
    const all = await listConversations(100)
    const target = all.find(c => c.id === id)
    if (!target) return
    setActiveConversation(target)
    const msgs = await loadMessages(id)
    setMessages(msgs)
    loadedConvRef.current = id
    setError(null)
  }, [])

  const newConversation = useCallback(async () => {
    const conv = await createConversation()
    setActiveConversation(conv)
    setMessages([])
    loadedConvRef.current = conv.id
    setError(null)
    await refreshConversations()
  }, [refreshConversations])

  const deleteConv = useCallback(async (id: string) => {
    await deleteConversation(id)
    const all = await listConversations()
    if (all.length === 0) {
      const conv = await createConversation()
      setActiveConversation(conv)
      setMessages([])
      loadedConvRef.current = conv.id
    } else {
      // If we deleted the active one, switch to the most recent
      if (activeConversation?.id === id) {
        setActiveConversation(all[0])
        const msgs = await loadMessages(all[0].id)
        setMessages(msgs)
        loadedConvRef.current = all[0].id
      }
    }
    await refreshConversations()
  }, [activeConversation, refreshConversations])

  const sendMessage = useCallback(async (content: string) => {
    if (!config.enabled || isSendingRef.current) {
      if (!config.enabled) setError('El asistente no está habilitado. Actívalo en configuración.')
      return
    }

    isSendingRef.current = true
    setIsLoading(true)
    setError(null)

    // Ensure we have an active conversation
    let conv = activeConversation
    if (!conv) {
      conv = await createConversation()
      setActiveConversation(conv)
      loadedConvRef.current = conv.id
      await refreshConversations()
    }
    const convId = conv.id

    const userMsg: AiChatMessage = {
      id: crypto.randomUUID(),
      conversationId: convId,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    await saveMessage(userMsg, convId)

    if (conv.title === 'Nueva conversación') {
      const title = generateTitle(content)
      await updateConversationTitle(convId, title)
      setActiveConversation((prev) => prev?.id === convId ? { ...prev, title } : prev)
    }

    try {
      const provider = createProvider(config)
      const systemPrompt = buildSystemPrompt(config.dataPermissions)
      const tools = getEnabledTools(config.dataPermissions)

      const systemMsg: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: systemPrompt,
        timestamp: new Date(),
      }

      let currentMsgs = [systemMsg, ...messages, userMsg]
      let iteration = 0

      while (iteration < MAX_ITERATIONS) {
        // Podar historial para no exceder ventana de contexto del modelo
        currentMsgs = pruneMessages(currentMsgs)
        const response = await provider.chat(currentMsgs, tools)

        if (response.toolCalls && response.toolCalls.length > 0 && tools.length > 0) {
          const assistantMsg: AiChatMessage = {
            id: crypto.randomUUID(),
            conversationId: convId,
            role: 'assistant',
            content: stripToolCallJson(response.content) || `Ejecutando ${response.toolCalls.length} consulta(s)...`,
            toolCalls: response.toolCalls,
            timestamp: new Date(),
          }
          currentMsgs = [...currentMsgs, assistantMsg]

          for (const toolCall of response.toolCalls) {
            const tool = tools.find((t) => t.name === toolCall.name)
            if (!tool) {
              const errorMsg: AiChatMessage = {
                id: crypto.randomUUID(),
                conversationId: convId,
                role: 'tool',
                content: `Error: Tool "${toolCall.name}" no encontrada`,
                toolCallId: toolCall.id,
                toolName: toolCall.name,
                timestamp: new Date(),
              }
              currentMsgs = [...currentMsgs, errorMsg]
              continue
            }

            try {
              const result = await tool.execute(normalizeParams(toolCall.arguments))
              const toolMsg: AiChatMessage = {
                id: crypto.randomUUID(),
                conversationId: convId,
                role: 'tool',
                content: result,
                toolCallId: toolCall.id,
                toolName: toolCall.name,
                timestamp: new Date(),
              }
              currentMsgs = [...currentMsgs, toolMsg]
            } catch (err) {
              const errorMsg: AiChatMessage = {
                id: crypto.randomUUID(),
                conversationId: convId,
                role: 'tool',
                content: `Error ejecutando ${toolCall.name}: ${err instanceof Error ? err.message : String(err)}`,
                toolCallId: toolCall.id,
                toolName: toolCall.name,
                timestamp: new Date(),
              }
              currentMsgs = [...currentMsgs, errorMsg]
            }
          }

          iteration++
        } else {
          const finalMsg: AiChatMessage = {
            id: crypto.randomUUID(),
            conversationId: convId,
            role: 'assistant',
            content: stripToolCallJson(response.content) || 'Listo.',
            timestamp: new Date(),
          }
          currentMsgs = [...currentMsgs, finalMsg]
          const displayMsgs = currentMsgs.filter((m) => m.role !== 'system')
          setMessages(displayMsgs)
          await saveMessages(displayMsgs, convId)
          await refreshConversations()
          setIsLoading(false)
          isSendingRef.current = false
          return
        }
      }

      // Max iterations
      const timeoutMsg: AiChatMessage = {
        id: crypto.randomUUID(),
        conversationId: convId,
        role: 'assistant',
        content: 'La consulta requirió demasiados pasos. Por favor, sé más específico o prueba con una pregunta más simple.',
        timestamp: new Date(),
      }
      currentMsgs = [...currentMsgs, timeoutMsg]
      const displayMsgs = currentMsgs.filter((m) => m.role !== 'system')
      setMessages(displayMsgs)
      await saveMessages(displayMsgs, convId)
      await refreshConversations()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      const errorMsg: AiChatMessage = {
        id: crypto.randomUUID(),
        conversationId: convId,
        role: 'assistant',
        content: `⚠️ Error: ${errorMessage}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
      await saveMessage(errorMsg, convId)
    } finally {
      setIsLoading(false)
      isSendingRef.current = false
    }
  }, [config, messages, activeConversation, refreshConversations])

  const clearMessages = useCallback(async () => {
    if (activeConversation) {
      await dbCleanMessages(activeConversation.id)
    }
    setMessages([])
    setError(null)
  }, [activeConversation])

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearMessages,
    conversations,
    activeConversation,
    switchConversation,
    newConversation,
    deleteConv,
  }
}

async function dbCleanMessages(conversationId: string) {
  const { db } = await import('@/services/db/database')
  await db.aiMessages.where('conversationId').equals(conversationId).delete()
}
