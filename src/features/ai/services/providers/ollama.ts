import type {
  AiProviderConfig,
  AiChatMessage,
  AiToolDefinition,
  AiChatResponse,
  AiProviderInterface,
} from '../../types'

export function createOllamaProvider(config: AiProviderConfig): AiProviderInterface {
  const baseUrl = config.baseUrl.replace(/\/+$/, '')

  async function chat(
    messages: AiChatMessage[],
    tools?: AiToolDefinition[],
  ): Promise<AiChatResponse> {
    const body: Record<string, unknown> = {
      model: config.model,
      messages: messages.map((m) => ({
        role: m.role === 'tool' ? 'tool' : m.role,
        content: m.content,
        ...(m.role === 'tool' ? { tool_call_id: m.toolCallId } : {}),
        ...(m.role === 'assistant' && m.toolCalls
          ? {
              tool_calls: m.toolCalls.map((tc) => ({
                function: {
                  name: tc.name,
                  // Ollama espera arguments como objeto, no como string
                  arguments:
                    typeof tc.arguments === 'string'
                      ? (() => {
                          try {
                            return JSON.parse(tc.arguments)
                          } catch {
                            return tc.arguments
                          }
                        })()
                      : tc.arguments,
                },
              })),
            }
          : {}),
      })),
      stream: false,
    }

    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))
    }

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Ollama error (${res.status}): ${text}`)
    }

    const data = await res.json()
    const output: AiChatResponse = { content: data.message?.content ?? '' }

    if (data.message?.tool_calls?.length > 0) {
      output.toolCalls = data.message.tool_calls.map(
        (tc: { function: { name: string; arguments: unknown } }) => ({
          id: crypto.randomUUID(),
          name: tc.function.name,
          arguments:
            typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : (tc.function.arguments as Record<string, unknown>),
        }),
      )
    }

    return output
  }

  async function testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async function getModels(): Promise<string[]> {
    try {
      const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) return []
      const data = await res.json()
      return (data.models ?? []).map((m: { name: string }) => m.name)
    } catch {
      return []
    }
  }

  return { chat, testConnection, getModels }
}
