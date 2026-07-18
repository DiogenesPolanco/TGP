import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AiProviderConfig, AiProviderType } from '../types'
import { AI_PROVIDER_DEFAULTS } from '../types'

// Migra configs viejas (commitments/objectives/team/sprints/projects)
// al nuevo schema de 8 dominios que cubre las 40+ tablas de TGP.
function migratePermissions(
  perms: Record<string, boolean>
): AiProviderConfig['dataPermissions'] {
  // Si ya tiene las nuevas claves, es el schema actual
  if ('catalogo' in perms) {
    return perms as AiProviderConfig['dataPermissions']
  }
  const defaults = getDefaultPermissions()
  // Si es schema viejo, mapear equivalencias
  // VIEJO → NUEVO
  // commitments, tasks → ejecucion
  // objectives → estrategia
  // team → personas
  // sprints → personas (está dentro de personas/sprints)
  // projects → catalogo
  if ('commitments' in perms) {
    defaults.ejecucion = perms.commitments ?? defaults.ejecucion
  }
  if ('objectives' in perms) {
    defaults.estrategia = perms.objectives ?? defaults.estrategia
  }
  if ('team' in perms) {
    defaults.personas = perms.team ?? defaults.personas
  }
  // sprints no tiene equivalencia directa, lo dejamos con el default (true)
  if ('projects' in perms) {
    defaults.catalogo = perms.projects ?? defaults.catalogo
  }
  return defaults
}

function getDefaultPermissions(): AiProviderConfig['dataPermissions'] {
  return {
    catalogo: true,
    seguridad: true,
    gobierno: true,
    estrategia: false,
    ejecucion: true,
    personas: true,
    reclutamiento: false,
    equipamiento: false,
  }
}

interface AiConfigState {
  configs: Record<string, AiProviderConfig>
  getConfig: (userId: string) => AiProviderConfig | null
  saveConfig: (userId: string, partial: Partial<AiProviderConfig> & { provider: AiProviderType }) => AiProviderConfig
  removeConfig: (userId: string) => void
  updatePermission: (userId: string, key: keyof AiProviderConfig['dataPermissions'], value: boolean) => void
}

// Models que NO soporan function calling estándar (type:"function")
const GROQ_BAD_MODELS = [
  'llama3-70b-8192',
  'llama-3.2-90b-vision-preview',
  'llama-3.2-11b-vision-preview',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
]

const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant'

function sanitizeConfig(config: AiProviderConfig): AiProviderConfig {
  if (config.provider === 'groq' && GROQ_BAD_MODELS.includes(config.model)) {
    if (typeof window !== 'undefined') {
      console.warn(
        `[AI Config] Modelo "${config.model}" no soporta tool calling o tiene rate limit muy bajo. ` +
          `Cambiando automáticamente a "${GROQ_FALLBACK_MODEL}".`
      )
    }
    return { ...config, model: GROQ_FALLBACK_MODEL, updatedAt: new Date() }
  }
  return config
}

function createConfig(userId: string, provider: AiProviderType): AiProviderConfig {
  const defaults = AI_PROVIDER_DEFAULTS[provider]
  return {
    id: crypto.randomUUID(),
    userId,
    provider,
    baseUrl: defaults.baseUrl,
    apiKey: '',
    model: defaults.model,
    enabled: true,
    dataPermissions: getDefaultPermissions(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export const useAiConfigStore = create<AiConfigState>()(
  persist(
    (set, get) => ({
      configs: {},

      getConfig: (userId) => {
        const raw = get().configs[userId]
        if (!raw) return null
        // Migrar dataPermissions del schema anterior si es necesario
        const migrated = {
          ...raw,
          dataPermissions: migratePermissions(raw.dataPermissions as Record<string, boolean>),
        }
        const sanitized = sanitizeConfig(migrated)
        if (sanitized !== migrated || sanitized.dataPermissions !== raw.dataPermissions) {
          set({ configs: { ...get().configs, [userId]: sanitized } })
        }
        return sanitized
      },

      saveConfig: (userId, partial) => {
        const existing = get().configs[userId]
        const config: AiProviderConfig = existing
          ? { ...existing, ...partial, updatedAt: new Date() }
          : { ...createConfig(userId, partial.provider), ...partial, updatedAt: new Date() }
        const sanitized = sanitizeConfig(config)
        set({ configs: { ...get().configs, [userId]: sanitized } })
        return sanitized
      },

      removeConfig: (userId) => {
        const { [userId]: _, ...rest } = get().configs
        set({ configs: rest })
      },

      updatePermission: (userId, key, value) => {
        const config = get().configs[userId]
        if (!config) return
        set({
          configs: {
            ...get().configs,
            [userId]: {
              ...config,
              dataPermissions: { ...config.dataPermissions, [key]: value },
              updatedAt: new Date(),
            },
          },
        })
      },
    }),
    {
      name: 'tgp-ai-config',
      partialize: (state) => ({ configs: state.configs }),
    }
  )
)
