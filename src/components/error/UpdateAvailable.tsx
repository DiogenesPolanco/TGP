import { RefreshCw, Sparkles } from 'lucide-react'

export function UpdateAvailable({ onReload }: { onReload: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto animate-bounce">
            <Sparkles size={40} className="text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">2</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-neutral-90 dark:text-white">Nueva versión disponible</h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed">
            Se ha detectado una versión más reciente de TGP. Para evitar errores y disfrutar
            de las últimas mejoras, recarga la aplicación.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border border-amber-200 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-300 text-left leading-relaxed">
          Las funcionalidades pueden verse afectadas si no actualizas.
        </div>

        <button
          onClick={onReload}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25 animate-pulse"
        >
          <RefreshCw size={18} />
          Recargar ahora
        </button>
      </div>
    </div>
  )
}
