import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active)
    return <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-60 transition-opacity" />
  return dir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
}

interface Props {
  label: string
  sortKey: string
  currentKey: string
  dir: 'asc' | 'desc'
  onToggle: (k: string) => void
  align?: 'left' | 'right'
}

export function SortTh({ label, sortKey, currentKey, dir, onToggle, align }: Props) {
  const active = currentKey === sortKey
  return (
    <th
      onClick={() => onToggle(sortKey)}
      className={`group px-4 py-3 font-medium text-neutral-50 hover:text-neutral-90 dark:hover:text-white cursor-pointer select-none transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className={`${active ? 'text-primary' : ''}`}>
          <SortIcon active={active} dir={dir} />
        </span>
      </div>
    </th>
  )
}
