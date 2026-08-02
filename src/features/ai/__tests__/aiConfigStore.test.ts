import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAiConfigStore } from '../store/aiConfigStore'
import { AI_PROVIDER_DEFAULTS } from '../types'

const STORE_KEY = 'tgp-ai-config'

beforeEach(() => {
  localStorage.clear()
  useAiConfigStore.setState({ configs: {} })
})

const baseConfig = {
  id: 'cfg-1',
  userId: 'user-1',
  provider: 'groq' as const,
  apiKey: 'sk-test',
  model: 'llama-3.1-8b-instant',
  enabled: true,
}

describe('aiConfigStore CRUD', () => {
  it('getConfig returns null when no config exists', () => {
    expect(useAiConfigStore.getState().getConfig('user-1')).toBeNull()
  })

  it('saveConfig creates a config with provider defaults', () => {
    const cfg = useAiConfigStore.getState().saveConfig('user-1', {
      provider: 'openai',
      apiKey: 'sk-123',
    })
    expect(cfg.provider).toBe('openai')
    expect(cfg.model).toBe(AI_PROVIDER_DEFAULTS.openai.model)
    expect(cfg.baseUrl).toBe(AI_PROVIDER_DEFAULTS.openai.baseUrl)
    expect(cfg.enabled).toBe(true)
    expect(cfg.createdAt).toBeInstanceOf(Date)
    expect(cfg.updatedAt).toBeInstanceOf(Date)
  })

  it('saveConfig merges into an existing config', () => {
    useAiConfigStore.getState().saveConfig('user-1', { provider: 'openai', apiKey: 'sk-1' })
    const updated = useAiConfigStore
      .getState()
      .saveConfig('user-1', { provider: 'openai', model: 'gpt-4o' })
    expect(updated.model).toBe('gpt-4o')
    expect(updated.apiKey).toBe('sk-1')
    expect(updated.provider).toBe('openai')
  })

  it('saveConfig persists to localStorage', () => {
    useAiConfigStore.getState().saveConfig('user-1', baseConfig)
    const raw = localStorage.getItem(STORE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.configs['user-1'].model).toBe('llama-3.1-8b-instant')
  })

  it('removeConfig deletes the config', () => {
    useAiConfigStore.getState().saveConfig('user-1', baseConfig)
    useAiConfigStore.getState().removeConfig('user-1')
    expect(useAiConfigStore.getState().getConfig('user-1')).toBeNull()
  })

  it('default permissions enable the core domains and disable optional ones', () => {
    const cfg = useAiConfigStore.getState().saveConfig('user-1', baseConfig)
    expect(cfg.dataPermissions).toEqual({
      catalogo: true,
      seguridad: true,
      gobierno: true,
      estrategia: false,
      ejecucion: true,
      personas: true,
      reclutamiento: false,
      equipamiento: false,
    })
  })

  it('updatePermission toggles a single permission and bumps updatedAt', async () => {
    useAiConfigStore.getState().saveConfig('user-1', baseConfig)
    useAiConfigStore.getState().updatePermission('user-1', 'estrategia', true)
    const cfg = useAiConfigStore.getState().getConfig('user-1')!
    expect(cfg.dataPermissions.estrategia).toBe(true)
    expect(cfg.dataPermissions.catalogo).toBe(true)
    useAiConfigStore.getState().updatePermission('user-1', 'catalogo', false)
    expect(useAiConfigStore.getState().getConfig('user-1')!.dataPermissions.catalogo).toBe(false)
  })

  it('updatePermission is a no-op for unknown user', () => {
    expect(() =>
      useAiConfigStore.getState().updatePermission('ghost', 'catalogo', false),
    ).not.toThrow()
  })
})

describe('schema migration', () => {
  function seedLegacyConfig(perms: Record<string, boolean>) {
    const legacy = {
      state: {
        configs: {
          'user-1': {
            id: 'cfg-old',
            userId: 'user-1',
            provider: 'groq',
            baseUrl: 'https://api.groq.com/openai/v1',
            apiKey: 'sk-old',
            model: 'llama-3.1-8b-instant',
            enabled: true,
            dataPermissions: perms,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      },
      version: 0,
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(legacy))
    useAiConfigStore.persist.rehydrate()
  }

  it('maps old commitments/tasks → ejecucion', () => {
    seedLegacyConfig({ commitments: true, tasks: true })
    const cfg = useAiConfigStore.getState().getConfig('user-1')!
    expect(cfg.dataPermissions.ejecucion).toBe(true)
  })

  it('maps old objectives → estrategia', () => {
    seedLegacyConfig({ objectives: true })
    const cfg = useAiConfigStore.getState().getConfig('user-1')!
    expect(cfg.dataPermissions.estrategia).toBe(true)
  })

  it('maps old team → personas', () => {
    seedLegacyConfig({ team: true })
    const cfg = useAiConfigStore.getState().getConfig('user-1')!
    expect(cfg.dataPermissions.personas).toBe(true)
  })

  it('maps old projects → catalogo', () => {
    seedLegacyConfig({ projects: true })
    const cfg = useAiConfigStore.getState().getConfig('user-1')!
    expect(cfg.dataPermissions.catalogo).toBe(true)
  })

  it('full legacy migration keeps defaults for unmapped domains', () => {
    seedLegacyConfig({ commitments: true, objectives: true })
    const cfg = useAiConfigStore.getState().getConfig('user-1')!
    expect(cfg.dataPermissions).toEqual({
      catalogo: true,
      seguridad: true,
      gobierno: true,
      estrategia: true,
      ejecucion: true,
      personas: true,
      reclutamiento: false,
      equipamiento: false,
    })
  })

  it('false legacy values are respected', () => {
    seedLegacyConfig({ commitments: false })
    const cfg = useAiConfigStore.getState().getConfig('user-1')!
    expect(cfg.dataPermissions.ejecucion).toBe(false)
  })

  it('does not migrate when the new schema keys already exist', () => {
    const cfg = useAiConfigStore.getState().saveConfig('user-1', {
      ...baseConfig,
      dataPermissions: {
        catalogo: false,
        seguridad: false,
        gobierno: false,
        estrategia: true,
        ejecucion: false,
        personas: false,
        reclutamiento: true,
        equipamiento: false,
      },
    })
    expect(cfg.dataPermissions).toEqual({
      catalogo: false,
      seguridad: false,
      gobierno: false,
      estrategia: true,
      ejecucion: false,
      personas: false,
      reclutamiento: true,
      equipamiento: false,
    })
  })
})

describe('groq model sanitization', () => {
  it('replaces known bad groq models with the fallback', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cfg = useAiConfigStore.getState().saveConfig('user-1', {
      provider: 'groq',
      model: 'llama3-70b-8192',
    })
    expect(cfg.model).toBe('llama-3.1-8b-instant')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('keeps valid groq models unchanged', () => {
    const cfg = useAiConfigStore.getState().saveConfig('user-1', {
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
    })
    expect(cfg.model).toBe('llama-3.1-70b-versatile')
  })

  it('does not sanitize non-groq providers', () => {
    const cfg = useAiConfigStore.getState().saveConfig('user-1', {
      provider: 'openai',
      model: 'llama3-70b-8192',
    })
    expect(cfg.model).toBe('llama3-70b-8192')
  })
})
