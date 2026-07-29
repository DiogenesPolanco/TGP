import { useState, useCallback } from 'react'
import { useUserStore } from '@/stores/userStore'
import { useAiConfigStore } from '../store/aiConfigStore'
import type { AiProviderType } from '../types'
import { AI_PROVIDER_DEFAULTS } from '../types'
import { createProvider } from '../services/AiProvider'

export interface WizardState {
  step: number
  provider: AiProviderType | null
  baseUrl: string
  apiKey: string
  model: string
  testResult: 'idle' | 'testing' | 'success' | 'error'
  testError: string | null
  availableModels: string[]
}

const INITIAL_STATE: WizardState = {
  step: 0,
  provider: null,
  baseUrl: '',
  apiKey: '',
  model: '',
  testResult: 'idle',
  testError: null,
  availableModels: [],
}

export function useAiSetup() {
  const currentUser = useUserStore((s) => s.currentUser)
  const { getConfig, saveConfig } = useAiConfigStore()
  const [wizard, setWizard] = useState<WizardState>(INITIAL_STATE)

  const existingConfig = currentUser ? getConfig(currentUser.id) : null

  const selectProvider = useCallback((provider: AiProviderType) => {
    const defaults = AI_PROVIDER_DEFAULTS[provider]
    setWizard((prev) => ({
      ...prev,
      provider,
      baseUrl: defaults.baseUrl,
      model: defaults.model,
      apiKey: '',
      testResult: 'idle',
      testError: null,
      availableModels: [],
    }))
  }, [])

  const updateField = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setWizard((prev) => ({ ...prev, [key]: value }))
  }, [])

  const testConnection = useCallback(async () => {
    if (!wizard.provider) return

    setWizard((prev) => ({ ...prev, testResult: 'testing', testError: null }))

    try {
      const config = {
        id: 'test',
        userId: currentUser?.id ?? 'test',
        provider: wizard.provider,
        baseUrl: wizard.baseUrl,
        apiKey: wizard.apiKey,
        model: wizard.model,
        enabled: true,
        dataPermissions: {
          catalogo: true,
          seguridad: false,
          gobierno: false,
          estrategia: false,
          ejecucion: false,
          personas: false,
          reclutamiento: false,
          equipamiento: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const provider = createProvider(config)
      const ok = await provider.testConnection()

      if (ok) {
        const models = await provider.getModels()
        setWizard((prev) => ({
          ...prev,
          testResult: 'success',
          availableModels: models,
          model: models.length > 0 ? models[0] : prev.model,
        }))
      } else {
        setWizard((prev) => ({
          ...prev,
          testResult: 'error',
          testError: 'No se pudo conectar. Verifica la URL y credenciales.',
        }))
      }
    } catch (err) {
      setWizard((prev) => ({
        ...prev,
        testResult: 'error',
        testError: err instanceof Error ? err.message : 'Error de conexión',
      }))
    }
  }, [wizard.provider, wizard.baseUrl, wizard.apiKey, wizard.model, currentUser])

  const nextStep = useCallback(() => {
    setWizard((prev) => ({ ...prev, step: Math.min(prev.step + 1, 3) }))
  }, [])

  const prevStep = useCallback(() => {
    setWizard((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }))
  }, [])

  const completeSetup = useCallback(() => {
    if (!currentUser || !wizard.provider) return

    saveConfig(currentUser.id, {
      provider: wizard.provider,
      baseUrl: wizard.baseUrl,
      apiKey: wizard.apiKey,
      model: wizard.model,
      enabled: true,
    })

    setWizard(INITIAL_STATE)
  }, [currentUser, wizard, saveConfig])

  const isStepValid = useCallback(() => {
    switch (wizard.step) {
      case 0:
        return wizard.provider !== null
      case 1:
        return wizard.testResult === 'success'
      case 2:
        return true // permissions are optional
      case 3:
        return true
      default:
        return false
    }
  }, [wizard])

  return {
    wizard,
    existingConfig,
    selectProvider,
    updateField,
    testConnection,
    nextStep,
    prevStep,
    completeSetup,
    isStepValid,
  }
}
