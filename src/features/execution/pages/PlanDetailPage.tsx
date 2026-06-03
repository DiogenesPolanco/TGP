import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { ArrowLeft, Plus, Edit, Trash2, ChevronDown, ChevronUp, Circle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { ActivityForm } from '../components/ActivityForm'
import { BlockerPanel } from '../components/BlockerPanel'
import { DependencyList } from '../components/DependencyList'
import type { Activity } from '@/types/domain'
import type { DeliverableStatus } from '@/constants/enums'

const statusIcon: Record<DeliverableStatus, React.ReactNode> = {
  pending: <Circle size={16} className="text-neutral-50" />,
  in_progress: <Clock size={16} className="text-info" />,
  completed: <CheckCircle2 size={16} className="text-success" />,
  cancelled: <XCircle size={16} className="text-neutral-50" />,
}

const statusLabel: Record<DeliverableStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const priorityColor: Record<string, string> = {
  low: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-danger/10 text-danger',
}

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { confirm } = useConfirm()

  const [showActivityForm, setShowActivityForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

  const plan = useLiveQuery(() => db.plans.get(id ?? ''), [id])
  const activities = useLiveQuery(() => db.activities.where('planId').equals(id ?? '').toArray(), [id]) ?? []
  const tasks = useLiveQuery(() => db.tasks.where('planId').equals(id ?? '').toArray(), [id]) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const objectives = useLiveQuery(() => db.objectives.toArray()) ?? []

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const appMap = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications])

  const rootActivities = activities.filter((a) => !a.parentActivityId)
  const childActivities = (parentId: string) => activities.filter((a) => a.parentActivityId === parentId)

  const tasksByActivity = useMemo(() => {
    const map = new Map<string, typeof tasks>()
    for (const t of tasks) {
      if (t.activityId) {
        const existing = map.get(t.activityId) ?? []
        existing.push(t)
        map.set(t.activityId, existing)
      }
    }
    return map
  }, [tasks])

  const stats = useMemo(() => ({
    total: activities.length,
    completed: activities.filter((a) => a.status === 'completed').length,
    inProgress: activities.filter((a) => a.status === 'in_progress').length,
    pending: activities.filter((a) => a.status === 'pending').length,
    totalTasks: tasks.length,
    doneTasks: tasks.filter((t) => t.status === 'done').length,
  }), [activities, tasks])

  const handleDeleteActivity = async (activity: Activity) => {
    const childCount = childActivities(activity.id).length
    const msg = childCount > 0
      ? `"${activity.title}" tiene ${childCount} sub-actividad(es). Eliminar todo?`
      : `Eliminar "${activity.title}"?`
    if (!(await confirm(msg))) return
    for (const child of childActivities(activity.id)) {
      await db.tasks.where('activityId').equals(child.id).delete()
      await db.activities.delete(child.id)
    }
    await db.tasks.where('activityId').equals(activity.id).delete()
    await db.activities.delete(activity.id)
  }

  const handleTaskStatusToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    await db.tasks.update(taskId, {
      status: newStatus as 'todo' | 'done',
      completedAt: newStatus === 'done' ? new Date() : null,
      updatedAt: new Date(),
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedActivities((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-50">Plan no encontrado</p>
        <button onClick={() => navigate('/execution/plans')} className="mt-4 text-sm text-primary hover:underline">
          Volver a planes
        </button>
      </div>
    )
  }

  const daysTotal = Math.ceil((plan.endDate.getTime() - plan.startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysLeft = Math.ceil((plan.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const progress = daysTotal > 0 ? Math.round(((daysTotal - Math.max(0, daysLeft)) / daysTotal) * 100) : 0

  const objective = plan.objectiveId ? objectives.find((o) => o.id === plan.objectiveId) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/execution/plans')} className="p-2 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-70 transition-colors">
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">{plan.title}</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              plan.health === 'red' ? 'bg-danger/10 text-danger border-danger/30' :
              plan.health === 'yellow' ? 'bg-warning/10 text-warning border-warning/30' :
              'bg-success/10 text-success border-success/30'
            }`}>
              {plan.health === 'red' ? 'Critico' : plan.health === 'yellow' ? 'En Riesgo' : 'Saludable'}
            </span>
          </div>
          {plan.description && (
            <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">{plan.description}</p>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <p className="text-2xl font-bold text-neutral-90 dark:text-white">{stats.total}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Actividades</p>
        </div>
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Completadas</p>
        </div>
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <p className="text-2xl font-bold text-info">{stats.inProgress}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">En Progreso</p>
        </div>
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <p className="text-2xl font-bold text-neutral-90 dark:text-white">{stats.doneTasks}/{stats.totalTasks}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Tareas</p>
        </div>
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <p className="text-2xl font-bold text-neutral-90 dark:text-white">{daysLeft > 0 ? `${daysLeft}d` : 'Vencido'}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Tiempo restante</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Progreso del Plan</span>
          <span className="text-sm text-neutral-60">{Math.min(100, progress)}%</span>
        </div>
        <div className="w-full bg-neutral-20 dark:bg-neutral-70 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${
              plan.health === 'red' ? 'bg-danger' : plan.health === 'yellow' ? 'bg-warning' : 'bg-success'
            }`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-neutral-50">
          <span>{plan.startDate.toLocaleDateString('es-ES')}</span>
          {objective && <span>OKR: {objective.title}</span>}
          <span>{plan.endDate.toLocaleDateString('es-ES')}</span>
        </div>
      </div>

      {/* Blockers and Dependencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BlockerPanel sourceType="plan" sourceId={plan.id} />
        <DependencyList planId={plan.id} />
      </div>

      {/* Activities section */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-20 dark:border-neutral-70">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            Actividades ({rootActivities.length})
          </h3>
          <button
            onClick={() => { setEditingActivity(null); setShowActivityForm(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            <Plus size={16} />
            Nueva Actividad
          </button>
        </div>

        <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {rootActivities.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-50">
              No hay actividades. Crea la primera para empezar.
            </div>
          ) : (
            rootActivities.map((activity) => (
              <ActivityNode
                key={activity.id}
                activity={activity}
                childActivities={childActivities(activity.id)}
                tasks={tasksByActivity.get(activity.id) ?? []}
                teamMap={teamMap}
                appMap={appMap}
                expanded={expandedActivities.has(activity.id)}
                onToggle={() => toggleExpand(activity.id)}
                onEdit={() => { setEditingActivity(activity); setShowActivityForm(true) }}
                onDelete={() => handleDeleteActivity(activity)}
                onTaskToggle={handleTaskStatusToggle}
              />
            ))
          )}
        </div>
      </div>

      {showActivityForm && (
        <ActivityForm
          planId={plan.id}
          activity={editingActivity}
          onClose={() => { setShowActivityForm(false); setEditingActivity(null) }}
          onSave={() => { setShowActivityForm(false); setEditingActivity(null) }}
        />
      )}
    </div>
  )
}

function ActivityNode({
  activity,
  childActivities: children,
  tasks,
  teamMap,
  appMap,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onTaskToggle,
}: {
  activity: Activity
  childActivities: Activity[]
  tasks: { id: string; title: string; status: string }[]
  teamMap: Map<string, { name: string }>
  appMap: Map<string, { name: string }>
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onTaskToggle: (taskId: string, currentStatus: string) => void
}) {
  return (
    <div className="group">
      <div className="flex items-start justify-between px-6 py-4 hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {statusIcon[activity.status]}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-90 dark:text-white">{activity.title}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColor[activity.priority]}`}>
                {activity.priority}
              </span>
              <span className="text-xs text-neutral-50">{statusLabel[activity.status]}</span>
            </div>
            {activity.description && (
              <p className="text-xs text-neutral-60 dark:text-neutral-40 mt-0.5 line-clamp-1">{activity.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-50">
              {activity.assigneeId && <span>{activity.assigneeId}</span>}
              {teamMap.get(activity.teamId ?? '') && <span>{teamMap.get(activity.teamId!)?.name}</span>}
              {appMap.get(activity.applicationId ?? '') && <span>{appMap.get(activity.applicationId!)?.name}</span>}
              {activity.estimatedHours && <span>{activity.estimatedHours}h est.</span>}
              {activity.dueDate && (
                <span className={new Date(activity.dueDate) < new Date() && activity.status !== 'completed' ? 'text-danger' : ''}>
                  Vence: {new Date(activity.dueDate).toLocaleDateString('es-ES')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-4">
          {children.length > 0 && (
            <button onClick={onToggle} className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
              {expanded ? <ChevronUp size={16} className="text-neutral-50" /> : <ChevronDown size={16} className="text-neutral-50" />}
            </button>
          )}
          <button onClick={onEdit} className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
            <Edit size={14} />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Sub-activities */}
      {expanded && children.length > 0 && (
        <div className="ml-12 border-l-2 border-neutral-20 dark:border-neutral-70">
          {children.map((child) => (
            <div key={child.id} className="flex items-start justify-between px-6 py-3 hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {statusIcon[child.status]}
                <div className="min-w-0">
                  <span className="text-sm text-neutral-90 dark:text-white">{child.title}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${priorityColor[child.priority]}`}>
                    {child.priority}
                  </span>
                  {child.assigneeId && <span className="ml-2 text-xs text-neutral-50">{child.assigneeId}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={onEdit} className="p-1 rounded text-neutral-50 hover:text-primary"><Edit size={14} /></button>
                <button onClick={onDelete} className="p-1 rounded text-neutral-50 hover:text-danger"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline Tasks */}
      {tasks.length > 0 && (
        <div className="ml-12 pb-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onTaskToggle(task.id, task.status)}
              className="flex items-center gap-2 px-6 py-1.5 w-full text-left hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors group"
            >
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.status === 'done'
                  ? 'bg-success border-success'
                  : 'border-neutral-40 dark:border-neutral-50 group-hover:border-primary'
              }`}>
                {task.status === 'done' && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <span className={`text-xs ${task.status === 'done' ? 'line-through text-neutral-50' : 'text-neutral-70 dark:text-neutral-30'}`}>
                {task.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
