import { FileSpreadsheet, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function TermsDeclinedPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{
        background: 'radial-gradient(ellipse 60% 50% at 20% 30%, #0052CC 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 70%, #C85A48 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 50%, #36B37E 0%, transparent 50%)'
      }} />
      <div className="w-full max-w-lg relative">
        <div className="bg-white/95 dark:bg-neutral-80/95 backdrop-blur-xl rounded-3xl border border-neutral-20/80 dark:border-neutral-70/80 shadow-2xl shadow-neutral-30/30 dark:shadow-black/30 overflow-hidden p-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-neutral-10 dark:bg-neutral-85 flex items-center justify-center mx-auto">
            <FileSpreadsheet size={40} className="text-neutral-50" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">
              ¡Nos vemos en Excel!
            </h2>
            <p className="text-base text-neutral-60 dark:text-neutral-40 leading-relaxed">
              Entendemos que TGP no es para todos. 
              <br />¡Suerte con esas hojas de cálculo!
            </p>
          </div>

          <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-5 border border-neutral-20 dark:border-neutral-70 text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed">
            <p className="mb-2">
              Si cambias de opinión más adelante, estaremos aquí.
            </p>
            <p className="text-xs text-neutral-50">
              TGP · Gobernando tecnologías, no voluntades 😄
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button onClick={onBack} variant="secondary" className="rounded-xl">
              <ArrowLeft size={18} />
              Volver
            </Button>
            <Button onClick={() => window.location.reload()} variant="primary" className="rounded-xl shadow-lg shadow-primary/25 bg-primary text-white hover:bg-primary/90">
              <RefreshCw size={18} />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
