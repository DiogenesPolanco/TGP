import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  XCircle,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Pencil,
  ListTodo,
  Ban,
} from 'lucide-react'
import type { Blocker, Activity, Commitment, Task } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { HtmlDescription } from '@/components/ui/HtmlDescription'

// ── StatCard ──

export function StatCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: ReactNode
  label: string
  value: number
  color: string
  onClick?: () => void
}) {
  const iconClasses: Record<string, string> = {
    'text-primary': 'bg-primary/10 text-primary',
    'text-danger': 'bg-danger/10 text-danger',
    'text-warning': 'bg-warning/10 text-warning',
    'text-success': 'bg-success/10 text-success',
    'text-info': 'bg-info/10 text-info',
  }
  const CardComp = onClick ? Button : 'div'
  return (
    <CardComp
      onClick={onClick}
      className="bg-card rounded-2xl border border-boundary p-4 shadow-sm flex items-center justify-center gap-3"
    >
      <div className={`p-2 rounded-lg ${iconClasses[color] || 'bg-primary/10 text-primary'}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </CardComp>
  )
}

// ── BlockersPanel ──

const severityLabel: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  info: 'Info',
}

export function BlockersPanel({
  blockers,
  blockerPlan,
}: {
  blockers: Blocker[]
  blockerPlan: (blocker: Blocker) => { id: string; title: string } | undefined
}) {
  const navigate = useNavigate()

  if (blockers.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-danger/30 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-danger/5 border-b border-danger/20">
        <Ban size={16} className="text-danger" />
        <h3 className="text-sm font-semibold text-danger">
          Bloqueos Activos ({blockers.length})
        </h3>
      </div>
      <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
        {blockers.slice(0, 5).map((blocker) => {
          const plan = blockerPlan(blocker)
          return (
            <div
              key={blocker.id}
              className="px-4 py-3 cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors group"
              onClick={() => navigate(`/execution/blockers/${blocker.id}/edit`)}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    blocker.severity === 'critical'
                      ? 'bg-danger/10 text-danger'
                      : blocker.severity === 'high'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-neutral-10 text-neutral-60'
                  }`}
                >
                  {severityLabel[blocker.severity]}
                </span>
                <span className="text-sm font-medium text-neutral-90 dark:text-white flex-1 truncate">
                  {blocker.title}
                </span>
                <Pencil
                  size={14}
                  className="shrink-0 text-neutral-40 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="text-xs text-muted mt-1 ml-1">
                <HtmlDescription html={blocker.description} lines={1} />
              </div>
              <div className="flex items-center gap-2 mt-1 ml-1">
                {plan && <span className="text-xs text-primary font-medium">{plan.title}</span>}
                {blocker.assigneeId && (
                  <span className="text-xs text-neutral-50">Asignado: {blocker.assigneeId}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── OverduePanel ──

export function OverduePanel({
  overdue,
  planMap,
  today,
}: {
  overdue: Activity[]
  planMap: Map<string, { title: string }>
  today: Date
}) {
  const navigate = useNavigate()

  if (overdue.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-boundary">
        <XCircle size={16} className="text-danger" />
        <h3 className="text-sm font-semibold text-danger">Vencidas ({overdue.length})</h3>
      </div>
      <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
        {overdue.map((act) => {
          const plan = planMap.get(act.planId)
          const daysOverdue = Math.ceil(
            (today.getTime() - new Date(act.dueDate!).getTime()) / (1000 * 60 * 60 * 24),
          )
          return (
            <div key={act.id} className="px-4 py-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                  {act.title}
                </p>
                <p className="text-xs text-neutral-50">
                  {plan?.title} &middot; {daysOverdue}d vencida
                  {act.assigneeId && <span> &middot; {act.assigneeId}</span>}
                </p>
              </div>
              <Button
                onClick={() => navigate(`/execution/plans/${act.planId}`)}
                className="shrink-0 p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
              >
                <ArrowRight size={16} />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── DuePanel ──

export function DuePanel({
  dueToday,
  commitmentsDueSoon,
  planMap,
  appMap,
  selectedWeek,
}: {
  dueToday: Activity[]
  commitmentsDueSoon: Commitment[]
  planMap: Map<string, { title: string }>
  appMap: Map<string, { name: string }>
  selectedWeek: boolean
}) {
  const navigate = useNavigate()

  return (
    <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-boundary">
        <Calendar size={16} className="text-warning" />
        <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">
          {selectedWeek ? 'Vence Esta Semana' : 'Vence Hoy'}
        </h3>
        {dueToday.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">
            {dueToday.length}
          </span>
        )}
      </div>
      <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
        {dueToday.length === 0 && commitmentsDueSoon.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-50">
            <CheckCircle2 size={24} className="mx-auto text-success mb-2" />
            <p>Sin vencimientos para hoy</p>
          </div>
        ) : (
          <>
            {dueToday.map((act) => {
              const plan = planMap.get(act.planId)
              const app = appMap.get(act.applicationId ?? '')
              return (
                <div
                  key={act.id}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors group"
                  onClick={() => navigate(`/execution/plans/${act.planId}`)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                      {act.title}
                    </p>
                    <p className="text-xs text-neutral-50">
                      {plan?.title}
                      {app && <span> &middot; {app.name}</span>}
                      {act.assigneeId && <span> &middot; {act.assigneeId}</span>}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-neutral-40 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              )
            })}
            {commitmentsDueSoon.map((c) => {
              const app = appMap.get(c.applicationId ?? '')
              return (
                <div
                  key={c.id}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors group"
                  onClick={() => navigate('/execution/commitments')}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                      Compromiso: {c.title}
                    </p>
                    <p className="text-xs text-neutral-50">
                      Vence: {new Date(c.commitmentDate).toLocaleDateString('es-ES')}
                      {app && <span> &middot; {app.name}</span>}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-neutral-40 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// ── TasksPanel ──

export function TasksPanel({
  tasksDue,
  planMap,
}: {
  tasksDue: Task[]
  planMap: Map<string, { title: string }>
}) {
  const navigate = useNavigate()

  if (tasksDue.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-boundary">
        <ListTodo size={16} className="text-info" />
        <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">
          Tareas Pendientes ({tasksDue.length})
        </h3>
      </div>
      <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
        {tasksDue.slice(0, 8).map((task) => {
          const plan = planMap.get(task.planId ?? '')
          return (
            <div
              key={task.id}
              className="px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors group"
              onClick={() => task.planId && navigate(`/execution/plans/${task.planId}`)}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  task.priority === 'critical'
                    ? 'bg-danger'
                    : task.priority === 'high'
                      ? 'bg-warning'
                      : 'bg-neutral-40'
                }`}
              />
              <span className="text-sm text-neutral-90 dark:text-white flex-1 truncate">
                {task.title}
              </span>
              {plan && <span className="text-xs text-neutral-50 shrink-0">{plan.title}</span>}
              <ArrowRight
                size={14}
                className="shrink-0 text-neutral-40 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
