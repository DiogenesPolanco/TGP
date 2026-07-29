import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BadgeProps {
  children?: ReactNode
  variant?: 'status' | 'dot'
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

const colorMap = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    dot: 'bg-primary',
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    dot: 'bg-success',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    dot: 'bg-warning',
  },
  danger: {
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/20',
    dot: 'bg-danger',
  },
  info: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
    dot: 'bg-info',
  },
  neutral: {
    bg: 'bg-neutral-10 dark:bg-neutral-75',
    text: 'text-muted',
    border: 'border-neutral-20 dark:border-neutral-60',
    dot: 'bg-neutral-40 dark:bg-neutral-50',
  },
}

function Badge({
  children,
  variant = 'status',
  color = 'primary',
  size = 'md',
  className,
}: BadgeProps) {
  const c = colorMap[color]

  if (variant === 'dot') {
    return <span className={cn('w-2 h-2 rounded-full inline-block', c.dot, className)} />
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full text-xs font-semibold border',
        c.bg,
        c.text,
        c.border,
        size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5',
        className,
      )}
    >
      {children}
    </span>
  )
}

export { Badge }
export default Badge
