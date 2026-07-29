import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import {
  Pencil,
  Server,
  Search,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileWarning,
} from 'lucide-react'
import { RelatedEntitiesView } from '@/features/shared/components/RelatedEntitiesView'
import { Button } from '@/components/ui/Button'
import { HtmlDescription } from '@/components/ui/HtmlDescription'

const severityLabel: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  info: 'Info',
}
const statusLabel: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  overdue: 'Vencido',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}
const categoryLabel: Record<string, string> = {
  security: 'Seguridad',
  compliance: 'Cumplimiento',
  architecture: 'Arquitectura',
  process: 'Proceso',
  data_governance: 'Data Gov.',
  access_control: 'Acceso',
  business_continuity: 'Continuidad',
}

const severityBg: Record<string, string> = {
  critical: 'bg-danger/5 border-danger/20',
  high: 'bg-warning/5 border-warning/20',
  medium: 'bg-info/5 border-info/20',
  low: 'bg-success/5 border-success/20',
  info: 'bg-neutral-10 dark:bg-neutral-70 border-neutral-20',
}
const severityIcon: Record<string, React.ReactNode> = {
  critical: <XCircle size={24} className="text-white" />,
  high: <AlertTriangle size={24} className="text-white" />,
  medium: <Clock size={24} className="text-white" />,
  low: <CheckCircle size={24} className="text-white" />,
  info: <HelpCircle size={24} className="text-white" />,
}
const severityIconBg: Record<string, string> = {
  critical: 'bg-danger',
  high: 'bg-warning',
  medium: 'bg-info',
  low: 'bg-success',
  info: 'bg-neutral-50',
}

export function AuditDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'info' | 'relations'>('info')

  const finding = useLiveQuery(() => db.auditFindings.get(id!), [id])
  const app = useLiveQuery(
    () => (finding?.applicationId ? db.applications.get(finding.applicationId) : undefined),
    [finding],
  )

  // ── Related entities ──
  const rawMsJunction = useLiveQuery(
    () => db.auditFindingMicroservices.where('auditFindingId').equals(id!).toArray(),
    [id],
  )
  const msJunction = useMemo(() => rawMsJunction ?? [], [rawMsJunction])
  const msIds = useMemo(() => new Set(msJunction.map((j) => j.microserviceId)), [msJunction])

  const rawMicroservices = useLiveQuery(() => db.microservices.toArray())
  const microservices = useMemo(() => rawMicroservices ?? [], [rawMicroservices])
  const linkedMs = useMemo(
    () => microservices.filter((ms) => msIds.has(ms.id)),
    [microservices, msIds],
  )

  const rawAllVulns = useLiveQuery(() => db.vulnerabilities.toArray())
  const allVulns = useMemo(() => rawAllVulns ?? [], [rawAllVulns])
  const rawAllIncidents = useLiveQuery(() => db.incidents.toArray())
  const allIncidents = useMemo(() => rawAllIncidents ?? [], [rawAllIncidents])
  const rawAllRisks = useLiveQuery(() => db.risks.toArray())
  const allRisks = useMemo(() => rawAllRisks ?? [], [rawAllRisks])

  const relatedData = useMemo(() => {
    if (!finding) return null
    const relatedApps = app ? [app] : []
    const appIds = new Set(relatedApps.map((a) => a.id))
    return {
      apps: relatedApps,
      microservices: linkedMs,
      vulns: allVulns.filter((v) => v.applicationId && appIds.has(v.applicationId)),
      incidents: allIncidents.filter((i) => i.applicationId && appIds.has(i.applicationId)),
      risks: allRisks.filter((r) => r.applicationId && appIds.has(r.applicationId)),
      auditFindings: [],
    }
  }, [finding, app, linkedMs, allVulns, allIncidents, allRisks])

  const slaDays = finding
    ? Math.ceil((new Date(finding.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0
  const slaColor = slaDays < 0 ? 'text-danger' : slaDays <= 7 ? 'text-warning' : 'text-success'

  if (!finding) {
    return (
      <DetailLayout title="Hallazgo no encontrado" onBack={() => navigate('/governance/audit')}>
        <p className="text-neutral-50">El hallazgo no existe o ha sido eliminado.</p>
      </DetailLayout>
    )
  }

  const tabs = [
    { id: 'info' as const, label: 'Información General', icon: Server },
    { id: 'relations' as const, label: 'Relacionados', icon: Search },
  ]

  return (
    <DetailLayout
      title={finding.title}
      subtitle={`Ref: ${finding.auditReference}`}
      onBack={() => navigate('/governance/audit')}
      backLabel="Auditoría"
      actions={
        <Button
          onClick={() => navigate(`/governance/audit/${id}/edit`)}
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
          <div
            className={`rounded-xl border p-5 ${severityBg[finding.severity] || 'bg-neutral-10'}`}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${severityIconBg[finding.severity] || 'bg-neutral-40'} flex items-center justify-center shadow-sm`}
                >
                  {severityIcon[finding.severity] || (
                    <HelpCircle size={24} className="text-white" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-50 dark:text-neutral-40">
                    Severidad
                  </p>
                  <p className="text-xl font-bold text-neutral-90 dark:text-white">
                    {severityLabel[finding.severity] ?? finding.severity}
                  </p>
                  <p className="text-sm text-muted mt-0.5">
                    {categoryLabel[finding.category] ?? finding.category} ·{' '}
                    {statusLabel[finding.status] ?? finding.status}
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg ${slaColor} text-center`}>
                <p className="text-2xl font-bold tabular-nums">
                  {slaDays < 0 ? Math.abs(slaDays) : slaDays}
                </p>
                <p className="text-[10px] uppercase tracking-wider">
                  {slaDays < 0 ? 'días vencido' : 'días restantes'}
                </p>
              </div>
            </div>
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Información General" icon={<Server size={18} />}>
              <div className="grid grid-cols-2 gap-3">
                <MiniField label="Título" value={finding.title} />
                <MiniField label="Referencia" value={finding.auditReference} />
                <MiniField
                  label="Categoría"
                  value={categoryLabel[finding.category] ?? finding.category}
                />
                <MiniField label="Aplicación" value={app?.name ?? 'Sin asignar'} />
              </div>
            </Section>

            <Section title="Clasificación" icon={<Shield size={18} />}>
              <div className="grid grid-cols-2 gap-3">
                <MiniField
                  label="Severidad"
                  value={
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        finding.severity === 'critical'
                          ? 'bg-danger/10 text-danger'
                          : finding.severity === 'high'
                            ? 'bg-warning/10 text-warning'
                            : finding.severity === 'medium'
                              ? 'bg-info/10 text-info'
                              : 'bg-success/10 text-success'
                      }`}
                    >
                      {severityLabel[finding.severity] ?? finding.severity}
                    </span>
                  }
                />
                <MiniField
                  label="Estado"
                  value={
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        finding.status === 'open'
                          ? 'bg-danger/10 text-danger'
                          : finding.status === 'in_progress'
                            ? 'bg-warning/10 text-warning'
                            : finding.status === 'overdue'
                              ? 'bg-danger/10 text-danger'
                              : finding.status === 'resolved'
                                ? 'bg-success/10 text-success'
                                : 'bg-neutral-10 text-neutral-60'
                      }`}
                    >
                      {statusLabel[finding.status] ?? finding.status}
                    </span>
                  }
                />
                <MiniField
                  label="Vencimiento"
                  value={new Date(finding.dueDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                />
                <MiniField
                  label="SLA"
                  value={
                    <span
                      className={`text-xs font-medium ${slaDays < 0 ? 'text-danger' : slaDays <= 7 ? 'text-warning' : 'text-success'}`}
                    >
                      {slaDays < 0 ? `${Math.abs(slaDays)}d vencido` : `${slaDays}d restantes`}
                    </span>
                  }
                />
              </div>
            </Section>
          </div>

          {finding.description && (
            <Section title="Descripción" icon={<FileWarning size={18} />}>
              <HtmlDescription html={finding.description} full />
            </Section>
          )}

          {finding.actionPlan && (
            <Section title="Plan de Acción" icon={<CheckCircle size={18} />}>
              <HtmlDescription html={finding.actionPlan.description} full />
              {finding.actionPlan.items.length > 0 && (
                <ul className="space-y-2">
                  {finding.actionPlan.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 text-sm">
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${item.isCompleted ? 'bg-success border-success' : 'border-neutral-40'}`}
                      >
                        {item.isCompleted && <span className="text-white text-[10px]">✓</span>}
                      </span>
                      <span
                        className={`${item.isCompleted ? 'line-through text-neutral-50' : 'text-neutral-90 dark:text-white'}`}
                      >
                        {item.description}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}
        </div>
      )}

      {activeTab === 'relations' && relatedData && (
        <RelatedEntitiesView data={relatedData} entityLabel="este hallazgo" />
      )}
    </DetailLayout>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
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
      <dd className="text-sm text-neutral-90 dark:text-white">
        {typeof value === 'string' ? value || '—' : value}
      </dd>
    </div>
  )
}
