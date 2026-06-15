import { useState, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, Link } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Select'
import { createShareLink } from '@/services/share/publicShareService'
import { TermsModal } from '@/components/sharing/TermsModal'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { isTermsAccepted, acceptTerms } from '@/services/share/termsService'
import { encryptData } from '@/services/share/encryptionService'
import {
  Search, Filter, Download, Upload, Share2,
  Trash2, Eye, Pencil, X, Server, Check, Copy,
  AlertTriangle, Shield,
  RefreshCw, Clock, Ban, Calendar,
} from 'lucide-react'
import type { Microservice, MicroserviceLifecycleStatus } from '@/types/domain'
import { Button } from '@/components/ui/Button'

const lifecycleLabel: Record<MicroserviceLifecycleStatus, string> = {
  active: 'Activo',
  evolving: 'En Evolución',
  deprecated: 'Deprecado',
  decommissioned: 'Decomisionado',
  planned: 'Planificado',
}

const lifecycleColor: Record<string, string> = {
  active: 'bg-success/10 text-success',
  evolving: 'bg-info/10 text-info',
  deprecated: 'bg-warning/10 text-warning',
  decommissioned: 'bg-danger/10 text-danger',
  planned: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40',
}

const lifecycleDotColor: Record<string, string> = {
  active: 'bg-success',
  evolving: 'bg-info',
  deprecated: 'bg-warning',
  decommissioned: 'bg-danger',
  planned: 'bg-neutral-40',
}

const lifecycleIcon: Record<string, React.ReactNode> = {
  active: <Check size={12} />,
  evolving: <RefreshCw size={12} />,
  deprecated: <Clock size={12} />,
  decommissioned: <Ban size={12} />,
  planned: <Calendar size={12} />,
}

export function MicroservicesPage() {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterLifecycle, setFilterLifecycle] = useState('')
  const [filterApp, setFilterApp] = useState('')
  const [filterRisk, setFilterRisk] = useState<string | null>(null)


  // Share state
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [sharePending, setSharePending] = useState<any>(null)

  const rawMicroservices = useLiveQuery(() => db.microservices.toArray())
  const microservices = useMemo(() => rawMicroservices ?? [], [rawMicroservices])
  const rawApplications = useLiveQuery(() => db.applications.toArray())
  const applications = useMemo(() => rawApplications ?? [], [rawApplications])

  const appMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const app of applications) {
      map.set(app.id, app.name)
    }
    return map
  }, [applications])

  // ── Junction tables for risk indicators ──
  const rawVulnJunction = useLiveQuery(() => db.vulnerabilityMicroservices.toArray())
  const vulnJunction = useMemo(() => rawVulnJunction ?? [], [rawVulnJunction])
  const rawIncidentJunction = useLiveQuery(() => db.incidentMicroservices.toArray())
  const incidentJunction = useMemo(() => rawIncidentJunction ?? [], [rawIncidentJunction])
  const rawAuditJunction = useLiveQuery(() => db.auditFindingMicroservices.toArray())
  const auditJunction = useMemo(() => rawAuditJunction ?? [], [rawAuditJunction])
  const rawRiskJunction = useLiveQuery(() => db.riskMicroservices.toArray())
  const riskJunction = useMemo(() => rawRiskJunction ?? [], [rawRiskJunction])
  const rawTechnologies = useLiveQuery(() => db.technologies.toArray())
  const technologies = useMemo(() => rawTechnologies ?? [], [rawTechnologies])

  // Per-microservice aggregations for each risk dimension
  const riskMap = useMemo(() => {
    const eolTechIds = new Set(technologies.filter((t) => t.supportStatus === 'eol').map((t) => t.id))

    const vulns = new Map<string, number>()
    const incidents = new Map<string, number>()
    const audits = new Map<string, number>()
    const risks = new Map<string, number>()
    const eolCount = new Map<string, number>()

    for (const j of vulnJunction) vulns.set(j.microserviceId, (vulns.get(j.microserviceId) ?? 0) + 1)
    for (const j of incidentJunction) incidents.set(j.microserviceId, (incidents.get(j.microserviceId) ?? 0) + 1)
    for (const j of auditJunction) audits.set(j.microserviceId, (audits.get(j.microserviceId) ?? 0) + 1)
    for (const j of riskJunction) risks.set(j.microserviceId, (risks.get(j.microserviceId) ?? 0) + 1)

    for (const ms of microservices) {
      const count = (ms.technologies ?? []).filter((tId) => eolTechIds.has(tId)).length
      if (count > 0) eolCount.set(ms.id, count)
    }

    return { vulns, incidents, audits, risks, eolCount }
  }, [technologies, vulnJunction, incidentJunction, auditJunction, riskJunction, microservices])

  // Aggregate stats for KPI cards
  const riskStats = useMemo(() => {
    const withEol = riskMap.eolCount.size
    const withVuln = riskMap.vulns.size
    const withIncident = riskMap.incidents.size
    const withAudit = riskMap.audits.size
    const withRisk = riskMap.risks.size
    return { withEol, withVuln, withIncident, withAudit, withRisk }
  }, [riskMap])

  // ── KPI calculations ──

  const kpis = useMemo(() => {
    const total = microservices.length
    return { total }
  }, [microservices])

  // ── Filtering ──

  const filteredItems = useMemo(() => {
    return microservices.filter((ms) => {
      const matchesSearch =
        !searchTerm ||
        ms.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ms.technicalLead ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ms.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLifecycle = !filterLifecycle || ms.lifecycleStatus === filterLifecycle
      const matchesApp = !filterApp || ms.applicationId === filterApp
      if (filterRisk === 'eol' && (riskMap.eolCount.get(ms.id) ?? 0) === 0) return false
      if (filterRisk === 'vuln' && (riskMap.vulns.get(ms.id) ?? 0) === 0) return false
      if (filterRisk === 'incident' && (riskMap.incidents.get(ms.id) ?? 0) === 0) return false
      if (filterRisk === 'audit' && (riskMap.audits.get(ms.id) ?? 0) === 0) return false
      if (filterRisk === 'risk' && (riskMap.risks.get(ms.id) ?? 0) === 0) return false
      return matchesSearch && matchesLifecycle && matchesApp
    })
  }, [microservices, searchTerm, filterLifecycle, filterApp, filterRisk, riskMap])

  // ── Handlers ──

  const handleDelete = async (id: string) => {
    if (await confirm('¿Está seguro de eliminar este microservicio?')) {
      await db.microservices.delete(id)
      addNotification({ type: 'success', message: 'Microservicio eliminado correctamente' })
    }
  }

  const handleExport = () => {
    if (filteredItems.length === 0) {
      addNotification({ type: 'warning', message: 'No hay microservicios para exportar' })
      return
    }
    const data = filteredItems.map((ms) => ({
      name: ms.name,
      description: ms.description,
      application: appMap.get(ms.applicationId) ?? '',
      technicalLead: ms.technicalLead ?? '',
      lifecycleStatus: ms.lifecycleStatus ?? '',
      technologies: ms.technologies?.length ?? 0,
      repository: ms.repository ?? '',
      createdAt: ms.createdAt?.toISOString?.() ?? '',
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `microservicios-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ type: 'success', message: `${data.length} microservicios exportados` })
  }

  const doShare = useCallback(async () => {
    const data = {
      microservices: filteredItems.map((ms) => ({
        id: ms.id,
        name: ms.name,
        description: ms.description,
        application: appMap.get(ms.applicationId) ?? '',
        technicalLead: ms.technicalLead ?? '',
        lifecycleStatus: ms.lifecycleStatus ?? '',
        technologiesCount: ms.technologies?.length ?? 0,
      })),
      exportedAt: new Date().toISOString(),
    }
    setSharePending(data)
    setShowPassphrase(true)
  }, [filteredItems, appMap])

  // ── Columns ──

  const columns: Column<Microservice>[] = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (ms) => (
        <>
          <Link
            to={`/catalog/microservices/${ms.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {ms.name}
          </Link>
          {ms.description && (
            <p className="text-xs text-neutral-50 dark:text-neutral-50 mt-0.5 line-clamp-1">
              {ms.description.replace(/<[^>]*>/g, '').slice(0, 120)}
            </p>
          )}
        </>
      ),
    },
    {
      key: 'apps',
      label: 'Apps',
      sortable: true,
      render: (ms) => {
        const appName = appMap.get(ms.applicationId)
        const count = appName ? 1 : 0
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${
                count > 0
                  ? 'bg-primary/10 text-primary'
                  : 'bg-danger/10 text-danger'
              }`}
            >
              {count}
            </span>
            {appName ? (
              <Link
                to={`/catalog/applications/${ms.applicationId}`}
                className="text-sm text-neutral-70 dark:text-neutral-30 hover:text-primary transition-colors"
              >
                {appName}
              </Link>
            ) : (
              <span className="text-sm text-neutral-50">Sin app</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'technicalLead',
      label: 'Tech Lead',
      sortable: true,
      render: (ms) => (
        <span className="text-sm text-neutral-70 dark:text-neutral-30">
          {ms.technicalLead || '—'}
        </span>
      ),
    },
    {
      key: 'lifecycleStatus',
      label: 'Estado',
      sortable: true,
      render: (ms) => {
        const status = ms.lifecycleStatus
        if (!status) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-10 dark:bg-neutral-70 text-neutral-50 dark:text-neutral-40">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-40" />
              <Ban size={12} className="shrink-0" />
              Sin estado
            </span>
          )
        }
        const dot = lifecycleDotColor[status] || 'bg-neutral-40'
        const icon = lifecycleIcon[status] || null
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${lifecycleColor[status] || 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {icon && <span className="shrink-0">{icon}</span>}
            {lifecycleLabel[status] || status}
          </span>
        )
      },
    },
    {
      key: 'technologies',
      label: 'Tecnologías',
      render: (ms) => (
        <span className="text-sm text-neutral-70 dark:text-neutral-30">
          {ms.technologies?.length ?? 0} techs
        </span>
      ),
    },
    {
      key: 'indicators',
      label: 'Alertas',
      className: 'min-w-[120px]',
      render: (ms) => {
        const items: { label: string; count: number; color: string }[] = [
          { label: 'EOL', count: riskMap.eolCount.get(ms.id) ?? 0, color: 'bg-danger' },
          { label: 'Vuln', count: riskMap.vulns.get(ms.id) ?? 0, color: 'bg-severity-high' },
          { label: 'Inc', count: riskMap.incidents.get(ms.id) ?? 0, color: 'bg-warning' },
          { label: 'Aud', count: riskMap.audits.get(ms.id) ?? 0, color: 'bg-info' },
          { label: 'Riesgo', count: riskMap.risks.get(ms.id) ?? 0, color: 'bg-purple-500' },
        ]
        const active = items.filter((i) => i.count > 0)
        return active.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {active.map((i) => (
              <span
                key={i.label}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-neutral-10 dark:bg-neutral-70 text-neutral-70 dark:text-neutral-30 border border-neutral-20 dark:border-neutral-60"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${i.color}`} />
                {i.label} {i.count}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-neutral-50">Sin alertas</span>
        )
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (ms) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/catalog/microservices/${ms.id}`}
            className="p-1.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
          >
            <Eye size={16} className="text-neutral-60 dark:text-neutral-40" />
          </Link>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/catalog/microservices/${ms.id}`)
            }}
            className="p-1.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
          >
            <Pencil size={16} className="text-neutral-60 dark:text-neutral-40" />
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); handleDelete(ms.id) }}
            className="p-1.5 rounded-md hover:bg-danger/10 transition-colors"
          >
            <Trash2 size={16} className="text-danger" />
          </Button>
        </div>
      ),
    },
  ]

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Catálogo de Microservicios</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/catalog/microservices/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            <Server size={16} />
            Nuevo Microservicio
          </Button>
          <Button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Upload size={16} />
            Importar
          </Button>
          <Button
            onClick={async () => {
              if (!isTermsAccepted()) {
                setShowTerms(true)
                return
              }
              await doShare()
            }}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Share2 size={16} />
            Compartir
          </Button>
          <Button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Download size={16} />
            Exportar
          </Button>
        </div>
      </div>

      {/* Share URL banner */}
      {shareUrl && (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 flex items-center gap-3 max-w-full overflow-hidden">
          <span className="text-sm text-neutral-50 shrink-0">Enlace público:</span>
          <span className="flex-1 text-xs bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-lg text-primary font-mono min-w-0 truncate">
            {shareUrl.split('#')[0]}
          </span>
          <Button
            onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      )}

      {/* Terms & Passphrase modals */}
      {showTerms && (
        <TermsModal
          onAccept={() => { acceptTerms(); setShowTerms(false); doShare() }}
          onClose={() => setShowTerms(false)}
        />
      )}
      {showPassphrase && (
        <PassphraseModal
          title="Proteger enlace compartido"
          buttonLabel="Proteger"
          description="Opcional: agrega una contraseña para cifrar los datos."
          onSubmit={async (pass) => {
            const payload = pass ? await encryptData(sharePending, pass) : sharePending
            const { url } = await createShareLink(48, 'dashboard', undefined, payload)
            setShareUrl(url); setShowPassphrase(false); setSharePending(null)
          }}
          onSkip={async () => {
            const { url } = await createShareLink(48, 'dashboard', undefined, sharePending)
            setShareUrl(url); setShowPassphrase(false); setSharePending(null)
          }}
          onClose={() => { setShowPassphrase(false); setSharePending(null) }}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Server size={20} />}
          label="Total Microservicios"
          value={kpis.total}
          color="text-primary"
          active={filterRisk === null}
          onClick={() => setFilterRisk(null)}
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Obsolescencia"
          value={riskStats.withEol}
          color="text-danger"
          active={filterRisk === 'eol'}
          onClick={() => setFilterRisk(filterRisk === 'eol' ? null : 'eol')}
        />
        <StatCard
          icon={<Shield size={20} />}
          label="Vulnerabilidades"
          value={riskStats.withVuln}
          color="text-severity-high"
          active={filterRisk === 'vuln'}
          onClick={() => setFilterRisk(filterRisk === 'vuln' ? null : 'vuln')}
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Incidentes"
          value={riskStats.withIncident}
          color="text-warning"
          active={filterRisk === 'incident'}
          onClick={() => setFilterRisk(filterRisk === 'incident' ? null : 'incident')}
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Auditorías"
          value={riskStats.withAudit}
          color="text-info"
          active={filterRisk === 'audit'}
          onClick={() => setFilterRisk(filterRisk === 'audit' ? null : 'audit')}
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Riesgos"
          value={riskStats.withRisk}
          color="text-purple-500"
          active={filterRisk === 'risk'}
          onClick={() => setFilterRisk(filterRisk === 'risk' ? null : 'risk')}
        />
      </div>

      {/* Search bar */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar microservicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || filterLifecycle || filterApp
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(filterLifecycle || filterApp) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="space-y-3 pt-3 border-t border-neutral-20 dark:border-neutral-70">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-60">Estado</label>
                <Select
                  value={filterLifecycle}
                  onChange={(v) => setFilterLifecycle(v)}
                  options={[
                    { value: '', label: 'Todos' },
                    ...Object.entries(lifecycleLabel).map(([k, v]) => ({ value: k, label: v })),
                  ]}
                  className="min-w-[140px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-60">Aplicación</label>
                <Select
                  value={filterApp}
                  onChange={(v) => setFilterApp(v)}
                  options={[
                    { value: '', label: 'Todas' },
                    ...applications.map((app) => ({ value: app.id, label: app.name })),
                  ]}
                  className="min-w-[160px]"
                />
              </div>
              {(filterLifecycle || filterApp) && (
                <Button
                  onClick={() => { setFilterLifecycle(''); setFilterApp('') }}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger hover:text-danger-dark transition-colors"
                >
                  <X size={14} />
                  Limpiar filtros
                </Button>
              )}
            </div>
            </div>
          )}
        </div>

      {/* Table */}
      {!rawMicroservices ? (
        <SkeletonTable rows={8} />
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <EmptyState
            icon={<Server size={22} className="text-neutral-50" />}
            title={
              searchTerm || filterLifecycle || filterApp
                ? 'Sin resultados'
                : 'No hay microservicios registrados'
            }
            description={
              searchTerm || filterLifecycle || filterApp
                ? 'Intenta con otros filtros o términos de búsqueda'
                : 'Los microservicios se crean desde la aplicación a la que pertenecen'
            }
          />
        </div>
      ) : (
        <SortableTable
          columns={columns}
          data={filteredItems}
          onRowClick={(ms) => navigate(`/catalog/microservices/${ms.id}`)}
          emptyMessage="No se encontraron microservicios"
        />
      )}
    </div>
  )
}

function StatCard({
  icon, label, value, color, active, onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  active?: boolean
  onClick?: () => void
}) {
  const iconClasses: Record<string, string> = {
    'text-primary': 'bg-primary/10 text-primary',
    'text-danger': 'bg-danger/10 text-danger',
    'text-severity-high': 'bg-danger/10 text-danger',
    'text-warning': 'bg-warning/10 text-warning',
    'text-info': 'bg-info/10 text-info',
    'text-purple-500': 'bg-purple-500/10 text-purple-500',
  }
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
        className={`rounded-2xl border p-4 flex items-center justify-center gap-3 transition-all ${
          active
            ? 'ring-2 ring-primary/40 border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
            : 'bg-white dark:bg-neutral-80 border-neutral-20 dark:border-neutral-70 shadow-sm hover:shadow-md hover:border-neutral-30 dark:hover:border-neutral-60'
        }${onClick ? ' cursor-pointer' : ''}`}
      >
        <div className={`p-2 rounded-lg ${iconClasses[color] || 'bg-primary/10 text-primary'}`}>{icon}</div>
        <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
        <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </Comp>
  )
}
