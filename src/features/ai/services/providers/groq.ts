import type {
  AiProviderConfig,
  AiChatMessage,
  AiToolDefinition,
  AiChatResponse,
  AiProviderInterface,
} from '../../types'
import { buildToolDefinitions } from '../AiProvider'

/**
 * Parsea el formato legacy <function=name> args </function> que algunos
 * modelos de Groq (llama-3.1-8b-instant) generan en lugar del formato
 * nativo tool_calls.
 *
 * Formato esperado:
 *   <function=nombre> { "key": "val" } </function>
 *   <function=nombre> , "key": "val", "key2": "val2" }</function>  ← con leading comma
 */
function parseLegacyFunctionCall(
  text: string,
): { name: string; arguments: Record<string, unknown>; id: string } | null {
  // Groq puede devolver tanto </function> (con slash, estándar XML) como
  // <function> (sin slash, formato legacy Groq). Aceptamos ambos.
  const match = text.match(/<function=(\w+)>([\s\S]*?)<\/?function>/)
  if (!match) return null

  const name = match[1]
  let raw = match[2].trim()

  // Si la raw empieza con leading comma, agregar la llave faltante
  if (!raw.startsWith('{')) {
    if (raw.startsWith(',')) {
      raw = '{' + raw
    } else {
      raw = '{' + raw + '}'
    }
  }

  try {
    const args = JSON.parse(raw)
    return {
      name,
      arguments: args as Record<string, unknown>,
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    }
  } catch {
    return null
  }
}

/**
 * Dado un error body de Groq con tool_use_failed, intenta rescatar la
 * generación legacy <function> y devolver un AiChatResponse simulado.
 */
function tryRescueToolCall(text: string): AiChatResponse | null {
  try {
    const body = JSON.parse(text) as {
      error?: { failed_generation?: string }
    }
    if (!body.error?.failed_generation) return null
    const parsed = parseLegacyFunctionCall(body.error.failed_generation)
    if (!parsed) return null
    return {
      content: '',
      toolCalls: [
        {
          id: parsed.id,
          name: parsed.name,
          arguments: parsed.arguments,
        },
      ],
    }
  } catch {
    return null
  }
}

export function createGroqProvider(config: AiProviderConfig): AiProviderInterface {
  const baseUrl = config.baseUrl.replace(/\/+$/, '')

  const MAX_RETRIES = 3

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  function isRateLimitError(err: unknown): boolean {
    return err instanceof Error && /Groq error \(429\)/.test(err.message)
  }

  function extractWaitMs(err: Error): number {
    const match = err.message.match(/try again in ([\d.]+)s/)
    let seconds = match ? parseFloat(match[1]) : 5
    seconds = Math.min(seconds, 60)
    const jitter = seconds * 0.2 * (Math.random() * 2 - 1)
    return Math.round((seconds + jitter) * 1000)
  }

  async function chatOnce(
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
      body.tool_choice = 'auto'
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
      // Algunos modelos Groq generan <function=name> legacy en lugar de tool_calls.
      // La API rechaza con 400, pero podemos rescatar la generación.
      const rescued = tryRescueToolCall(text)
      if (rescued) return rescued
      throw new Error(`Groq error (${res.status}): ${text}`)
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

  async function chat(
    messages: AiChatMessage[],
    tools?: AiToolDefinition[],
  ): Promise<AiChatResponse> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await chatOnce(messages, tools)
      } catch (err) {
        if (attempt >= MAX_RETRIES || !isRateLimitError(err)) throw err
        const waitMs = extractWaitMs(err as Error)
        await sleep(waitMs)
      }
    }
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
