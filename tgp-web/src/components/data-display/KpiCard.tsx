import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const colorMap = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
}

export function KpiCard({ title, value, subtitle, trend, trendValue, icon, color = 'primary' }: KpiCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-neutral-50'

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', colorMap[color])}>
          {icon}
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
            <TrendIcon size={16} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-neutral-60 dark:text-neutral-40 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-neutral-50 dark:text-neutral-50 mt-1">{subtitle}</p>
      )}
    </div>
  )
}
