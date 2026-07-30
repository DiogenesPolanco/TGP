import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { computeAppTechMap } from '@/utils/technologyUtils'
import { ObsolescenceGraph } from '@/features/obsolescence/components/ObsolescenceGraph'
import { Network, AlertTriangle, Clock, CheckCircle, Layers, Info, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatCard } from '../components/StatCard'
import { ObsolescenceMapSidebar } from '../components/ObsolescenceMapSidebar'
import { getWorstStatus, type StatusFilter } from '../utils/mapHelpers'
import type { Technology } from '@/types/domain'
import type { SupportStatus } from '@/constants/enums'

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

  const appTechMap = useMemo(() => computeAppTechMap(apps, microservices), [apps, microservices])
  const msTechMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const ms of microservices) map.set(ms.id, ms.technologies)
    return map
  }, [microservices])

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
      result.push({
        id: app.id,
        label: app.name,
        status: getWorstStatus(techIds, techMap),
        type: 'app',
        techCount: techIds.length,
        appName: app.name,
      })
    }
    for (const ms of microservices) {
      const techIds = msTechMap.get(ms.id) ?? []
      const parentApp = apps.find((a) => a.id === ms.applicationId)
      result.push({
        id: ms.id,
        label: ms.name,
        status: getWorstStatus(techIds, techMap),
        type: 'microservice',
        parentAppId: ms.applicationId,
        techCount: techIds.length,
        appName: parentApp?.name ?? '',
      })
    }
    return result
  }, [apps, microservices, appTechMap, msTechMap, techMap])

  const allEdges = useMemo(
    () => microservices.map((ms) => ({ source: ms.applicationId, target: ms.id })),
    [microservices],
  )

  const filteredNodes = useMemo(
    () =>
      allNodes.filter((n) => {
        if (
          search &&
          !n.label.toLowerCase().includes(search.toLowerCase()) &&
          !n.appName.toLowerCase().includes(search.toLowerCase())
        )
          return false
        if (statusFilter !== 'all' && n.status !== statusFilter) return false
        if (!showMicroservices && n.type === 'microservice') return false
        return true
      }),
    [allNodes, search, statusFilter, showMicroservices],
  )

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes])
  const filteredEdges = useMemo(
    () => allEdges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)),
    [allEdges, filteredNodeIds],
  )

  const stats = useMemo(() => {
    const appNodes = allNodes.filter((n) => n.type === 'app')
    return {
      totalApps: apps.length,
      totalMs: microservices.length,
      appsWithEol: appNodes.filter((n) => n.status === 'eol').length,
      appsWithExtended: appNodes.filter((n) => n.status === 'extended').length,
      appsWithMixed: appNodes.filter((n) => n.status === 'mixed').length,
      appsActive: appNodes.filter((n) => n.status === 'active').length,
      appsUnknown: appNodes.filter((n) => n.status === 'unknown').length,
      msWithEol: allNodes.filter((n) => n.type === 'microservice' && n.status === 'eol').length,
    }
  }, [apps, microservices, allNodes])

  const handleNodeClick = useCallback(
    (nodeId: string, nodeType: 'app' | 'microservice', parentAppId?: string) => {
      if (nodeType === 'app') navigate(`/catalog/applications/${nodeId}`)
      else if (parentAppId) navigate(`/catalog/applications/${parentAppId}`)
    },
    [navigate],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/catalog/obsolescence')}
            className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-60" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
              Mapa de Obsolescencias
            </h1>
            <p className="text-sm text-muted">
              Apps y microservicios coloreados por estado de soporte de sus tecnologías
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard
          icon={<Layers size={18} />}
          value={stats.totalApps}
          label="Aplicaciones"
          iconBg="bg-primary/10 text-primary"
          active={statusFilter === 'all' && showMicroservices && !search}
          onClick={() => {
            setStatusFilter('all')
            setShowMicroservices(true)
            setSearch('')
          }}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
          <div className="p-3 border-b border-boundary flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">
              Grafo de Obsolescencias
            </h2>
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
                <p className="text-sm mt-1">
                  Registra aplicaciones y asigna tecnologías para ver el mapa
                </p>
              </div>
            )}
          </div>
        </div>

        <ObsolescenceMapSidebar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          showMicroservices={showMicroservices}
          onToggleMicroservices={() => setShowMicroservices(!showMicroservices)}
          filteredApps={filteredNodes.filter((n) => n.type === 'app').length}
          filteredMs={filteredNodes.filter((n) => n.type === 'microservice').length}
        />
      </div>
    </div>
  )
}
