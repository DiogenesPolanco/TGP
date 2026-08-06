import { ArrowRight, AlertTriangle, AlertOctagon, Calendar, Target } from 'lucide-react'
import { useNavigate } from 'react-router'

interface Milestone {
  date: Date
  title: string
  planTitle: string
  planId: string
  type: 'due' | 'end'
}

interface Alert {
  severity: 'critical' | 'warning' | 'info'
  message: string
  link?: string
}

interface Props {
  milestones: Milestone[]
  alerts: Alert[]
  today: Date
}

export function ExecutiveTimelineSidebar({ milestones, alerts, today }: Props) {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-boundary">
          <Calendar size={15} className="text-primary" />
          <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Próximos Hitos</h3>
        </div>
        <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {milestones.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-50">No hay hitos próximos</div>
          ) : (
            milestones.map((m, i) => {
              const d = new Date(m.date)
              const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div
                  key={i}
                  className="px-4 py-3 cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors"
                  onClick={() => navigate(`/execution/plans/${m.planId}`)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    {m.type === 'end' ? (
                      <Target size={12} className="text-danger" />
                    ) : (
                      <Calendar size={12} className="text-warning" />
                    )}
                    <span
                      className={`text-xs font-semibold ${diffDays <= 0 ? 'text-danger' : diffDays <= 3 ? 'text-warning' : 'text-neutral-90 dark:text-white'}`}
                    >
                      {diffDays <= 0
                        ? 'VENCE HOY'
                        : diffDays === 1
                          ? 'MAÑANA'
                          : `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                    </span>
                  </div>
                  <p className="text-xs text-secondary truncate">{m.title}</p>
                  <p className="text-[10px] text-neutral-50 mt-0.5">{m.planTitle}</p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-boundary">
            <AlertOctagon size={15} className="text-danger" />
            <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Alertas</h3>
          </div>
          <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`px-4 py-3 flex items-start gap-2 cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors ${a.severity === 'critical' ? 'bg-danger/[0.02]' : a.severity === 'warning' ? 'bg-warning/[0.02]' : ''}`}
                onClick={() => a.link && navigate(a.link)}
              >
                <AlertTriangle
                  size={14}
                  className={`shrink-0 mt-0.5 ${a.severity === 'critical' ? 'text-danger' : a.severity === 'warning' ? 'text-warning' : 'text-info'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-secondary">{a.message}</p>
                </div>
                <ArrowRight size={12} className="shrink-0 text-neutral-40 mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
