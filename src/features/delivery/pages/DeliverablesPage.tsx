import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import {
  Filter,
  ArrowRight,
  Search,
  Upload,
  Trash2,
} from 'lucide-react'
import type { DeliverableStatus, Deliverable } from '@/types/domain'
import { Button } from '@/components/ui/Button'

const statusColors: Record<DeliverableStatus, string> = {
  pending: 'bg-neutral-10 dark:bg-neutral-70 text-muted',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
}

const statusLabel: Record<DeliverableStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export function DeliverablesPage() {
  const { confirm } = useConfirm()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<DeliverableStatus | 'all'>('all')
  const [appFilter, setAppFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const allDeliverables = useLiveQuery(() => db.deliverables.toArray()) ?? []
  const allApplications = useLiveQuery(() => db.applications.toArray()) ?? []
  const allObjectives = useLiveQuery(() => db.objectives.toArray()) ?? []

  const appMap = new Map(allApplications.map((a) => [a.id, a]))

  const filtered = allDeliverables.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (appFilter && d.applicationId !== appFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const app = d.applicationId ? appMap.get(d.applicationId) : null
      if (
        !d.title.toLowerCase().includes(q) &&
        !d.description.toLowerCase().includes(q) &&
        !(app?.name.toLowerCase().includes(q))
      ) return false
    }
    return true
  })

  const handleDelete = async (id: string) => {
    if (!(await confirm('¿Eliminar este entregable?'))) return
    await db.deliverables.delete(id)
  }

  const columns: Column<Deliverable>[] = [
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (del) => (
        <>
          <p className="text-sm font-medium text-neutral-90 dark:text-white">{del.title}</p>
          {del.description && (
            <p className="text-xs text-neutral-50 mt-0.5 max-w-xs truncate">{del.description}</p>
          )}
        </>
      ),
    },
    {
      key: 'applicationId',
      label: 'Aplicación',
      render: (del) => {
        const app = del.applicationId ? appMap.get(del.applicationId) : null
        return app ? (
          <span className="flex items-center gap-1 text-sm text-primary">
            {app.name}
          </span>
        ) : (
          <span className="text-sm text-neutral-50">—</span>
        )
      },
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (del) => (
        <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColors[del.status])}>
          {statusLabel[del.status]}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Fecha Límite',
      sortable: true,
      render: (del) => (
        <span className="text-sm text-secondary">
          {del.dueDate
            ? new Date(del.dueDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
            : '—'}
        </span>
      ),
    },
    {
      key: 'objectiveId',
      label: 'OKR',
      render: (del) => {
        const obj = del.objectiveId ? allObjectives.find((o) => o.id === del.objectiveId) : null
        return (
          <span className="text-sm text-secondary max-w-[180px] truncate block">
            {obj?.title ?? '—'}
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: 'Acción',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (del) => (
        <div className="flex items-center justify-end gap-1">
          {del.applicationId && (
            <Button
              onClick={(e) => { e.stopPropagation(); navigate(`/catalog/applications/${del.applicationId}`) }}
              className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
              title="Ver aplicación"
            >
              <ArrowRight size={14} />
            </Button>
          )}
          <Button
            onClick={() => handleDelete(del.id)}
            className="p-1.5 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">
            Entregables Generales
          </h2>
          <span className="text-sm text-neutral-50 px-3 py-1 rounded-full bg-neutral-10 dark:bg-neutral-70">
            {filtered.length} de {allDeliverables.length}
          </span>
        </div>
        <Button
          onClick={() => navigate('/admin/import')}
          className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <Upload size={16} />
          Importar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map((st) => {
          const count = allDeliverables.filter((d) => d.status === st).length
          return (
            <Button
              key={st}
              onClick={() => { setStatusFilter(st); setShowFilters(true) }}
              className={cn(
                'p-4 rounded-xl border text-left shadow-sm transition-all',
                statusFilter === st
                  ? 'border-primary bg-primary/5'
                  : 'bg-card border-boundary hover:shadow',
              )}
            >
              <p className={cn('text-2xl font-bold', statusColors[st])}>{count}</p>
              <p className="text-xs text-muted mt-1">{statusLabel[st]}</p>
            </Button>
          )
        })}
      </div>

      {/* Filters bar */}
      <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar por título, descripción o aplicación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors',
              showFilters
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-neutral-60 hover:bg-neutral-10 dark:hover:bg-neutral-70',
            )}
          >
            <Filter size={16} />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="flex gap-3 mt-3 pt-3 border-t border-boundary">
            <div className="flex-1">
              <label className="block text-xs text-neutral-50 mb-1">Estado</label>
              <Select value={statusFilter} onChange={(v) => setStatusFilter(v as DeliverableStatus | 'all')} options={[
                { value: 'all', label: 'Todos' },
                { value: 'pending', label: 'Pendiente' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'completed', label: 'Completado' },
                { value: 'cancelled', label: 'Cancelado' },
              ]} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-neutral-50 mb-1">Aplicación</label>
              <Select value={appFilter} onChange={(v) => setAppFilter(v)} options={[
                { value: '', label: 'Todas' },
                ...allApplications.map((app) => ({ value: app.id, label: app.name })),
              ]} />
            </div>
          </div>
        )}
      </div>

      <SortableTable
        columns={columns}
        data={filtered}
        emptyMessage="No hay entregables que coincidan con los filtros"
      />
    </div>
  )
}
