import { cn } from '@/lib/utils'

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-subtle',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-boundary p-5 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonPulse className="w-8 h-8 rounded-lg" />
        <SkeletonPulse className="w-14 h-4" />
      </div>
      <SkeletonPulse className="w-24 h-3" />
      <SkeletonPulse className="w-16 h-7" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-2xl border border-boundary p-4 space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-boundary">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {[1, 2, 3, 4].map((c) => (
            <SkeletonPulse key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-card rounded-2xl border border-boundary p-6">
      <SkeletonPulse className="w-32 h-4 mb-6" />
      <SkeletonPulse className="w-full h-48" />
    </div>
  )
}
