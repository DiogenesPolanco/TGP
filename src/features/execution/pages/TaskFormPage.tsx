import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useForm } from 'react-hook-form'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import { criticalityOptions, taskStatusOptions } from '@/constants/options'
import type { Task, Criticality } from '@/types/domain'

interface TaskFormData {
  title: string
  description: string
  planId: string
  activityId: string
  assigneeId: string
  priority: Criticality
  status: string
  estimatedHours: number | null
  dueDate: string
}

export function TaskFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const isEdit = !!id

  const task = useLiveQuery(() => (id ? db.tasks.get(id) : undefined), [id])
  const plans = useLiveQuery(() => db.plans.toArray()) ?? []
  const activities = useLiveQuery(() => db.activities.toArray()) ?? []

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<TaskFormData>()

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        planId: task.planId ?? '',
        activityId: task.activityId ?? '',
        assigneeId: task.assigneeId ?? '',
        priority: task.priority,
        status: task.status,
        estimatedHours: task.estimatedHours,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      })
    }
  }, [task, reset])

  const onSubmit = async (data: TaskFormData) => {
    const now = new Date()
    const payload = {
      title: data.title,
      description: data.description,
      planId: data.planId || null,
      activityId: data.activityId || null,
      assigneeId: data.assigneeId || null,
      priority: data.priority,
      status: data.status,
      estimatedHours: data.estimatedHours || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      updatedAt: now,
    }

    if (isEdit) {
      await db.tasks.update(id!, { ...payload } as any)
      addNotification({ type: 'success', message: 'Tarea actualizada' })
      navigate(`/execution/tasks/${id}`)
    } else {
      const newId = await db.tasks.add({
        id: crypto.randomUUID(),
        ...payload,
        completedAt: null,
        dependsOn: [],
        metadata: {},
        createdAt: now,
      } as Task)
      addNotification({ type: 'success', message: 'Tarea creada' })
      navigate(`/execution/tasks/${newId}`)
    }
  }

  return (
    <DetailLayout
      title={isEdit ? 'Editar Tarea' : 'Nueva Tarea'}
      onBack={() => navigate('/execution/tasks')}
      backLabel="Tareas"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Título</Label>
            <input {...register('title', { required: 'El título es obligatorio' })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
          </div>
          <div className="md:col-span-2">
            <Label>Descripción</Label>
            <textarea {...register('description')} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <Label>Plan</Label>
            <select {...register('planId')}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin plan</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <Label>Actividad</Label>
            <select {...register('activityId')}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin actividad</option>
              {activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
          <div>
            <Label>Prioridad</Label>
            <select {...register('priority', { required: true })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              {criticalityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Estado</Label>
            <select {...register('status', { required: true })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              {taskStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <PersonSelect
              label="Asignado a"
              value={watch('assigneeId')}
              onChange={(id) => setValue('assigneeId', id)}
            />
          </div>
          <div>
            <Label>Horas estimadas</Label>
            <input type="number" {...register('estimatedHours', { valueAsNumber: true })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <Label>Fecha límite</Label>
            <DatePicker {...register('dueDate')}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-20 dark:border-neutral-70">
          <button type="submit" disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50">
            {isEdit ? 'Guardar Cambios' : 'Crear Tarea'}
          </button>
          <button type="button" onClick={() => navigate('/execution/tasks')}
            className="px-6 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </DetailLayout>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-neutral-60 dark:text-neutral-40 mb-1">{children}</label>
}
