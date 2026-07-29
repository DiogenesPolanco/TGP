import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface PanelHeaderProps {
  title: string
  badge?: string | number
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

function PanelHeader({ title, badge, icon, actions, className }: PanelHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-3">
        {icon && <span className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</span>}
        <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">{title}</h2>
        {badge && (
          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {badge}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export { PanelHeader }
export default PanelHeader
