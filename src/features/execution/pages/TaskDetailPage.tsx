import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { Pencil } from 'lucide-react'
import type { Criticality } from '@/types/domain'

const priorityLabel: Record<Criticality, string> = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' }
const priorityColor: Record<Criticality, string> = { critical: 'bg-danger/10 text-danger', high: 'bg-warning/10 text-warning', medium: 'bg-info/10 text-info', low: 'bg-success/10 text-success' }
const statusLabel: Record<string, string> = { todo: 'Por Hacer', in_progress: 'En Progreso', review: 'Revisión', done: 'Completada' }
const statusColor: Record<string, string> = { todo: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60', in_progress: 'bg-info/10 text-info', review: 'bg-warning/10 text-warning', done: 'bg-success/10 text-success' }

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const task = useLiveQuery(() => db.tasks.get(id!), [id])
  const plan = useLiveQuery(() => task?.planId ? db.plans.get(task.planId) : undefined, [task])
  const activity = useLiveQuery(() => task?.activityId ? db.activities.get(task.activityId) : undefined, [task])

  if (!task) {
    return <DetailLayout title="Tarea no encontrada" onBack={() => navigate('/execution/tasks')}><p className="text-neutral-50">La tarea no existe o ha sido eliminada.</p></DetailLayout>
  }

  return (
    <DetailLayout
      title={task.title}
      subtitle={task.description || undefined}
      onBack={() => navigate('/execution/tasks')}
      backLabel="Tareas"
      actions={
        <button
          onClick={() => navigate(`/execution/tasks/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Pencil size={16} />
          Editar
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Información General">
          <Field label="Título" value={task.title} />
          <Field label="Descripción" value={task.description || 'Sin descripción'} />
          <Field label="Plan" value={plan?.title ?? 'Sin asignar'} />
          <Field label="Actividad" value={activity?.title ?? 'Sin asignar'} />
          <Field label="Asignado" value={task.assigneeId ?? 'Sin asignar'} />
        </Section>
        <Section title="Estado y Prioridad">
          <div className="flex items-start gap-2">
            <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">Prioridad</dt>
            <dd className={`text-sm font-medium px-2 py-0.5 rounded ${priorityColor[task.priority]}`}>{priorityLabel[task.priority]}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">Estado</dt>
            <dd className={`text-sm font-medium px-2 py-0.5 rounded ${statusColor[task.status]}`}>{statusLabel[task.status]}</dd>
          </div>
          <Field label="Horas estimadas" value={task.estimatedHours ? `${task.estimatedHours}h` : '—'} />
          <Field label="Fecha límite" value={task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : '—'} />
          {task.completedAt && <Field label="Completada" value={new Date(task.completedAt).toLocaleDateString('es-ES')} />}
          <Field label="Dependencias" value={task.dependsOn.length > 0 ? `${task.dependsOn.length} tarea(s)` : 'Ninguna'} />
        </Section>
      </div>
    </DetailLayout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">{label}</dt>
      <dd className="text-sm text-neutral-90 dark:text-white flex-1">{value || '—'}</dd>
    </div>
  )
}
