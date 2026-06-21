import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { usePublicShare } from '@/hooks/usePublicShare'
import { getPublicDependenciesData } from '@/services/share/publicShareService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { DependencyGraph } from '@/features/dependencies/DependencyGraph'
import { Network, Layers, ArrowRight } from 'lucide-react'

export function PublicDependencyMapPage() {
  const { hash } = useParams<{ hash: string }>()
  const { loading, valid, data, pendingEncrypted, handleDecrypt } = usePublicShare(
    hash,
    () => getPublicDependenciesData(),
  )

  const appArr = (data?.applications as Array<Record<string, unknown>>) ?? []
  const depArr = (data?.dependencies as Array<Record<string, unknown>>) ?? []

  const nodes = useMemo(() => {
    return appArr.map((app) => ({
      id: app.id as string,
      label: app.name as string,
      criticality: app.criticality as string,
    }))
  }, [appArr])

  const edges = useMemo(() => {
    return depArr.map((dep) => ({
      source: dep.applicationId as string,
      target: dep.dependsOnAppId as string,
      type: dep.dependencyType as string,
      criticality: dep.criticality as string,
    }))
  }, [depArr])

  const connectedAppsCount = useMemo(() => {
    if (!depArr.length) return 0
    return new Set([...depArr.map((d) => d.applicationId as string), ...depArr.map((d) => d.dependsOnAppId as string)]).size
  }, [depArr])

  if (loading) return <div className="min-h-screen bg-canvas flex items-center justify-center"><div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" /></div>
  if (!valid) return <InvalidLinkPage />
  if (!data) {
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <PassphraseModal
            title="Mapa de dependencias protegido"
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
    <div id="printable-content" className="min-h-screen bg-canvas">
      <header className="bg-card border-b border-boundary">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Mapa de Dependencias</h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl border border-boundary p-3 flex items-center gap-3">
            <Network size={20} className="text-primary shrink-0" />
            <div>
              <p className="text-lg font-bold text-neutral-90 dark:text-white">{nodes.length}</p>
              <p className="text-xs text-neutral-50">Aplicaciones</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-boundary p-3 flex items-center gap-3">
            <ArrowRight size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-lg font-bold text-neutral-90 dark:text-white">{edges.length}</p>
              <p className="text-xs text-neutral-50">Dependencias</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-boundary p-3 flex items-center gap-3">
            <Layers size={20} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-lg font-bold text-neutral-90 dark:text-white">{connectedAppsCount}</p>
              <p className="text-xs text-neutral-50">Apps conectadas</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
            <div className="p-3 border-b border-boundary">
              <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Grafo de Dependencias</h2>
            </div>
            <div className="p-3">
              {nodes.length > 0 ? (
                <div className="w-full overflow-auto" style={{ minHeight: 500 }}>
                  <DependencyGraph nodes={nodes} edges={edges} width={900} height={600} />
                </div>
              ) : (
                <div className="text-center py-16 text-neutral-50">
                  <Network size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No hay aplicaciones registradas</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-2xl border border-boundary p-4">
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
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-neutral-50 uppercase tracking-wider mb-2">Criticidad</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full bg-[#FF5630]" />
                      <span className="text-secondary">Alta</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full bg-[#FF8B00]" />
                      <span className="text-secondary">Media</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full bg-[#36B37E]" />
                      <span className="text-secondary">Baja</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-boundary p-4">
              <h3 className="text-sm font-bold text-neutral-90 dark:text-white mb-2">Acerca de esta vista</h3>
              <p className="text-xs text-neutral-60 leading-relaxed">
                Grafo de dependencias entre aplicaciones del portafolio. Las flechas indican la dirección de la dependencia.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-40 py-4 border-t border-boundary">
          TGP — Technology Governance Platform · Datos compartidos
        </div>
      </main>
    </div>
  )
}
