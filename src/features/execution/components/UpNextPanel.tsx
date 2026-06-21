import { useNavigate } from 'react-router-dom'
import { Calendar, ArrowRight, User, Target } from 'lucide-react'
import type { Activity, Plan, Commitment } from '@/types/domain'

interface UpNextPanelProps {
  activities: Activity[]
  plans: Plan[]
  commitments: Commitment[]
  today: Date
}

interface UpNextItem {
  id: string
  title: string
  dueDate: Date
  planTitle: string | null
  planId: string | null
  assignee: string | null
  type: 'activity' | 'commitment'
}

export function UpNextPanel({ activities, plans, commitments, today }: UpNextPanelProps) {
  const navigate = useNavigate()
  const planMap = new Map(plans.map((p) => [p.id, p]))

  const upcoming = gatherUpcoming(activities, commitments, planMap, today)
    .slice(0, 6)

  if (upcoming.length === 0) return null

  return (
    <div className="bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-boundary">
        <Calendar size={15} className="text-primary" />
        <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Qué Sigue</h3>
        <span className="text-[11px] text-neutral-50 ml-auto">Próximos vencimientos</span>
      </div>

      <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
        {upcoming.map((item) => {
          const diffDays = Math.ceil(
            (item.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          )
          const isToday = diffDays === 0
          const isTomorrow = diffDays === 1
          const isPast = diffDays < 0

          const dayLabel = isPast
            ? `Hace ${Math.abs(diffDays)}d`
            : isToday
              ? 'Hoy'
              : isTomorrow
                ? 'Mañana'
                : `En ${diffDays}d`

          return (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors cursor-pointer group"
              onClick={() => {
                if (item.planId) navigate(`/execution/plans/${item.planId}`)
                else if (item.type === 'commitment') navigate('/execution/commitments')
              }}
            >
              {/* Day indicator */}
              <div className={`shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center border ${
                isPast
                  ? 'bg-danger/10 border-danger/20 text-danger'
                  : isToday
                    ? 'bg-warning/10 border-warning/20 text-warning'
                    : 'bg-neutral-10 dark:bg-neutral-70 border-neutral-20 dark:border-neutral-60 text-muted'
              }`}>
                <span className="text-[10px] font-bold leading-none">{item.dueDate.getDate()}</span>
                <span className="text-[9px] leading-none mt-0.5 opacity-75">
                  {item.dueDate.toLocaleDateString('es-ES', { month: 'short' }).slice(0, 3)}
                </span>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${
                  isPast
                    ? 'text-danger'
                    : 'text-neutral-90 dark:text-white'
                }`}>
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.planTitle && (
                    <span className="flex items-center gap-1 text-[11px] text-primary">
                      <Target size={10} />
                      {item.planTitle}
                    </span>
                  )}
                  {item.assignee && (
                    <span className="flex items-center gap-1 text-[11px] text-neutral-50">
                      <User size={10} />
                      {item.assignee}
                    </span>
                  )}
                </div>
              </div>

              {/* Due label */}
              <div className="shrink-0 text-right">
                <span className={`text-[11px] font-semibold ${
                  isPast ? 'text-danger' : isToday ? 'text-warning' : 'text-neutral-50'
                }`}>
                  {dayLabel}
                </span>
              </div>

              <ArrowRight size={14} className="shrink-0 text-neutral-40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function gatherUpcoming(
  activities: Activity[],
  commitments: Commitment[],
  planMap: Map<string, Plan>,
  today: Date,
): UpNextItem[] {
  const items: UpNextItem[] = []

  // Collect pending/in-progress activities with due dates, ordered by due date
  for (const act of activities) {
    if (!act.dueDate) continue
    if (act.status === 'completed' || act.status === 'cancelled') continue
    const plan = act.planId ? planMap.get(act.planId) : undefined
    const dueDate = new Date(act.dueDate)
    dueDate.setHours(0, 0, 0, 0)

    // Only show upcoming + recently overdue (within 7 days)
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < -7) continue

    items.push({
      id: act.id,
      title: act.title,
      dueDate,
      planTitle: plan?.title ?? null,
      planId: act.planId,
      assignee: act.assigneeId,
      type: 'activity',
    })
  }

  // Collect active/at_risk commitments with dates
  for (const c of commitments) {
    if (c.status !== 'active' && c.status !== 'at_risk') continue
    const dueDate = new Date(c.commitmentDate)
    dueDate.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < -7) continue

    items.push({
      id: c.id,
      title: c.title,
      dueDate,
      planTitle: null,
      planId: null,
      assignee: c.ownerId,
      type: 'commitment',
    })
  }

  // Sort by due date (ascending)
  items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

  return items
}
