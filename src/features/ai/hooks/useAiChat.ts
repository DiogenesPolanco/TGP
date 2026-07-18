import { useState, useCallback } from 'react'
import type { AiChatMessage, AiProviderConfig } from '../types'
import { normalizeParams } from '../types'
import { createProvider, buildSystemPrompt } from '../services/AiProvider'
import { getEnabledTools } from '../tools/registry'

const MAX_ITERATIONS = 5

// Algunos modelos (especialmente Groq) devuelven los argumentos de tool calls
// como JSON plano en el content del assistant. Esto filtra esos blobs para
// que no aparezcan en la UI.
function stripToolCallJson(content: string): string {
  // Caso 1: el content es JSON puro {"key": value, ...}
  const trimmed = content.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed)
      return ''
    } catch {
      // No es JSON válido, continuar
    }
  }

  // Caso 2: JSON inline tipo "texto {"key": value, ...} más texto"
  // Solo removemos JSON planos de primer nivel (sin anidamiento profundo)
  const cleaned = content.replace(/\s*\{["']\w+["']\s*:\s*[^}]+?\}\s*/g, ' ').trim()
  return cleaned
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
}

export function useAiChat({ config }: UseAiChatOptions): UseAiChatReturn {
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!config.enabled) {
      setError('El asistente no está habilitado. Actívalo en configuración.')
      return
    }

    setIsLoading(true)
    setError(null)

    const userMsg: AiChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])

    try {
      const provider = createProvider(config)
      const systemPrompt = buildSystemPrompt(config.dataPermissions)
      const tools = getEnabledTools(config.dataPermissions)

      const history = [...messages, userMsg]
      const systemMsg: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: systemPrompt,
        timestamp: new Date(),
      }

      let currentMsgs = [systemMsg, ...history]
      let iteration = 0

      while (iteration < MAX_ITERATIONS) {
        const response = await provider.chat(currentMsgs, tools)

        if (response.toolCalls && response.toolCalls.length > 0 && tools.length > 0) {
          const assistantMsg: AiChatMessage = {
            id: crypto.randomUUID(),
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
            role: 'assistant',
            content: stripToolCallJson(response.content) || 'Listo.',
            timestamp: new Date(),
          }
          currentMsgs = [...currentMsgs, finalMsg]
          setMessages(currentMsgs.filter((m) => m.role !== 'system'))
          setIsLoading(false)
          return
        }
      }

      // Max iterations reached
      const timeoutMsg: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'La consulta requirió demasiados pasos. Por favor, sé más específico o prueba con una pregunta más simple.',
        timestamp: new Date(),
      }
      currentMsgs = [...currentMsgs, timeoutMsg]
      setMessages(currentMsgs.filter((m) => m.role !== 'system'))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)

      const errorMsg: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ Error: ${errorMessage}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [config, messages])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, sendMessage, isLoading, error, clearMessages }
}
