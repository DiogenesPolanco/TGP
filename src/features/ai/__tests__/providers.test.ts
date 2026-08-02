import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createOllamaProvider } from '../services/providers/ollama'
import { createGroqProvider } from '../services/providers/groq'
import { createOpenAiProvider } from '../services/providers/openai'
import { createAnthropicProvider } from '../services/providers/anthropic'
import type { AiProviderConfig, AiChatMessage, AiToolDefinition } from '../types'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const config: AiProviderConfig = {
  id: 'cfg-1',
  userId: 'user-1',
  provider: 'ollama',
  baseUrl: 'http://localhost:11434/',
  apiKey: 'sk-test',
  model: 'llama3.2',
  enabled: true,
  dataPermissions: {
    catalogo: true,
    seguridad: true,
    gobierno: true,
    estrategia: false,
    ejecucion: true,
    personas: true,
    reclutamiento: false,
    equipamiento: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

const tool: AiToolDefinition = {
  name: 'buscar_aplicacion',
  description: 'Busca aplicaciones',
  parameters: { type: 'object', properties: { nombre: { type: 'string' } } },
  execute: async () => '[]',
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }
}

describe('ollama provider', () => {
  it('normalizes trailing slashes in baseUrl', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: { content: 'hola' } }))
    const p = createOllamaProvider(config)
    await p.chat([{ role: 'user', content: 'hola', id: 'm1', timestamp: new Date() }])
    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:11434/api/chat')
  })

  it('sends tool_calls arguments as an object, not a string', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: { content: '' } }))
    const p = createOllamaProvider(config)
    const msgs: AiChatMessage[] = [
      {
        role: 'assistant',
        content: '',
        id: 'a1',
        timestamp: new Date(),
        toolCalls: [
          {
            id: 'tc-1',
            name: 'buscar_aplicacion',
            arguments: { nombre: 'Core Banking' },
          },
        ],
      },
      {
        role: 'tool',
        content: '["ok"]',
        toolCallId: 'tc-1',
        id: 't1',
        timestamp: new Date(),
      },
    ]
    await p.chat(msgs, [tool])
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body as string)
    expect(body.tools).toBeDefined()
    expect(body.stream).toBe(false)
    const assistantMsg = body.messages.find((m: { role: string }) => m.role === 'assistant')
    expect(typeof assistantMsg.tool_calls[0].function.arguments).toBe('object')
    expect(assistantMsg.tool_calls[0].function.arguments.nombre).toBe('Core Banking')
  })

  it('parses string tool_calls arguments from the response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        message: {
          content: '',
          tool_calls: [{ function: { name: 'buscar_aplicacion', arguments: '{"nombre":"Core"}' } }],
        },
      }),
    )
    const p = createOllamaProvider(config)
    const res = await p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }])
    expect(res.toolCalls).toHaveLength(1)
    expect(res.toolCalls![0].name).toBe('buscar_aplicacion')
    expect(res.toolCalls![0].arguments).toEqual({ nombre: 'Core' })
    expect(res.toolCalls![0].id).toBeTruthy()
  })

  it('passes object tool_calls arguments through unchanged', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        message: {
          content: '',
          tool_calls: [{ function: { name: 'x', arguments: { clave: 1 } } }],
        },
      }),
    )
    const p = createOllamaProvider(config)
    const res = await p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }])
    expect(res.toolCalls![0].arguments).toEqual({ clave: 1 })
  })

  it('throws a descriptive error on non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' })
    const p = createOllamaProvider(config)
    await expect(
      p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }]),
    ).rejects.toThrow('Ollama error (500): boom')
  })

  it('testConnection hits /api/tags and returns ok', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    const p = createOllamaProvider(config)
    expect(await p.testConnection()).toBe(true)
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:11434/api/tags')
  })

  it('getModels maps data.models names', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ models: [{ name: 'llama3.2' }, { name: 'mistral' }] }),
    )
    const p = createOllamaProvider(config)
    expect(await p.getModels()).toEqual(['llama3.2', 'mistral'])
  })
})

describe('groq provider', () => {
  const groqConfig = {
    ...config,
    provider: 'groq' as const,
    baseUrl: 'https://api.groq.com/openai/v1/',
  }

  it('posts to /chat/completions with bearer auth', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ choices: [{ message: { content: 'hola' } }] }))
    const p = createGroqProvider(groqConfig)
    await p.chat([{ role: 'user', content: 'hola', id: 'm1', timestamp: new Date() }], [tool])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer sk-test')
    const body = JSON.parse(init.body as string)
    expect(body.model).toBe('llama3.2')
    expect(body.tool_choice).toBe('auto')
    expect(body.tools).toHaveLength(1)
  })

  it('maps tool messages with tool_call_id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ choices: [{ message: { content: 'ok' } }] }))
    const p = createGroqProvider(groqConfig)
    const msgs: AiChatMessage[] = [
      { role: 'user', content: 'x', id: 'm1', timestamp: new Date() },
      { role: 'tool', content: '["r"]', toolCallId: 'tc-1', id: 'm2', timestamp: new Date() },
    ]
    await p.chat(msgs)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    const toolMsg = body.messages.find((m: { role: string }) => m.role === 'tool')
    expect(toolMsg.tool_call_id).toBe('tc-1')
  })

  it('retries on 429 rate-limit errors up to MAX_RETRIES', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit. Please try again in 0.01s.',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit. Please try again in 0.01s.',
      })
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: 'finally' } }] }))
    const p = createGroqProvider(groqConfig)
    const res = await p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }])
    expect(res.content).toBe('finally')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('gives up after MAX_RETRIES and rethrows', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit. Please try again in 0.01s.',
    })
    const p = createGroqProvider(groqConfig)
    await expect(
      p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }]),
    ).rejects.toThrow('Groq error (429)')
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('rescues a legacy <function=name> tool call from a 400 response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: {
            failed_generation: '<function=buscar_aplicacion> {"nombre": "Core"}</function>',
          },
        }),
    })
    const p = createGroqProvider(groqConfig)
    const res = await p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }])
    expect(res.toolCalls).toHaveLength(1)
    expect(res.toolCalls![0].name).toBe('buscar_aplicacion')
    expect(res.toolCalls![0].arguments).toEqual({ nombre: 'Core' })
  })

  it('recovers from a leading-comma legacy format', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: {
            failed_generation: '<function=buscar_aplicacion> , "nombre": "Core"}</function>',
          },
        }),
    })
    const p = createGroqProvider(groqConfig)
    const res = await p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }])
    expect(res.toolCalls![0].arguments).toEqual({ nombre: 'Core' })
  })

  it('throws when the 400 has no rescusable generation', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'just text' })
    const p = createGroqProvider(groqConfig)
    await expect(
      p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }]),
    ).rejects.toThrow('Groq error (400)')
  })

  it('parses native tool_calls from a successful response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                { id: 'c1', function: { name: 'consultar_datos', arguments: '{"tabla":"apps"}' } },
              ],
            },
          },
        ],
      }),
    )
    const p = createGroqProvider(groqConfig)
    const res = await p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }])
    expect(res.toolCalls![0]).toEqual({
      id: 'c1',
      name: 'consultar_datos',
      arguments: { tabla: 'apps' },
    })
  })

  it('testConnection checks /models', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    const p = createGroqProvider(groqConfig)
    expect(await p.testConnection()).toBe(true)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.groq.com/openai/v1/models')
  })

  it('getModels maps data.data ids', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ id: 'llama' }, { id: 'mixtral' }] }))
    const p = createGroqProvider(groqConfig)
    expect(await p.getModels()).toEqual(['llama', 'mixtral'])
  })
})

describe('openai provider', () => {
  const openaiConfig = {
    ...config,
    provider: 'openai' as const,
    baseUrl: 'https://api.openai.com/v1/',
  }

  it('posts to /chat/completions with bearer auth', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ choices: [{ message: { content: 'hi' } }] }))
    const p = createOpenAiProvider(openaiConfig)
    await p.chat([{ role: 'user', content: 'hi', id: 'm1', timestamp: new Date() }], [tool])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer sk-test')
  })

  it('pairs tool messages with their preceding assistant tool_calls', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ choices: [{ message: { content: 'ok' } }] }))
    const p = createOpenAiProvider(openaiConfig)
    const msgs: AiChatMessage[] = [
      { role: 'user', content: 'x', id: 'm1', timestamp: new Date() },
      {
        role: 'assistant',
        content: '',
        id: 'a1',
        timestamp: new Date(),
        toolCalls: [{ id: 'tc-1', name: 'buscar_aplicacion', arguments: { nombre: 'Core' } }],
      },
      { role: 'tool', content: '["ok"]', toolCallId: 'tc-1', id: 't1', timestamp: new Date() },
    ]
    await p.chat(msgs)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.messages).toHaveLength(3)
    const toolMsg = body.messages.find((m: { role: string }) => m.role === 'tool')
    expect(toolMsg.tool_call_id).toBe('tc-1')
    const assistantMsg = body.messages.find((m: { role: string }) => m.role === 'assistant')
    expect(assistantMsg.tool_calls[0].function.arguments).toBe('{"nombre":"Core"}')
  })

  it('drops orphan tool messages without a matching assistant tool_call', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ choices: [{ message: { content: 'ok' } }] }))
    const p = createOpenAiProvider(openaiConfig)
    const msgs: AiChatMessage[] = [
      { role: 'user', content: 'x', id: 'm1', timestamp: new Date() },
      { role: 'tool', content: '["r"]', toolCallId: 'orphan-1', id: 'm2', timestamp: new Date() },
    ]
    await p.chat(msgs)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.messages).toHaveLength(1)
    expect(body.messages[0].role).toBe('user')
  })

  it('parses native tool_calls and throws openai-specific error', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        choices: [
          { message: { tool_calls: [{ id: 'c1', function: { name: 't', arguments: '{}' } }] } },
        ],
      }),
    )
    const p = createOpenAiProvider(openaiConfig)
    const res = await p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }])
    expect(res.toolCalls![0].name).toBe('t')
  })

  it('throws descriptive error on non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => 'unauthorized' })
    const p = createOpenAiProvider(openaiConfig)
    await expect(
      p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }]),
    ).rejects.toThrow('OpenAI error (401): unauthorized')
  })
})

describe('anthropic provider', () => {
  const anthropicConfig = {
    ...config,
    provider: 'anthropic' as const,
    baseUrl: 'https://api.anthropic.com/',
  }

  it('posts to /v1/messages with x-api-key and version headers', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: [{ type: 'text', text: 'hola' }] }))
    const p = createAnthropicProvider(anthropicConfig)
    await p.chat([{ role: 'user', content: 'hola', id: 'm1', timestamp: new Date() }])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init.headers['x-api-key']).toBe('sk-test')
    expect(init.headers['anthropic-version']).toBe('2023-06-01')
  })

  it('extracts system messages into the top-level system field', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: [{ type: 'text', text: 'ok' }] }))
    const p = createAnthropicProvider(anthropicConfig)
    const msgs: AiChatMessage[] = [
      { role: 'system', content: 'Eres un asistente.', id: 's1', timestamp: new Date() },
      { role: 'user', content: 'hola', id: 'm1', timestamp: new Date() },
    ]
    await p.chat(msgs)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.system).toBe('Eres un asistente.')
    expect(body.messages).toHaveLength(1)
    expect(body.messages[0].role).toBe('user')
  })

  it('maps tool results to tool_result content blocks', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: [{ type: 'text', text: 'ok' }] }))
    const p = createAnthropicProvider(anthropicConfig)
    const msgs: AiChatMessage[] = [
      { role: 'user', content: '["r"]', toolCallId: 'tc-1', id: 'm1', timestamp: new Date() },
    ]
    await p.chat(msgs)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.messages[0].content).toEqual([
      { type: 'tool_result', tool_use_id: 'tc-1', content: '["r"]' },
    ])
  })

  it('maps assistant tool_calls to tool_use blocks', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: [{ type: 'text', text: 'ok' }] }))
    const p = createAnthropicProvider(anthropicConfig)
    const msgs: AiChatMessage[] = [
      {
        role: 'assistant',
        content: 'pensando',
        id: 'a1',
        timestamp: new Date(),
        toolCalls: [{ id: 'tc-1', name: 'buscar_aplicacion', arguments: { nombre: 'Core' } }],
      },
    ]
    await p.chat(msgs)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    const assistant = body.messages[0]
    expect(assistant.content).toContainEqual({ type: 'text', text: 'pensando' })
    expect(assistant.content).toContainEqual({
      type: 'tool_use',
      id: 'tc-1',
      name: 'buscar_aplicacion',
      input: { nombre: 'Core' },
    })
  })

  it('parses text and tool_use blocks from the response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        content: [
          { type: 'text', text: 'Resultado:' },
          { type: 'tool_use', id: 'tc-9', name: 'consultar_datos', input: { tabla: 'apps' } },
        ],
      }),
    )
    const p = createAnthropicProvider(anthropicConfig)
    const res = await p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }])
    expect(res.content).toBe('Resultado:')
    expect(res.toolCalls).toEqual([
      { id: 'tc-9', name: 'consultar_datos', arguments: { tabla: 'apps' } },
    ])
  })

  it('throws descriptive error on non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, text: async () => 'rate limited' })
    const p = createAnthropicProvider(anthropicConfig)
    await expect(
      p.chat([{ role: 'user', content: 'x', id: 'm1', timestamp: new Date() }]),
    ).rejects.toThrow('Anthropic error (429): rate limited')
  })

  it('testConnection posts a ping message', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    const p = createAnthropicProvider(anthropicConfig)
    expect(await p.testConnection()).toBe(true)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.max_tokens).toBe(10)
    expect(body.messages).toEqual([{ role: 'user', content: 'ping' }])
  })
})
