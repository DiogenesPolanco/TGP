import { RefreshCw, Sparkles, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function UpdateAvailable({ onReload }: { onReload: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 20% 30%, #0052CC 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 80% 70%, #C85A48 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, #36B37E 0%, transparent 50%)
          `,
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-4xl relative">
        <div className="bg-white/95 dark:bg-neutral-80/95 backdrop-blur-xl rounded-3xl border border-neutral-20/80 dark:border-neutral-70/80 shadow-2xl shadow-neutral-30/30 dark:shadow-black/30 overflow-hidden">
          <div className="flex flex-col sm:flex-row min-h-[380px]">
            <div className="sm:w-[42%] bg-gradient-to-br from-primary via-primary-dark to-[#03245E] p-8 sm:p-10 text-white flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{
                background: 'radial-gradient(circle at 30% 40%, white 0%, transparent 60%), radial-gradient(circle at 70% 80%, #4C9AFF 0%, transparent 50%)'
              }} />
              <div className="relative flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                  <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight">TGP</p>
                  <p className="text-[11px] font-medium opacity-60 tracking-wide">Technology Governance Platform</p>
                </div>
              </div>

              <div className="relative flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={16} />
                  <span className="text-xs font-medium uppercase tracking-widest opacity-60">Actualización</span>
                </div>
                <h2 className="text-3xl font-bold leading-tight mb-3">Nueva versión<br />disponible</h2>
                <p className="text-base leading-relaxed opacity-85">
                  Se ha detectado una versión más reciente de TGP. Recarga la aplicación para disfrutar de las últimas mejoras.
                </p>
              </div>

              <div className="relative mt-6 pt-4 border-t border-white/15">
                <p className="text-sm opacity-60 leading-relaxed">TGP · Mejora continua</p>
              </div>
            </div>

            <div className="hidden sm:block w-5 bg-white/95 dark:bg-neutral-80/95 relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-neutral-20 dark:bg-neutral-70" />
                ))}
              </div>
            </div>

            <div className="sm:w-[58%] p-8 sm:p-10 bg-white/95 dark:bg-neutral-80/95 flex flex-col justify-center">
              <div className="max-w-sm mx-auto w-full space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Download size={32} className="text-primary" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-neutral-90 dark:text-white">Instalar actualización</h3>
                  <p className="text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed">
                    Aplica los cambios más recientes para mantener todo funcionando correctamente.
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border border-amber-200 dark:border-amber-500/20">
                  <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                    Tus datos no se perderán. La aplicación se descargará de nuevo con las últimas mejoras.
                  </p>
                </div>

                <Button onClick={onReload} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25">
                  <RefreshCw size={20} />
                  Instalar ahora
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
