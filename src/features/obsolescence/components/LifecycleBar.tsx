import type { SupportStatus } from '@/types/domain'
import { getStatusLabel } from '../utils/obsolescenceHelpers'

export function LifecycleBar({ status }: { status: SupportStatus }) {
  const segments = [
    { id: 'active', label: 'Activo', color: 'bg-success', w: '1/3' },
    { id: 'extended', label: 'Extendido', color: 'bg-warning', w: '1/3' },
    { id: 'eol', label: 'EOL', color: 'bg-danger', w: '1/3' },
  ]
  const statusOrder = ['active', 'extended', 'eol', 'unknown']
  const currentIdx = statusOrder.indexOf(status)

  return (
    <div className="flex items-center gap-0.5 shrink-0" title={`Estado: ${getStatusLabel(status)}`}>
      {segments.map((seg, i) => {
        const filled = i <= currentIdx && status !== 'unknown'
        return (
          <div key={seg.id}
            className={`h-5 w-2 rounded-sm transition-colors ${filled ? seg.color : 'bg-neutral-20 dark:bg-neutral-70'} ${i === currentIdx && status !== 'unknown' ? 'ring-1 ring-offset-1 ring-offset-white dark:ring-offset-neutral-80 ring-black/20' : ''}`}
          />
        )
      })}
    </div>
  )
}
