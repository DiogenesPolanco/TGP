import {
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Wifi,
  WifiOff,
  Sparkles,
  ClipboardList,
  FolderKanban,
  Shield,
  Scale,
  Target,
  Users,
  UserPlus,
  Monitor,
} from 'lucide-react'
import type { AiProviderType } from '../types'
import { AI_PROVIDER_DEFAULTS } from '../types'
import type { WizardState } from '../hooks/useAiSetup'
import { Select } from '@/components/ui/Select'

interface AiSetupWizardProps {
  wizard: WizardState
  onSelectProvider: (provider: AiProviderType) => void
  onUpdateField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void
  onTestConnection: () => void
  onNext: () => void
  onPrev: () => void
  onComplete: () => void
  isStepValid: () => boolean
}

const PROVIDERS: {
  type: AiProviderType
  icon: string
  name: string
  desc: string
  tooltip: string
  badge: string
  color: string
  disabled?: boolean
}[] = [
  {
    type: 'ollama',
    icon: '🦙',
    name: 'Ollama (local)',
    desc: 'Local · 100% gratis, sin límites',
    tooltip: 'Ejecutás el modelo en tu máquina. Sin costos, sin límites de uso, 100% offline.',
    badge: 'Gratis',
    color: 'text-neutral-90 dark:text-white',
  },
  {
    type: 'groq',
    icon: '⚡',
    name: 'Groq',
    desc: 'Cloud gratuito · 30 req/min',
    tooltip:
      'Cloud gratuito con inferencia ultrarrápida. Limitado a 30 requests por minuto en el plan free.',
    badge: 'Gratis',
    color: 'text-neutral-90 dark:text-white',
  },
  {
    type: 'openai',
    icon: '🔵',
    name: 'OpenAI',
    desc: 'Pago por uso · requiere API key',
    tooltip: 'Modelos GPT de pago. Necesitás una API key de OpenAI con crédito disponible.',
    badge: 'API key',
    color: 'text-neutral-90 dark:text-white',
  },
  {
    type: 'anthropic',
    icon: '🟠',
    name: 'Anthropic (Claude)',
    desc: 'Próximamente — análisis avanzado',
    tooltip: 'Claude de Anthropic. Pendiente de integración — estará disponible pronto.',
    badge: 'Pronto',
    color: 'text-neutral-40 dark:text-neutral-50',
    disabled: true,
  },
]

const STEPS = ['Proveedor', 'Conexión', 'Permisos', 'Listo']

export function AiSetupWizard({
  wizard,
  onSelectProvider,
  onUpdateField,
  onTestConnection,
  onNext,
  onPrev,
  onComplete,
  isStepValid,
}: AiSetupWizardProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1 rounded-full transition-colors ${
                i < wizard.step
                  ? 'bg-neutral-50 dark:bg-neutral-40'
                  : i === wizard.step
                    ? 'bg-neutral-70 dark:bg-neutral-30'
                    : 'bg-neutral-20 dark:bg-neutral-70'
              }`}
            />
            <p
              className={`text-[10px] mt-1 text-center ${
                i === wizard.step
                  ? 'text-neutral-90 dark:text-white font-medium'
                  : 'text-neutral-40 dark:text-neutral-60'
              }`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Step 0: Provider Selection */}
      {wizard.step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-60 mb-4">
            Selecciona un proveedor de IA. Puedes cambiarlo después.
          </p>
          {PROVIDERS.map((p) => (
            <button
              key={p.type}
              onClick={() => !p.disabled && onSelectProvider(p.type)}
              disabled={p.disabled}
              title={p.tooltip}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-300 ${
                p.disabled
                  ? 'border-dashed border-neutral-30 dark:border-neutral-60 bg-neutral-5 dark:bg-neutral-85 opacity-50 cursor-not-allowed'
                  : wizard.provider === p.type
                    ? 'border-boundary bg-card shadow-md ring-2 ring-neutral-90 dark:ring-white'
                    : 'border-boundary bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:shadow-sm cursor-pointer'
              }`}
            >
              <div
                className={`p-3 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  p.disabled
                    ? 'bg-neutral-10 dark:bg-neutral-75'
                    : wizard.provider === p.type
                      ? 'bg-neutral-5 dark:bg-neutral-75 ring-1 ring-neutral-90/10 dark:ring-white/10'
                      : 'bg-neutral-5 dark:bg-neutral-75'
                }`}
              >
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${p.color}`}>{p.name}</p>
                <p className="text-xs text-neutral-50 truncate">{p.desc}</p>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  p.badge === 'Gratis'
                    ? 'border-success/30 text-success'
                    : p.badge === 'Pronto'
                      ? 'border-warning/30 text-warning'
                      : 'border-neutral-30 dark:border-neutral-60 text-neutral-50'
                }`}
              >
                {p.badge}
              </span>
              {!p.disabled && (
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                    wizard.provider === p.type
                      ? 'border-neutral-90 dark:border-white'
                      : 'border-neutral-30 dark:border-neutral-60'
                  }`}
                >
                  {wizard.provider === p.type && (
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-90 dark:bg-white" />
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Step 1: Connection */}
      {wizard.step === 1 && wizard.provider && (
        <div className="space-y-4">
          {wizard.provider === 'ollama' && (
            <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl border border-boundary p-4 text-sm space-y-2">
              <p className="font-medium text-neutral-90 dark:text-white">Para usar Ollama:</p>
              <ol className="list-decimal list-inside text-neutral-60 space-y-1 text-xs">
                <li>
                  Descarga e instala <strong>Ollama</strong> desde ollama.com
                </li>
                <li>
                  Ejecuta{' '}
                  <code className="bg-neutral-10 dark:bg-neutral-75 px-1 rounded text-[10px]">
                    ollama pull llama3.2
                  </code>
                </li>
                <li>Deja Ollama corriendo en segundo plano</li>
              </ol>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-60 mb-1">
              URL del servidor
            </label>
            <input
              type="text"
              value={wizard.baseUrl}
              onChange={(e) => onUpdateField('baseUrl', e.target.value)}
              className="w-full bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-lg px-3 py-2 text-sm text-neutral-90 dark:text-white placeholder-neutral-40 focus:outline-none focus:ring-1 focus:ring-neutral-50"
              placeholder="http://localhost:11434"
            />
          </div>

          {(wizard.provider === 'groq' ||
            wizard.provider === 'openai' ||
            wizard.provider === 'anthropic') && (
            <div>
              <label className="block text-xs font-medium text-neutral-60 mb-1">API Key</label>
              <input
                type="password"
                value={wizard.apiKey}
                onChange={(e) => onUpdateField('apiKey', e.target.value)}
                className="w-full bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-lg px-3 py-2 text-sm text-neutral-90 dark:text-white placeholder-neutral-40 focus:outline-none focus:ring-1 focus:ring-neutral-50 font-mono"
                placeholder={`${wizard.provider === 'groq' ? 'gsk_' : 'sk-'}...`}
              />
              <p className="text-[10px] text-neutral-40 dark:text-neutral-60 mt-1">
                Tu API key se guarda solo en tu navegador (localStorage).
              </p>
            </div>
          )}

          {wizard.provider !== 'ollama' && (
            <div>
              <label className="block text-xs font-medium text-neutral-60 mb-1">Modelo</label>
              {wizard.availableModels.length > 0 ? (
                <Select
                  value={wizard.model}
                  onChange={(v) => onUpdateField('model', v)}
                  options={wizard.availableModels}
                  searchable
                  placeholder="Buscá o seleccioná un modelo..."
                />
              ) : (
                <input
                  type="text"
                  value={wizard.model}
                  onChange={(e) => onUpdateField('model', e.target.value)}
                  placeholder={AI_PROVIDER_DEFAULTS[wizard.provider]?.model ?? 'Ej: gpt-4o-mini'}
                  className="w-full bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-lg px-3 py-2 text-sm text-neutral-90 dark:text-white placeholder-neutral-40 focus:outline-none focus:ring-1 focus:ring-neutral-50"
                />
              )}
            </div>
          )}

          <button
            onClick={onTestConnection}
            disabled={wizard.testResult === 'testing'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-20 dark:bg-neutral-70 text-neutral-90 dark:text-white hover:bg-neutral-30 dark:hover:bg-neutral-60 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {wizard.testResult === 'testing' ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Probando conexión...
              </>
            ) : (
              <>
                <Wifi size={14} /> Probar conexión
              </>
            )}
          </button>

          {wizard.testResult === 'success' && (
            <div className="flex items-center gap-2 text-xs text-success">
              <Check size={14} />
              Conexión exitosa
              {wizard.availableModels.length > 0 &&
                ` · ${wizard.availableModels.length} modelo(s) disponible(s)`}
            </div>
          )}

          {wizard.testResult === 'error' && (
            <div className="flex items-center gap-2 text-xs text-danger">
              <WifiOff size={14} />
              {wizard.testError}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Permissions */}
      {wizard.step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-60">
            ¿Qué datos puede consultar el asistente? Puedes ajustarlo después en Ajustes.
          </p>

          {[
            {
              icon: <FolderKanban size={18} />,
              label: 'Catálogo',
              desc: 'Applications, technologies, microservices, databases',
              tables: '10 tablas',
            },
            {
              icon: <Shield size={18} />,
              label: 'Seguridad',
              desc: 'Vulnerabilidades CVSS e incidentes P1-P4',
              tables: '2 tablas',
            },
            {
              icon: <Scale size={18} />,
              label: 'Gobierno',
              desc: 'Matriz de riesgos y hallazgos de auditoría',
              tables: '2 tablas',
            },
            {
              icon: <Target size={18} />,
              label: 'Estrategia',
              desc: 'OKRs, THI histórico y entregables',
              tables: '3 tablas',
            },
            {
              icon: <ClipboardList size={18} />,
              label: 'Ejecución',
              desc: 'Planes, tareas, compromisos, dependencias y bloqueos',
              tables: '6 tablas',
            },
            {
              icon: <Users size={18} />,
              label: 'Personas',
              desc: 'Equipos, perfiles, sprints, métricas DORA, 1:1',
              tables: '7 tablas',
            },
            {
              icon: <UserPlus size={18} />,
              label: 'Reclutamiento',
              desc: 'Candidatos, tecnologías y evaluaciones',
              tables: '3 tablas',
            },
            {
              icon: <Monitor size={18} />,
              label: 'Equipamiento',
              desc: 'Equipos, asignaciones y tickets de soporte',
              tables: '3 tablas',
            },
          ].map((perm, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl border border-boundary bg-card"
            >
              <span className="text-neutral-50 dark:text-neutral-60 shrink-0">{perm.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-90 dark:text-white">{perm.label}</p>
                <p className="text-xs text-neutral-50">{perm.desc}</p>
              </div>
              <span className="text-[10px] text-neutral-40 dark:text-neutral-60">
                {perm.tables}
              </span>
              <div className="w-5 h-5 rounded border-2 bg-neutral-60 dark:bg-neutral-40 border-neutral-60 dark:border-neutral-40 flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Ready */}
      {wizard.step === 3 && (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-10 dark:bg-neutral-75 flex items-center justify-center mx-auto">
            <Sparkles size={32} className="text-neutral-90 dark:text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">¡Todo listo!</h3>
            <p className="text-sm text-neutral-50 mt-1">
              Tu asistente de gerencia está configurado con{' '}
              {wizard.provider && PROVIDERS.find((p) => p.type === wizard.provider)?.name}.
            </p>
          </div>
          <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl border border-boundary p-4 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-50">Proveedor</span>
              <span className="text-neutral-90 dark:text-white font-medium">{wizard.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-50">Modelo</span>
              <span className="text-neutral-90 dark:text-white font-medium">{wizard.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-50">Endpoint</span>
              <span className="text-neutral-90 dark:text-white font-mono text-xs">
                {wizard.baseUrl}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onPrev}
          disabled={wizard.step === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-neutral-50 hover:text-neutral-90 dark:hover:text-white hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={14} />
          Anterior
        </button>

        {wizard.step < 3 ? (
          <button
            onClick={onNext}
            disabled={!isStepValid()}
            className="flex items-center gap-1 px-5 py-2 rounded-lg bg-neutral-20 dark:bg-neutral-70 text-neutral-90 dark:text-white hover:bg-neutral-30 dark:hover:bg-neutral-60 transition-colors text-sm font-medium disabled:opacity-40"
          >
            Siguiente
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="flex items-center gap-1 px-5 py-2 rounded-lg bg-neutral-90 dark:bg-white text-white dark:text-neutral-90 hover:opacity-90 transition-colors text-sm font-medium"
          >
            <Check size={14} />
            Activar asistente
          </button>
        )}
      </div>
    </div>
  )
}
