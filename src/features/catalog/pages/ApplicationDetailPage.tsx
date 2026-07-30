import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/services/db/database'
import {
  Pencil,
  FileText,
  Shield,
  AlertTriangle,
  Activity,
  FileWarning,
  Building2,
  Layers,
  Server,
  Database,
  Package,
  ChevronRight,
} from 'lucide-react'
import type { Vulnerability, Risk, Incident, AuditFinding } from '@/types/domain'
import { DeliverablesTab } from '../components/DeliverablesTab'
import { MicroservicesTab } from '../components/MicroservicesTab'
import { DatabasesTab } from '../components/DatabasesTab'
import { ArchitectureTab } from '../components/ArchitectureTab'
import { useInheritedEntityIds } from '@/hooks/useMicroserviceEntities'
import { HtmlDescription } from '@/components/ui/HtmlDescription'
import { EntityList } from '../components/EntityList'
import { VulnerabilitiesTab } from '../components/VulnerabilitiesTab'
import { TechStackManager } from '../components/TechStackManager'
import { AppSummaryTab } from '../components/AppSummaryTab'
import { criticalityLabel, appStatusLabel, criticalityColor, statusColor } from '../constants/applicationConstants'

const tabConfig = [
  { id: 'summary', label: 'Resumen', icon: FileText },
  { id: 'architecture', label: 'Arquitectura', icon: Building2 },
  { id: 'tech', label: 'Tech Stack', icon: Layers },
  { id: 'microservices', label: 'Microservicios', icon: Server },
  { id: 'databases', label: 'Bases de Datos', icon: Database },
  { id: 'vulns', label: 'Vulnerabilidades', icon: Shield },
  { id: 'risks', label: 'Riesgos', icon: AlertTriangle },
  { id: 'incidents', label: 'Incidentes', icon: Activity },
  { id: 'audit', label: 'Auditoría', icon: FileWarning },
  { id: 'deliverables', label: 'Entregables', icon: Package },
] as const

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('summary')

  const application = useLiveQuery(() => db.applications.get(id!), [id])
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray())
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const vulnerabilities = useLiveQuery(
    () => db.vulnerabilities.where('applicationId').equals(id!).toArray(),
    [id],
  )
  const risks = useLiveQuery(() => db.risks.where('applicationId').equals(id!).toArray(), [id])
  const incidents = useLiveQuery(
    () => db.incidents.where('applicationId').equals(id!).toArray(),
    [id],
  )
  const findings = useLiveQuery(
    () => db.auditFindings.where('applicationId').equals(id!).toArray(),
    [id],
  )
  const deliverables = useLiveQuery(
    () => db.deliverables.where('applicationId').equals(id!).toArray(),
    [id],
  )
  const microservices = useLiveQuery(
    () => db.microservices.where('applicationId').equals(id!).toArray(),
    [id],
  )
  const microserviceIds = useMemo(() => (microservices ?? []).map((m) => m.id), [microservices])

  const {
    inheritedVulnIds,
    inheritedRiskIds,
    inheritedIncidentIds,
    inheritedAuditIds,
    inheritedDatabaseIds,
  } = useInheritedEntityIds(microserviceIds)

  const inheritedVulns =
    useLiveQuery(
      () =>
        inheritedVulnIds.size > 0
          ? db.vulnerabilities
              .where('id')
              .anyOf([...inheritedVulnIds])
              .toArray()
          : [],
      [inheritedVulnIds.size],
    ) ?? []

  const inheritedRisks =
    useLiveQuery(
      () =>
        inheritedRiskIds.size > 0
          ? db.risks
              .where('id')
              .anyOf([...inheritedRiskIds])
              .toArray()
          : [],
      [inheritedRiskIds.size],
    ) ?? []

  const inheritedIncidents =
    useLiveQuery(
      () =>
        inheritedIncidentIds.size > 0
          ? db.incidents
              .where('id')
              .anyOf([...inheritedIncidentIds])
              .toArray()
          : [],
      [inheritedIncidentIds.size],
    ) ?? []

  const inheritedFindings =
    useLiveQuery(
      () =>
        inheritedAuditIds.size > 0
          ? db.auditFindings
              .where('id')
              .anyOf([...inheritedAuditIds])
              .toArray()
          : [],
      [inheritedAuditIds.size],
    ) ?? []

  const inheritedDatabases =
    useLiveQuery(
      () =>
        inheritedDatabaseIds.size > 0
          ? db.appDatabases
              .where('id')
              .anyOf([...inheritedDatabaseIds])
              .toArray()
          : [],
      [inheritedDatabaseIds.size],
    ) ?? []

  const allVulns = useMemo(() => {
    const map = new Map<string, Vulnerability>()
    for (const v of vulnerabilities ?? []) map.set(v.id, v)
    for (const v of inheritedVulns) if (!map.has(v.id)) map.set(v.id, v)
    return [...map.values()]
  }, [vulnerabilities, inheritedVulns])

  const allRisks = useMemo(() => {
    const map = new Map<string, Risk>()
    for (const r of risks ?? []) map.set(r.id, r)
    for (const r of inheritedRisks) if (!map.has(r.id)) map.set(r.id, r)
    return [...map.values()]
  }, [risks, inheritedRisks])

  const allIncidents = useMemo(() => {
    const map = new Map<string, Incident>()
    for (const i of incidents ?? []) map.set(i.id, i)
    for (const i of inheritedIncidents) if (!map.has(i.id)) map.set(i.id, i)
    return [...map.values()]
  }, [incidents, inheritedIncidents])

  const allFindings = useMemo(() => {
    const map = new Map<string, AuditFinding>()
    for (const f of findings ?? []) map.set(f.id, f)
    for (const f of inheritedFindings) if (!map.has(f.id)) map.set(f.id, f)
    return [...map.values()]
  }, [findings, inheritedFindings])

  if (!application) {
    return (
      <div className="bg-card rounded-xl border border-boundary p-6 shadow-sm">
        <p className="text-muted">Aplicación no encontrada</p>
      </div>
    )
  }

  const bu = businessUnits?.find((b) => b.id === application.businessUnitId)
  const appTechnologies = allTechnologies.filter((t) => application.technologies.includes(t.id))

  const activeVulnCount = allVulns.filter((v) => v.status !== 'fixed').length

  const tabCounts: Record<string, number | undefined> = {
    tech: appTechnologies.length,
    microservices: microservices?.length,
    databases: inheritedDatabases?.length,
    vulns: activeVulnCount,
    risks: allRisks.length,
    incidents: allIncidents.length,
    audit: allFindings.length,
    deliverables: deliverables?.length,
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-50">
        <button
          onClick={() => navigate('/catalog/applications')}
          className="hover:text-neutral-90 dark:hover:text-white transition-colors"
        >
          Aplicaciones
        </button>
        <ChevronRight size={14} className="text-neutral-40" />
        <span className="text-neutral-90 dark:text-white font-medium truncate max-w-[200px]">
          {application.name}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-neutral-90 dark:text-white leading-tight">
            {application.name}
          </h1>
          {application.description && (
            <HtmlDescription html={application.description} full className="max-w-2xl" />
          )}
          <div className="flex items-center gap-3 pt-1">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-medium ${criticalityColor[application.criticality]}`}
            >
              {criticalityLabel[application.criticality]}
            </span>
            <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-neutral-10 dark:bg-neutral-70 text-muted">
              {appStatusLabel[application.status]}
            </span>
            <span className="text-sm text-neutral-50">
              {bu?.name && `${bu.name} · `}
              {application.ownerName} · {application.architecture}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/catalog/applications/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm shrink-0"
        >
          <Pencil size={16} />
          Editar
        </button>
      </div>

      {/* Tabs + Content */}
      <div className="flex gap-8">
        {/* Vertical Tabs */}
        <nav className="w-44 shrink-0 space-y-1">
          {tabConfig.map((tab) => {
            const Icon = tab.icon
            const count = tabCounts[tab.id]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-accent/10 text-accent font-medium shadow-sm'
                    : 'text-muted hover:text-neutral-90 dark:hover:text-white hover:bg-neutral-10 dark:hover:bg-neutral-70'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{tab.label}</span>
                {count !== undefined && (
                  <span
                    className={`ml-auto text-xs font-medium ${
                      activeTab === tab.id ? 'text-accent' : 'text-neutral-50'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-card rounded-xl border border-boundary shadow-sm p-8"
            >
              {activeTab === 'summary' && (
                <AppSummaryTab
                  application={application}
                  buName={bu?.name}
                  appTechnologies={appTechnologies}
                  activeVulnCount={activeVulnCount}
                  risksCount={allRisks.length}
                  incidentsCount={allIncidents.length}
                  findingsCount={allFindings.length}
                  microservicesCount={microservices?.length ?? 0}
                  databasesCount={inheritedDatabases?.length ?? 0}
                  deliverablesCount={deliverables?.length ?? 0}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'architecture' && <ArchitectureTab applicationId={id!} />}

              {activeTab === 'tech' && (
                <TechStackManager
                  applicationId={application.id}
                  selectedIds={application.technologies}
                />
              )}

              {activeTab === 'microservices' && <MicroservicesTab applicationId={id!} />}

              {activeTab === 'databases' && (
                <DatabasesTab applicationId={id!} databases={inheritedDatabases ?? []} />
              )}

              {activeTab === 'vulns' && (
                <VulnerabilitiesTab vulnerabilities={allVulns} applicationId={id!} />
              )}

              {activeTab === 'risks' && (
                <EntityList
                  title="Riesgos"
                  entityType="risks"
                  items={allRisks}
                  applicationId={id!}
                  headers={['Título', 'Categoría', 'Score', 'Estado']}
                  renderCells={(r: Risk) => [r.title, r.category, r.riskScore.toString(), r.status]}
                  severityColor={() => null}
                />
              )}

              {activeTab === 'incidents' && (
                <EntityList
                  title="Incidentes"
                  entityType="incidents"
                  items={allIncidents}
                  applicationId={id!}
                  headers={['Título', 'Severidad', 'Estado', 'Downtime']}
                  renderCells={(i: Incident) => [
                    i.title,
                    i.severity,
                    i.status,
                    `${i.downtimeMinutes ?? 0} min`,
                  ]}
                  severityColor={(i: Incident) => i.severity}
                />
              )}

              {activeTab === 'audit' && (
                <EntityList
                  title="Hallazgos de Auditoría"
                  entityType="auditFindings"
                  items={allFindings}
                  applicationId={id!}
                  headers={['Título', 'Severidad', 'Estado', 'Vencimiento']}
                  renderCells={(f: AuditFinding) => [
                    f.title,
                    f.severity,
                    f.status,
                    new Date(f.dueDate).toLocaleDateString('es-ES'),
                  ]}
                  severityColor={(f: AuditFinding) => f.severity}
                />
              )}

              {activeTab === 'deliverables' && <DeliverablesTab applicationId={id!} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}


