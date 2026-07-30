import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

export function StatCard({
  icon, value, label, iconBg, valueColor, active, onClick,
}: {
  icon: ReactNode
  value: number
  label: string
  iconBg: string
  valueColor?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Button type="button" onClick={onClick}
      className={`rounded-xl border p-3 flex items-center gap-3 transition-all text-left cursor-pointer ${
        active ? 'ring-2 ring-primary/40 border-primary bg-primary/5 dark:bg-primary/10' : 'bg-card border-boundary hover:shadow-md hover:border-neutral-30 dark:hover:border-neutral-60'
      }`}
    >
      <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-lg font-bold ${valueColor ?? 'text-neutral-90 dark:text-white'}`}>{value}</p>
        <p className="text-xs text-neutral-50 truncate">{label}</p>
      </div>
    </Button>
  )
}
