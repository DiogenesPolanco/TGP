import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { usePublicShare } from '@/hooks/usePublicShare'
import { getPublicObsolescenceData } from '@/services/share/publicShareService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { ObsolescenceGraph } from '@/features/obsolescence/components/ObsolescenceGraph'
import { computeAppTechMap } from '@/utils/technologyUtils'
import type { SupportStatus, Technology } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import {
  Network, Layers, AlertTriangle, Clock, CheckCircle, Info, Search, Eye, EyeOff,
} from 'lucide-react'

type StatusFilter = SupportStatus | 'all' | 'mixed'

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

export function PublicObsolescenceMapPage() {
  const { hash } = useParams<{ hash: string }>()
  const { loading, valid, data, pendingEncrypted, handleDecrypt } = usePublicShare(
    hash,
    () => getPublicObsolescenceData(),
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showMicroservices, setShowMicroservices] = useState(true)

  const apps = (data?.applications as Array<Record<string, unknown>>) ?? []
  const microservices = (data?.microservices as Array<Record<string, unknown>>) ?? []
  const technologies = (data?.technologies as Array<Record<string, unknown>>) ?? []

  const techMap = useMemo(() => {
    const map = new Map<string, Technology>()
    for (const t of technologies) map.set(t.id as string, t as unknown as Technology)
    return map
  }, [technologies])

  const appTechMap = useMemo(
    () => computeAppTechMap(apps as any, microservices as any),
    [apps, microservices],
  )

  const msTechMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const ms of microservices) {
      map.set(ms.id as string, ms.technologies as string[])
    }
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
      const techIds = appTechMap.get(app.id as string) ?? (app.technologies as string[])
      const status = getWorstStatus(techIds, techMap)
      result.push({
        id: app.id as string,
        label: app.name as string,
        status,
        type: 'app',
        techCount: techIds.length,
        appName: app.name as string,
      })
    }
    for (const ms of microservices) {
      const techIds = msTechMap.get(ms.id as string) ?? []
      const status = getWorstStatus(techIds, techMap)
      const parentApp = apps.find((a) => a.id === ms.applicationId)
      result.push({
        id: ms.id as string,
        label: ms.name as string,
        status,
        type: 'microservice',
        parentAppId: ms.applicationId as string,
        techCount: techIds.length,
        appName: (parentApp?.name as string) ?? '',
      })
    }
    return result
  }, [apps, microservices, appTechMap, msTechMap, techMap])

  const allEdges = useMemo(
    () =>
      microservices.map((ms) => ({
        source: ms.applicationId as string,
        target: ms.id as string,
      })),
    [microservices],
  )

  const filteredNodeIds = useMemo(() => {
    const filtered = allNodes.filter((n) => {
      if (search && !n.label.toLowerCase().includes(search.toLowerCase()) && !n.appName.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== 'all' && n.status !== statusFilter) return false
      if (!showMicroservices && n.type === 'microservice') return false
      return true
    })
    return new Set(filtered.map((n) => n.id))
  }, [allNodes, search, statusFilter, showMicroservices])

  const filteredEdges = useMemo(
    () => allEdges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)),
    [allEdges, filteredNodeIds],
  )

  const filteredNodes = useMemo(
    () => allNodes.filter((n) => filteredNodeIds.has(n.id)),
    [allNodes, filteredNodeIds],
  )

  const stats = useMemo(() => {
    const totalApps = apps.length
    const totalMs = microservices.length
    const appNodes = allNodes.filter((n) => n.type === 'app')
    const appsWithEol = appNodes.filter((n) => n.status === 'eol').length
    const appsWithExtended = appNodes.filter((n) => n.status === 'extended').length
    const appsWithMixed = appNodes.filter((n) => n.status === 'mixed').length
    const appsActive = appNodes.filter((n) => n.status === 'active').length
    const appsUnknown = appNodes.filter((n) => n.status === 'unknown').length
    return { totalApps, totalMs, appsWithEol, appsWithExtended, appsWithMixed, appsActive, appsUnknown }
  }, [apps, microservices, allNodes])

  if (loading) return <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center"><div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" /></div>
  if (!valid) return <InvalidLinkPage />
  if (!data) {
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center">
          <PassphraseModal
            title="Mapa de obsolescencias protegido"
            description="Esta vista fue compartida con cifrado. Ingresa la contraseña para verla."
            onSubmit={async (pass) => {
              const ok = await handleDecrypt(pass)
              if (!ok) alert('Contraseña incorrecta')
            }}
          />
        </div>
      )
    }
    return null
  }

  return (
    <div id="printable-content" className="min-h-screen bg-neutral-10 dark:bg-neutral-90">
      <header className="bg-white dark:bg-neutral-80 border-b border-neutral-20 dark:border-neutral-70">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Mapa de Obsolescencias</h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard icon={<Layers size={18} />} value={stats.totalApps} label="Aplicaciones" active />
          <StatCard icon={<Network size={18} />} value={stats.totalMs} label="Microservicios" active />
          <StatCard icon={<AlertTriangle size={18} />} value={stats.appsWithEol} label="Apps con EOL" />
          <StatCard icon={<Clock size={18} />} value={stats.appsWithExtended} label="Soporte Extendido" />
          <StatCard icon={<Info size={18} />} value={stats.appsWithMixed} label="Estado Mixto" />
          <StatCard icon={<CheckCircle size={18} />} value={stats.appsActive} label="Apps Saludables" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-neutral-20 dark:border-neutral-70 flex items-center justify-between">
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
                  />
                </div>
              ) : (
                <div className="text-center py-16 text-neutral-50">
                  <Network size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No hay aplicaciones registradas</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-4">
              <h3 className="font-semibold text-sm text-neutral-90 dark:text-white mb-3">Leyenda</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF5630]" />
                  <span className="text-xs text-neutral-70 dark:text-neutral-30">EOL — Fin de vida</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF8B00]" />
                  <span className="text-xs text-neutral-70 dark:text-neutral-30">Soporte Extendido</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                  <span className="text-xs text-neutral-70 dark:text-neutral-30">Mixto</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#36B37E]" />
                  <span className="text-xs text-neutral-70 dark:text-neutral-30">Activo</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#6B778C]" />
                  <span className="text-xs text-neutral-70 dark:text-neutral-30">Sin datos</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-4">
              <h3 className="font-semibold text-sm text-neutral-90 dark:text-white mb-3">Filtros</h3>
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
              <div className="mb-3">
                <label className="text-xs font-medium text-neutral-60 dark:text-neutral-40 mb-1.5 block">Estado de soporte</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      onClick={() => setStatusFilter(opt.value)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                        statusFilter === opt.value
                          ? 'border-current bg-current/10'
                          : 'border-neutral-30 dark:border-neutral-60 text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70'
                      }`}
                      style={statusFilter === opt.value ? { borderColor: opt.color, color: opt.color } : undefined}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-20 dark:border-neutral-70">
                <div className="flex items-center gap-2">
                  {showMicroservices ? <Eye size={15} className="text-primary" /> : <EyeOff size={15} className="text-neutral-50" />}
                  <span className="text-xs text-neutral-70 dark:text-neutral-30">Microservicios</span>
                </div>
                <Button
                  onClick={() => setShowMicroservices(!showMicroservices)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showMicroservices ? 'bg-primary' : 'bg-neutral-40'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${showMicroservices ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </Button>
              </div>
              {(search || statusFilter !== 'all' || !showMicroservices) && (
                <Button
                  onClick={() => { setSearch(''); setStatusFilter('all'); setShowMicroservices(true) }}
                  className="mt-3 w-full text-xs text-center text-primary hover:text-primary-dark py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-40 py-4 border-t border-neutral-20 dark:border-neutral-70">
          TGP — Technology Governance Platform · Datos compartidos
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, value, label, active }: { icon: React.ReactNode; value: number; label: string; active?: boolean }) {
  return (
    <div className={`bg-white dark:bg-neutral-80 rounded-2xl border p-3 flex items-center gap-3 ${active ? 'border-neutral-30 dark:border-neutral-60' : 'border-neutral-20 dark:border-neutral-70 opacity-80'}`}>
      <div className="text-primary shrink-0">{icon}</div>
      <div>
        <p className="text-lg font-bold text-neutral-90 dark:text-white">{value}</p>
        <p className="text-xs text-neutral-50">{label}</p>
      </div>
    </div>
  )
}
