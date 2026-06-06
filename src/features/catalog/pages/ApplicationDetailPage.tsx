import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Table } from 'dexie'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/services/db/database'
import {
  Pencil, Shield, AlertTriangle, Activity, FileWarning,
  Plus, X, Unlink, Search, FileText, Building2, Layers, Server,
  Database, Package, ChevronRight,
} from 'lucide-react'
import type { Technology, Vulnerability, Risk, Incident, AuditFinding, SupportStatus } from '@/types/domain'
import { DeliverablesTab } from '../components/DeliverablesTab'
import { MicroservicesTab } from '../components/MicroservicesTab'
import { DatabasesTab } from '../components/DatabasesTab'
import { ArchitectureTab } from '../components/ArchitectureTab'

const statusColors: Record<SupportStatus, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40 border-neutral-30 dark:border-neutral-60',
}

const statusLabel: Record<SupportStatus, string> = {
  active: 'Activo',
  extended: 'S. Extendido',
  eol: 'EOL',
  unknown: '?',
}

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
  const vulnerabilities = useLiveQuery(() => db.vulnerabilities.where('applicationId').equals(id!).toArray(), [id])
  const risks = useLiveQuery(() => db.risks.where('applicationId').equals(id!).toArray(), [id])
  const incidents = useLiveQuery(() => db.incidents.where('applicationId').equals(id!).toArray(), [id])
  const findings = useLiveQuery(() => db.auditFindings.where('applicationId').equals(id!).toArray(), [id])
  const deliverables = useLiveQuery(() => db.deliverables.where('applicationId').equals(id!).toArray(), [id])
  const microservices = useLiveQuery(() => db.microservices.where('applicationId').equals(id!).toArray(), [id])
  const databases = useLiveQuery(() => db.appDatabases.where('applicationId').equals(id!).toArray(), [id])

  if (!application) {
    return (
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
        <p className="text-neutral-60 dark:text-neutral-40">Aplicación no encontrada</p>
      </div>
    )
  }

  const bu = businessUnits?.find((b) => b.id === application.businessUnitId)
  const appTechnologies = allTechnologies.filter((t) => application.technologies.includes(t.id))

  const tabCounts: Record<string, number | undefined> = {
    tech: appTechnologies.length,
    microservices: microservices?.length,
    databases: databases?.length,
    vulns: vulnerabilities?.length,
    risks: risks?.length,
    incidents: incidents?.length,
    audit: findings?.length,
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
            <p className="text-base text-neutral-60 dark:text-neutral-40 leading-relaxed max-w-2xl">
              {application.description}
            </p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${criticalityColor[application.criticality]}`}>
              {criticalityLabel[application.criticality]}
            </span>
            <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40">
              {appStatusLabel[application.status]}
            </span>
            <span className="text-sm text-neutral-50">
              {bu?.name && `${bu.name} · `}{application.ownerName} · {application.architecture}
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
                    : 'text-neutral-60 dark:text-neutral-40 hover:text-neutral-90 dark:hover:text-white hover:bg-neutral-10 dark:hover:bg-neutral-70'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{tab.label}</span>
                {count !== undefined && (
                  <span className={`ml-auto text-xs font-medium ${
                    activeTab === tab.id ? 'text-accent' : 'text-neutral-50'
                  }`}>
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
              className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm p-8"
            >
              {activeTab === 'summary' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-90 dark:text-white mb-6">
                      Resumen
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Info */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                          {([
                            ['Nombre', application.name],
                            ['Owner', application.ownerName],
                            ['Business Unit', bu?.name || '-'],
                            ['Arquitectura', application.architecture],
                            ['Estado', appStatusLabel[application.status]],
                            ['Criticidad', criticalityLabel[application.criticality]],
                            ...(application.supportEndDate
                              ? [['Fin de soporte', new Date(application.supportEndDate).toLocaleDateString('es-ES')]]
                              : [] as string[][]),
                          ] as const).map(([label, value]) => (
                            <div key={label}>
                              <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider mb-0.5">{label}</dt>
                              <dd className="text-sm font-medium text-neutral-90 dark:text-white">{value}</dd>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Metrics */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-medium text-neutral-50 uppercase tracking-wider">Métricas</h3>
                        <MetricHighlight icon={Shield} label="Vulnerabilidades" value={vulnerabilities?.length ?? 0} color="text-danger" />
                        <MetricHighlight icon={AlertTriangle} label="Riesgos" value={risks?.length ?? 0} color="text-warning" />
                        <MetricHighlight icon={Activity} label="Incidentes" value={incidents?.length ?? 0} color="text-info" />
                        <MetricHighlight icon={FileWarning} label="Hallazgos" value={findings?.length ?? 0} color="text-neutral-60" />
                      </div>
                    </div>
                  </div>

                  {/* Tech Stack Preview */}
                  {appTechnologies.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
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
                        {appTechnologies.slice(0, 8).map((tech) => (
                          <span
                            key={tech.id}
                            className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border ${
                              tech.supportStatus === 'eol'
                                ? 'bg-danger/5 text-danger border-danger/20'
                                : tech.supportStatus === 'extended'
                                  ? 'bg-warning/5 text-warning border-warning/20'
                                  : 'bg-success/5 text-success border-success/20'
                            }`}
                          >
                            {tech.name}
                            <span className="opacity-60 text-xs">{tech.version}</span>
                          </span>
                        ))}
                        {appTechnologies.length > 8 && (
                          <span className="text-sm text-neutral-50 self-center">
                            +{appTechnologies.length - 8} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Links */}
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
                      value={databases?.length ?? 0}
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
              )}

              {activeTab === 'architecture' && (
                <ArchitectureTab applicationId={id!} />
              )}

              {activeTab === 'tech' && (
                <TechStackManager
                  applicationId={application.id}
                  selectedIds={application.technologies}
                  allTechnologies={allTechnologies}
                />
              )}

              {activeTab === 'microservices' && (
                <MicroservicesTab applicationId={id!} />
              )}

              {activeTab === 'databases' && (
                <DatabasesTab applicationId={id!} />
              )}

              {activeTab === 'vulns' && (
                <EntityList
                  title="Vulnerabilidades"
                  entityType="vulnerabilities"
                  items={vulnerabilities ?? []}
                  applicationId={id!}
                  headers={['Título', 'Severidad', 'CVSS']}
                  renderCells={(v: Vulnerability) => [v.title, v.severity, v.cvssScore.toString()]}
                  severityColor={(v: Vulnerability) => v.severity}
                />
              )}

              {activeTab === 'risks' && (
                <EntityList
                  title="Riesgos"
                  entityType="risks"
                  items={risks ?? []}
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
                  items={incidents ?? []}
                  applicationId={id!}
                  headers={['Título', 'Severidad', 'Estado', 'Downtime']}
                  renderCells={(i: Incident) => [i.title, i.severity, i.status, `${i.downtimeMinutes ?? 0} min`]}
                  severityColor={(i: Incident) => i.severity}
                />
              )}

              {activeTab === 'audit' && (
                <EntityList
                  title="Hallazgos de Auditoría"
                  entityType="auditFindings"
                  items={findings ?? []}
                  applicationId={id!}
                  headers={['Título', 'Severidad', 'Estado', 'Vencimiento']}
                  renderCells={(f: AuditFinding) => [f.title, f.severity, f.status, new Date(f.dueDate).toLocaleDateString('es-ES')]}
                  severityColor={(f: AuditFinding) => f.severity}
                />
              )}

              {activeTab === 'deliverables' && (
                <DeliverablesTab applicationId={id!} />
              )}
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
  allTechnologies,
}: {
  applicationId: string
  selectedIds: string[]
  allTechnologies: Technology[]
}) {
  const [techSearch, setTechSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const selectedTechs = allTechnologies.filter((t) => selectedIds.includes(t.id))
  const availableTechs = allTechnologies.filter(
    (t) => !selectedIds.includes(t.id) &&
      (!techSearch || t.name.toLowerCase().includes(techSearch.toLowerCase()) || t.vendor.toLowerCase().includes(techSearch.toLowerCase()))
  )

  const addTechnology = async (techId: string) => {
    await db.applications.update(applicationId, {
      technologies: [...selectedIds, techId],
    })
    setTechSearch('')
    setShowDropdown(false)
  }

  const removeTechnology = async (techId: string) => {
    await db.applications.update(applicationId, {
      technologies: selectedIds.filter((id) => id !== techId),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">Stack Tecnológico</h4>
      </div>

      <div className="space-y-2 mb-4">
        {selectedTechs.map((tech) => (
          <div key={tech.id} className="flex items-center justify-between p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg group">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-90 dark:text-white">{tech.name} {tech.version}</span>
              <span className="text-xs text-neutral-60 dark:text-neutral-40">({tech.category})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                tech.supportStatus === 'eol' ? 'bg-danger/10 text-danger' :
                tech.supportStatus === 'extended' ? 'bg-warning/10 text-warning' :
                'bg-success/10 text-success'
              }`}>
                {tech.supportStatus}
              </span>
              <button
                onClick={() => removeTechnology(tech.id)}
                className="p-1 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {selectedTechs.length === 0 && (
          <p className="text-sm text-neutral-50 dark:text-neutral-50">No hay tecnologías asignadas</p>
        )}
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar tecnología para agregar..."
              value={techSearch}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => { setTechSearch(e.target.value); setShowDropdown(true) }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {availableTechs.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-50">
                {techSearch ? 'Sin resultados' : 'Todas las tecnologías ya están asignadas'}
              </p>
            ) : (
              availableTechs.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => addTechnology(tech.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-90 dark:text-white">{tech.name}</span>
                    <span className="text-neutral-50">{tech.version}</span>
                    <span className="text-xs text-neutral-50">({tech.vendor})</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[tech.supportStatus]}`}>
                    {statusLabel[tech.supportStatus]}
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
  const allItemsOfType = useLiveQuery(
    () => (db[entityType] as Table<T, string>).toArray(),
    [entityType]
  ) ?? []

  const dissociate = async (item: T) => {
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
      (!search || (renderCells(item)[0] ?? '').toLowerCase().includes(search.toLowerCase()))
  ) as T[]

  const severityBadge = (sev: string | null) => {
    if (!sev) return null
    const colors: Record<string, string> = {
      critical: 'bg-danger/10 text-danger',
      high: 'bg-warning/10 text-warning',
      medium: 'bg-info/10 text-info',
      low: 'bg-success/10 text-success',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[sev] || 'bg-neutral-10 text-neutral-60'}`}>
        {sev}
      </span>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">{title}</h4>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-50 dark:text-neutral-50 mb-4">No hay {title.toLowerCase()} asociados</p>
      ) : (
        <table className="w-full mb-4">
          <thead>
            <tr className="border-b border-neutral-20 dark:border-neutral-70">
              {headers.map((h) => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">{h}</th>
              ))}
              <th className="text-right px-4 py-2 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {items.map((item) => {
              const sev = severityColor(item)
              const cells = renderCells(item)
              return (
                <tr key={item.id} className="group">
                  {cells.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-sm text-neutral-70 dark:text-neutral-30">
                      {j === 1 && sev ? severityBadge(cell) : cell}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => dissociate(item)}
                      className="p-1.5 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Desasociar"
                    >
                      <Unlink size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <div className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder={`Buscar ${title.toLowerCase()} para asociar...`}
            value={search}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
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
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        sev === 'critical' ? 'bg-danger/10 text-danger' :
                        sev === 'high' ? 'bg-warning/10 text-warning' :
                        sev === 'medium' ? 'bg-info/10 text-info' :
                        'bg-success/10 text-success'
                      }`}>
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

/* ─── Editorial Components ─── */

function MetricHighlight({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.FC<{ size?: number }>
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-10 dark:bg-neutral-70/50">
      <div className={`p-2 rounded-lg bg-white dark:bg-neutral-70 shadow-sm ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xl font-bold text-neutral-90 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-neutral-60 dark:text-neutral-40 mt-0.5">{label}</p>
      </div>
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
      className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-70/50 hover:border-accent/30 hover:bg-accent/5 transition-all group text-center"
    >
      <div className="p-2 rounded-lg bg-white dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40 group-hover:text-accent transition-colors shadow-sm">
        <Icon size={20} />
      </div>
      <span className="text-xs text-neutral-60 dark:text-neutral-40">{label}</span>
          <span className="text-xl font-bold text-neutral-90 dark:text-white leading-none">{value}</span>
    </button>
  )
}
