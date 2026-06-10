import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import type { Activity, Task } from '@/types/domain'
import type { Criticality, DeliverableStatus, TaskStatus } from '@/constants/enums'

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

  const [tasks, setTasks] = useState<Task[]>(activity ? [] : [])
  const [newTaskTitle, setNewTaskTitle] = useState('')

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
      } else {
        const activityId = crypto.randomUUID()
        await db.activities.add({
          id: activityId,
          ...data,
          actualHours: null,
          completedAt: null,
          metadata: {},
          createdAt: now,
        })
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
      <div className="w-full max-w-xl bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {activity ? 'Editar Actividad' : 'Nueva Actividad'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            <X size={20} className="text-neutral-50" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
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

          <div className="col-span-2">
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Descripción</label>
            <RichTextEditor
              value={description}
              onChange={(html) => setDescription(html)}
              placeholder="Describe la actividad..."
            />
          </div>

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
                .map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
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
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <PersonSelect
              label="Asignado a"
              value={assigneeId}
              onChange={setAssigneeId}
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
              {applications.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
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
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Fecha Fin</label>
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
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
              <button onClick={addTask} className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors">
                <Plus size={16} />
              </button>
            </div>
            {tasks.length > 0 && (
              <div className="space-y-1">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
                    <span className="text-sm text-neutral-90 dark:text-white">{t.title}</span>
                    <button onClick={() => removeTask(t.id)} className="p-0.5 text-neutral-50 hover:text-danger transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando…' : activity ? 'Actualizar' : 'Crear Actividad'}
          </button>
        </div>
      </div>
    </div>
  )
}
