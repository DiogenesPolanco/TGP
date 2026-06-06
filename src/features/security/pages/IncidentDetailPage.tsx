import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { Pencil } from 'lucide-react'

const severityLabel: Record<string, string> = { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja', info: 'Info' }
const incidentStatusLabel: Record<string, string> = { detected: 'Detectado', acknowledged: 'Reconocido', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado' }

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const incident = useLiveQuery(() => db.incidents.get(id!), [id])
  const app = useLiveQuery(() => incident?.applicationId ? db.applications.get(incident.applicationId) : null, [incident])

  if (!incident) {
    return <DetailLayout title="Incidente no encontrado" onBack={() => navigate('/security/incidents')}><p className="text-neutral-50">El incidente no existe o ha sido eliminado.</p></DetailLayout>
  }

  return (
    <DetailLayout
      title={incident.title}
      subtitle={`ID externo: ${incident.externalId}`}
      onBack={() => navigate('/security/incidents')}
      backLabel="Incidentes"
      actions={
        <button
          onClick={() => navigate(`/security/incidents/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Pencil size={16} />
          Editar
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Información General">
          <Field label="Título" value={incident.title} />
          <Field label="Descripción" value={incident.description} />
          <Field label="ID Externo" value={incident.externalId} />
          <Field label="Aplicación" value={app?.name ?? 'Sin asignar'} />
          <Field label="RCA" value={incident.rca ?? 'No registrado'} />
        </Section>
        <Section title="Métricas">
          <Field label="Severidad" value={severityLabel[incident.severity] ?? incident.severity} />
          <Field label="Estado" value={incidentStatusLabel[incident.status] ?? incident.status} />
          <Field label="Detectado" value={new Date(incident.detectedAt).toLocaleDateString('es-ES')} />
          <Field label="Respondido" value={incident.respondedAt ? new Date(incident.respondedAt).toLocaleDateString('es-ES') : '—'} />
          <Field label="Resuelto" value={incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString('es-ES') : '—'} />
          <Field label="Downtime" value={incident.downtimeMinutes ? `${incident.downtimeMinutes} min` : '—'} />
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
