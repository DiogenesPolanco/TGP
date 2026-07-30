import { Target, HelpCircle } from 'lucide-react'
import type { ObjectiveStatus, KeyResult } from '@/types/domain'
import { STATUS_OPTIONS, STATUS_STYLE, STATUS_ICON } from '../constants/objectiveFormConstants'

interface Props {
  title: string
  type: string
  status: ObjectiveStatus
  keyResults: KeyResult[]
  liveProgress: number
  teamId: string
  teams: { id: string; name: string }[]
}

export function ObjectivePreviewCard({ title, type, status, keyResults, liveProgress, teamId, teams }: Props) {
  const progressColor =
    liveProgress >= 100 ? 'bg-success' : liveProgress >= 60 ? 'bg-success' : liveProgress >= 30 ? 'bg-warning' : 'bg-danger'

  return (
    <div className="bg-card rounded-xl border border-boundary p-5 shadow-sm sticky top-6 space-y-4">
      <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
        <Target size={16} className="text-primary" />
        Vista Previa
      </h3>

      <div className="bg-neutral-10 dark:bg-neutral-70/50 rounded-xl border border-boundary overflow-hidden">
        <div className={`h-1 w-full ${status === 'achieved' || status === 'on_track' ? 'bg-success' : status === 'at_risk' ? 'bg-warning' : status === 'behind' ? 'bg-danger' : 'bg-neutral-40'}`} />
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLE[status]}`}>
              {STATUS_ICON[status]}
              {STATUS_OPTIONS.find((o) => o.value === status)?.label}
            </span>
            <span className="text-[10px] font-medium text-neutral-50 uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-10 dark:bg-neutral-70">
              {type === 'okr' ? 'OKR' : type === 'kpi' ? 'KPI' : 'BSC'}
            </span>
          </div>

          <p className="text-sm font-semibold text-neutral-90 dark:text-white mb-1 line-clamp-2">
            {title || 'Sin título'}
          </p>

          <div className="flex items-center justify-between mt-3 mb-1.5">
            <span className="text-[11px] text-neutral-50">Progreso general</span>
            <span className="text-sm font-bold text-neutral-90 dark:text-white tabular-nums">{Math.round(liveProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${liveProgress}%` }} />
          </div>

          <div className="mt-3 pt-3 border-t border-boundary">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-50">Key Results</span>
              <span className="font-semibold text-neutral-90 dark:text-white">{keyResults.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-neutral-50">Equipo</span>
              <span className="font-semibold text-neutral-90 dark:text-white truncate max-w-[120px] text-right">
                {teamId ? teams.find((t) => t.id === teamId)?.name : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-10 dark:bg-neutral-70/40 rounded-lg p-3 space-y-1.5">
        <p className="text-xs font-semibold text-secondary flex items-center gap-1.5">
          <HelpCircle size={12} /> Tips
        </p>
        <ul className="text-[11px] text-muted space-y-1 list-disc list-inside">
          <li>Usa métricas específicas y medibles</li>
          <li>Define metas alcanzables pero desafiantes</li>
          <li>Los KRs deben estar vinculados al objetivo</li>
          <li>Actualiza el progreso regularmente</li>
        </ul>
      </div>
    </div>
  )
}
