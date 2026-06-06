import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import type { Task, Criticality } from '@/types/domain'

const priorityLabel: Record<Criticality, string> = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' }
const priorityColor: Record<Criticality, string> = {
  critical: 'bg-danger/10 text-danger',
  high: 'bg-warning/10 text-warning',
  medium: 'bg-info/10 text-info',
  low: 'bg-success/10 text-success',
}
const statusColor: Record<string, string> = {
  todo: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60',
  in_progress: 'bg-info/10 text-info',
  review: 'bg-warning/10 text-warning',
  done: 'bg-success/10 text-success',
}

export function TasksPage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const { addNotification } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const allTasks = useLiveQuery(() => db.tasks.toArray()) ?? []
  const plans = useLiveQuery(() => db.plans.toArray()) ?? []

  const planMap = new Map(plans.map((p) => [p.id, p]))

  const filtered = allTasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleDelete = async (task: Task) => {
    if (!(await confirm(`Eliminar tarea "${task.title}"?`))) return
    await db.tasks.delete(task.id)
    addNotification({ type: 'success', message: 'Tarea eliminada' })
  }

  const handleQuickStatus = async (id: string, status: string) => {
    await db.tasks.update(id, {
      status,
      completedAt: status === 'done' ? new Date() : undefined,
      updatedAt: new Date(),
    })
  }

  const columns: Column<Task>[] = [
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (t) => (
        <div>
          <p className="text-sm font-medium text-neutral-90 dark:text-white">{t.title}</p>
          {t.description && <p className="text-xs text-neutral-50 truncate max-w-xs">{t.description}</p>}
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Prioridad',
      sortable: true,
      render: (t) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[t.priority]}`}>
          {priorityLabel[t.priority]}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (t) => (
        <select
          value={t.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleQuickStatus(t.id, e.target.value)}
          className={`text-xs px-2 py-1 rounded-full border font-medium cursor-pointer ${statusColor[t.status]}`}
        >
          <option value="todo">Por Hacer</option>
          <option value="in_progress">En Progreso</option>
          <option value="review">Revisión</option>
          <option value="done">Completada</option>
        </select>
      ),
    },
    {
      key: 'planId',
      label: 'Plan',
      sortable: true,
      render: (t) => (
        <span className="text-sm text-neutral-70 dark:text-neutral-30">
          {(t.planId && planMap.get(t.planId)?.title) || '-'}
        </span>
      ),
    },
    {
      key: 'estimatedHours',
      label: 'Horas',
      sortable: true,
      render: (t) => (
        <span className="text-sm text-neutral-70 dark:text-neutral-30">{t.estimatedHours ?? '-'}</span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Vence',
      sortable: true,
      render: (t) => {
        if (!t.dueDate) return <span className="text-sm text-neutral-50">—</span>
        const d = new Date(t.dueDate)
        const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return (
          <span className={`text-sm ${diff < 0 ? 'text-danger font-medium' : diff <= 3 ? 'text-warning' : 'text-neutral-70 dark:text-neutral-30'}`}>
            {d.toLocaleDateString('es-ES')}
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      render: (t) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/execution/tasks/${t.id}/edit`)}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => handleDelete(t)}
            className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
      className: 'text-right w-20',
    },
  ]

  const stats = {
    total: allTasks.length,
    todo: allTasks.filter((t) => t.status === 'todo').length,
    inProgress: allTasks.filter((t) => t.status === 'in_progress').length,
    done: allTasks.filter((t) => t.status === 'done').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Tareas</h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">Gestión de tareas operativas</p>
        </div>
        <button
          onClick={() => navigate('/execution/tasks/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nueva Tarea
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="text-primary" />
        <StatCard label="Por Hacer" value={stats.todo} color="text-neutral-60" />
        <StatCard label="En Progreso" value={stats.inProgress} color="text-info" />
        <StatCard label="Completadas" value={stats.done} color="text-success" />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Todos</option>
            <option value="todo">Por Hacer</option>
            <option value="in_progress">En Progreso</option>
            <option value="review">Revisión</option>
            <option value="done">Completada</option>
          </select>
        </div>
      </div>

      <SortableTable
        columns={columns}
        data={filtered}
        onRowClick={(t) => navigate(`/execution/tasks/${t.id}`)}
        emptyMessage="No hay tareas que coincidan con los filtros"
      />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </div>
  )
}


