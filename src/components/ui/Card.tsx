import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padding?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, padding = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-card border border-boundary shadow-sm overflow-hidden',
          padding && 'p-5',
          hoverable && 'hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }
export default Card