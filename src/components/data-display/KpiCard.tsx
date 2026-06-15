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
  onClick?: () => void
}

const colorMap = {
  primary: {
    icon: 'text-primary bg-primary/10',
    accent: 'bg-primary',
    shadow: 'shadow-primary/10',
    gradient: 'from-primary/5 via-transparent to-transparent',
  },
  success: {
    icon: 'text-success bg-success/10',
    accent: 'bg-success',
    shadow: 'shadow-success/10',
    gradient: 'from-success/5 via-transparent to-transparent',
  },
  warning: {
    icon: 'text-warning bg-warning/10',
    accent: 'bg-warning',
    shadow: 'shadow-warning/10',
    gradient: 'from-warning/5 via-transparent to-transparent',
  },
  danger: {
    icon: 'text-danger bg-danger/10',
    accent: 'bg-danger',
    shadow: 'shadow-danger/10',
    gradient: 'from-danger/5 via-transparent to-transparent',
  },
  info: {
    icon: 'text-info bg-info/10',
    accent: 'bg-info',
    shadow: 'shadow-info/10',
    gradient: 'from-info/5 via-transparent to-transparent',
  },
}

export function KpiCard({ title, value, subtitle, trend, trendValue, icon, color = 'primary', onClick }: KpiCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-neutral-50'
  const styles = colorMap[color]

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-5',
        'shadow-sm hover:shadow-lg transition-all duration-300',
        'hover:-translate-y-0.5',
        styles.shadow,
        'overflow-hidden',
        onClick && 'cursor-pointer',
      )}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          'bg-gradient-to-b',
          styles.gradient,
        )}
      />

      {/* Accent bar at top */}
      <div className={cn('absolute top-0 left-0 right-0 h-0.5 opacity-60', styles.accent)} />

      {/* Content (relative to stay above gradient overlay) */}
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2 rounded-lg transition-transform duration-300 group-hover:scale-110', styles.icon)}>
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
        <p className="text-2xl font-bold text-neutral-90 dark:text-white tabular-nums">{value}</p>
        {subtitle && (
          <p className="text-xs text-neutral-50 dark:text-neutral-50 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
