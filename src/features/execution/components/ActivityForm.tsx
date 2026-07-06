import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { MemberSelector } from '@/components/ui/MemberSelector'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { Activity, Task } from '@/types/domain'
import type { Criticality, DeliverableStatus, TaskStatus } from '@/constants/enums'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

interface ActivityFormProps {
  planId: string
  activity: Activity | null
  onClose: () => void
  onSave: () => void
}

export function ActivityForm({ planId, activity, onClose, onSave }: ActivityFormProps) {
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const activities = useLiveQuery(() => db.activities.where('planId').equals(planId).toArray()) ?? []

  const [title, setTitle] = useState(activity?.title ?? '')
  const [description, setDescription] = useState(activity?.description ?? '')
  const [assigneeId, setAssigneeId] = useState(activity?.assigneeId ?? '')
  const [teamId, setTeamId] = useState(activity?.teamId ?? '')
  const [applicationId, setApplicationId] = useState(activity?.applicationId ?? '')
  const [parentActivityId, setParentActivityId] = useState(activity?.parentActivityId ?? '')
  const [priority, setPriority] = useState<Criticality>(activity?.priority ?? 'medium')
  const [status, setStatus] = useState<DeliverableStatus>(activity?.status ?? 'pending')
  const [plannedPoints, setPlannedPoints] = useState(activity?.plannedPoints?.toString() ?? '')
  const [completedPoints, setCompletedPoints] = useState(activity?.completedPoints?.toString() ?? '')
  const [startDate, setStartDate] = useState(
    activity?.startDate ? new Date(activity.startDate).toISOString().split('T')[0] : '',
  )
  const [dueDate, setDueDate] = useState(
    activity?.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] : '',
  )
  const [saving, setSaving] = useState(false)

  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Load existing tasks when editing
  const existingTasks = useLiveQuery(
    () => (activity?.id ? db.tasks.where('activityId').equals(activity.id).toArray() : []),
    [activity?.id],
  )

  useEffect(() => {
    if (existingTasks) setTasks(existingTasks)
  }, [existingTasks])

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
      const data: Partial<Activity> = {
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
        sortOrder: activity?.sortOrder ?? (activities.length > 0 ? Math.max(...activities.map((a) => a.sortOrder ?? 0)) + 1 : 0),
        startDate: startDate ? parseLocalDate(startDate) : null,
        dueDate: dueDate ? parseLocalDate(dueDate) : null,
        completedAt: activity?.completedAt ?? null,
        updatedAt: now,
      }

      if (activity) {
        await db.activities.update(activity.id, data)
      } else {
        const activityId = crypto.randomUUID()
        await db.activities.add({
          id: activityId,
          ...data,
          sortOrder: data.sortOrder ?? 0,
          actualHours: null,
          completedAt: null,
          metadata: {},
          createdAt: now,
        } as Activity)
        // Save inline tasks
        if (tasks.length > 0) {
          await db.tasks.bulkAdd(
            tasks.map((t) => ({
              ...t,
              activityId,
            })),
          )
        }
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card rounded-2xl border border-boundary shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {activity ? 'Editar Actividad' : 'Nueva Actividad'}
          </h3>
          <Button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            <X size={20} className="text-neutral-50" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
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

          <div className="col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1.5">Descripción</label>
            <RichTextEditor
              value={description}
              onChange={(html) => setDescription(html)}
              placeholder="Describe la actividad..."
            />
          </div>

          <div>
            <Select
              label="Actividad Padre"
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
            <Select
              label="Prioridad"
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
            <Select
              label="Estado"
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
            <Select
              label="Equipo"
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
            <Select
              label="Aplicación"
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
              <Button onClick={addTask} className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors">
                <Plus size={16} />
              </Button>
            </div>
            {tasks.length > 0 && (
              <div className="space-y-1">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
                    <span className="text-sm text-neutral-90 dark:text-white">{t.title}</span>
                    <Button onClick={() => removeTask(t.id)} className="p-0.5 text-neutral-50 hover:text-danger transition-colors">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando…' : activity ? 'Actualizar' : 'Crear Actividad'}
          </Button>
        </div>
      </div>
    </div>
  )
}
