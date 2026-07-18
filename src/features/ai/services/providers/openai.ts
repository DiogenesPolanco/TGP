import type { AiProviderConfig, AiChatMessage, AiToolDefinition, AiChatResponse, AiProviderInterface } from '../../types'
import { buildToolDefinitions } from '../AiProvider'

export function createOpenAiProvider(config: AiProviderConfig): AiProviderInterface {
  const baseUrl = config.baseUrl.replace(/\/+$/, '')

  async function chat(
    messages: AiChatMessage[],
    tools?: AiToolDefinition[]
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
      throw new Error(`${config.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} error (${res.status}): ${text}`)
    }

    const data = await res.json()
    const choice = data.choices?.[0]
    const output: AiChatResponse = { content: choice?.message?.content ?? '' }

    if (choice?.message?.tool_calls?.length > 0) {
      output.toolCalls = choice.message.tool_calls.map((tc: { id: string; function: { name: string; arguments: string } }) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      }))
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
