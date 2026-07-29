import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import { Plus, Search, Pencil, Trash2, ListTodo, Clock, Play, CheckCircle2 } from 'lucide-react'
import type { Task, Criticality } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { HtmlDescription } from '@/components/ui/HtmlDescription'

const priorityLabel: Record<Criticality, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}
const priorityColor: Record<Criticality, string> = {
  critical: 'bg-danger/10 text-danger',
  high: 'bg-warning/10 text-warning',
  medium: 'bg-info/10 text-info',
  low: 'bg-success/10 text-success',
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
      status: status as any,
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
          {t.description && <HtmlDescription html={t.description} lines={1} className="max-w-xs" />}
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
        <Select
          value={t.status}
          onChange={(v) => handleQuickStatus(t.id, v)}
          options={[
            { value: 'todo', label: 'Por Hacer' },
            { value: 'in_progress', label: 'En Progreso' },
            { value: 'review', label: 'Revisión' },
            { value: 'done', label: 'Completada' },
          ]}
        />
      ),
    },
    {
      key: 'planId',
      label: 'Plan',
      sortable: true,
      render: (t) => (
        <span className="text-sm text-secondary">
          {(t.planId && planMap.get(t.planId)?.title) || '-'}
        </span>
      ),
    },
    {
      key: 'estimatedHours',
      label: 'Horas',
      sortable: true,
      render: (t) => <span className="text-sm text-secondary">{t.estimatedHours ?? '-'}</span>,
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
          <span
            className={`text-sm ${diff < 0 ? 'text-danger font-medium' : diff <= 3 ? 'text-warning' : 'text-secondary'}`}
          >
            {d.toLocaleDateString('es-ES')}
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      render: (t) => (
        <div
          className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            onClick={() => navigate(`/execution/tasks/${t.id}/edit`)}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </Button>
          <Button
            onClick={() => handleDelete(t)}
            className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </Button>
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
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Tareas</h2>
          <p className="text-sm text-muted mt-1">Gestión de tareas operativas</p>
        </div>
        <Button
          onClick={() => navigate('/execution/tasks/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nueva Tarea
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<ListTodo size={18} />}
          label="Total"
          value={stats.total}
          color="text-primary"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Por Hacer"
          value={stats.todo}
          color="text-neutral-60"
        />
        <StatCard
          icon={<Play size={18} />}
          label="En Progreso"
          value={stats.inProgress}
          color="text-info"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Completadas"
          value={stats.done}
          color="text-success"
        />
      </div>

      <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50"
            />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="min-w-[150px]">
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'todo', label: 'Por Hacer' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'review', label: 'Revisión' },
                { value: 'done', label: 'Completada' },
              ]}
            />
          </div>
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

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  const iconClasses: Record<string, string> = {
    'text-primary': 'bg-primary/10 text-primary',
    'text-neutral-60': 'bg-neutral-60/10 text-neutral-60',
    'text-info': 'bg-info/10 text-info',
    'text-success': 'bg-success/10 text-success',
  }
  return (
    <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm flex items-center justify-center gap-3">
      <div className={`p-2 rounded-lg ${iconClasses[color] || 'bg-primary/10 text-primary'}`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}
