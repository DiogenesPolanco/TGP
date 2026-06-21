import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DependencyGraph } from './DependencyGraph'
import { Network, Layers, ArrowRight } from 'lucide-react'

export function DependencyMapPage() {
  const navigate = useNavigate()
  const apps = useLiveQuery(() => db.applications.toArray()) ?? []
  const deps = useLiveQuery(() => db.applicationDependencies.toArray()) ?? []

  const handleNodeClick = useCallback((appId: string) => {
    navigate(`/catalog/applications/${appId}`)
  }, [navigate])

  const nodes = apps.map((app) => ({
    id: app.id,
    label: app.name,
    criticality: app.criticality,
  }))

  const edges = deps.map((dep) => ({
    source: dep.applicationId,
    target: dep.dependsOnAppId,
    type: dep.dependencyType,
    criticality: dep.criticality,
  }))

  const appMap = new Map(apps.map((a) => [a.id, a]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">Mapa de Dependencias</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-boundary p-3 flex items-center gap-3">
          <Network size={20} className="text-primary shrink-0" />
          <div>
            <p className="text-lg font-bold text-neutral-90 dark:text-white">{nodes.length}</p>
            <p className="text-xs text-neutral-50">Aplicaciones</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-boundary p-3 flex items-center gap-3">
          <ArrowRight size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-lg font-bold text-neutral-90 dark:text-white">{edges.length}</p>
            <p className="text-xs text-neutral-50">Dependencias</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-boundary p-3 flex items-center gap-3">
          <Layers size={20} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-lg font-bold text-neutral-90 dark:text-white">
              {new Set([...deps.map((d) => d.applicationId), ...deps.map((d) => d.dependsOnAppId)]).size}
            </p>
            <p className="text-xs text-neutral-50">Apps conectadas</p>
          </div>
        </div>
      </div>

      {/* Two-column layout: Graph | Legend + Dependencies */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Graph — takes 3/4 */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
          <div className="p-3 border-b border-boundary">
            <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Grafo de Dependencias</h2>
          </div>
          <div className="p-3">
            {nodes.length > 0 ? (
              <div className="w-full overflow-auto" style={{ minHeight: 500 }}>
                <DependencyGraph nodes={nodes} edges={edges} width={900} height={600} onNodeClick={handleNodeClick} />
              </div>
            ) : (
              <div className="text-center py-16 text-neutral-50">
                <Network size={48} className="mx-auto mb-4 opacity-30" />
                <p>No hay aplicaciones registradas</p>
                <p className="text-sm mt-1">Las dependencias aparecerán aquí cuando añadas aplicaciones y sus relaciones</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — takes 1/4 */}
        <div className="lg:col-span-1 space-y-4">
          {/* Leyenda */}
          <div className="bg-card rounded-xl border border-boundary p-4">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white mb-3">Leyenda</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-neutral-50 uppercase tracking-wider mb-2">Tipo</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-neutral-80 dark:text-neutral-20">
                    <span className="w-4 h-0.5 rounded bg-[#FF5630]" /> Hard
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-80 dark:text-neutral-20">
                    <span className="w-4 block" style={{ borderTop: '2px dashed #FFAB00', height: 0 }} /> Soft
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-80 dark:text-neutral-20">
                    <span className="w-4 h-0.5 rounded bg-[#2684FF]" /> Datos
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-80 dark:text-neutral-20">
                    <span className="w-4 h-0.5 rounded bg-[#6554C0]" /> Red
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-neutral-50 uppercase tracking-wider mb-2">Criticidad</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-neutral-80 dark:text-neutral-20">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5630]" /> Crítica
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-80 dark:text-neutral-20">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF8B00]" /> Alta
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-80 dark:text-neutral-20">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFAB00]" /> Media
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-80 dark:text-neutral-20">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#36B37E]" /> Baja
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-50 leading-relaxed">
                Click en cualquier nodo del grafo para ir al detalle.
              </p>
            </div>
          </div>

          {/* Lista compacta de dependencias */}
          {edges.length > 0 && (
            <div className="bg-card rounded-xl border border-boundary p-4">
              <h3 className="text-sm font-bold text-neutral-90 dark:text-white mb-3">Dependencias</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {deps.map((dep) => {
                  const sourceApp = appMap.get(dep.applicationId)
                  const targetApp = appMap.get(dep.dependsOnAppId)
                  return (
                    <div key={dep.id} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-neutral-5 dark:hover:bg-neutral-85 transition-colors">
                      <span className="font-medium text-neutral-90 dark:text-white truncate">{sourceApp?.name ?? dep.applicationId}</span>
                      <span className="text-neutral-40">→</span>
                      <span className="font-medium text-neutral-90 dark:text-white truncate">{targetApp?.name ?? dep.dependsOnAppId}</span>
                      <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        dep.criticality === 'critical' ? 'bg-danger/10 text-danger'
                        : dep.criticality === 'high' ? 'bg-warning/10 text-warning'
                        : 'bg-success/10 text-success'
                      }`}>{dep.criticality}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
