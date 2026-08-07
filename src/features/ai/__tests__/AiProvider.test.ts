import { describe, it, expect } from 'vitest'
import { createProvider, buildSystemPrompt, buildToolDefinitions } from '../services/AiProvider'
import type { AiProviderConfig, AiProviderType, AiToolDefinition } from '../types'

function makeConfig(provider: AiProviderType): AiProviderConfig {
  return {
    id: 'cfg-1',
    userId: 'user-1',
    provider,
    baseUrl: 'http://localhost:11434',
    apiKey: 'sk-test',
    model: 'test-model',
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
      finops: false,
    },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }
}

describe('createProvider', () => {
  it('returns a provider interface for each supported type', () => {
    for (const provider of ['ollama', 'groq', 'openai', 'anthropic'] as AiProviderType[]) {
      const p = createProvider(makeConfig(provider))
      expect(typeof p.chat).toBe('function')
      expect(typeof p.testConnection).toBe('function')
      expect(typeof p.getModels).toBe('function')
    }
  })

  it('throws for an unsupported provider', () => {
    expect(() =>
      createProvider({ ...makeConfig('ollama'), provider: 'weird' as AiProviderType }),
    ).toThrow('Provider not supported: weird')
  })
})

describe('buildSystemPrompt', () => {
  const allOn: AiProviderConfig['dataPermissions'] = {
    catalogo: true,
    seguridad: true,
    gobierno: true,
    estrategia: true,
    ejecucion: true,
    personas: true,
    reclutamiento: true,
    equipamiento: true,
    finops: true,
  }
  const allOff: AiProviderConfig['dataPermissions'] = {
    catalogo: false,
    seguridad: false,
    gobierno: false,
    estrategia: false,
    ejecucion: false,
    personas: false,
    reclutamiento: false,
    equipamiento: false,
    finops: false,
  }

  it('includes a DATOS DISPONIBLES section', () => {
    expect(buildSystemPrompt(allOn)).toContain('DATOS DISPONIBLES:')
  })

  it('lists table names for enabled permissions', () => {
    const prompt = buildSystemPrompt(allOn)
    expect(prompt).toContain('catalogo: applications, technologies, microservices')
    expect(prompt).toContain('seguridad: vulnerabilities, incidents')
    expect(prompt).toContain('gobierno: risks, auditFindings')
    expect(prompt).toContain('estrategia: objectives, healthIndexHistory')
    expect(prompt).toContain('ejecucion: plans, activities, tasks, commitments')
    expect(prompt).toContain('personas: teams, memberProfiles, sprintRecords')
    expect(prompt).toContain('reclutamiento: candidates, candidateTechnologies')
    expect(prompt).toContain('equipamiento: equipment, equipmentAssignments')
  })

  it('omits disabled permissions from DATOS DISPONIBLES', () => {
    const prompt = buildSystemPrompt({
      ...allOff,
      catalogo: true,
      ejecucion: true,
    })
    expect(prompt).toContain('• catalogo: applications')
    expect(prompt).toContain('• ejecucion: plans')
    expect(prompt).not.toContain('seguridad:')
    expect(prompt).not.toContain('estrategia:')
    expect(prompt).not.toContain('equipamiento:')
  })

  it('shows "- Ninguno." when no permissions are enabled', () => {
    expect(buildSystemPrompt(allOff)).toContain('- Ninguno.')
  })

  it('always includes RELACIONES and INSTRUCCIONES sections', () => {
    const prompt = buildSystemPrompt(allOff)
    expect(prompt).toContain('RELACIONES:')
    expect(prompt).toContain('INSTRUCCIONES:')
  })
})

describe('buildToolDefinitions', () => {
  const tools: AiToolDefinition[] = [
    {
      name: 'buscar_aplicacion',
      description: 'Busca aplicaciones',
      parameters: { type: 'object', properties: {} },
      execute: async () => '[]',
    },
    {
      name: 'consultar_datos',
      description: 'Consulta datos',
      parameters: { type: 'object', properties: {} },
      execute: async () => '[]',
    },
  ]

  it('maps tools to the OpenAI function-calling shape', () => {
    const defs = buildToolDefinitions(tools) as Array<{
      type: string
      function: { name: string; description: string; parameters: unknown }
    }>
    expect(defs).toHaveLength(2)
    expect(defs[0]).toEqual({
      type: 'function',
      function: {
        name: 'buscar_aplicacion',
        description: 'Busca aplicaciones',
        parameters: tools[0].parameters,
      },
    })
    expect(defs[1].function.name).toBe('consultar_datos')
  })
})
