import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { Button } from '@/components/ui/Button'
import { Pencil, Server, Search, ArrowLeft, ChevronRight } from 'lucide-react'
import { InfoTab } from '../components/InfoTab'
import { RelationsTab } from '../components/RelationsTab'

const supportStatusLabel: Record<string, string> = {
  active: 'Activo',
  extended: 'Soporte Extendido',
  eol: 'EOL',
  unknown: 'Desconocido',
}

const supportStatusColor: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown:
    'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30 dark:border-neutral-60',
}

const categoryLabel: Record<string, string> = {
  framework: 'Framework',
  language: 'Lenguaje',
  database: 'Base de Datos',
  os: 'OS',
  runtime: 'Runtime',
  library: 'Librería',
  message_broker: 'Message Broker',
  cache: 'Cache',
  web_server: 'Web Server',
  cloud_service: 'Cloud Service',
  tool: 'Herramienta',
  other: 'Otro',
}

type TabId = 'info' | 'relations'

export function TechnologyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('info')

  const tech = useLiveQuery(() => db.technologies.get(id!), [id])

  const apps =
    useLiveQuery(
      () => (tech ? db.applications.filter((a) => a.technologies.includes(id!)).toArray() : []),
      [tech],
    ) ?? []
  const microservices =
    useLiveQuery(
      () => (tech ? db.microservices.filter((m) => m.technologies.includes(id!)).toArray() : []),
      [tech],
    ) ?? []
  const databases =
    useLiveQuery(
      () => (tech ? db.appDatabases.filter((d) => d.technologies.includes(id!)).toArray() : []),
      [tech],
    ) ?? []
  const vulns =
    useLiveQuery(
      () =>
        tech
          ? db.vulnerabilities.filter((v) => (v as any).technologies?.includes(id!)).toArray()
          : [],
      [tech],
    ) ?? []
  const incidents =
    useLiveQuery(
      () =>
        tech ? db.incidents.filter((i) => (i as any).technologies?.includes(id!)).toArray() : [],
      [tech],
    ) ?? []
  const risks =
    useLiveQuery(
      () => (tech ? db.risks.filter((r) => (r as any).technologies?.includes(id!)).toArray() : []),
      [tech],
    ) ?? []
  const auditFindings =
    useLiveQuery(
      () =>
        tech
          ? db.auditFindings.filter((f) => (f as any).technologies?.includes(id!)).toArray()
          : [],
      [tech],
    ) ?? []

  const people = [
    ...new Set(
      [...apps.map((a) => a.ownerName), ...microservices.map((m) => m.technicalLead)].filter(
        Boolean,
      ),
    ),
  ] as string[]

  const daysUntilEol = tech?.eolDate
    ? Math.ceil((new Date(tech.eolDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const eolExpired = daysUntilEol !== null && daysUntilEol < 0

  if (!tech) {
    return (
      <div className="bg-card rounded-xl border border-boundary p-6 shadow-sm">
        <p className="text-muted">Tecnología no encontrada</p>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: typeof Server; count?: number }[] = [
    { id: 'info', label: 'Info General', icon: Server },
    {
      id: 'relations',
      label: 'Relaciones',
      icon: Search,
      count:
        apps.length +
        microservices.length +
        databases.length +
        vulns.length +
        incidents.length +
        risks.length +
        auditFindings.length,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-50">
        <button
          onClick={() => navigate('/obsolescence')}
          className="flex items-center gap-1 hover:text-neutral-90 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Obsolescencia
        </button>
        <ChevronRight size={14} className="text-neutral-40" />
        <span className="text-neutral-90 dark:text-white font-medium truncate max-w-[200px]">
          {tech.name}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-neutral-90 dark:text-white">{tech.name}</h1>
            {tech.version && <span className="text-lg text-neutral-50">v{tech.version}</span>}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border ${supportStatusColor[tech.supportStatus]}`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${tech.supportStatus === 'active' ? 'bg-success' : tech.supportStatus === 'extended' ? 'bg-warning' : tech.supportStatus === 'eol' ? 'bg-danger' : 'bg-neutral-40'}`}
              />
              {supportStatusLabel[tech.supportStatus]}
            </span>
            <span className="text-neutral-50">{categoryLabel[tech.category] ?? tech.category}</span>
            {tech.vendor && <span className="text-neutral-50">{tech.vendor}</span>}
          </div>
        </div>
        <Button
          onClick={() => navigate(`/catalog/obsolescence/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Pencil size={16} />
          Editar
        </Button>
      </div>

      {/* Tabs + Content */}
      <div className="flex gap-8">
        <nav className="w-44 shrink-0 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
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
                {tab.count !== undefined && (
                  <span
                    className={`ml-auto text-xs font-medium ${activeTab === tab.id ? 'text-accent' : 'text-neutral-50'}`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="flex-1 min-w-0 bg-card rounded-xl border border-boundary shadow-sm p-8">
          {activeTab === 'info' && (
            <InfoTab tech={tech} daysUntilEol={daysUntilEol} eolExpired={eolExpired} />
          )}
          {activeTab === 'relations' && (
            <RelationsTab
              data={{
                apps,
                microservices,
                databases,
                people,
                vulns,
                incidents,
                risks,
                auditFindings,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
