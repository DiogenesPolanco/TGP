import type { ReactNode } from 'react'
import { CheckCircle, User, Wrench, XCircle, AlertTriangle } from 'lucide-react'

export const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excelente' },
  { value: 'good', label: 'Bueno' },
  { value: 'fair', label: 'Regular' },
  { value: 'poor', label: 'Malo' },
]

export const statusBg: Record<string, string> = {
  available: 'bg-success/5 border-success/20',
  assigned: 'bg-primary/5 border-primary/20',
  maintenance: 'bg-warning/5 border-warning/20',
  retired: 'bg-neutral-10 dark:bg-neutral-70 border-neutral-20',
  obsolete: 'bg-danger/5 border-danger/20',
}

export const statusIconBg: Record<string, string> = {
  available: 'bg-success',
  assigned: 'bg-primary',
  maintenance: 'bg-warning',
  retired: 'bg-neutral-40',
  obsolete: 'bg-danger',
}

export const statusIcon: Record<string, ReactNode> = {
  available: <CheckCircle size={24} className="text-white" />,
  assigned: <User size={24} className="text-white" />,
  maintenance: <Wrench size={24} className="text-white" />,
  retired: <XCircle size={24} className="text-white" />,
  obsolete: <AlertTriangle size={24} className="text-white" />,
}

export function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-card rounded-2xl border border-boundary p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
        {icon && <span className="text-neutral-50">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  )
}

export function MiniField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[10px] font-medium text-neutral-40 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-neutral-90 dark:text-white">
        {typeof value === 'string' ? value || '—' : value}
      </dd>
    </div>
  )
}

export function TicketTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    repair: { label: 'Reparación', color: 'bg-warning/10 text-warning' },
    replacement: { label: 'Reemplazo', color: 'bg-danger/10 text-danger' },
    new: { label: 'Nuevo', color: 'bg-success/10 text-success' },
  }
  const c = cfg[type] ?? { label: type, color: 'bg-neutral-10 text-neutral-60' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.color}`}>{c.label}</span>
  )
}

export function TicketStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    open: { label: 'Abierto', color: 'bg-danger/10 text-danger' },
    in_progress: { label: 'En Progreso', color: 'bg-warning/10 text-warning' },
    resolved: { label: 'Resuelto', color: 'bg-success/10 text-success' },
    closed: { label: 'Cerrado', color: 'bg-neutral-30 text-neutral-60' },
  }
  const c = cfg[status] ?? { label: status, color: 'bg-neutral-10 text-neutral-60' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.color}`}>{c.label}</span>
  )
}
