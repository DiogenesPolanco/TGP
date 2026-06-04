import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { cn } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import {
  Filter,
  X,
  ArrowRight,
  Search,
} from 'lucide-react'
import type { DeliverableStatus } from '@/types/domain'

const statusColors: Record<DeliverableStatus, string> = {
  pending: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40',
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

  const { page, setPage, totalPages, paginatedItems: paginatedDeliverables } = usePagination(filtered, 5)

  const handleDelete = async (id: string) => {
    await db.deliverables.delete(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">
          Entregables Generales
        </h2>
        <span className="text-sm text-neutral-50 px-3 py-1 rounded-full bg-neutral-10 dark:bg-neutral-70">
          {filtered.length} de {allDeliverables.length}
        </span>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
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
          <button
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
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-3 mt-3 pt-3 border-t border-neutral-20 dark:border-neutral-70">
            <div className="flex-1">
              <label className="block text-xs text-neutral-50 mb-1">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DeliverableStatus | 'all')}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-neutral-50 mb-1">Aplicación</label>
              <select
                value={appFilter}
                onChange={(e) => setAppFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todas</option>
                {allApplications.map((app) => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map((st) => {
          const count = allDeliverables.filter((d) => d.status === st).length
          return (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setShowFilters(true) }}
              className={cn(
                'p-4 rounded-xl border text-left shadow-sm transition-all',
                statusFilter === st
                  ? 'border-primary bg-primary/5'
                  : 'bg-white dark:bg-neutral-80 border-neutral-20 dark:border-neutral-70 hover:shadow',
              )}
            >
              <p className={cn('text-2xl font-bold', statusColors[st])}>{count}</p>
              <p className="text-xs text-neutral-60 dark:text-neutral-40 mt-1">{statusLabel[st]}</p>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-neutral-50">
            <p className="text-sm">No hay entregables que coincidan con los filtros</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-70">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Título</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Aplicación</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Fecha Límite</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">OKR</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
                {paginatedDeliverables.map((del) => {
                  const app = del.applicationId ? appMap.get(del.applicationId) : null
                  const obj = del.objectiveId ? allObjectives.find((o) => o.id === del.objectiveId) : null
                  return (
                    <tr key={del.id} className="group hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-neutral-90 dark:text-white">{del.title}</p>
                        {del.description && (
                          <p className="text-xs text-neutral-50 mt-0.5 max-w-xs truncate">{del.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {app ? (
                          <button
                            onClick={() => navigate(`/catalog/applications/${app.id}`)}
                            className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors"
                          >
                            {app.name}
                            <ArrowRight size={12} />
                          </button>
                        ) : (
                          <span className="text-sm text-neutral-50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColors[del.status])}>
                          {statusLabel[del.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-70 dark:text-neutral-30">
                        {del.dueDate
                          ? del.dueDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-70 dark:text-neutral-30 max-w-[180px] truncate">
                        {obj?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(del.id)}
                          className="p-1.5 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={5}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
