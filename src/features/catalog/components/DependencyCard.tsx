import { ExternalLink, Shield } from 'lucide-react'
import { criticalityLabel, appStatusLabel } from '@/features/catalog/constants/architectureConstants'
import type { Application, ApplicationDependency } from '@/types/domain'

export function DependencyCard({
  dep,
  depInfo,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  dep: Application
  depInfo?: ApplicationDependency
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  return (
    <div
      className={`
        relative rounded-xl border-2 bg-neutral-50/50 dark:bg-neutral-75 shadow-sm
        transition-all duration-200 cursor-default
        ${
          isHovered
            ? 'border-neutral-400 shadow-lg shadow-neutral-500/10 scale-[1.02]'
            : 'border-neutral-20 dark:border-neutral-60'
        }
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-20 dark:border-neutral-60">
        <div className="p-1 rounded-md bg-neutral-200 dark:bg-neutral-60 text-neutral-600 dark:text-neutral-400">
          <ExternalLink size={14} />
        </div>
        <span className="text-sm font-semibold text-neutral-90 dark:text-white truncate">
          {dep.name}
        </span>
        {depInfo?.dependencyType && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-60 text-neutral-600 dark:text-neutral-400 uppercase font-mono">
            {depInfo.dependencyType}
          </span>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        {depInfo?.description && (
          <p className="text-xs text-muted line-clamp-2">{depInfo.description}</p>
        )}
        <div className="flex items-center gap-2 text-[10px] text-neutral-50">
          <Shield size={12} />
          <span>
            {dep.architecture} · {appStatusLabel[dep.status]}
          </span>
          {dep.criticality && (
            <span
              className={`ml-auto px-1.5 py-0.5 rounded-full ${
                dep.criticality === 'critical'
                  ? 'bg-red-500/10 text-red-500'
                  : dep.criticality === 'high'
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-emerald-500/10 text-emerald-500'
              }`}
            >
              {criticalityLabel[dep.criticality]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
