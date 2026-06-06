import { ChevronLeft } from 'lucide-react'

interface DetailLayoutProps {
  title: string
  subtitle?: string
  onBack: () => void
  backLabel?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function DetailLayout({ title, subtitle, onBack, backLabel = 'Volver', actions, children }: DetailLayoutProps) {
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-neutral-50">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-neutral-90 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          {backLabel}
        </button>
      </nav>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-neutral-60 dark:text-neutral-40">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm p-6">
        {children}
      </div>
    </div>
  )
}
