import type React from 'react'

export function QuickLinkCard({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: React.FC<{ size?: number }>
  label: string
  value: number | string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-boundary bg-neutral-10 dark:bg-neutral-70/50 hover:border-accent/30 hover:bg-accent/5 transition-all group text-center"
    >
      <div className="p-2 rounded-lg bg-white dark:bg-neutral-70 text-muted group-hover:text-accent transition-colors shadow-sm">
        <Icon size={20} />
      </div>
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xl font-bold text-neutral-90 dark:text-white leading-none">
        {value}
      </span>
    </button>
  )
}
