import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const variantMap = {
  primary:
    'text-white hover:bg-secondary/90 active:bg-primary/80 active:text-white',
  secondary:
    'bg-neutral-10 dark:bg-neutral-75 text-secondary hover:bg-neutral-20 dark:hover:bg-neutral-70 border border-neutral-30 dark:border-neutral-60',
  ghost:
    'text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 hover:text-neutral-90 dark:hover:text-white',
  danger:
    'bg-danger text-white hover:bg-danger/90 active:bg-danger/80',
  'outline-primary':
    'border border-primary/30 text-primary hover:bg-primary/5',
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantMap
  size?: keyof typeof sizeMap
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
          variantMap[variant],
          sizeMap[size],
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export default Button
