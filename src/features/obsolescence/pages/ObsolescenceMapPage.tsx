import { useState, useMemo, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { computeAppTechMap } from '@/utils/technologyUtils'
import { ObsolescenceGraph } from '@/features/obsolescence/components/ObsolescenceGraph'
import type { SupportStatus, Technology } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import {
  Network,
  AlertTriangle,
  Clock,
  CheckCircle,
  Layers,
  Search,
  Eye,
  EyeOff,
  Info,
  ArrowLeft,
} from 'lucide-react'

type StatusFilter = SupportStatus | 'all' | 'mixed'

function StatCard({ icon, value, label, iconBg, valueColor, active, onClick }: {
  icon: ReactNode; value: number; label: string; iconBg: string
  valueColor?: string; active: boolean; onClick: () => void
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 flex items-center gap-3 transition-all text-left cursor-pointer ${
        active
          ? 'ring-2 ring-primary/40 border-primary bg-primary/5 dark:bg-primary/10'
          : 'bg-card border-boundary hover:shadow-md hover:border-neutral-30 dark:hover:border-neutral-60'
      }`}
    >
      <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-lg font-bold ${valueColor ?? 'text-neutral-90 dark:text-white'}`}>{value}</p>
        <p className="text-xs text-neutral-50 truncate">{label}</p>
      </div>
    </Button>
  )
}

function getWorstStatus(
  techIds: string[],
  techMap: Map<string, Technology>,
): SupportStatus | 'mixed' {
  if (techIds.length === 0) return 'unknown'

  let hasExtended = false
  let hasUnknown = false
  let hasActive = false

  for (const tId of techIds) {
    const tech = techMap.get(tId)
    if (!tech || tech.supportStatus === 'unknown') {
      hasUnknown = true
    } else if (tech.supportStatus === 'eol') {
      return 'eol'
    } else if (tech.supportStatus === 'extended') {
      hasExtended = true
    } else if (tech.supportStatus === 'active') {
      hasActive = true
    }
  }

  if (hasExtended && hasActive) return 'mixed'
  if (hasExtended) return 'extended'
  if (hasActive && hasUnknown) return 'mixed'
  if (hasActive) return 'active'
  return 'unknown'
}

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string; color: string }[] = [
  { value: 'all', label: 'Todos', color: '#8888a0' },
  { value: 'eol', label: 'EOL', color: '#FF5630' },
  { value: 'extended', label: 'Soporte Extendido', color: '#FF8B00' },
  { value: 'active', label: 'Activo', color: '#36B37E' },
  { value: 'unknown', label: 'Sin datos', color: '#6B778C' },
  { value: 'mixed', label: 'Mixto', color: '#8B5CF6' },
]

export function ObsolescenceMapPage() {
  const navigate = useNavigate()

  const apps = useLiveQuery(() => db.applications.toArray()) ?? []
  const microservices = useLiveQuery(() => db.microservices.toArray()) ?? []
  const technologies = useLiveQuery(() => db.technologies.toArray()) ?? []

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showMicroservices, setShowMicroservices] = useState(true)

  const techMap = useMemo(() => {
    const map = new Map<string, Technology>()
    for (const t of technologies) map.set(t.id, t)
    return map
  }, [technologies])

  // Precompute: appId → merged tech IDs (direct + inherited from microservices)
  const appTechMap = useMemo(
    () => computeAppTechMap(apps, microservices),
    [apps, microservices],
  )

  // Precompute: microserviceId → its own tech IDs
  const msTechMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const ms of microservices) {
      map.set(ms.id, ms.technologies)
    }
    return map
  }, [microservices])

  // Build nodes
  const allNodes = useMemo(() => {
    const result: {
      id: string
      label: string
      status: SupportStatus | 'mixed'
      type: 'app' | 'microservice'
      parentAppId?: string
      techCount: number
      appName: string
    }[] = []

    for (const app of apps) {
      const techIds = appTechMap.get(app.id) ?? app.technologies
      const status = getWorstStatus(techIds, techMap)
      result.push({
        id: app.id,
        label: app.name,
        status,
        type: 'app',
        techCount: techIds.length,
        appName: app.name,
      })
    }

    for (const ms of microservices) {
      const techIds = msTechMap.get(ms.id) ?? []
      const status = getWorstStatus(techIds, techMap)
      const parentApp = apps.find((a) => a.id === ms.applicationId)
      result.push({
        id: ms.id,
        label: ms.name,
        status,
        type: 'microservice',
        parentAppId: ms.applicationId,
        techCount: techIds.length,
        appName: parentApp?.name ?? '',
      })
    }

    return result
  }, [apps, microservices, appTechMap, msTechMap, techMap])

  // Build edges
  const allEdges = useMemo(
    () =>
      microservices.map((ms) => ({
        source: ms.applicationId,
        target: ms.id,
      })),
    [microservices],
  )

  // Filter nodes by search and status
  const filteredNodeIds = useMemo(() => {
    const filtered = allNodes.filter((n) => {
      if (search && !n.label.toLowerCase().includes(search.toLowerCase()) && !n.appName.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== 'all' && n.status !== statusFilter) return false
      if (!showMicroservices && n.type === 'microservice') return false
      return true
    })
    return new Set(filtered.map((n) => n.id))
  }, [allNodes, search, statusFilter, showMicroservices])

  // Filter edges to only connect visible nodes
  const filteredEdges = useMemo(
    () => allEdges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)),
    [allEdges, filteredNodeIds],
  )

  const filteredNodes = useMemo(
    () => allNodes.filter((n) => filteredNodeIds.has(n.id)),
    [allNodes, filteredNodeIds],
  )

  // Stats
  const stats = useMemo(() => {
    const totalApps = apps.length
    const totalMs = microservices.length
    const appNodes = allNodes.filter((n) => n.type === 'app')
    const appsWithEol = appNodes.filter((n) => n.status === 'eol').length
    const appsWithExtended = appNodes.filter((n) => n.status === 'extended').length
    const appsWithMixed = appNodes.filter((n) => n.status === 'mixed').length
    const appsActive = appNodes.filter((n) => n.status === 'active').length
    const appsUnknown = appNodes.filter((n) => n.status === 'unknown').length
    const msWithEol = allNodes.filter((n) => n.type === 'microservice' && n.status === 'eol').length
    return {
      totalApps,
      totalMs,
      appsWithEol,
      appsWithExtended,
      appsWithMixed,
      appsActive,
      appsUnknown,
      msWithEol,
    }
  }, [apps, microservices, allNodes])

  const handleNodeClick = useCallback(
    (nodeId: string, nodeType: 'app' | 'microservice', parentAppId?: string) => {
      if (nodeType === 'app') {
        navigate(`/catalog/applications/${nodeId}`)
      } else if (parentAppId) {
        navigate(`/catalog/applications/${parentAppId}`)
      }
    },
    [navigate],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/catalog/obsolescence')}
            className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-60" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">Mapa de Obsolescencias</h1>
            <p className="text-sm text-muted">
              Apps y microservicios coloreados por estado de soporte de sus tecnologías
            </p>
          </div>
        </div>
      </div>

      {/* Stats row — clickeable como filtros rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard
          icon={<Layers size={18} />}
          value={stats.totalApps}
          label="Aplicaciones"
          iconBg="bg-primary/10 text-primary"
          active={statusFilter === 'all' && showMicroservices && !search}
          onClick={() => { setStatusFilter('all'); setShowMicroservices(true); setSearch('') }}
        />
        <StatCard
          icon={<Network size={18} />}
          value={stats.totalMs}
          label="Microservicios"
          iconBg="bg-info/10 text-info"
          active={showMicroservices && statusFilter === 'all' && !search}
          onClick={() => setShowMicroservices(!showMicroservices)}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          value={stats.appsWithEol}
          label="Apps con EOL"
          iconBg="bg-danger/10 text-danger"
          valueColor="text-danger"
          active={statusFilter === 'eol'}
          onClick={() => setStatusFilter(statusFilter === 'eol' ? 'all' : 'eol')}
        />
        <StatCard
          icon={<Clock size={18} />}
          value={stats.appsWithExtended}
          label="Soporte Extendido"
          iconBg="bg-warning/10 text-warning"
          valueColor="text-warning"
          active={statusFilter === 'extended'}
          onClick={() => setStatusFilter(statusFilter === 'extended' ? 'all' : 'extended')}
        />
        <StatCard
          icon={<Info size={18} />}
          value={stats.appsWithMixed}
          label="Estado Mixto"
          iconBg="bg-purple-500/10 text-purple-500"
          valueColor="text-purple-500"
          active={statusFilter === 'mixed'}
          onClick={() => setStatusFilter(statusFilter === 'mixed' ? 'all' : 'mixed')}
        />
        <StatCard
          icon={<CheckCircle size={18} />}
          value={stats.appsActive}
          label="Apps Saludables"
          iconBg="bg-success/10 text-success"
          valueColor="text-success"
          active={statusFilter === 'active'}
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
        />
      </div>

      {/* Main content: Graph + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Graph — 3/4 */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
          <div className="p-3 border-b border-boundary flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Grafo de Obsolescencias</h2>
            <span className="text-xs text-neutral-50">
              {filteredNodes.length} nodos · {filteredEdges.length} conexiones
            </span>
          </div>
          <div className="p-3">
            {filteredNodes.length > 0 ? (
              <div className="w-full overflow-auto" style={{ minHeight: 500 }}>
                <ObsolescenceGraph
                  nodes={filteredNodes}
                  edges={filteredEdges}
                  width={900}
                  height={600}
                  onNodeClick={handleNodeClick}
                />
              </div>
            ) : (
              <div className="text-center py-16 text-neutral-50">
                <Network size={48} className="mx-auto mb-4 opacity-30" />
                <p>No hay aplicaciones registradas</p>
                <p className="text-sm mt-1">Registra aplicaciones y asigna tecnologías para ver el mapa</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — 1/4 */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-card rounded-xl border border-boundary p-4">
            <h3 className="font-semibold text-sm text-neutral-90 dark:text-white mb-3">Leyenda</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#FF5630]" />
                <span className="text-xs text-secondary">EOL — Fin de vida</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#FF8B00]" />
                <span className="text-xs text-secondary">Soporte Extendido</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                <span className="text-xs text-secondary">Mixto (activo + extendido)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#36B37E]" />
                <span className="text-xs text-secondary">Activo — Saludable</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#6B778C]" />
                <span className="text-xs text-secondary">Sin datos / Desconocido</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-boundary">
              <h4 className="text-xs font-semibold text-neutral-70 dark:text-neutral-40 uppercase tracking-wider mb-2">Nodos</h4>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 rounded-full border-2 border-neutral-50 flex items-center justify-center" />
                <span className="text-xs text-secondary">App</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-neutral-50 flex items-center justify-center" />
                <span className="text-xs text-secondary">Microservicio</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-boundary">
              <h4 className="text-xs font-semibold text-neutral-70 dark:text-neutral-40 uppercase tracking-wider mb-2">Interacción</h4>
              <p className="text-xs text-neutral-60 leading-relaxed">
                Click en un nodo para ir al detalle de la aplicación. Las flechas punteadas indican relación app → microservicio.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-xl border border-boundary p-4">
            <h3 className="font-semibold text-sm text-neutral-90 dark:text-white mb-3">Filtros</h3>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Status filter */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted mb-1.5 block">Estado de soporte</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      statusFilter === opt.value
                        ? 'border-current bg-current/10'
                        : 'border-neutral-30 dark:border-neutral-60 text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70'
                    }`}
                    style={statusFilter === opt.value ? { borderColor: opt.color, color: opt.color } : undefined}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Microservices toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-boundary">
              <div className="flex items-center gap-2">
                {showMicroservices ? <Eye size={15} className="text-primary" /> : <EyeOff size={15} className="text-neutral-50" />}
                <span className="text-xs text-secondary">Microservicios</span>
              </div>
              <Button
                onClick={() => setShowMicroservices(!showMicroservices)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  showMicroservices ? 'bg-primary' : 'bg-neutral-40'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    showMicroservices ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </Button>
            </div>

            {/* Clear filters */}
            {(search || statusFilter !== 'all' || !showMicroservices) && (
              <Button
                onClick={() => { setSearch(''); setStatusFilter('all'); setShowMicroservices(true) }}
                className="mt-3 w-full text-xs text-center text-primary hover:text-primary-dark py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Summary */}
          {statusFilter !== 'all' && (
            <div className="bg-card rounded-xl border border-boundary p-4">
              <h3 className="font-semibold text-sm text-neutral-90 dark:text-white mb-2">Resultados</h3>
              <p className="text-xs text-neutral-60">
                {filteredNodes.filter((n) => n.type === 'app').length} apps · {filteredNodes.filter((n) => n.type === 'microservice').length} microservicios
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
