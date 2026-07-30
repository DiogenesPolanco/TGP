import { Box, AlertTriangle } from 'lucide-react'
import { statusColors, categoryIcons } from '@/features/catalog/constants/architectureConstants'
import type { Technology, Microservice } from '@/types/domain'

export function MicroserviceCard({
  ms,
  technologies,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  ms: Microservice
  technologies: Technology[]
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  const msEol = technologies.filter((t) => t.supportStatus === 'eol')

  return (
    <div
      className={`
        relative rounded-xl border-2 bg-card shadow-sm
        transition-all duration-200 cursor-default
        ${
          isHovered
            ? 'border-blue-400 shadow-lg shadow-blue-500/10 scale-[1.02]'
            : 'border-neutral-20 dark:border-neutral-60 hover:border-blue-300 dark:hover:border-blue-600'
        }
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-20 dark:border-neutral-60 bg-gradient-to-r from-blue-500/5 to-transparent">
        <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Box size={14} />
        </div>
        <span className="text-sm font-semibold text-neutral-90 dark:text-white truncate">
          {ms.name}
        </span>
        {msEol.length > 0 && (
          <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">
            <AlertTriangle size={12} className="inline mr-0.5" />
            {msEol.length}
          </span>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        {technologies.length > 0 ? (
          technologies.map((tech) => (
            <div
              key={tech.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neutral-10 dark:bg-neutral-70/50 group"
            >
              <span className="text-neutral-50 shrink-0">
                {categoryIcons[tech.category] || <Box size={12} />}
              </span>
              <span className="text-xs text-secondary truncate flex-1">{tech.name}</span>
              <span className="text-[10px] text-neutral-50 shrink-0">{tech.version}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                  tech.supportStatus === 'eol'
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : tech.supportStatus === 'extended'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}
              >
                {tech.supportStatus === 'active' ? '✓' : tech.supportStatus === 'eol' ? '!' : '~'}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-neutral-50 italic">Sin tecnologías</p>
        )}
      </div>
    </div>
  )
}
