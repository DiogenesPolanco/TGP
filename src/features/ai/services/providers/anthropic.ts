import type { AiProviderConfig, AiChatMessage, AiToolDefinition, AiChatResponse, AiProviderInterface } from '../../types'

export function createAnthropicProvider(config: AiProviderConfig): AiProviderInterface {
  const baseUrl = (config.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '')

  function toAnthropicMessages(msgs: AiChatMessage[]) {
    const systemParts: string[] = []
    const anthropicMessages: unknown[] = []

    for (const m of msgs) {
      if (m.role === 'system') {
        systemParts.push(m.content)
        continue
      }

      if (m.role === 'user') {
        if (m.toolCallId) {
          // tool_result: Anthropic lo envía como user con content blocks
          anthropicMessages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: m.toolCallId,
              content: m.content,
            }],
          })
        } else {
          anthropicMessages.push({
            role: 'user',
            content: m.content,
          })
        }
        continue
      }

      if (m.role === 'assistant') {
        const content: unknown[] = []
        if (m.content) {
          content.push({ type: 'text', text: m.content })
        }
        if (m.toolCalls) {
          for (const tc of m.toolCalls) {
            content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.arguments as Record<string, unknown>,
            })
          }
        }
        anthropicMessages.push({ role: 'assistant', content })
        continue
      }
    }

    return { system: systemParts.join('\n'), messages: anthropicMessages }
  }

  async function chat(
    messages: AiChatMessage[],
    tools?: AiToolDefinition[]
  ): Promise<AiChatResponse> {
    const { system, messages: anthropicMessages } = toAnthropicMessages(messages)

    const body: Record<string, unknown> = {
      model: config.model || 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: anthropicMessages,
    }

    if (system) {
      body.system = system
    }

    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }))
    }

    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Anthropic error (${res.status}): ${text}`)
    }

    const data = await res.json()
    const output: AiChatResponse = { content: '' }

    if (data.content && Array.isArray(data.content)) {
      const textParts: string[] = []
      const toolCalls: { id: string; name: string; arguments: Record<string, unknown> }[] = []

      for (const block of data.content) {
        if (block.type === 'text') {
          textParts.push(block.text)
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input as Record<string, unknown>,
          })
        }
      }

      output.content = textParts.join('\n')
      if (toolCalls.length > 0) {
        output.toolCalls = toolCalls
      }
    }

    return output
  }

  async function testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-opus-20240229',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        signal: AbortSignal.timeout(10000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async function getModels(): Promise<string[]> {
    return []
  }

  return { chat, testConnection, getModels }
}
