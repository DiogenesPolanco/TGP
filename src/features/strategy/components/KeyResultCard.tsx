import { Trash2 } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { STATUS_OPTIONS } from '../constants/objectiveFormConstants'
import type { KeyResult } from '@/types/domain'

interface Props {
  kr: KeyResult
  index: number
  onUpdate: (index: number, field: keyof KeyResult, value: string | number) => void
  onRemove: (index: number) => void
}

export function KeyResultCard({ kr, index, onUpdate, onRemove }: Props) {
  const krPct = kr.target > kr.baseline
    ? Math.round(((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100)
    : 0
  const krClamped = Math.min(100, Math.max(0, krPct))

  const progressColor =
    krClamped >= 100 ? 'bg-success' : krClamped >= 60 ? 'bg-success' : krClamped >= 30 ? 'bg-warning' : 'bg-danger'

  return (
    <div
      data-kr-card
      className="bg-neutral-10 dark:bg-neutral-70/50 rounded-xl border border-boundary p-4 hover:border-primary/20 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Nombre del Key Result"
            value={kr.title}
            onChange={(e) => onUpdate(index, 'title', e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={kr.status}
            onChange={(v) => onUpdate(index, 'status', v)}
            options={STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            className="w-36"
          />
          <Button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Eliminar KR"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {(['measure', 'baseline', 'current', 'target'] as const).map((field) => (
          <div key={field}>
            <label className="block text-[10px] font-medium text-neutral-50 uppercase tracking-wider mb-1">
              {field === 'measure' ? 'Medida' : field === 'baseline' ? 'Línea Base' : field === 'current' ? 'Actual' : 'Meta'}
            </label>
            <input
              type={field === 'measure' ? 'text' : 'number'}
              placeholder={field === 'measure' ? 'Ej: %' : field === 'baseline' || field === 'current' ? '0' : '100'}
              value={field === 'measure' ? kr.measure : field === 'baseline' ? kr.baseline : field === 'current' ? kr.current : kr.target}
              onChange={(e) => onUpdate(index, field, field === 'measure' ? e.target.value : parseFloat(e.target.value) || 0)}
              className={`w-full px-2.5 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${field === 'current' ? 'font-semibold text-primary' : ''}`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-neutral-50 w-10">Progreso</span>
        <div className="flex-1 h-1.5 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${progressColor}`} style={{ width: `${krClamped}%` }} />
        </div>
        <span className="text-xs font-semibold text-neutral-90 dark:text-white tabular-nums w-8 text-right">{krClamped}%</span>
      </div>
    </div>
  )
}
