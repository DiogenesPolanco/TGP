import type {
  AiProviderConfig,
  AiChatMessage,
  AiToolDefinition,
  AiChatResponse,
  AiProviderInterface,
} from '../../types'
import { buildToolDefinitions } from '../AiProvider'

/**
 * OpenAI requiere que cada mensaje "tool" esté inmediatamente precedido por
 * un mensaje "assistant" con tool_calls que contenga el tool_call_id.
 * Como sortBy('timestamp') puede desordenar mensajes del mismo ms,
 * esta función reordena y empareja correctamente los pares.
 */
function pairToolMessages(msgs: AiChatMessage[]): AiChatMessage[] {
  const result: AiChatMessage[] = []
  const pendingToolIds = new Set<string>()

  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i]

    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      for (const tc of m.toolCalls) pendingToolIds.add(tc.id)
      result.push(m)
    } else if (m.role === 'tool') {
      if (m.toolCallId && pendingToolIds.has(m.toolCallId)) {
        result.push(m)
        pendingToolIds.delete(m.toolCallId)
      }
    } else {
      result.push(m)
    }
  }

  return result
}

export function createOpenAiProvider(config: AiProviderConfig): AiProviderInterface {
  const baseUrl = config.baseUrl.replace(/\/+$/, '')

  async function chat(
    messages: AiChatMessage[],
    tools?: AiToolDefinition[],
  ): Promise<AiChatResponse> {
    const paired = pairToolMessages(messages)
    const body: Record<string, unknown> = {
      model: config.model,
      messages: paired.map((m) => ({
        role: m.role === 'tool' ? 'tool' : m.role,
        content: m.content,
        ...(m.role === 'tool' ? { tool_call_id: m.toolCallId } : {}),
        ...(m.role === 'assistant' && m.toolCalls
          ? {
              tool_calls: m.toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function' as const,
                function: {
                  name: tc.name,
                  arguments: JSON.stringify(tc.arguments),
                },
              })),
            }
          : {}),
      })),
    }

    if (tools && tools.length > 0) {
      body.tools = buildToolDefinitions(tools)
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(
        `${config.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} error (${res.status}): ${text}`,
      )
    }

    const data = await res.json()
    const choice = data.choices?.[0]
    const output: AiChatResponse = { content: choice?.message?.content ?? '' }

    if (choice?.message?.tool_calls?.length > 0) {
      output.toolCalls = choice.message.tool_calls.map(
        (tc: { id: string; function: { name: string; arguments: string } }) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        }),
      )
    }

    return output
  }

  async function testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async function getModels(): Promise<string[]> {
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return []
      const data = await res.json()
      return (data.data ?? []).map((m: { id: string }) => m.id)
    } catch {
      return []
    }
  }

  return { chat, testConnection, getModels }
}
