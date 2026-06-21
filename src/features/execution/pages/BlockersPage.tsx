import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button';
import { Plus, Search, Pencil, Trash2, Ban } from 'lucide-react'
import type { Blocker } from '@/types/domain'

const severityLabel: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' }
const severityColor: Record<string, string> = { critical: 'bg-danger/10 text-danger', high: 'bg-warning/10 text-warning', medium: 'bg-info/10 text-info', low: 'bg-success/10 text-success' }
const statusLabel: Record<string, string> = { open: 'Abierto', escalated: 'Escalado', resolved: 'Resuelto' }
const statusColor: Record<string, string> = { open: 'bg-danger/10 text-danger', escalated: 'bg-warning/10 text-warning', resolved: 'bg-success/10 text-success' }

export function BlockersPage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const { addNotification } = useAppStore()
  const [search, setSearch] = useState('')
  const [sevFilter, setSevFilter] = useState<string>('all')

  const blockers = useLiveQuery(() => db.blockers.toArray()) ?? []

  const filtered = blockers.filter((b) => {
    if (sevFilter !== 'all' && b.severity !== sevFilter) return false
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleDelete = async (b: Blocker) => {
    if (!(await confirm(`Eliminar bloqueo "${b.title}"?`))) return
    await db.blockers.delete(b.id)
    addNotification({ type: 'success', message: 'Bloqueo eliminado' })
  }

  const columns: Column<Blocker>[] = [
    { key: 'title', label: 'Título', sortable: true, render: (b) => (
      <div>
        <p className="text-sm font-medium text-neutral-90 dark:text-white">{b.title}</p>
        <p className="text-xs text-neutral-50 truncate max-w-xs">{b.description}</p>
      </div>
    )},
    { key: 'severity', label: 'Severidad', sortable: true, render: (b) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${severityColor[b.severity]}`}>{severityLabel[b.severity]}</span>
    )},
    { key: 'status', label: 'Estado', sortable: true, render: (b) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[b.status]}`}>{statusLabel[b.status]}</span>
    )},
    { key: 'sourceType', label: 'Origen', sortable: true, render: (b) => {
      const labels: Record<string, string> = { task: 'Tarea', activity: 'Actividad', plan: 'Plan', commitment: 'Compromiso' }
      return <span className="text-sm text-secondary">{labels[b.sourceType] ?? b.sourceType}</span>
    }},
    { key: 'assigneeId', label: 'Asignado', sortable: true, render: (b) => (
      <span className="text-sm text-secondary">{b.assigneeId ?? '—'}</span>
    )},
    { key: 'actions', label: '', render: (b) => (
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
        <Button onClick={() => navigate(`/execution/blockers/${b.id}/edit`)} variant="ghost" size="sm" className="p-1.5" title="Editar"><Pencil size={14} /></Button>
        <Button onClick={() => handleDelete(b)} variant="ghost" size="sm" className="p-1.5 text-neutral-50 hover:text-danger" title="Eliminar"><Trash2 size={14} /></Button>
      </div>
    ), className: 'text-right w-20' },
  ]

  const stats = {
    total: blockers.length,
    open: blockers.filter((b) => b.status === 'open').length,
    escalated: blockers.filter((b) => b.status === 'escalated').length,
    critical: blockers.filter((b) => b.severity === 'critical' && b.status !== 'resolved').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Bloqueos</h2>
          <p className="text-sm text-muted mt-1">Gestión de bloqueos y escalamientos</p>
        </div>
        <Button onClick={() => navigate('/execution/blockers/new')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          <Plus size={18} /> Nuevo Bloqueo
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Ban size={18} />} label="Total" value={stats.total} color="text-primary" />
        <StatCard icon={<Ban size={18} />} label="Abiertos" value={stats.open} color="text-danger" />
        <StatCard icon={<Ban size={18} />} label="Escalados" value={stats.escalated} color="text-warning" />
        <StatCard icon={<Ban size={18} />} label="Críticos" value={stats.critical} color="text-danger" />
      </div>

      <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input type="text" placeholder="Buscar bloqueos..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="min-w-[180px]">
            <Select value={sevFilter} onChange={setSevFilter} options={[
              { value: 'all', label: 'Todas las severidades' },
              { value: 'critical', label: 'Crítica' },
              { value: 'high', label: 'Alta' },
              { value: 'medium', label: 'Media' },
              { value: 'low', label: 'Baja' },
            ]} />
          </div>
        </div>
      </div>

      <SortableTable
        columns={columns}
        data={filtered}
        onRowClick={(b) => navigate(`/execution/blockers/${b.id}/edit`)}
        emptyMessage="No se encontraron bloqueos"
      />
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const iconClasses: Record<string, string> = {
    'text-primary': 'bg-primary/10 text-primary',
    'text-danger': 'bg-danger/10 text-danger',
    'text-warning': 'bg-warning/10 text-warning',
  }
  return (
    <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm flex items-center justify-center gap-3">
      <div className={`p-2 rounded-lg ${iconClasses[color] || 'bg-primary/10 text-primary'}`}>{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}
