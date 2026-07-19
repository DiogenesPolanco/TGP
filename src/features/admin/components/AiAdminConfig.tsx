import { Sparkles, Bot, ExternalLink } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useAiConfigStore } from '@/features/ai/store/aiConfigStore'
import { Button } from '@/components/ui/Button'

export function AiAdminConfig() {
  const currentUser = useUserStore((s) => s.currentUser)
  const { getConfig } = useAiConfigStore()
  const existingConfig = currentUser ? getConfig(currentUser.id) : null

  // ── Configured state ──
  if (existingConfig) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-10 dark:bg-neutral-75 flex items-center justify-center shrink-0">
            <Bot size={18} className="text-neutral-90 dark:text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white">Asistente AI</h3>
            <p className="text-xs text-neutral-50">
              Conectado a {existingConfig.provider} · {existingConfig.model}
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 shrink-0">
            Activo
          </span>
        </div>
        <Button
          variant="ghost"
          leftIcon={<ExternalLink size={14} />}
          onClick={() => window.location.href = '/ai/settings'}
          className="text-xs"
        >
          Ir a Ajustes
        </Button>
      </div>
    )
  }

  // ── Not configured ──
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-neutral-10 dark:bg-neutral-75 flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-neutral-50" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-neutral-90 dark:text-white">Asistente AI</h3>
          <p className="text-xs text-neutral-50">
            Conectá un LLM para consultar datos de TGP en lenguaje natural.
          </p>
        </div>
      </div>
      <Button variant="secondary" onClick={() => window.location.href = '/ai/setup'} leftIcon={<Sparkles size={14} />} className="text-sm">
        Configurar asistente
      </Button>
    </div>
  )
}
