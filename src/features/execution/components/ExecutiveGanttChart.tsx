import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'

const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planificado', color: 'text-info' },
  in_progress: { label: 'En Progreso', color: 'text-success' },
  on_hold: { label: 'En Pausa', color: 'text-warning' },
  completed: { label: 'Completado', color: 'text-success' },
  cancelled: { label: 'Cancelado', color: 'text-neutral-50' },
}

const healthConfig: Record<string, { label: string; bar: string; dot: string; bg: string }> = {
  green: { label: 'Saludable', bar: 'bg-success', dot: 'bg-success', bg: 'bg-success/10' },
  yellow: { label: 'En Riesgo', bar: 'bg-warning', dot: 'bg-warning', bg: 'bg-warning/10' },
  red: { label: 'Crítico', bar: 'bg-danger', dot: 'bg-danger', bg: 'bg-danger/10' },
}

interface PlanSummary {
  id: string
  title: string
  startDate: Date
  endDate: Date
  status: string
  health: string
}

interface Props {
  plans: PlanSummary[]
  activities: { planId: string; status: string }[]
  today: Date
  timelineStart: Date
  timelineEnd: Date
  totalWeeks: number
  weekWidth: number
  totalWidth: number
  onNavigate: (offset: number) => void
  onToday: () => void
}

export function ExecutiveGanttChart({
  plans,
  activities,
  today,
  timelineStart,
  timelineEnd,
  totalWeeks,
  weekWidth,
  totalWidth,
  onNavigate,
  onToday,
}: Props) {
  const navigate = useNavigate()
  const totalSpan = timelineEnd.getTime() - timelineStart.getTime()

  return (
    <div className="xl:col-span-3 bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-boundary">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-primary" />
          <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Línea de Tiempo</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-50">
            {timelineStart.toLocaleDateString('es-ES')} — {timelineEnd.toLocaleDateString('es-ES')}
          </span>
          <Button
            onClick={() => onNavigate(-12)}
            className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-70 text-neutral-50"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            onClick={onToday}
            className="px-2 py-0.5 text-xs font-medium rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Hoy
          </Button>
          <Button
            onClick={() => onNavigate(12)}
            className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-70 text-neutral-50"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${totalWidth + 200}px` }}>
          <div className="flex border-b border-boundary sticky top-0 bg-card z-10">
            <div className="w-48 shrink-0 px-4 py-2 text-xs font-semibold text-neutral-50 uppercase tracking-wider border-r border-boundary">
              Plan
            </div>
            <div className="flex">
              {Array.from({ length: Math.min(totalWeeks, 24) }).map((_, i) => {
                const weekDate = new Date(timelineStart)
                weekDate.setDate(weekDate.getDate() + i * 7)
                const isCurrent =
                  weekDate <= today && new Date(weekDate.getTime() + 6 * 86400000) >= today
                return (
                  <div
                    key={i}
                    className={`shrink-0 text-center py-2 text-[10px] font-semibold uppercase tracking-wider border-r border-boundary ${isCurrent ? 'bg-primary/[0.04] text-primary' : 'text-neutral-50'}`}
                    style={{ width: `${weekWidth}px` }}
                  >
                    <span>
                      {weekDate.getDate()}/{weekDate.getMonth() + 1}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {plans.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-50">
              No hay planes con los filtros seleccionados
            </div>
          ) : (
            plans.map((plan) => {
              const planStart = new Date(plan.startDate)
              const planEnd = new Date(plan.endDate)
              const leftPct =
                totalSpan > 0
                  ? ((planStart.getTime() - timelineStart.getTime()) / totalSpan) * 100
                  : 0
              const widthPct =
                totalSpan > 0 ? ((planEnd.getTime() - planStart.getTime()) / totalSpan) * 100 : 0
              const isOverdue = planEnd < today && plan.status === 'in_progress'
              const health = healthConfig[plan.health] ?? healthConfig.green

              const planActivities = activities.filter((a) => a.planId === plan.id)
              const completedPct =
                planActivities.length > 0
                  ? Math.round(
                      (planActivities.filter((a) => a.status === 'completed').length /
                        planActivities.length) *
                        100,
                    )
                  : 0

              return (
                <div
                  key={plan.id}
                  className="flex items-center border-b border-boundary hover:bg-neutral-10 dark:hover:bg-neutral-70/30 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/execution/plans/${plan.id}`)}
                >
                  <div className="w-48 shrink-0 px-4 py-3 border-r border-boundary flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${health.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                        {plan.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-medium ${isOverdue ? 'text-danger' : (statusConfig[plan.status]?.color ?? 'text-neutral-50')}`}
                        >
                          {isOverdue
                            ? 'Vencido'
                            : (statusConfig[plan.status]?.label ?? plan.status)}
                        </span>
                        <span className="text-[10px] text-neutral-50">{completedPct}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex-1 h-14" style={{ minWidth: `${totalWidth}px` }}>
                    {today >= timelineStart && today <= timelineEnd && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-danger/60 z-20"
                        style={{
                          left: `${((today.getTime() - timelineStart.getTime()) / totalSpan) * 100}%`,
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-danger absolute -top-1 -left-[3px]" />
                      </div>
                    )}
                    <div className="absolute inset-0">
                      {Array.from({ length: Math.min(totalWeeks, 24) }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-neutral-20/50 dark:border-neutral-70/30"
                          style={{ left: `${((i * weekWidth) / (totalWeeks * weekWidth)) * 100}%` }}
                        />
                      ))}
                    </div>
                    {widthPct > 0 && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md flex items-center px-2 group-hover:shadow-md transition-shadow overflow-hidden"
                        style={{
                          left: `${Math.max(0, leftPct)}%`,
                          width: `${Math.max(2, widthPct)}%`,
                          backgroundColor:
                            plan.health === 'red'
                              ? 'rgba(255, 86, 48, 0.15)'
                              : plan.health === 'yellow'
                                ? 'rgba(255, 171, 0, 0.15)'
                                : 'rgba(54, 179, 126, 0.12)',
                          borderLeft: `3px solid ${plan.health === 'red' ? '#FF5630' : plan.health === 'yellow' ? '#FFAB00' : '#36B37E'}`,
                        }}
                      >
                        <div
                          className="absolute inset-0 rounded-md opacity-20"
                          style={{
                            width: `${completedPct}%`,
                            backgroundColor:
                              plan.health === 'red'
                                ? '#FF5630'
                                : plan.health === 'yellow'
                                  ? '#FFAB00'
                                  : '#36B37E',
                          }}
                        />
                        <span className="relative text-[11px] font-medium text-neutral-90 dark:text-white truncate z-10">
                          {plan.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 px-5 py-3 border-t border-boundary">
        <span className="text-[11px] text-neutral-50 uppercase tracking-wider font-semibold">
          Leyenda
        </span>
        <span className="flex items-center gap-1.5 text-xs text-neutral-60">
          <span className="w-3 h-3 rounded-sm bg-success/30 border-l-[3px] border-success" />{' '}
          Saludable
        </span>
        <span className="flex items-center gap-1.5 text-xs text-neutral-60">
          <span className="w-3 h-3 rounded-sm bg-warning/30 border-l-[3px] border-warning" /> En
          Riesgo
        </span>
        <span className="flex items-center gap-1.5 text-xs text-neutral-60">
          <span className="w-3 h-3 rounded-sm bg-danger/30 border-l-[3px] border-danger" /> Crítico
        </span>
        <span className="flex items-center gap-1.5 text-xs text-neutral-60">
          <span className="w-2 h-2 rounded-full bg-danger" /> Hoy
        </span>
      </div>
    </div>
  )
}
