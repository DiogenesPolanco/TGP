import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  cloud: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  licenses: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  support: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  infrastructure: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  personnel: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  security: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  data: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  networking: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  development: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  training: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
  consulting: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  hardware: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
  other: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  distribution: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
}

export function CostCategoryBadge({ categoryId, label }: { categoryId: string; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        CATEGORY_COLORS[categoryId] ?? CATEGORY_COLORS.other,
      )}
    >
      {label}
    </span>
  )
}
