import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-neutral-30 dark:border-neutral-60',
          'bg-card px-3 py-2 text-sm',
          'text-neutral-90 dark:text-white',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          'placeholder:text-neutral-40 dark:placeholder:text-neutral-50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
export default Input
