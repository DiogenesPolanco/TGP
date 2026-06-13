import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { Pencil, Server, Search } from 'lucide-react'
import { RelatedEntitiesView } from '@/features/shared/components/RelatedEntitiesView'

const severityLabel: Record<string, string> = { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja', info: 'Info' }
const incidentStatusLabel: Record<string, string> = { detected: 'Detectado', acknowledged: 'Reconocido', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado' }

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'info' | 'relations'>('info')

  const incident = useLiveQuery(() => db.incidents.get(id!), [id])
  const app = useLiveQuery(() => incident?.applicationId ? db.applications.get(incident.applicationId) : undefined, [incident])

  // ── Related entities ──
  const rawMsJunction = useLiveQuery(() => db.incidentMicroservices.where('incidentId').equals(id!).toArray(), [id])
  const msJunction = useMemo(() => rawMsJunction ?? [], [rawMsJunction])
  const msIds = useMemo(() => new Set(msJunction.map((j) => j.microserviceId)), [msJunction])

  const rawMicroservices = useLiveQuery(() => db.microservices.toArray())
  const microservices = useMemo(() => rawMicroservices ?? [], [rawMicroservices])
  const linkedMs = useMemo(() => microservices.filter((ms) => msIds.has(ms.id)), [microservices, msIds])

  const rawAllVulns = useLiveQuery(() => db.vulnerabilities.toArray())
  const allVulns = useMemo(() => rawAllVulns ?? [], [rawAllVulns])
  const rawAllRisks = useLiveQuery(() => db.risks.toArray())
  const allRisks = useMemo(() => rawAllRisks ?? [], [rawAllRisks])
  const rawAllAudit = useLiveQuery(() => db.auditFindings.toArray())
  const allAudit = useMemo(() => rawAllAudit ?? [], [rawAllAudit])

  const relatedData = useMemo(() => {
    if (!incident) return null
    const relatedApps = app ? [app] : []
    const appIds = new Set(relatedApps.map((a) => a.id))
    return {
      apps: relatedApps,
      microservices: linkedMs,
      vulns: allVulns.filter((v) => v.applicationId && appIds.has(v.applicationId)),
      incidents: [incident],
      risks: allRisks.filter((r) => r.applicationId && appIds.has(r.applicationId)),
      auditFindings: allAudit.filter((a) => a.applicationId && appIds.has(a.applicationId)),
    }
  }, [incident, app, linkedMs, allVulns, allRisks, allAudit])

  if (!incident) {
    return <DetailLayout title="Incidente no encontrado" onBack={() => navigate('/security/incidents')}><p className="text-neutral-50">El incidente no existe o ha sido eliminado.</p></DetailLayout>
  }

  const tabs = [
    { id: 'info' as const, label: 'Información General', icon: Server },
    { id: 'relations' as const, label: 'Relacionados', icon: Search },
  ]

  return (
    <DetailLayout
      title={incident.title}
      subtitle={`Severidad: ${severityLabel[incident.severity] ?? incident.severity}`}
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
      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-20 dark:border-neutral-70 -mx-6 px-6 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-60 dark:text-neutral-40 hover:text-neutral-90 dark:hover:text-white'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'info' && (
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
      )}

      {activeTab === 'relations' && relatedData && (
        <RelatedEntitiesView data={relatedData} entityLabel="este incidente" />
      )}
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
