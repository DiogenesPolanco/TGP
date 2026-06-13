import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { Pencil, Server, Search } from 'lucide-react'
import { RelatedEntitiesView } from '@/features/shared/components/RelatedEntitiesView'

const statusLabel: Record<string, string> = { open: 'Abierto', mitigated: 'Mitigado', accepted: 'Aceptado', closed: 'Cerrado' }
const categoryLabel: Record<string, string> = { technical: 'Técnico', security: 'Seguridad', operational: 'Operacional', regulatory: 'Regulatorio', financial: 'Financiero' }

export function RiskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'info' | 'relations'>('info')

  const risk = useLiveQuery(() => db.risks.get(id!), [id])
  const app = useLiveQuery(() => risk?.applicationId ? db.applications.get(risk.applicationId) : undefined, [risk])
  const bu = useLiveQuery(() => risk?.businessUnitId ? db.businessUnits.get(risk.businessUnitId) : undefined, [risk])

  // ── Related entities ──
  const rawMsJunction = useLiveQuery(() => db.riskMicroservices.where('riskId').equals(id!).toArray(), [id])
  const msJunction = useMemo(() => rawMsJunction ?? [], [rawMsJunction])
  const msIds = useMemo(() => new Set(msJunction.map((j) => j.microserviceId)), [msJunction])

  const rawMicroservices = useLiveQuery(() => db.microservices.toArray())
  const microservices = useMemo(() => rawMicroservices ?? [], [rawMicroservices])
  const linkedMs = useMemo(() => microservices.filter((ms) => msIds.has(ms.id)), [microservices, msIds])

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
      risks: [risk],
      auditFindings: allAudit.filter((a) => a.applicationId && appIds.has(a.applicationId)),
    }
  }, [risk, app, linkedMs, allVulns, allIncidents, allAudit])

  if (!risk) {
    return <DetailLayout title="Riesgo no encontrado" onBack={() => navigate('/governance/risks')}><p className="text-neutral-50">El riesgo no existe o ha sido eliminado.</p></DetailLayout>
  }

  const riskLevel = risk.riskScore >= 15 ? 'Crítico' : risk.riskScore >= 10 ? 'Alto' : risk.riskScore >= 5 ? 'Medio' : 'Bajo'
  const riskColor = risk.riskScore >= 15 ? 'bg-danger/10 text-danger' : risk.riskScore >= 10 ? 'bg-warning/10 text-warning' : risk.riskScore >= 5 ? 'bg-info/10 text-info' : 'bg-success/10 text-success'

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
        <button
          onClick={() => navigate(`/governance/risks/${id}/edit`)}
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
            <Field label="Título" value={risk.title} />
            <Field label="Descripción" value={risk.description} />
            <Field label="Categoría" value={categoryLabel[risk.category] ?? risk.category} />
            <Field label="Aplicación" value={app?.name ?? 'Sin asignar'} />
            <Field label="Unidad de Negocio" value={bu?.name ?? 'Sin asignar'} />
          </Section>
          <Section title="Matriz de Riesgo">
            <Field label="Probabilidad" value={`${risk.probability}/5`} />
            <Field label="Impacto" value={`${risk.impact}/5`} />
            <div className="flex items-start gap-2">
              <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">Score</dt>
              <dd className={`text-sm font-bold px-2 py-0.5 rounded ${riskColor}`}>{risk.riskScore} · {riskLevel}</dd>
            </div>
            <Field label="Estado" value={statusLabel[risk.status] ?? risk.status} />
            {risk.targetDate && <Field label="Fecha Objetivo" value={new Date(risk.targetDate).toLocaleDateString('es-ES')} />}
          </Section>
        </div>
      )}

      {activeTab === 'relations' && relatedData && (
        <RelatedEntitiesView data={relatedData} entityLabel="este riesgo" />
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
