import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import {
  getSchedulerState,
  saveSchedulerConfig,
  executeNow,
} from '@/services/jobs/automatedChecksService'
import type { SchedulerConfig, SchedulerState } from '@/services/jobs/automatedChecksService'
import { Clock, Play, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'

function formatTime(epoch: number): string {
  return new Date(epoch).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatNextRun(nextRun: number | null): string {
  if (!nextRun) return '—'
  const diff = nextRun - Date.now()
  if (diff <= 0) return 'Pendiente'
  if (diff < 60_000) return 'En menos de 1 min'
  if (diff < 3_600_000) return `En ${Math.round(diff / 60_000)} min`
  const hours = Math.floor(diff / 3_600_000)
  const mins = Math.round((diff % 3_600_000) / 60_000)
  return `En ${hours}h ${mins}m (${formatTime(nextRun)})`
}

export function JobSchedulerConfig() {
  const { addNotification } = useAppStore()
  const [state, setState] = useState<SchedulerState>(getSchedulerState())
  const [time, setTime] = useState(state.config.time)

  const refresh = useCallback(() => {
    setState(getSchedulerState())
  }, [])

  // Refresh state every 10s to update nextRun countdown
  useEffect(() => {
    const id = setInterval(refresh, 10_000)
    return () => clearInterval(id)
  }, [refresh])

  const handleToggle = (enabled: boolean) => {
    const newConfig: SchedulerConfig = { time, enabled }
    saveSchedulerConfig(newConfig)
    setState(getSchedulerState())
    addNotification({
      type: enabled ? 'success' : 'info',
      message: enabled ? 'Programador automático activado' : 'Programador automático desactivado',
    })
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    const config = getSchedulerState().config
    saveSchedulerConfig({ time: newTime, enabled: config.enabled })
    refresh()
  }

  const handleRunNow = async () => {
    const newState = await executeNow()
    setState(newState)
    if (newState.lastResult) {
      addNotification({
        type: newState.lastResult.success ? 'success' : 'error',
        message: newState.lastResult.message,
        duration: 6000,
      })
    }
  }

  const { config } = state
  const cardClass = 'p-4 bg-neutral-10 dark:bg-neutral-70 rounded-lg border border-neutral-20 dark:border-neutral-60'
  const btnClass = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">Programador Automático</h3>
        </div>
        {config.enabled && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
            <CheckCircle2 size={12} />
            Activo
          </span>
        )}
      </div>

      <p className="text-sm text-neutral-60 dark:text-neutral-40">
        El programador ejecuta verificaciones automáticas del sistema (obsolescencia, vencimientos,
        bloqueos, backups) y genera alertas en el dashboard.
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-90 dark:text-white">
            Habilitar programador
          </label>
          <button
            onClick={() => handleToggle(!config.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.enabled ? 'bg-primary' : 'bg-neutral-30 dark:bg-neutral-60'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">
            Hora de ejecución diaria
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-40 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className={`${cardClass} space-y-2`}>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-60">Última ejecución</span>
            <span className="text-neutral-90 dark:text-white font-medium">
              {state.lastRun > 0 ? formatTime(state.lastRun) : 'Nunca'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-60">Próxima ejecución</span>
            <span className="text-neutral-90 dark:text-white font-medium">
              {formatNextRun(state.nextRun)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-60">Estado</span>
            <span className="flex items-center gap-1">
              {state.isRunning ? (
                <><Loader2 size={12} className="animate-spin text-primary" /> Ejecutando...</>
              ) : (
                <span className="flex items-center gap-1 text-neutral-90 dark:text-white">
                  <span className={`inline-block w-2 h-2 rounded-full ${config.enabled ? 'bg-success' : 'bg-neutral-40'}`} />
                  {config.enabled ? 'Activo' : 'Inactivo'}
                </span>
              )}
            </span>
          </div>
        </div>

        {state.lastResult && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            state.lastResult.success
              ? 'bg-success/5 text-success'
              : 'bg-danger/5 text-danger'
          }`}>
            {state.lastResult.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
            <div>
              <span>{state.lastResult.message}</span>
              <span className="block text-xs opacity-70 mt-1">
                {new Date(state.lastResult.timestamp).toLocaleString('es-ES')}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRunNow}
            disabled={state.isRunning}
            className={`${btnClass} bg-primary text-white hover:bg-primary-dark disabled:opacity-50`}
          >
            {state.isRunning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {state.isRunning ? 'Ejecutando...' : 'Ejecutar Ahora'}
          </button>
          <button
            onClick={refresh}
            className={`${btnClass} border border-neutral-30 dark:border-neutral-60 text-neutral-70 dark:text-neutral-30 hover:bg-neutral-20 dark:hover:bg-neutral-60`}
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>
      </div>

      <details className="text-xs text-neutral-50">
        <summary className="cursor-pointer hover:text-neutral-70 dark:hover:text-neutral-30 transition-colors">
          Ver verificaciones ejecutadas
        </summary>
        <ul className="mt-2 space-y-1 pl-4 list-disc">
          <li>Vacaciones del personal — alerta si alguien está de vacaciones</li>
          <li>Obsolescencia tecnológica — sincroniza EOL y alerta tecnologías obsoletas en uso</li>
          <li>Compromisos vencidos — alerta compromisos más allá de su fecha</li>
          <li>Planes vencidos — alerta planes con fecha fin vencida</li>
          <li>Bloqueos abiertos — alerta bloqueos sin resolver o escalados</li>
          <li>Actividades vencidas — alerta actividades fuera de plazo</li>
          <li>Entregables vencidos — alerta entregables no completados</li>
          <li>Backup automático — guarda copia local y, si está configurado, sube a Azure</li>
        </ul>
      </details>
    </div>
  )
}
