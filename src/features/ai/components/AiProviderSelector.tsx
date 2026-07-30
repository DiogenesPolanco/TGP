import { useState } from 'react'
import { Check, Eye, EyeOff, Wifi, WifiOff, Loader2, Save } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { createProvider } from '../services/AiProvider'
import type { AiProviderType, AiProviderConfig } from '../types'
import { AI_PROVIDER_DEFAULTS } from '../types'

interface ProviderOption {
  type: AiProviderType
  icon: string
  name: string
  desc: string
  tooltip: string
  badge: string
  disabled?: boolean
}

const PROVIDERS: ProviderOption[] = [
  { type: 'ollama', icon: '🦙', name: 'Ollama (local)', desc: 'Local · 100% gratis, sin límites', tooltip: 'Ejecutás el modelo en tu máquina. Sin costos, sin límites de uso, 100% offline.', badge: 'Gratis' },
  { type: 'groq', icon: '⚡', name: 'Groq', desc: 'Cloud gratuito · 30 req/min', tooltip: 'Cloud gratuito con inferencia ultrarrápida. Limitado a 30 requests por minuto en el plan free.', badge: 'Gratis' },
  { type: 'openai', icon: '🔵', name: 'OpenAI', desc: 'Pago por uso · requiere API key', tooltip: 'Modelos GPT de pago. Necesitás una API key de OpenAI con crédito disponible.', badge: 'API key' },
  { type: 'anthropic', icon: '🟠', name: 'Anthropic (Claude)', desc: 'Próximamente — análisis avanzado', tooltip: 'Claude de Anthropic. Pendiente de integración — estará disponible pronto.', badge: 'Pronto', disabled: true },
]

function providerLabel(p: AiProviderType): string {
  return PROVIDERS.find((x) => x.type === p)?.name ?? p
}

interface Props {
  config: AiProviderConfig
  onSave: (cfg: { provider: AiProviderType; baseUrl: string; apiKey: string; model: string }) => void
  onCancel: () => void
}

export function AiProviderSelector({ config, onSave, onCancel }: Props) {
  const [dirty, setDirty] = useState({ provider: config.provider, baseUrl: config.baseUrl, apiKey: config.apiKey, model: config.model })
  const [availableModels, setAvailableModels] = useState<string[]>([config.model])
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  const handleTestConnection = async () => {
    setTestResult('testing')
    setTestError(null)
    try {
      const testConfig: AiProviderConfig = {
        ...config,
        id: 'test',
        provider: dirty.provider,
        baseUrl: dirty.baseUrl,
        apiKey: dirty.apiKey,
        model: dirty.model,
      }
      const provider = createProvider(testConfig)
      const ok = await provider.testConnection()
      if (ok) {
        const models = await provider.getModels()
        setAvailableModels(models)
        setDirty((prev) => ({ ...prev, model: models.length > 0 ? models[0] : prev.model }))
        setTestResult('success')
      } else {
        setTestResult('error')
        setTestError('No se pudo conectar. Verificá la URL y las credenciales.')
      }
    } catch (err) {
      setTestResult('error')
      setTestError(err instanceof Error ? err.message : 'Error de conexión')
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-boundary flex items-center gap-2">
        <span className="text-base leading-none">✏️</span>
        <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Editar configuración</h2>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-60 mb-3">Proveedor de IA</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PROVIDERS.map((p) => (
              <button
                key={p.type}
                disabled={p.disabled}
                title={p.tooltip}
                onClick={() => {
                  if (p.disabled) return
                  const defaults = AI_PROVIDER_DEFAULTS[p.type]
                  setDirty({ provider: p.type, baseUrl: defaults.baseUrl, model: defaults.model, apiKey: '' })
                  setAvailableModels([])
                  setTestResult('idle')
                  setTestError(null)
                }}
                className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition-all duration-300 ${
                  p.disabled
                    ? 'border-dashed border-neutral-30 dark:border-neutral-60 bg-neutral-5 dark:bg-neutral-85 opacity-50 cursor-not-allowed'
                    : dirty.provider === p.type
                      ? 'border-boundary bg-card shadow-md ring-2 ring-neutral-90 dark:ring-white'
                      : 'border-boundary bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:shadow-sm cursor-pointer'
                }`}
              >
                {!p.disabled && dirty.provider === p.type && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-neutral-90 dark:bg-white flex items-center justify-center ring-1 ring-neutral-90/20 dark:ring-white/20">
                    <Check size={12} className="text-white dark:text-neutral-90" strokeWidth={3} />
                  </div>
                )}
                <div className={`p-3 rounded-xl flex items-center justify-center text-xl shrink-0 ${p.disabled ? 'bg-neutral-10 dark:bg-neutral-75' : dirty.provider === p.type ? 'bg-neutral-5 dark:bg-neutral-75 ring-1 ring-neutral-90/10 dark:ring-white/10' : 'bg-neutral-5 dark:bg-neutral-75'}`}>
                  {p.icon}
                </div>
                <span className={`text-xs font-semibold leading-tight ${p.disabled ? 'text-neutral-50' : 'text-neutral-90 dark:text-white'}`}>{p.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.badge === 'Gratis' ? 'bg-success/10 text-success' : p.badge === 'Pronto' ? 'bg-warning/10 text-warning' : 'bg-neutral-10 dark:bg-neutral-75 text-muted'}`}>
                  {p.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-5 border-t border-boundary">
          <div className="p-2.5 rounded-xl text-lg bg-neutral-5 dark:bg-neutral-75">
            {PROVIDERS.find((p) => p.type === dirty.provider)?.icon}
          </div>
          <div>
            <span className="block text-sm font-semibold text-neutral-90 dark:text-white">Configuración de {providerLabel(dirty.provider)}</span>
            <span className="text-xs text-muted">{PROVIDERS.find((p) => p.type === dirty.provider)?.desc}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-60 mb-1.5">URL del servidor</label>
          <input type="text" value={dirty.baseUrl} onChange={(e) => setDirty({ ...dirty, baseUrl: e.target.value })}
            className="w-full bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-lg px-3 py-2 text-sm text-neutral-90 dark:text-white placeholder-neutral-40 focus:outline-none focus:ring-1 focus:ring-neutral-50 font-mono transition-all" />
        </div>

        {dirty.provider !== 'ollama' && (
          <div>
            <label className="block text-sm font-medium text-neutral-60 mb-1.5">API Key</label>
            <div className="relative">
              <input type={showApiKey ? 'text' : 'password'} value={dirty.apiKey} onChange={(e) => setDirty({ ...dirty, apiKey: e.target.value })}
                className="w-full bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-lg pl-3 pr-9 py-2 text-sm text-neutral-90 dark:text-white placeholder-neutral-40 focus:outline-none focus:ring-1 focus:ring-neutral-50 font-mono transition-all"
                placeholder={dirty.provider === 'groq' ? 'gsk_...' : 'sk-...'} />
              <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-neutral-90 dark:hover:text-white transition-colors">
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-xs text-muted mt-1">Se guarda cifrada en localStorage de tu navegador.</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-60 mb-1.5">Modelo</label>
          {availableModels.length > 0 ? (
            <Select value={dirty.model} onChange={(v) => setDirty({ ...dirty, model: v })} options={availableModels} searchable placeholder="Buscá o seleccioná un modelo..." />
          ) : (
            <input type="text" value={dirty.model} onChange={(e) => setDirty({ ...dirty, model: e.target.value })}
              className="w-full bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-lg px-3 py-2 text-sm text-neutral-90 dark:text-white placeholder-neutral-40 focus:outline-none focus:ring-1 focus:ring-neutral-50 transition-all"
              placeholder={AI_PROVIDER_DEFAULTS[dirty.provider]?.model ?? ''} />
          )}
        </div>

        <div className="bg-neutral-5 dark:bg-neutral-85 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wifi size={14} className="text-muted" />
            <span className="text-sm font-medium text-muted">Prueba de conexión</span>
            <span className="text-xs text-muted ml-auto">Requerido para guardar</span>
          </div>
          <button onClick={handleTestConnection} disabled={testResult === 'testing'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-90 dark:bg-white text-white dark:text-neutral-90 hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50">
            {testResult === 'testing' ? <><Loader2 size={14} className="animate-spin" /> Probando conexión...</> : <><Wifi size={14} /> Probar conexión</>}
          </button>
          {testResult === 'success' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 text-sm text-success font-medium">
              <Check size={14} /> Conexión exitosa{availableModels.length > 0 && ` · ${availableModels.length} modelo(s) disponible(s)`}
            </div>
          )}
          {testResult === 'error' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 text-sm text-danger font-medium">
              <WifiOff size={14} /> {testError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-boundary">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-neutral-90 dark:hover:text-white hover:bg-neutral-10 dark:hover:bg-neutral-80 transition-colors">Cancelar</button>
          <button onClick={() => onSave(dirty)} disabled={testResult !== 'success'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-90 dark:bg-white text-white dark:text-neutral-90 hover:opacity-90 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
            <Save size={14} /> Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}
