import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import type { Task } from '@/types/domain'
import type { Criticality, DeliverableStatus, TaskStatus } from '@/constants/enums'

export function ActivityFormPage() {
  const { planId, activityId } = useParams<{ planId: string; activityId?: string }>()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()

  const plan = useLiveQuery(() => (planId ? db.plans.get(planId) : undefined), [planId])
  const activity = useLiveQuery(
    () => (activityId ? db.activities.get(activityId) : undefined),
    [activityId],
  )
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const activities =
    useLiveQuery(
      () => (planId ? db.activities.where('planId').equals(planId).toArray() : []),
      [planId],
    ) ?? []

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [parentActivityId, setParentActivityId] = useState('')
  const [priority, setPriority] = useState<Criticality>('medium')
  const [status, setStatus] = useState<DeliverableStatus>('pending')
  const [plannedPoints, setPlannedPoints] = useState('')
  const [completedPoints, setCompletedPoints] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')

  useEffect(() => {
    if (activity) {
      queueMicrotask(() => {
        setTitle(activity.title ?? '')
        setDescription(activity.description ?? '')
        setAssigneeId(activity.assigneeId ?? '')
        setTeamId(activity.teamId ?? '')
        setApplicationId(activity.applicationId ?? '')
        setParentActivityId(activity.parentActivityId ?? '')
        setPriority(activity.priority ?? 'medium')
        setStatus(activity.status ?? 'pending')
        setPlannedPoints(activity.plannedPoints?.toString() ?? '')
        setCompletedPoints(activity.completedPoints?.toString() ?? '')
        setStartDate(activity.startDate ? new Date(activity.startDate).toISOString().split('T')[0] : '')
        setDueDate(activity.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] : '')
        setTasks((activity as any).tasks ?? [])
      })
    }
  }, [activity])

  if (!planId) return <div className="p-6 text-neutral-50">Plan no especificado</div>
  if (activityId && !activity) return <div className="p-6 text-neutral-50">Cargando…</div>
  if (!plan) return <div className="p-6 text-neutral-50">Cargando…</div>

  const addTask = () => {
    if (!newTaskTitle.trim()) return
    const task: Task = {
      id: crypto.randomUUID(),
      activityId: null,
      planId,
      title: newTaskTitle.trim(),
      description: '',
      assigneeId: null,
      status: 'todo' as TaskStatus,
      priority: 'medium' as Criticality,
      estimatedHours: null,
      dueDate: null,
      completedAt: null,
      dependsOn: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setTasks((prev) => [...prev, task])
    setNewTaskTitle('')
  }

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const now = new Date()
      const data = {
        planId,
        parentActivityId: parentActivityId || null,
        title: title.trim(),
        description: description.trim(),
        assigneeId: assigneeId || null,
        teamId: teamId || null,
        applicationId: applicationId || null,
        priority,
        status,
        estimatedHours: activity?.estimatedHours ?? null,
        actualHours: activity?.actualHours ?? null,
        plannedPoints: plannedPoints ? Number(plannedPoints) : null,
        completedPoints: completedPoints ? Number(completedPoints) : null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        completedAt: activity?.completedAt ?? null,
        updatedAt: now,
      }

      if (activity) {
        await db.activities.update(activity.id, data)
        addNotification({ type: 'success', message: 'Actividad actualizada' })
      } else {
        const newActivityId = crypto.randomUUID()
        await db.activities.add({
          id: newActivityId,
          ...data,
          actualHours: null,
          completedAt: null,
          metadata: {},
          createdAt: now,
        })
        if (tasks.length > 0) {
          await db.tasks.bulkAdd(
            tasks.map((t) => ({
              ...t,
              activityId: newActivityId,
            })),
          )
        }
        addNotification({ type: 'success', message: 'Actividad creada' })
      }
      navigate(`/execution/plans/${planId}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/execution/plans/${planId}`)}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
            {activity ? 'Editar Actividad' : 'Nueva Actividad'}
          </h1>
          <p className="text-sm text-neutral-50 mt-0.5">Plan: {plan.title}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Título <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ej. Migrar autenticación a OAuth2"
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Descripción</label>
          <RichTextEditor
            value={description}
            onChange={(html) => setDescription(html)}
            placeholder="Describe la actividad..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Actividad Padre</label>
            <select
              value={parentActivityId}
              onChange={(e) => setParentActivityId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Ninguna (raíz)</option>
              {activities
                .filter((a) => a.id !== activity?.id)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Prioridad</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Criticality)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DeliverableStatus)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="pending">Pendiente</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Equipo</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin equipo</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Asignado a</label>
            <input
              type="text"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder="userPrincipal"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Aplicación</label>
            <select
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin app</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Puntos Planif.</label>
            <input
              type="number"
              value={plannedPoints}
              onChange={(e) => setPlannedPoints(e.target.value)}
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Puntos Comp.</label>
            <input
              type="number"
              value={completedPoints}
              onChange={(e) => setCompletedPoints(e.target.value)}
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Fecha Fin</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Inline tasks (only for new activities) */}
        {!activity && (
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Tareas rápidas</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTask() }}
                placeholder="Agregar tarea y presionar Enter"
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={addTask}
                className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            {tasks.length > 0 && (
              <div className="space-y-1">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-3 py-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg"
                  >
                    <span className="text-sm text-neutral-90 dark:text-white">{t.title}</span>
                    <button
                      onClick={() => removeTask(t.id)}
                      className="p-0.5 text-neutral-50 hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/execution/plans/${planId}`)}
            className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando…' : activity ? 'Actualizar' : 'Crear Actividad'}
          </button>
        </div>
      </div>
    </div>
  )
}
