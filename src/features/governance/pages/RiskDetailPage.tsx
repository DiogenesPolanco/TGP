import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import {
  Pencil,
  Server,
  Search,
  AlertTriangle,
  Target,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { RelatedEntitiesView } from '@/features/shared/components/RelatedEntitiesView'
import { Button } from '@/components/ui/Button'

const statusLabel: Record<string, string> = {
  open: 'Abierto',
  mitigated: 'Mitigado',
  accepted: 'Aceptado',
  closed: 'Cerrado',
}
const categoryLabel: Record<string, string> = {
  technical: 'Técnico',
  security: 'Seguridad',
  operational: 'Operacional',
  regulatory: 'Regulatorio',
  financial: 'Financiero',
}

export function RiskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'info' | 'relations'>('info')

  const risk = useLiveQuery(() => db.risks.get(id!), [id])
  const app = useLiveQuery(
    () => (risk?.applicationId ? db.applications.get(risk.applicationId) : undefined),
    [risk],
  )
  const bu = useLiveQuery(
    () => (risk?.businessUnitId ? db.businessUnits.get(risk.businessUnitId) : undefined),
    [risk],
  )

  // ── Related entities ──
  const rawMsJunction = useLiveQuery(
    () => db.riskMicroservices.where('riskId').equals(id!).toArray(),
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
  const rawAllAudit = useLiveQuery(() => db.auditFindings.toArray())
  const allAudit = useMemo(() => rawAllAudit ?? [], [rawAllAudit])

  const relatedData = useMemo(() => {
    if (!risk) return null
    const relatedApps = app ? [app] : []
    const appIds = new Set(relatedApps.map((a) => a.id))
    return {
      apps: relatedApps,
      microservices: linkedMs,
      vulns: allVulns.filter((v) => v.applicationId && appIds.has(v.applicationId)),
      incidents: allIncidents.filter((i) => i.applicationId && appIds.has(i.applicationId)),
      risks: [],
      auditFindings: allAudit.filter((a) => a.applicationId && appIds.has(a.applicationId)),
    }
  }, [risk, app, linkedMs, allVulns, allIncidents, allAudit])

  if (!risk) {
    return (
      <DetailLayout title="Riesgo no encontrado" onBack={() => navigate('/governance/risks')}>
        <p className="text-neutral-50">El riesgo no existe o ha sido eliminado.</p>
      </DetailLayout>
    )
  }

  const riskLevel =
    risk.riskScore >= 15
      ? 'Crítico'
      : risk.riskScore >= 10
        ? 'Alto'
        : risk.riskScore >= 5
          ? 'Medio'
          : 'Bajo'
  const riskColor =
    risk.riskScore >= 15
      ? 'bg-danger text-white'
      : risk.riskScore >= 10
        ? 'bg-warning text-white'
        : risk.riskScore >= 5
          ? 'bg-info text-white'
          : 'bg-success text-white'
  const riskBg =
    risk.riskScore >= 15
      ? 'bg-danger/5 border-danger/20'
      : risk.riskScore >= 10
        ? 'bg-warning/5 border-warning/20'
        : risk.riskScore >= 5
          ? 'bg-info/5 border-info/20'
          : 'bg-success/5 border-success/20'
  const riskIcon =
    risk.riskScore >= 15 ? (
      <XCircle size={24} className="text-white" />
    ) : risk.riskScore >= 10 ? (
      <AlertTriangle size={24} className="text-white" />
    ) : risk.riskScore >= 5 ? (
      <Clock size={24} className="text-white" />
    ) : (
      <CheckCircle size={24} className="text-white" />
    )
  const riskIconBg =
    risk.riskScore >= 15
      ? 'bg-danger'
      : risk.riskScore >= 10
        ? 'bg-warning'
        : risk.riskScore >= 5
          ? 'bg-info'
          : 'bg-success'

  const tabs = [
    { id: 'info' as const, label: 'Información General', icon: Server },
    { id: 'relations' as const, label: 'Relacionados', icon: Search },
  ]

  return (
    <DetailLayout
      title={risk.title}
      subtitle={`Score: ${risk.riskScore} · ${riskLevel}`}
      onBack={() => navigate('/governance/risks')}
      backLabel="Riesgos"
      actions={
        <Button
          onClick={() => navigate(`/governance/risks/${id}/edit`)}
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
          <div className={`rounded-xl border p-5 ${riskBg}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${riskIconBg} flex items-center justify-center shadow-sm`}
                >
                  {riskIcon}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-50 dark:text-neutral-40">
                    Nivel de Riesgo
                  </p>
                  <p className="text-xl font-bold text-neutral-90 dark:text-white">{riskLevel}</p>
                  <p className="text-sm text-muted mt-0.5">
                    Score: <span className="font-bold">{risk.riskScore}</span> · Probabilidad{' '}
                    {risk.probability}/5 · Impacto {risk.impact}/5
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg ${riskColor} text-center min-w-[80px]`}>
                <p className="text-2xl font-bold tabular-nums">{risk.riskScore}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-80">Score</p>
              </div>
            </div>
            {risk.mitigationPlan && (
              <div className="mt-4 pt-4 border-t border-current/10">
                <p className="text-xs font-medium text-neutral-50 uppercase tracking-wider mb-1">
                  Plan de Mitigación
                </p>
                <p className="text-sm text-secondary whitespace-pre-wrap">{risk.mitigationPlan}</p>
              </div>
            )}
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Información General" icon={<Server size={18} />}>
              <div className="grid grid-cols-2 gap-3">
                <MiniField label="Título" value={risk.title} />
                <MiniField
                  label="Categoría"
                  value={categoryLabel[risk.category] ?? risk.category}
                />
                <MiniField label="Aplicación" value={app?.name ?? 'Sin asignar'} />
                <MiniField label="Unidad de Negocio" value={bu?.name ?? 'Sin asignar'} />
              </div>
            </Section>

            <Section title="Matriz de Riesgo" icon={<Target size={18} />}>
              <div className="grid grid-cols-2 gap-3">
                <MiniField label="Probabilidad" value={`${risk.probability}/5`} />
                <MiniField label="Impacto" value={`${risk.impact}/5`} />
                <MiniField
                  label="Estado"
                  value={
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        risk.status === 'open'
                          ? 'bg-danger/10 text-danger'
                          : risk.status === 'mitigated'
                            ? 'bg-warning/10 text-warning'
                            : risk.status === 'accepted'
                              ? 'bg-info/10 text-info'
                              : 'bg-success/10 text-success'
                      }`}
                    >
                      {statusLabel[risk.status] ?? risk.status}
                    </span>
                  }
                />
                {risk.targetDate && (
                  <MiniField
                    label="Fecha Objetivo"
                    value={new Date(risk.targetDate).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  />
                )}
              </div>
            </Section>
          </div>
        </div>
      )}

      {activeTab === 'relations' && relatedData && (
        <RelatedEntitiesView data={relatedData} entityLabel="este riesgo" />
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
