import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import type { Plan, Activity } from '@/types/domain'

interface PlanCardProps {
  plan: Plan
  activities: Activity[]
  today: Date
}

export function PlanCard({ plan, activities, today }: PlanCardProps) {
  const navigate = useNavigate()

  // ── Time metrics ──
  const start = new Date(plan.startDate)
  const end = new Date(plan.endDate)
  const daysTotal = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const daysLeft = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const daysElapsed = daysTotal - Math.max(0, daysLeft)
  const timeProgress = daysTotal > 0 ? Math.round((daysElapsed / daysTotal) * 100) : 0

  // ── Activity metrics ──
  const totalActivities = activities.length
  const completedActivities = activities.filter((a) => a.status === 'completed').length
  const inProgressActivities = activities.filter((a) => a.status === 'in_progress').length
  const overdueActivities = activities.filter((a) => {
    if (!a.dueDate || a.status === 'completed' || a.status === 'cancelled') return false
    const d = new Date(a.dueDate)
    d.setHours(0, 0, 0, 0)
    return d.getTime() < today.getTime()
  })
  const activityProgress =
    totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0

  // ── Health forecast ──
  const isBehind = activityProgress < timeProgress
  const forecastGap = timeProgress - activityProgress
  const forecastStatus: 'on_track' | 'at_risk' | 'critical' = !totalActivities
    ? 'on_track'
    : isBehind && forecastGap > 25
      ? 'critical'
      : isBehind
        ? 'at_risk'
        : 'on_track'

  // ── Health color ──
  const healthColor =
    plan.health === 'red' ? 'bg-danger' : plan.health === 'yellow' ? 'bg-warning' : 'bg-success'

  // ── Overdue count badge ──
  const overdueCount = overdueActivities.length

  return (
    <div
      className="group relative bg-card rounded-2xl border border-boundary p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => navigate(`/execution/plans/${plan.id}`)}
    >
      {/* Accent bar at top */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${healthColor}`} />

      {/* Overdue badge */}
      {overdueCount > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-danger/10 text-danger text-xs font-medium rounded-full border border-danger/20 z-10">
          <AlertTriangle size={10} />
          <span>
            {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="min-w-0 flex-1 pr-16">
          <h4 className="text-base font-semibold text-neutral-90 dark:text-white truncate">
            {plan.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-neutral-50">
              {start.toLocaleDateString('es-ES')} — {end.toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      </div>

      {/* Dual progress bars */}
      <div className="space-y-3 mb-3">
        {/* Time progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-neutral-50 uppercase tracking-wide">
              Progreso Temporal
            </span>
            <span className="text-[11px] font-semibold text-muted">
              {Math.min(100, timeProgress)}%
            </span>
          </div>
          <div className="w-full bg-neutral-20 dark:bg-neutral-70 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, timeProgress)}%`,
                background: `linear-gradient(90deg, ${plan.health === 'red' ? '#FF5630' : plan.health === 'yellow' ? '#FFAB00' : '#36B37E'}, ${plan.health === 'red' ? '#FF8B00' : plan.health === 'yellow' ? '#FF8B00' : '#57D9A3'})`,
              }}
            />
          </div>
        </div>

        {/* Activity progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-neutral-50 uppercase tracking-wide">
              Actividades
            </span>
            <span className="text-[11px] font-semibold text-muted">
              {completedActivities}/{totalActivities}
            </span>
          </div>
          <div className="w-full bg-neutral-20 dark:bg-neutral-70 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out bg-primary"
              style={{ width: `${Math.min(100, activityProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between pt-3 border-t border-boundary">
        <div className="flex items-center gap-3">
          {/* Days left */}
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              daysLeft < 0 ? 'text-danger' : daysLeft <= 7 ? 'text-warning' : 'text-muted'
            }`}
          >
            <Clock size={12} />
            {daysLeft > 0 ? `${daysLeft}d` : 'Vencido'}
          </span>

          {/* In progress count */}
          {inProgressActivities > 0 && (
            <span className="flex items-center gap-1 text-xs text-info font-medium">
              <CheckCircle2 size={12} />
              {inProgressActivities} activa{inProgressActivities > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Forecast badge */}
        <div
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            forecastStatus === 'critical'
              ? 'bg-danger/10 text-danger border-danger/20'
              : forecastStatus === 'at_risk'
                ? 'bg-warning/10 text-warning border-warning/20'
                : 'bg-success/10 text-success border-success/20'
          }`}
        >
          {forecastStatus === 'critical' ? (
            <AlertTriangle size={10} />
          ) : forecastStatus === 'at_risk' ? (
            <AlertTriangle size={10} />
          ) : (
            <CheckCircle2 size={10} />
          )}
          <span>
            {forecastStatus === 'critical'
              ? 'Crítico'
              : forecastStatus === 'at_risk'
                ? `-${forecastGap}%`
                : 'En Ruta'}
          </span>
        </div>
      </div>
    </div>
  )
}
