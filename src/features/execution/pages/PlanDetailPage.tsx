import { useMemo, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { createShareLink, getPublicPlanData } from '@/services/share/publicShareService'
import { encryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { ArrowLeft, Pencil, Share2, Check, Copy } from 'lucide-react'
import { BlockerPanel } from '../components/BlockerPanel'
import { DependencyList } from '../components/DependencyList'
import { ActivityGantt } from '../components/ActivityGantt'
import type { Activity } from '@/types/domain'

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { confirm } = useConfirm()

  const plan = useLiveQuery(() => db.plans.get(id ?? ''), [id])
  const rawActivities = useLiveQuery(() => db.activities.where('planId').equals(id ?? '').toArray(), [id])
  const activities = useMemo(() => rawActivities ?? [], [rawActivities])
  const rawTasks = useLiveQuery(() => db.tasks.where('planId').equals(id ?? '').toArray(), [id])
  const tasks = useMemo(() => rawTasks ?? [], [rawTasks])
  const rawTeams = useLiveQuery(() => db.teams.toArray())
  const teams = useMemo(() => rawTeams ?? [], [rawTeams])
  const rawApplications = useLiveQuery(() => db.applications.toArray())
  const applications = useMemo(() => rawApplications ?? [], [rawApplications])
  const rawObjectives = useLiveQuery(() => db.objectives.toArray())
  const objectives = useMemo(() => rawObjectives ?? [], [rawObjectives])

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const appMap = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications])

  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [sharePending, setSharePending] = useState<unknown>(null)

  const handleShare = useCallback(async () => {
    if (!id) return
    const data = await getPublicPlanData(id)
    if (!data) return
    setSharePending(data)
    setShowPassphrase(true)
  }, [id])

  const cleanUrl = shareUrl?.split('#')[0] ?? ''
  const handleCopy = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareUrl])

  const childActivities = (parentId: string) => activities.filter((a) => a.parentActivityId === parentId)

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

  const daysTotal = Math.ceil((new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24))
  // eslint-disable-next-line react-hooks/purity
  const daysLeft = Math.ceil((new Date(plan.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
            <button
              onClick={() => navigate(`/execution/plans/${plan.id}/edit`)}
              className="p-2 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-70 text-neutral-50 hover:text-primary transition-colors"
              title="Editar Plan"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-70 text-neutral-50 hover:text-primary transition-colors"
              title="Compartir Plan"
            >
              <Share2 size={18} />
            </button>
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

      {shareUrl && (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 flex items-center gap-3 max-w-full overflow-hidden">
          <span className="text-sm text-neutral-50 shrink-0">Enlace público:</span>
          <a href={cleanUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-xs bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-lg text-primary hover:text-primary-dark truncate font-mono min-w-0 hover:underline">
            {cleanUrl}
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-primary/10 text-primary hover:bg-primary/20"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}

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
          <span>{new Date(plan.startDate).toLocaleDateString('es-ES')}</span>
          {objective && <span>OKR: {objective.title}</span>}
          <span>{new Date(plan.endDate).toLocaleDateString('es-ES')}</span>
        </div>
      </div>

      {/* Blockers and Dependencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BlockerPanel sourceType="plan" sourceId={plan.id} />
        <DependencyList planId={plan.id} />
      </div>

      {/* Phase 4: Interactive Gantt Chart */}
      <ActivityGantt
        planId={plan.id}
        activities={activities}
        tasks={tasks}
        teamMap={teamMap}
        appMap={appMap}
        onEditActivity={(activityId) => navigate(`/execution/plans/${plan.id}/activities/${activityId}/edit`)}
        onDeleteActivity={handleDeleteActivity}
        onTaskToggle={handleTaskStatusToggle}
        onNewActivity={() => navigate(`/execution/plans/${plan.id}/activities/new`)}
      />

      {showPassphrase && (
        <PassphraseModal
          title="Compartir Plan"
          buttonLabel="Compartir"
          description="Opcional: agrega una contraseña para cifrar los datos. Quien reciba el enlace necesitará la contraseña para verlos."
          onSubmit={async (pass) => {
            const data = sharePending
            const payload = pass ? await encryptData(data, pass) : data
            const { url } = await createShareLink(48, 'plan', id, payload)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onSkip={async () => {
            const data = sharePending
            const { url } = await createShareLink(48, 'plan', id, data)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onClose={() => { setShowPassphrase(false); setSharePending(null) }}
        />
      )}
    </div>
  )
}


