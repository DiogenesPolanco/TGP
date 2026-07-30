import { Edit3, Trash2 } from 'lucide-react'
import type { TeamSprint } from '@/types/domain'
import { Button } from '@/components/ui/Button'

interface Props {
  sprint: TeamSprint
  onEdit: (s: TeamSprint) => void
  onDelete: (id: string) => void
}

export function SprintCard({ sprint: s, onEdit, onDelete }: Props) {
  const startStr =
    s.startDate instanceof Date
      ? s.startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
      : ''
  const endStr =
    s.endDate instanceof Date
      ? s.endDate.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : ''
  const doneSP = s.completedSP
  const notDoneSP = s.notCompletedSP
  const totalSP = doneSP + notDoneSP
  const effPct = totalSP > 0 ? Math.round((doneSP / totalSP) * 100) : 0
  const plannedPct = s.plannedSP > 0 ? Math.round((doneSP / s.plannedSP) * 100) : 0

  const effColor =
    effPct >= 80 ? 'text-success' : effPct >= 50 ? 'text-warning' : 'text-danger'
  const effBg =
    effPct >= 80 ? 'bg-success/10' : effPct >= 50 ? 'bg-warning/10' : 'bg-danger/10'
  const progressColor =
    effPct >= 80 ? 'bg-success' : effPct >= 50 ? 'bg-warning' : 'bg-danger'

  return (
    <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm hover:shadow-md transition-all duration-200 group/sprint">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold text-neutral-90 dark:text-white truncate">
              {s.sprintName}
            </h4>
            <div className={`shrink-0 px-2 py-0.5 text-xs font-bold rounded-md ${effBg} ${effColor}`}>
              {effPct}%
            </div>
          </div>
          <p className="text-xs text-neutral-50 mt-0.5">
            {startStr} — {endStr}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] text-neutral-50 mb-1">
          <span>Progreso de ejecución</span>
          <span>{doneSP}/{totalSP || s.plannedSP} SP</span>
        </div>
        <div className="w-full bg-neutral-20 dark:bg-neutral-70 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(100, totalSP > 0 ? effPct : plannedPct)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center py-2 px-1 rounded-lg bg-neutral-10 dark:bg-neutral-70">
          <p className="text-[10px] font-medium text-neutral-50 uppercase tracking-wider">Plan</p>
          <p className="text-sm font-bold text-neutral-90 dark:text-white mt-0.5">{s.plannedSP}</p>
        </div>
        <div className="text-center py-2 px-1 rounded-lg bg-success/5">
          <p className="text-[10px] font-medium text-success uppercase tracking-wider">Completado</p>
          <p className="text-sm font-bold text-success mt-0.5">{doneSP}</p>
        </div>
        <div className="text-center py-2 px-1 rounded-lg bg-danger/5">
          <p className="text-[10px] font-medium text-danger uppercase tracking-wider">No Compl.</p>
          <p className="text-sm font-bold text-danger mt-0.5">{notDoneSP}</p>
        </div>
        <div className="text-center py-2 px-1 rounded-lg bg-primary/5">
          <p className="text-[10px] font-medium text-primary uppercase tracking-wider">Entrega</p>
          <p className="text-sm font-bold text-primary mt-0.5">{plannedPct}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-neutral-10 dark:border-neutral-70">
        <div className="text-[11px] text-neutral-40">
          <span className="inline-flex items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${doneSP + notDoneSP > 0 ? 'bg-success' : 'bg-neutral-30'}`}
            />
            {doneSP + notDoneSP > 0
              ? `${doneSP} SP completados de ${s.plannedSP} planificados`
              : 'Sin actividad registrada'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => onEdit(s)}
            className="p-1.5 rounded-lg text-neutral-40 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Editar sprint"
          >
            <Edit3 size={14} />
          </Button>
          <Button
            onClick={() => onDelete(s.id)}
            className="p-1.5 rounded-lg text-neutral-40 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Eliminar sprint"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
