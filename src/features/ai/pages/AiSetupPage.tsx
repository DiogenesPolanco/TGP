import { useNavigate } from 'react-router'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { AiSetupWizard } from '../components/AiSetupWizard'
import { useAiSetup } from '../hooks/useAiSetup'
import { useAiConfigStore } from '../store/aiConfigStore'

export function AiSetupPage() {
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.currentUser)
  const { getConfig } = useAiConfigStore()
  const existingConfig = currentUser ? getConfig(currentUser.id) : null

  const {
    wizard,
    selectProvider,
    updateField,
    testConnection,
    nextStep,
    prevStep,
    completeSetup,
    isStepValid,
  } = useAiSetup()

  // If already configured, show status and option to reconfigure
  if (existingConfig && wizard.step === 0) {
    return (
      <div className="max-w-lg mx-auto py-8 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Volver
        </button>

        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-neutral-10 dark:bg-neutral-75 flex items-center justify-center mx-auto">
            <Sparkles size={32} className="text-neutral-90 dark:text-white" />
          </div>
          <h1 className="text-xl font-bold text-neutral-90 dark:text-white">
            Asistente configurado
          </h1>
          <p className="text-sm text-neutral-50">
            Ya tienes un asistente activo con {existingConfig.provider} ({existingConfig.model}).
          </p>
          <div className="bg-card border border-boundary rounded-xl p-4 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-50">Proveedor</span>
              <span className="text-neutral-90 dark:text-white font-medium">
                {existingConfig.provider}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-50">Modelo</span>
              <span className="text-neutral-90 dark:text-white font-medium">
                {existingConfig.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-50">Endpoint</span>
              <span className="text-neutral-90 dark:text-white font-mono text-xs">
                {existingConfig.baseUrl}
              </span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/ai/settings')}
              className="px-4 py-2 rounded-lg bg-neutral-20 dark:bg-neutral-70 text-neutral-90 dark:text-white hover:bg-neutral-30 dark:hover:bg-neutral-60 transition-colors text-sm"
            >
              Ir a ajustes
            </button>
            <button
              onClick={() => {
                selectProvider(existingConfig.provider)
                nextStep()
              }}
              className="px-4 py-2 rounded-lg border border-boundary text-neutral-60 hover:text-neutral-90 dark:hover:text-white transition-colors text-sm"
            >
              Reconfigurar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <button
        onClick={() => (wizard.step === 0 ? navigate(-1) : prevStep())}
        className="flex items-center gap-1 text-sm text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        {wizard.step === 0 ? 'Volver' : 'Atrás'}
      </button>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-neutral-10 dark:bg-neutral-75 flex items-center justify-center mx-auto mb-3">
          <Sparkles size={24} className="text-neutral-90 dark:text-white" />
        </div>
        <h1 className="text-lg font-bold text-neutral-90 dark:text-white">
          Configurar asistente AI
        </h1>
        <p className="text-sm text-neutral-50 mt-1">
          Conecta un modelo de lenguaje para consultar datos de TGP en lenguaje natural.
        </p>
      </div>

      <AiSetupWizard
        wizard={wizard}
        onSelectProvider={selectProvider}
        onUpdateField={updateField}
        onTestConnection={testConnection}
        onNext={nextStep}
        onPrev={prevStep}
        onComplete={() => {
          completeSetup()
          navigate('/ai/settings')
        }}
        isStepValid={isStepValid}
      />
    </div>
  )
}
