import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Table } from 'dexie'
import { db } from '@/services/db/database'
import {
  ArrowLeft, Pencil, Shield, AlertTriangle, Activity, FileWarning,
  Plus, X, Unlink, Search,
} from 'lucide-react'
import type { Technology, Vulnerability, Risk, Incident, AuditFinding, SupportStatus } from '@/types/domain'
import { DeliverablesTab } from '../components/DeliverablesTab'
import { MicroservicesTab } from '../components/MicroservicesTab'
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

  if (!application) {
    return (
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
        <p className="text-neutral-60 dark:text-neutral-40">Aplicación no encontrada</p>
      </div>
    )
  }

  const bu = businessUnits?.find((b) => b.id === application.businessUnitId)
  const appTechnologies = allTechnologies.filter((t) => application.technologies.includes(t.id))

  const tabs = [
    { id: 'summary', label: 'Resumen' },
    { id: 'architecture', label: `Arquitectura` },
    { id: 'tech', label: `Tech Stack (${appTechnologies.length})` },
    { id: 'microservices', label: `Microservicios (${microservices?.length ?? 0})` },
    { id: 'vulns', label: `Vulnerabilidades (${vulnerabilities?.length ?? 0})` },
    { id: 'risks', label: `Riesgos (${risks?.length ?? 0})` },
    { id: 'incidents', label: `Incidentes (${incidents?.length ?? 0})` },
    { id: 'audit', label: `Auditoría (${findings?.length ?? 0})` },
    { id: 'deliverables', label: `Entregables (${deliverables?.length ?? 0})` },
  ]

  const getCriticalityColor = (criticality: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-danger text-white',
      high: 'bg-warning text-white',
      medium: 'bg-info text-white',
      low: 'bg-success text-white',
    }
    return colors[criticality] || 'bg-neutral-10 text-neutral-60'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/catalog/applications')}
            className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">{application.name}</h2>
            <p className="text-sm text-neutral-60 dark:text-neutral-40">{application.description}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/catalog/applications/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Pencil size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCriticalityColor(application.criticality)}`}>
          {application.criticality}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40">
          {application.status}
        </span>
        <span className="text-sm text-neutral-60 dark:text-neutral-40">
          {bu?.name} • {application.ownerName} • {application.architecture}
        </span>
      </div>

      <div className="border-b border-neutral-20 dark:border-neutral-70">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-60 dark:text-neutral-40 hover:text-neutral-90 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
        {activeTab === 'summary' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-neutral-70 dark:text-neutral-30 mb-3">Información General</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-60 dark:text-neutral-40">Nombre</dt>
                  <dd className="text-sm font-medium text-neutral-90 dark:text-white">{application.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-60 dark:text-neutral-40">Owner</dt>
                  <dd className="text-sm font-medium text-neutral-90 dark:text-white">{application.ownerName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-60 dark:text-neutral-40">Business Unit</dt>
                  <dd className="text-sm font-medium text-neutral-90 dark:text-white">{bu?.name || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-60 dark:text-neutral-40">Arquitectura</dt>
                  <dd className="text-sm font-medium text-neutral-90 dark:text-white">{application.architecture}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-60 dark:text-neutral-40">Estado</dt>
                  <dd className="text-sm font-medium text-neutral-90 dark:text-white">{application.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-60 dark:text-neutral-40">Criticidad</dt>
                  <dd className="text-sm font-medium text-neutral-90 dark:text-white">{application.criticality}</dd>
                </div>
                {application.supportEndDate && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-neutral-60 dark:text-neutral-40">Fin de soporte</dt>
                    <dd className="text-sm font-medium text-neutral-90 dark:text-white">
                      {new Date(application.supportEndDate).toLocaleDateString('es-ES')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-70 dark:text-neutral-30 mb-3">Métricas</h4>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard icon={<Shield size={20} />} label="Vulnerabilidades" value={vulnerabilities?.length ?? 0} color="text-danger" />
                <MetricCard icon={<AlertTriangle size={20} />} label="Riesgos" value={risks?.length ?? 0} color="text-warning" />
                <MetricCard icon={<Activity size={20} />} label="Incidentes" value={incidents?.length ?? 0} color="text-info" />
                <MetricCard icon={<FileWarning size={20} />} label="Hallazgos" value={findings?.length ?? 0} color="text-neutral-60" />
              </div>
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

        {activeTab === 'vulns' && (
          <EntityList
            title="Vulnerabilidades"
            entityType="vulnerabilities"
            items={vulnerabilities ?? []}
            applicationId={id!}
            headers={['Título', 'Severidad', 'CVSS']}
            renderCells={(v) => [v.title, v.severity, v.cvssScore.toString()]}
            severityColor={(v) => v.severity}
          />
        )}

        {activeTab === 'risks' && (
          <EntityList
            title="Riesgos"
            entityType="risks"
            items={risks ?? []}
            applicationId={id!}
            headers={['Título', 'Categoría', 'Score', 'Estado']}
            renderCells={(r) => [r.title, r.category, r.riskScore.toString(), r.status]}
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
            renderCells={(i) => [i.title, i.severity, i.status, `${i.downtimeMinutes ?? 0} min`]}
            severityColor={(i) => i.severity}
          />
        )}

        {activeTab === 'audit' && (
          <EntityList
            title="Hallazgos de Auditoría"
            entityType="auditFindings"
            items={findings ?? []}
            applicationId={id!}
            headers={['Título', 'Severidad', 'Estado', 'Vencimiento']}
            renderCells={(f) => [f.title, f.severity, f.status, new Date(f.dueDate).toLocaleDateString('es-ES')]}
            severityColor={(f) => f.severity}
          />
        )}

        {activeTab === 'deliverables' && (
          <DeliverablesTab applicationId={id!} />
        )}
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
        <h4 className="text-sm font-semibold text-neutral-70 dark:text-neutral-30">Tecnologías</h4>
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
        <h4 className="text-sm font-semibold text-neutral-70 dark:text-neutral-30">{title}</h4>
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

/* ─── Shared components ─── */

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-neutral-10 dark:bg-neutral-70 rounded-lg p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </div>
  )
}
