import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { Pencil, Server, Search, Shield, AlertTriangle, Calendar, Clock, Activity, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { RelatedEntitiesView } from '@/features/shared/components/RelatedEntitiesView'
import { Button } from '@/components/ui/Button'

const severityLabel: Record<string, string> = { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja', info: 'Info' }
const incidentStatusLabel: Record<string, string> = { detected: 'Detectado', acknowledged: 'Reconocido', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado' }

const severityColor: Record<string, string> = { critical: 'bg-danger text-white', high: 'bg-warning text-white', medium: 'bg-info text-white', low: 'bg-success text-white', info: 'bg-neutral-50 text-white' }
const severityBg: Record<string, string> = { critical: 'bg-danger/5 border-danger/20', high: 'bg-warning/5 border-warning/20', medium: 'bg-info/5 border-info/20', low: 'bg-success/5 border-success/20', info: 'bg-neutral-10 dark:bg-neutral-70 border-neutral-20' }
const severityIcon: Record<string, React.ReactNode> = { critical: <XCircle size={24} className="text-white" />, high: <AlertTriangle size={24} className="text-white" />, medium: <Clock size={24} className="text-white" />, low: <CheckCircle size={24} className="text-white" />, info: <HelpCircle size={24} className="text-white" /> }
const severityIconBg: Record<string, string> = { critical: 'bg-danger', high: 'bg-warning', medium: 'bg-info', low: 'bg-success', info: 'bg-neutral-50' }

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
      incidents: [],
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
        <Button
          onClick={() => navigate(`/security/incidents/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Pencil size={16} />
          Editar
        </Button>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 border-b border-boundary -mx-6 px-6 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant="ghost"
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-neutral-90 dark:hover:text-white'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Hero banner */}
          <div className={`rounded-xl border p-5 ${severityBg[incident.severity] || 'bg-neutral-10'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${severityIconBg[incident.severity] || 'bg-neutral-40'} flex items-center justify-center shadow-sm`}>
                  {severityIcon[incident.severity] || <HelpCircle size={24} className="text-white" />}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-50 dark:text-neutral-40">Severidad</p>
                  <p className="text-xl font-bold text-neutral-90 dark:text-white">{severityLabel[incident.severity] ?? incident.severity}</p>
                  <p className="text-sm text-muted mt-0.5">
                    {incidentStatusLabel[incident.status] ?? incident.status}
                    {incident.downtimeMinutes ? ` · Downtime: ${incident.downtimeMinutes} min` : ''}
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg ${severityColor[incident.severity] || 'bg-neutral-50 text-white'} text-center`}>
                <p className="text-2xl font-bold tabular-nums">{incident.downtimeMinutes ?? '—'}</p>
                <p className="text-[10px] uppercase tracking-wider">Downtime</p>
              </div>
            </div>
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Información General" icon={<Shield size={18} />}>
              <div className="grid grid-cols-2 gap-3">
                <MiniField label="Título" value={incident.title} />
                <MiniField label="ID Externo" value={incident.externalId} />
                <MiniField label="Aplicación" value={app?.name ?? 'Sin asignar'} />
                <MiniField label="RCA" value={incident.rca ?? 'No registrado'} />
              </div>
            </Section>

            <Section title="Métricas" icon={<Activity size={18} />}>
              <div className="grid grid-cols-2 gap-3">
                <MiniField
                  label="Severidad"
                  value={
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      incident.severity === 'critical' ? 'bg-danger/10 text-danger' :
                      incident.severity === 'high' ? 'bg-warning/10 text-warning' :
                      incident.severity === 'medium' ? 'bg-info/10 text-info' :
                      'bg-success/10 text-success'
                    }`}>
                      {severityLabel[incident.severity] ?? incident.severity}
                    </span>
                  }
                />
                <MiniField
                  label="Estado"
                  value={
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      incident.status === 'detected' ? 'bg-danger/10 text-danger' :
                      incident.status === 'acknowledged' ? 'bg-warning/10 text-warning' :
                      incident.status === 'in_progress' ? 'bg-info/10 text-info' :
                      incident.status === 'resolved' ? 'bg-success/10 text-success' :
                      'bg-neutral-10 text-neutral-60'
                    }`}>
                      {incidentStatusLabel[incident.status] ?? incident.status}
                    </span>
                  }
                />
                <MiniField label="Downtime" value={incident.downtimeMinutes ? `${incident.downtimeMinutes} min` : '—'} />
              </div>
            </Section>
          </div>

          <Section title="Timeline" icon={<Calendar size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-10 dark:bg-neutral-70/40 rounded-lg border border-boundary p-3">
                <p className="text-[10px] font-medium text-neutral-50 uppercase tracking-wider mb-1">Detectado</p>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">
                  {new Date(incident.detectedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="bg-neutral-10 dark:bg-neutral-70/40 rounded-lg border border-boundary p-3">
                <p className="text-[10px] font-medium text-neutral-50 uppercase tracking-wider mb-1">Respondido</p>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">
                  {incident.respondedAt ? new Date(incident.respondedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
              <div className="bg-neutral-10 dark:bg-neutral-70/40 rounded-lg border border-boundary p-3">
                <p className="text-[10px] font-medium text-neutral-50 uppercase tracking-wider mb-1">Resuelto</p>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">
                  {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
            </div>
          </Section>

          {incident.description && (
            <Section title="Descripción" icon={<Activity size={18} />}>
              <p className="text-sm text-secondary leading-relaxed">{incident.description}</p>
            </Section>
          )}
        </div>
      )}

      {activeTab === 'relations' && relatedData && (
        <RelatedEntitiesView data={relatedData} entityLabel="este incidente" />
      )}
    </DetailLayout>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-boundary p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
        {icon && <span className="text-neutral-50">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  )
}

function MiniField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[10px] font-medium text-neutral-40 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-neutral-90 dark:text-white">{typeof value === 'string' ? (value || '—') : value}</dd>
    </div>
  )
}
