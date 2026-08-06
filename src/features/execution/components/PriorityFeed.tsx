import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Clock, Target } from 'lucide-react'
import type { Blocker, Activity, Commitment, Task, Plan } from '@/types/domain'

interface PriorityFeedProps {
  blockers: Blocker[]
  activities: Activity[]
  commitments: Commitment[]
  tasks: Task[]
  plans: Plan[]
  today: Date
}

interface PriorityItem {
  id: string
  type:
    | 'blocker'
    | 'overdue-activity'
    | 'overdue-commitment'
    | 'due-activity'
    | 'due-commitment'
    | 'task'
  title: string
  description: string
  score: number
  severity?: string
  daysOverdue?: number
  daysUntilDue?: number
  planTitle?: string
  planId?: string
  assigneeId?: string
  link?: string
  dueDate?: Date
}

function scoreItem(item: PriorityItem): number {
  const base: Record<string, number> = {
    blocker: 900,
    'overdue-activity': 800,
    'overdue-commitment': 750,
    'due-activity': 500,
    'due-commitment': 450,
    task: 200,
  }
  let s = base[item.type] ?? 0
  if (item.type === 'blocker') {
    const sev: Record<string, number> = { critical: 200, high: 100, medium: 0, low: -100 }
    s += sev[item.severity ?? ''] ?? 0
  }
  if (item.daysOverdue) s += item.daysOverdue * 30
  if (item.daysUntilDue !== undefined && item.daysUntilDue >= 0) s -= item.daysUntilDue * 15
  if (item.type === 'task') {
    const prio: Record<string, number> = { critical: 150, high: 80, medium: 0, low: -50 }
    s += prio[item.severity ?? ''] ?? 0
  }
  return Math.max(0, s)
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function dateGroupKey(d: Date, today: Date): string {
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'ayer'
  if (diff <= 7) return 'semana'
  return formatDate(d)
}

function dateGroupLabel(key: string, d: Date): string {
  switch (key) {
    case 'hoy':
      return 'Hoy'
    case 'ayer':
      return 'Ayer'
    case 'semana':
      return 'Esta semana'
    default:
      return formatDate(d)
  }
}

const TYPE_STYLES = {
  blocker: { label: 'Bloqueo', dot: '#ff4444' },
  'overdue-activity': { label: 'Vencido', dot: '#ff4444' },
  'overdue-commitment': { label: 'C. Vencido', dot: '#ff6b35' },
  'due-activity': { label: 'Vence hoy', dot: '#ffb900' },
  'due-commitment': { label: 'C. Próximo', dot: '#ffb900' },
  task: { label: 'Tarea', dot: '#00b8d9' },
}

export function PriorityFeed({
  blockers,
  activities,
  commitments,
  tasks,
  plans,
  today,
}: PriorityFeedProps) {
  const navigate = useNavigate()
  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans])

  const items = useMemo(() => {
    const r: PriorityItem[] = []

    for (const b of blockers) {
      if (b.status !== 'open' && b.status !== 'escalated') continue
      r.push({
        id: b.id,
        type: 'blocker',
        title: b.title,
        description: stripHtml(b.description),
        score: 0,
        severity: b.severity,
        planId: b.sourceType === 'plan' ? b.sourceId : undefined,
        assigneeId: b.assigneeId ?? undefined,
        link: `/execution/blockers/${b.id}/edit`,
      })
    }

    for (const a of activities) {
      if (!a.dueDate || a.status === 'completed' || a.status === 'cancelled') continue
      const d = new Date(a.dueDate)
      d.setHours(0, 0, 0, 0)
      const diff = Math.ceil((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      if (diff <= 0) continue
      const plan = a.planId ? planMap.get(a.planId) : undefined
      r.push({
        id: a.id,
        type: 'overdue-activity',
        title: a.title,
        description: `Vencida hace ${diff}d${a.assigneeId ? ` · ${a.assigneeId}` : ''}`,
        score: 0,
        daysOverdue: diff,
        planId: a.planId,
        planTitle: plan?.title,
        assigneeId: a.assigneeId ?? undefined,
        link: a.planId ? `/execution/plans/${a.planId}` : undefined,
        dueDate: d,
      })
    }

    for (const c of commitments) {
      if (c.status !== 'active' && c.status !== 'at_risk') continue
      const d = new Date(c.commitmentDate)
      d.setHours(0, 0, 0, 0)
      const diff = Math.ceil((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      if (diff <= 0) continue
      r.push({
        id: c.id,
        type: 'overdue-commitment',
        title: c.title,
        description: `Vencido hace ${diff}d${c.ownerId ? ` · ${c.ownerId}` : ''}`,
        score: 0,
        daysOverdue: diff,
        assigneeId: c.ownerId ?? undefined,
        link: '/execution/commitments',
        dueDate: d,
      })
    }

    for (const a of activities) {
      if (!a.dueDate || a.status === 'completed' || a.status === 'cancelled') continue
      const d = new Date(a.dueDate)
      d.setHours(0, 0, 0, 0)
      const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diff !== 0) continue
      const plan = a.planId ? planMap.get(a.planId) : undefined
      r.push({
        id: a.id,
        type: 'due-activity',
        title: a.title,
        description: a.assigneeId ?? '',
        score: 0,
        daysUntilDue: 0,
        planId: a.planId,
        planTitle: plan?.title,
        assigneeId: a.assigneeId ?? undefined,
        link: a.planId ? `/execution/plans/${a.planId}` : undefined,
        dueDate: d,
      })
    }

    for (const t of tasks) {
      if (t.status === 'done') continue
      const plan = t.planId ? planMap.get(t.planId) : undefined
      let dueLabel = ''
      let dd: Date | undefined
      if (t.dueDate) {
        dd = new Date(t.dueDate)
        dd.setHours(0, 0, 0, 0)
        const diff = Math.ceil((dd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        dueLabel = diff <= 0 ? 'Vencida' : `En ${diff}d`
      }
      r.push({
        id: t.id,
        type: 'task',
        title: t.title,
        description: `${plan?.title ?? 'Sin plan'}${dueLabel ? ` · ${dueLabel}` : ''}`,
        score: 0,
        severity: t.priority,
        planId: t.planId ?? undefined,
        link: t.planId ? `/execution/plans/${t.planId}` : undefined,
        dueDate: dd,
      })
    }

    for (const item of r) item.score = scoreItem(item)
    r.sort((a, b) => b.score - a.score)

    return r
  }, [blockers, activities, commitments, tasks, planMap, today])

  const focusItems = items.filter((i) => i.score >= 300)
  const restItems = items.filter((i) => i.score < 300)

  const groupedRest = useMemo(() => {
    const groups = new Map<string, PriorityItem[]>()
    for (const item of restItems) {
      const date = item.dueDate ?? today
      const key = dateGroupKey(date, today)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }
    return groups
  }, [restItems, today])

  if (items.length === 0) return null

  return (
    <div className="bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-boundary">
        <Clock size={13} className="text-muted" />
        <h3 className="text-xs font-semibold text-default tracking-wide">Timeline</h3>
        <span className="text-[10px] font-mono ml-auto text-muted">{items.length} items</span>
      </div>

      <div className="py-1">
        {focusItems.length > 0 && (
          <TimelineSection label="Enfoque" dotColor="#ff4444">
            {focusItems.map((item) => (
              <TimelineItem
                key={`f-${item.type}-${item.id}`}
                item={item}
                prominent
                navigate={navigate}
              />
            ))}
          </TimelineSection>
        )}

        {[...groupedRest.entries()].map(([groupKey, groupItems]) => {
          const firstDate = groupItems.find((i) => i.dueDate)?.dueDate ?? today
          return (
            <TimelineSection
              key={groupKey}
              label={dateGroupLabel(groupKey, firstDate)}
              dotColor="#ffffff25"
              subtle
            >
              {groupItems.map((item) => (
                <TimelineItem key={`r-${item.type}-${item.id}`} item={item} navigate={navigate} />
              ))}
            </TimelineSection>
          )
        })}
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-boundary">
        <span className="text-[10px] font-mono text-muted">
          {today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <span className="text-[10px] font-mono text-muted">{focusItems.length} prioritarios</span>
      </div>
    </div>
  )
}

function TimelineSection({
  label,
  dotColor,
  subtle,
  children,
}: {
  label: string
  dotColor: string
  subtle?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 px-5 py-2">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
        />
        <span
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: subtle ? 'var(--color-muted)' : `${dotColor}cc` }}
        >
          {label}
        </span>
      </div>

      <div className="relative pl-[26px] pr-5">
        <div className="absolute left-[9px] top-0 bottom-0 w-px bg-boundary" />
        {children}
      </div>
    </div>
  )
}

function TimelineItem({
  item,
  prominent,
  navigate,
}: {
  item: PriorityItem
  prominent?: boolean
  navigate: ReturnType<typeof useNavigate>
}) {
  const style = TYPE_STYLES[item.type]
  const isCritical = item.score >= 700
  const dotColor = prominent ? '#ff4444' : style.dot
  const dotSize = prominent ? 9 : 6

  return (
    <div
      onClick={() => item.link && navigate(item.link)}
      className="relative pb-3 group cursor-pointer"
    >
      <div
        className="absolute left-[-17px] rounded-full z-10 transition-all duration-200"
        style={{
          width: dotSize,
          height: dotSize,
          top: 7,
          background: dotColor,
          boxShadow: isCritical
            ? '0 0 8px rgba(255,68,68,0.5), 0 0 20px rgba(255,68,68,0.15)'
            : `0 0 4px ${dotColor}40`,
        }}
      />

      <div
        className={`relative rounded-lg border transition-all duration-150 ${
          prominent ? '' : 'border-boundary hover:bg-subtle'
        }`}
        style={{
          borderColor: prominent ? 'rgba(255,68,68,0.15)' : undefined,
          background: prominent ? 'rgba(255,68,68,0.03)' : undefined,
        }}
      >
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: `${style.dot}cc` }}
            >
              {style.label}
            </span>
            {item.severity === 'critical' && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-danger/70">
                Crítico
              </span>
            )}
            {item.daysOverdue && (
              <span className="text-[10px] text-muted font-mono ml-auto">
                hace {item.daysOverdue}d
              </span>
            )}
            {item.dueDate && !item.daysOverdue && (
              <span className="text-[10px] text-muted font-mono ml-auto">
                {formatDate(item.dueDate)}
              </span>
            )}
          </div>

          <p
            className={`leading-snug ${prominent ? 'text-default text-[13px] font-medium' : 'text-secondary text-[12.5px]'}`}
          >
            {item.title}
          </p>

          {(item.planTitle || item.assigneeId) && (
            <div className="flex items-center gap-3 mt-1">
              {item.planTitle && (
                <span className="flex items-center gap-1 text-muted text-[10px]">
                  <Target size={10} />
                  {item.planTitle}
                </span>
              )}
              {item.assigneeId && (
                <span className="text-muted text-[10px] font-mono">{item.assigneeId}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .trim()
}
