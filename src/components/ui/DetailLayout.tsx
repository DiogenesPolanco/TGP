import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface DetailLayoutProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  onBack: () => void
  backLabel?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function DetailLayout({
  title,
  subtitle,
  onBack,
  backLabel = 'Volver',
  actions,
  children,
}: DetailLayoutProps) {
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-neutral-50">
        <Button
          onClick={onBack}
          variant="ghost"
          className="flex items-center gap-1 hover:text-neutral-90 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          {backLabel}
        </Button>
      </nav>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-neutral-90 dark:text-white">{title}</h1>
          {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      <div className="bg-card rounded-2xl border border-boundary shadow-sm p-6">{children}</div>
    </div>
  )
}
