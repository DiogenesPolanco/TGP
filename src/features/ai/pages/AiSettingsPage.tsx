import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowLeft, Bot, Pencil } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useAiConfigStore } from '../store/aiConfigStore'
import { InlineChat } from '../components/InlineChat'
import { Badge } from '@/components/ui/Badge'
import { AiPermissionsPanel } from '../components/AiPermissionsPanel'
import { AiInfoPanel } from '../components/AiInfoPanel'
import { AiProviderSelector } from '../components/AiProviderSelector'
import type { AiProviderType } from '../types'

const PROVIDER_ICONS: Record<string, string> = {
  ollama: '🦙',
  groq: '⚡',
  openai: '🔵',
  anthropic: '🟠',
}

function providerLabel(p: string): string {
  return (
    { ollama: 'Ollama (local)', groq: 'Groq', openai: 'OpenAI', anthropic: 'Anthropic (Claude)' }[
      p
    ] ?? p
  )
}

export function AiSettingsPage() {
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.currentUser)
  const { getConfig, saveConfig, removeConfig, updatePermission } = useAiConfigStore()
  const config = currentUser ? getConfig(currentUser.id) : null
  const [editing, setEditing] = useState(false)

  if (!config) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="w-16 h-16 rounded-2xl bg-neutral-10 dark:bg-neutral-75 flex items-center justify-center mx-auto">
          <Bot size={32} className="text-neutral-50" />
        </div>
        <h1 className="text-xl font-bold text-neutral-90 dark:text-white">
          Sin asistente configurado
        </h1>
        <p className="text-sm text-neutral-50 max-w-sm mx-auto">
          Configurá tu asistente de IA para consultar datos de gestión en lenguaje natural.
        </p>
        <button
          onClick={() => navigate('/ai/setup')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-90 dark:bg-white text-white dark:text-neutral-90 hover:opacity-90 transition-colors text-sm font-medium"
        >
          <Sparkles size={16} /> Configurar asistente
        </button>
        <p className="text-xs text-neutral-40">
          O andá a{' '}
          <button
            onClick={() => navigate('/ai/setup')}
            className="underline underline-offset-2 hover:text-neutral-60"
          >
            /ai/setup
          </button>{' '}
          para empezar desde cero.
        </p>
      </div>
    )
  }

  const handleSave = (cfg: {
    provider: AiProviderType
    baseUrl: string
    apiKey: string
    model: string
  }) => {
    if (!currentUser) return
    saveConfig(currentUser.id, { ...cfg, enabled: true })
    setEditing(false)
  }

  const handleRemove = () => {
    if (currentUser && confirm('¿Desconectar el asistente? Se borrará toda la configuración.')) {
      removeConfig(currentUser.id)
    }
  }

  const handleTogglePermission = (key: keyof typeof config.dataPermissions, value: boolean) => {
    if (currentUser) updatePermission(currentUser.id, key, value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">GobIA</h1>
          <p className="text-sm text-muted mt-1">
            Configuración del asistente de IA — proveedor, permisos y pruebas.
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-neutral-90 dark:hover:text-white bg-card border border-boundary hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors"
          >
            <Pencil size={14} /> Editar
          </button>
        )}
      </div>

      {!editing ? (
        <>
          <div className="bg-card rounded-xl border border-boundary overflow-hidden">
            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-neutral-10 dark:bg-neutral-75 flex items-center justify-center text-xl shrink-0">
                    {PROVIDER_ICONS[config.provider] ?? '🤖'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-neutral-90 dark:text-white">
                        {providerLabel(config.provider)}
                      </span>
                      <Badge color={config.enabled ? 'success' : 'neutral'} size="sm">
                        {config.enabled ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-0.5 font-mono">{config.model}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
                <span className="font-mono truncate max-w-[400px]">{config.baseUrl}</span>
                {config.apiKey && <span>API Key ••••••••{config.apiKey.slice(-4)}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <AiPermissionsPanel
                permissions={config.dataPermissions}
                userId={currentUser!.id}
                onToggle={handleTogglePermission}
              />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-boundary overflow-hidden h-full flex flex-col">
                <div className="px-5 py-3.5 border-b border-boundary flex items-center gap-2">
                  <span className="text-base leading-none">💬</span>
                  <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">
                    Probar asistente
                  </h2>
                  <span className="text-xs text-muted ml-auto font-mono truncate max-w-[120px]">
                    {config.provider}·{config.model}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <InlineChat config={config} />
                </div>
              </div>
            </div>
          </div>

          <AiInfoPanel onRemove={handleRemove} />
        </>
      ) : (
        <>
          <AiProviderSelector
            config={config}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <AiPermissionsPanel
                permissions={config.dataPermissions}
                userId={currentUser!.id}
                onToggle={handleTogglePermission}
              />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-boundary overflow-hidden h-full flex flex-col">
                <div className="px-5 py-3.5 border-b border-boundary flex items-center gap-2">
                  <span className="text-base leading-none">💬</span>
                  <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">
                    Probar asistente
                  </h2>
                  <span className="text-xs text-muted ml-auto font-mono truncate max-w-[120px]">
                    {config.provider}·{config.model}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <InlineChat config={config} />
                </div>
              </div>
            </div>
          </div>

          <AiInfoPanel onRemove={handleRemove} />
        </>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
