import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { MemberSelector } from '@/components/ui/MemberSelector'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import type { Activity, Task } from '@/types/domain'
import type { Criticality, DeliverableStatus, TaskStatus } from '@/constants/enums'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

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

  // Load existing tasks from DB when editing
  const existingTasks = useLiveQuery(
    () => (activityId ? db.tasks.where('activityId').equals(activityId).toArray() : []),
    [activityId],
  )

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
      })
    }
  }, [activity])

  // Sync existing DB tasks into local state
  useEffect(() => {
    if (existingTasks) setTasks(existingTasks)
  }, [existingTasks])

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
      const maxSortOrder = tasks.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), 0)
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
        sortOrder: activity?.sortOrder ?? (activities.length > 0 ? Math.max(...activities.map((a: Activity) => a.sortOrder ?? 0)) + 1 : 0),
        startDate: startDate ? parseLocalDate(startDate) : null,
        dueDate: dueDate ? parseLocalDate(dueDate) : null,
        completedAt: activity?.completedAt ?? null,
        updatedAt: now,
      }

      if (activity) {
        await db.activities.update(activity.id, data)
        // Sync tasks: delete removed, add new
        const oldTaskIds = existingTasks?.map((t) => t.id) ?? []
        const currentTaskIds = tasks.map((t) => t.id)
        const toDelete = oldTaskIds.filter((id) => !currentTaskIds.includes(id))
        const toAdd = tasks.filter((t) => !oldTaskIds.includes(t.id))
        if (toDelete.length > 0) await db.tasks.bulkDelete(toDelete)
        if (toAdd.length > 0) {
          await db.tasks.bulkAdd(
            toAdd.map((t) => ({
              ...t,
              activityId: activity.id,
              sortOrder: maxSortOrder + 1,
            })),
          )
        }
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
            tasks.map((t, i) => ({
              ...t,
              activityId: newActivityId,
              sortOrder: i,
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
        <Button
          onClick={() => navigate(`/execution/plans/${planId}`)}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-60" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
            {activity ? 'Editar Actividad' : 'Nueva Actividad'}
          </h1>
          <p className="text-sm text-neutral-50 mt-0.5">Plan: {plan.title}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-boundary p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">
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
          <label className="block text-sm font-medium text-secondary mb-1.5">Descripción</label>
          <RichTextEditor
            value={description}
            onChange={(html) => setDescription(html)}
            placeholder="Describe la actividad..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Actividad Padre</label>
            <Select
              value={parentActivityId}
              onChange={setParentActivityId}
              options={[
                { value: '', label: 'Ninguna (raíz)' },
                ...activities
                  .filter((a) => a.id !== activity?.id)
                  .map((a) => ({ value: a.id, label: a.title })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Prioridad</label>
            <Select
              value={priority}
              onChange={(v) => setPriority(v as Criticality)}
              options={[
                { value: 'low', label: 'Baja' },
                { value: 'medium', label: 'Media' },
                { value: 'high', label: 'Alta' },
                { value: 'critical', label: 'Crítica' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Estado</label>
            <Select
              value={status}
              onChange={(v) => setStatus(v as DeliverableStatus)}
              options={[
                { value: 'pending', label: 'Pendiente' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'completed', label: 'Completado' },
                { value: 'cancelled', label: 'Cancelado' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Equipo</label>
            <Select
              value={teamId}
              onChange={setTeamId}
              options={[
                { value: '', label: 'Sin equipo' },
                ...teams.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>

          <div>
            <MemberSelector
              label="Asignado a"
              value={assigneeId}
              onChange={setAssigneeId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Aplicación</label>
            <Select
              value={applicationId}
              onChange={setApplicationId}
              options={[
                { value: '', label: 'Sin app' },
                ...applications.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Puntos Planif.</label>
            <input
              type="number"
              value={plannedPoints}
              onChange={(e) => setPlannedPoints(e.target.value)}
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Puntos Comp.</label>
            <input
              type="number"
              value={completedPoints}
              onChange={(e) => setCompletedPoints(e.target.value)}
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Fecha Inicio</label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Fecha Fin</label>
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Tareas rápidas</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTask() }}
                placeholder="Agregar tarea y presionar Enter"
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button
                onClick={addTask}
                className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <Plus size={16} />
              </Button>
            </div>
            {tasks.length > 0 && (
              <div className="space-y-1">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-3 py-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg"
                  >
                    <span className="text-sm text-neutral-90 dark:text-white">{t.title}</span>
                    <Button
                      onClick={() => removeTask(t.id)}
                      className="p-0.5 text-neutral-50 hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate(`/execution/plans/${planId}`)}
            className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando…' : activity ? 'Actualizar' : 'Crear Actividad'}
          </Button>
        </div>
      </div>
    </div>
  )
}
