import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'

import type { DeliverableStatus } from '@/types/domain'

const statusLabel: Record<DeliverableStatus, string> = { pending: 'Pendiente', in_progress: 'En Progreso', completed: 'Completado', cancelled: 'Cancelado' }
const statusColor: Record<DeliverableStatus, string> = { pending: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60', in_progress: 'bg-info/10 text-info', completed: 'bg-success/10 text-success', cancelled: 'bg-danger/10 text-danger' }

export function DeliverableDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const deliverable = useLiveQuery(() => db.deliverables.get(id!), [id])
  const app = useLiveQuery(() => deliverable?.applicationId ? db.applications.get(deliverable.applicationId) : undefined, [deliverable])
  const objective = useLiveQuery(() => deliverable?.objectiveId ? db.objectives.get(deliverable.objectiveId) : undefined, [deliverable])

  if (!deliverable) {
    return <DetailLayout title="Entregable no encontrado" onBack={() => navigate('/catalog/deliverables')}><p className="text-neutral-50">El entregable no existe o ha sido eliminado.</p></DetailLayout>
  }

  const dueDate = deliverable.dueDate ? new Date(deliverable.dueDate) : null
  // eslint-disable-next-line react-hooks/purity
  const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  return (
    <DetailLayout
      title={deliverable.title}
      subtitle={deliverable.description}
      onBack={() => navigate('/catalog/deliverables')}
      backLabel="Entregables"
      actions={
        <div className="flex items-center gap-2">
          {app && (
            <button
              onClick={() => navigate(`/catalog/applications/${app.id}`)}
              className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              Ver Aplicación
            </button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Información General">
          <Field label="Título" value={deliverable.title} />
          <Field label="Descripción" value={deliverable.description} />
          <Field label="Aplicación" value={app?.name ?? 'Sin asignar'} />
          <Field label="OKR" value={objective?.title ?? 'Sin asignar'} />
        </Section>
        <Section title="Estado">
          <div className="flex items-start gap-2">
            <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">Estado</dt>
            <dd className={`text-sm font-medium px-2 py-0.5 rounded ${statusColor[deliverable.status]}`}>{statusLabel[deliverable.status]}</dd>
          </div>
          <Field label="Fecha Límite" value={dueDate?.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) ?? 'No definida'} />
          {daysLeft !== null && (
            <Field label="Tiempo restante" value={daysLeft >= 0 ? `${daysLeft} días` : `Vencido hace ${Math.abs(daysLeft)} días`} />
          )}
          <Field label="Creado" value={new Date(deliverable.createdAt).toLocaleDateString('es-ES')} />
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
