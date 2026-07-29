import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Table } from 'dexie'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/services/db/database'
import {
  Pencil,
  Shield,
  AlertTriangle,
  Activity,
  FileWarning,
  Search,
  Plus,
  Unlink,
  FileText,
  Building2,
  Layers,
  Server,
  Database,
  Package,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import type { Vulnerability, Risk, Incident, AuditFinding } from '@/types/domain'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { TechSearch } from '@/components/ui/TechSearch'
import { DeliverablesTab } from '../components/DeliverablesTab'
import { MicroservicesTab } from '../components/MicroservicesTab'
import { DatabasesTab } from '../components/DatabasesTab'
import { ArchitectureTab } from '../components/ArchitectureTab'
import { useInheritedEntityIds } from '@/hooks/useMicroserviceEntities'
import { HtmlDescription } from '@/components/ui/HtmlDescription'

const criticalityLabel: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

const appStatusLabel: Record<string, string> = {
  active: 'Activa',
  deprecated: 'Deprecada',
  retired: 'Retirada',
  planned: 'Planificada',
}

const criticalityColor: Record<string, string> = {
  critical: 'bg-danger/10 text-danger border-danger/30',
  high: 'bg-warning/10 text-warning border-warning/30',
  medium: 'bg-info/10 text-info border-info/30',
  low: 'bg-success/10 text-success border-success/30',
}

const statusColor: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  deprecated: 'bg-warning/10 text-warning border-warning/30',
  retired: 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
  planned: 'bg-info/10 text-info border-info/30',
}

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
                <div className="space-y-8">
                  {/* ── Información General ── */}
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-90 dark:text-white mb-6">
                      Resumen
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        ['Nombre', application.name, 'text-primary'],
                        ['Owner', application.ownerName, 'text-neutral-90 dark:text-white'],
                        ['Business Unit', bu?.name || '-', 'text-neutral-90 dark:text-white'],
                        [
                          'Arquitectura',
                          application.architecture,
                          'text-neutral-90 dark:text-white',
                        ],
                        [
                          'Estado',
                          appStatusLabel[application.status],
                          `inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[application.status]}`,
                        ],
                        [
                          'Criticidad',
                          criticalityLabel[application.criticality],
                          `inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${criticalityColor[application.criticality]}`,
                        ],
                        ...(application.supportEndDate
                          ? [
                              [
                                'Fin de Soporte',
                                new Date(application.supportEndDate).toLocaleDateString('es-ES'),
                                'text-neutral-90 dark:text-white',
                              ],
                            ]
                          : []),
                      ].map(([label, value, className]) => (
                        <div
                          key={label}
                          className="bg-neutral-10 dark:bg-neutral-70/40 rounded-lg border border-boundary p-4"
                        >
                          <dt className="text-[11px] font-medium text-neutral-50 uppercase tracking-wider mb-1.5">
                            {label}
                          </dt>
                          <dd className={`text-sm font-semibold ${className}`}>{value}</dd>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Métricas ── */}
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider mb-4">
                      Métricas de Seguridad y Riesgo
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricCard
                        icon={Shield}
                        label="Vulnerabilidades"
                        value={activeVulnCount}
                        color="text-danger"
                        bg="bg-danger/5 border-danger/20"
                      />
                      <MetricCard
                        icon={AlertTriangle}
                        label="Riesgos"
                        value={allRisks.length}
                        color="text-warning"
                        bg="bg-warning/5 border-warning/20"
                      />
                      <MetricCard
                        icon={Activity}
                        label="Incidentes"
                        value={allIncidents.length}
                        color="text-info"
                        bg="bg-info/5 border-info/20"
                      />
                      <MetricCard
                        icon={FileWarning}
                        label="Hallazgos"
                        value={allFindings.length}
                        color="text-neutral-60"
                        bg="bg-neutral-10 dark:bg-neutral-70/40 border-boundary"
                      />
                    </div>
                  </div>

                  {/* ── Tech Stack Preview ── */}
                  {appTechnologies.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider">
                          Stack Tecnológico
                        </h3>
                        <button
                          onClick={() => setActiveTab('tech')}
                          className="text-xs text-primary hover:text-primary-dark transition-colors font-medium"
                        >
                          Gestionar →
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {appTechnologies.slice(0, 10).map((tech) => (
                          <span
                            key={tech.id}
                            className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border ${
                              tech.supportStatus === 'eol'
                                ? 'bg-danger/5 text-danger border-danger/20'
                                : tech.supportStatus === 'extended'
                                  ? 'bg-warning/5 text-warning border-warning/20'
                                  : 'bg-success/5 text-success border-success/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                tech.supportStatus === 'eol'
                                  ? 'bg-danger'
                                  : tech.supportStatus === 'extended'
                                    ? 'bg-warning'
                                    : 'bg-success'
                              }`}
                            />
                            {tech.name}
                            <span className="opacity-50 text-xs">{tech.version}</span>
                          </span>
                        ))}
                        {appTechnologies.length > 10 && (
                          <span className="text-sm text-neutral-50 self-center ml-1">
                            +{appTechnologies.length - 10} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Acceso Rápido ── */}
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider mb-4">
                      Explorar
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <QuickLinkCard
                        icon={Server}
                        label="Microservicios"
                        value={microservices?.length ?? 0}
                        onClick={() => setActiveTab('microservices')}
                      />
                      <QuickLinkCard
                        icon={Database}
                        label="Bases de Datos"
                        value={inheritedDatabases?.length ?? 0}
                        onClick={() => setActiveTab('databases')}
                      />
                      <QuickLinkCard
                        icon={Package}
                        label="Entregables"
                        value={deliverables?.length ?? 0}
                        onClick={() => setActiveTab('deliverables')}
                      />
                      <QuickLinkCard
                        icon={Building2}
                        label="Arquitectura"
                        value={`${microservices?.length ?? 0} cont.`}
                        onClick={() => setActiveTab('architecture')}
                      />
                    </div>
                  </div>
                </div>
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

/* ─── Tech Stack Manager ─── */

function TechStackManager({
  applicationId,
  selectedIds,
}: {
  applicationId: string
  selectedIds: string[]
}) {
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const handleChange = async (ids: string[]) => {
    await db.applications.update(applicationId, { technologies: ids })
  }

  const appTechs = useMemo(
    () => allTechnologies.filter((t) => selectedIds.includes(t.id)),
    [allTechnologies, selectedIds],
  )

  const supportStatusLabel: Record<string, string> = {
    active: 'Activo',
    extended: 'S. Extendido',
    eol: 'EOL',
    unknown: '?',
  }

  const supportStatusColor: Record<string, string> = {
    active: 'bg-success/10 text-success border-success/30',
    extended: 'bg-warning/10 text-warning border-warning/30',
    eol: 'bg-danger/10 text-danger border-danger/30',
    unknown: 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
  }

  const techColumns: Column<(typeof allTechnologies)[number]>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Tecnología',
        sortable: true,
        render: (t) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-90 dark:text-white">{t.name}</span>
            <span className="text-xs text-neutral-50">{t.version}</span>
          </div>
        ),
      },
      {
        key: 'vendor',
        label: 'Vendor',
        sortable: true,
        render: (t) => <span className="text-sm text-secondary">{t.vendor || '—'}</span>,
      },
      {
        key: 'category',
        label: 'Categoría',
        sortable: true,
        render: (t) => <span className="text-sm text-secondary capitalize">{t.category}</span>,
      },
      {
        key: 'supportStatus',
        label: 'Estado',
        sortable: true,
        render: (t) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${supportStatusColor[t.supportStatus]}`}
          >
            {supportStatusLabel[t.supportStatus]}
          </span>
        ),
      },
      {
        key: 'eolDate',
        label: 'Fecha EOL',
        sortable: true,
        render: (t) => (
          <span className="text-sm text-secondary">
            {t.eolDate
              ? new Date(t.eolDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })
              : '—'}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Stack Tecnológico{' '}
          <span className="text-neutral-50 text-base font-normal">({selectedIds.length})</span>
        </h4>
      </div>
      <TechSearch selectedIds={selectedIds} onChange={handleChange} enableDepsSearch={true} />
      {appTechs.length > 0 && (
        <SortableTable
          columns={techColumns}
          data={appTechs}
          pageSize={10}
          emptyMessage="Sin tecnologías asignadas"
        />
      )}
    </div>
  )
}

/* ─── Entity List (Vulns / Risks / Incidents / Audit) ─── */

type EntityForList = Vulnerability | Risk | Incident | AuditFinding

function EntityList<T extends EntityForList>({
  title,
  entityType,
  items,
  applicationId,
  headers,
  renderCells,
  severityColor,
}: {
  title: string
  entityType: 'vulnerabilities' | 'risks' | 'incidents' | 'auditFindings'
  items: T[]
  applicationId: string
  headers: string[]
  renderCells: (item: T) => string[]
  severityColor: (item: T) => string | null
}) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const allItemsOfType =
    useLiveQuery(() => (db[entityType] as Table<T, string>).toArray(), [entityType]) ?? []

  const dissociate = async (item: T) => {
    // Only allow dissociation for directly associated entities
    if ((item as { applicationId?: string | null }).applicationId !== applicationId) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db[entityType] as Table<T, string>).update(item.id, { applicationId: null } as any)
  }

  const associate = async (item: T) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db[entityType] as Table<T, string>).update(item.id, { applicationId } as any)
    setSearch('')
    setShowDropdown(false)
  }

  const alreadyAssociatedIds = new Set(items.map((i) => i.id))
  const availableItems = allItemsOfType.filter(
    (item) =>
      !alreadyAssociatedIds.has(item.id) &&
      (!search || (renderCells(item)[0] ?? '').toLowerCase().includes(search.toLowerCase())),
  ) as T[]

  const getSeverityColorClass = (sev: string): string => {
    const colors: Record<string, string> = {
      critical: 'bg-danger/10 text-danger',
      high: 'bg-warning/10 text-warning',
      medium: 'bg-info/10 text-info',
      low: 'bg-success/10 text-success',
    }
    return colors[sev] || 'bg-neutral-10 text-neutral-60'
  }

  const columns: Column<T>[] = useMemo(() => {
    const cols: Column<T>[] = headers.map((header, idx) => ({
      key: `col-${idx}`,
      label: header,
      sortable: true,
      render: (item: T) => {
        const cells = renderCells(item)
        const cell = cells[idx] ?? ''
        const sev = severityColor(item)
        if (idx === 1 && sev) {
          return (
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColorClass(sev)}`}
            >
              {cell}
            </span>
          )
        }
        return <span className="text-sm text-secondary">{cell}</span>
      },
    }))
    cols.push({
      key: 'actions',
      label: 'Acción',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (item: T) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            dissociate(item)
          }}
          className="p-1.5 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 transition-all"
          title="Desasociar"
        >
          <Unlink size={14} />
        </button>
      ),
    })
    return cols
  }, [headers, renderCells, severityColor])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">{title}</h4>
      </div>

      <div className="mb-4">
        <SortableTable
          columns={columns}
          data={items}
          pageSize={10}
          emptyMessage={`No hay ${title.toLowerCase()} asociados`}
        />
      </div>

      <div className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder={`Buscar ${title.toLowerCase()} para asociar...`}
            value={search}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setSearch(e.target.value)
              setShowDropdown(true)
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 mt-1 bg-card border border-boundary rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {availableItems.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-50">
                {search ? 'Sin resultados' : 'No hay más elementos disponibles'}
              </p>
            ) : (
              availableItems.map((item) => {
                const cells = renderCells(item)
                const sev = severityColor(item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => associate(item)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Plus size={14} className="text-primary shrink-0" />
                      <span className="text-neutral-90 dark:text-white truncate">{cells[0]}</span>
                    </div>
                    {sev && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          sev === 'critical'
                            ? 'bg-danger/10 text-danger'
                            : sev === 'high'
                              ? 'bg-warning/10 text-warning'
                              : sev === 'medium'
                                ? 'bg-info/10 text-info'
                                : 'bg-success/10 text-success'
                        }`}
                      >
                        {cells[1]}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Vulnerabilities Tab ─── */

function VulnerabilitiesTab({
  vulnerabilities,
  applicationId,
}: {
  vulnerabilities: Vulnerability[]
  applicationId: string
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const allVulns = useLiveQuery(() => db.vulnerabilities.toArray(), []) ?? []

  const activeVulns = useMemo(
    () => vulnerabilities.filter((v) => v.status !== 'fixed'),
    [vulnerabilities],
  )

  const dissociate = async (vuln: Vulnerability) => {
    if (vuln.applicationId !== applicationId) return
    await db.vulnerabilities.update(vuln.id, { applicationId: null })
  }

  const associate = async (vuln: Vulnerability) => {
    await db.vulnerabilities.update(vuln.id, { applicationId })
    setSearch('')
    setShowDropdown(false)
  }

  const alreadyAssociatedIds = new Set(vulnerabilities.map((v) => v.id))
  const availableVulns = allVulns.filter(
    (v) =>
      !alreadyAssociatedIds.has(v.id) &&
      (!search || v.title.toLowerCase().includes(search.toLowerCase())),
  )

  const severityBadge = (sev: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-danger/10 text-danger',
      high: 'bg-warning/10 text-warning',
      medium: 'bg-info/10 text-info',
      low: 'bg-success/10 text-success',
      info: 'bg-neutral-10 text-neutral-60',
    }
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${colors[sev] || 'bg-neutral-10 text-neutral-60'}`}
      >
        {sev}
      </span>
    )
  }

  const statusLabel: Record<string, string> = {
    open: 'Abierta',
    in_progress: 'En Progreso',
    fixed: 'Corregida',
    accepted: 'Aceptada',
  }

  const getSlaStatus = (vuln: Vulnerability) => {
    const days = Math.ceil(
      (new Date(vuln.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )
    if (days < 0) return { label: 'Vencido', color: 'text-danger' }
    if (days <= 7) return { label: `${days}d`, color: 'text-warning' }
    return { label: `${days}d`, color: 'text-success' }
  }

  const vulnColumns: Column<Vulnerability>[] = [
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (v) => (
        <div>
          <p className="text-sm font-medium text-neutral-90 dark:text-white">{v.title}</p>
          <p className="text-xs text-neutral-50">{v.externalId}</p>
        </div>
      ),
    },
    {
      key: 'severity',
      label: 'Severidad',
      sortable: true,
      render: (v) => severityBadge(v.severity),
    },
    {
      key: 'cvssScore',
      label: 'CVSS',
      sortable: true,
      render: (v) => (
        <span className="text-sm font-medium text-neutral-90 dark:text-white">{v.cvssScore}</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (v) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            v.status === 'in_progress'
              ? 'bg-info/10 text-info'
              : v.status === 'accepted'
                ? 'bg-neutral-10 text-neutral-60'
                : 'bg-danger/10 text-danger'
          }`}
        >
          {statusLabel[v.status]}
        </span>
      ),
    },
    {
      key: 'slaDeadline',
      label: 'SLA',
      sortable: true,
      render: (v) => {
        const sla = getSlaStatus(v)
        return <span className={`text-sm font-medium ${sla.color}`}>{sla.label}</span>
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/security/vulnerabilities/${v.id}`)
            }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Ver vulnerabilidad"
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              dissociate(v)
            }}
            className="p-1.5 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Desasociar"
          >
            <Unlink size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Vulnerabilidades
          {vulnerabilities.length > activeVulns.length && (
            <span className="ml-2 text-sm font-normal text-neutral-50">
              ({activeVulns.length} activas, {vulnerabilities.length - activeVulns.length}{' '}
              corregidas ocultas)
            </span>
          )}
        </h4>
      </div>

      {activeVulns.length === 0 ? (
        <p className="text-sm text-neutral-50 dark:text-neutral-50 mb-4">
          No hay vulnerabilidades activas asociadas
          {vulnerabilities.length > 0 && (
            <> — {vulnerabilities.length} corregidas fueron filtradas</>
          )}
        </p>
      ) : (
        <div className="mb-4">
          <SortableTable
            columns={vulnColumns}
            data={activeVulns}
            pageSize={10}
            onRowClick={(v) => navigate(`/security/vulnerabilities/${v.id}`)}
          />
        </div>
      )}

      {/* Asociar vulnerabilidad */}
      <div className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder="Buscar vulnerabilidades para asociar..."
            value={search}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setSearch(e.target.value)
              setShowDropdown(true)
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 mt-1 bg-card border border-boundary rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {availableVulns.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-50">
                {search ? 'Sin resultados' : 'No hay más vulnerabilidades disponibles'}
              </p>
            ) : (
              availableVulns.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => associate(v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Plus size={14} className="text-primary shrink-0" />
                    <span className="text-neutral-90 dark:text-white truncate">{v.title}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      v.severity === 'critical'
                        ? 'bg-danger/10 text-danger'
                        : v.severity === 'high'
                          ? 'bg-warning/10 text-warning'
                          : v.severity === 'medium'
                            ? 'bg-info/10 text-info'
                            : 'bg-success/10 text-success'
                    }`}
                  >
                    {v.severity}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Editorial Components ─── */

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.FC<{ size?: number }>
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className={`rounded-xl border ${bg} p-4`}>
      <div className={`${color} mb-2`}>
        <Icon size={20} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  )
}

function QuickLinkCard({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: React.FC<{ size?: number }>
  label: string
  value: number | string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-boundary bg-neutral-10 dark:bg-neutral-70/50 hover:border-accent/30 hover:bg-accent/5 transition-all group text-center"
    >
      <div className="p-2 rounded-lg bg-white dark:bg-neutral-70 text-muted group-hover:text-accent transition-colors shadow-sm">
        <Icon size={20} />
      </div>
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xl font-bold text-neutral-90 dark:text-white leading-none">
        {value}
      </span>
    </button>
  )
}
