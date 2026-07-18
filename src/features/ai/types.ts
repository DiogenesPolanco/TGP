export type AiProviderType = 'ollama' | 'groq' | 'openai' | 'anthropic'

export interface AiProviderConfig {
  id: string
  userId: string
  provider: AiProviderType
  baseUrl: string
  apiKey: string
  model: string
  enabled: boolean
  dataPermissions: {
    catalogo: boolean
    seguridad: boolean
    gobierno: boolean
    estrategia: boolean
    ejecucion: boolean
    personas: boolean
    reclutamiento: boolean
    equipamiento: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface AiChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: AiToolCall[]
  toolCallId?: string
  toolName?: string
  timestamp: Date
}

export interface AiToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface AiToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (params: Record<string, unknown>) => Promise<string>
}

export interface AiChatResponse {
  content: string
  toolCalls?: AiToolCall[]
}

export interface AiProviderInterface {
  chat(
    messages: AiChatMessage[],
    tools?: AiToolDefinition[]
  ): Promise<AiChatResponse>
  testConnection(): Promise<boolean>
  getModels(): Promise<string[]>
}

export const AI_PROVIDER_DEFAULTS: Record<AiProviderType, { baseUrl: string; model: string }> = {
  ollama: { baseUrl: 'http://localhost:11434', model: 'llama3.2' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.1-8b-instant' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-haiku-20240307' },
}

export function normalizeBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val === 1
  if (typeof val === 'string') return val === 'true' || val === 'True' || val === '1'
  return false
}

/**
 * Normaliza parámetros recibidos del LLM: convierte strings numéricas a number,
 * valores "true"/"false" a boolean, y elimina nulls.
 * Esto evita que Groq rechace tool calls por tipos incorrectos.
 */
export function normalizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(params)) {
    if (val === null || val === undefined) continue

    if (typeof val === 'string') {
      const trimmed = val.trim()
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') continue

      // "true" / "false" → boolean
      if (trimmed === 'true' || trimmed === 'True') { out[key] = true; continue }
      if (trimmed === 'false' || trimmed === 'False') { out[key] = false; continue }

      // Numérico → number (string vacío ya se filtró arriba)
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        out[key] = Number(trimmed)
        continue
      }
    }

    out[key] = val
  }
  return out
}
