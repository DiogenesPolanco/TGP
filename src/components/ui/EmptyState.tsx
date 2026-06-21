import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  compact?: boolean
}

export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-16'
      )}
    >
      <div className="w-12 h-12 rounded-full bg-neutral-10 dark:bg-neutral-80 flex items-center justify-center mb-4">
        {icon ?? <Inbox size={22} className="text-neutral-50 dark:text-neutral-50" />}
      </div>
      <h3 className="text-sm font-semibold text-secondary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-50 dark:text-neutral-50 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
