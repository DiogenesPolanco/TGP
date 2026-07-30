import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  label: string
  value: number
  color?: string
  active?: boolean
  onClick?: () => void
}

const iconClasses: Record<string, string> = {
  'text-primary': 'bg-primary/10 text-primary',
  'text-danger': 'bg-danger/10 text-danger',
  'text-severity-high': 'bg-danger/10 text-danger',
  'text-warning': 'bg-warning/10 text-warning',
  'text-info': 'bg-info/10 text-info',
  'text-purple-500': 'bg-purple-500/10 text-purple-500',
}

export function StatCard({ icon, label, value, color = 'text-primary', active, onClick }: Props) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`rounded-2xl border p-4 flex items-center justify-center gap-3 transition-all ${
        active
          ? 'ring-2 ring-primary/40 border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
          : 'bg-card border-boundary shadow-sm hover:shadow-md hover:border-neutral-30 dark:hover:border-neutral-60'
      }${onClick ? ' cursor-pointer' : ''}`}
    >
      <div className={`p-2 rounded-lg ${iconClasses[color] || 'bg-primary/10 text-primary'}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Comp>
  )
}
