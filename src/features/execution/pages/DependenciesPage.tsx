import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button';
import { Search, Trash2 } from 'lucide-react'
import type { Dependency } from '@/types/domain'

const relationLabel: Record<string, string> = { blocks: 'Bloquea', depends_on: 'Depende de', related_to: 'Relacionado con' }
const statusLabel: Record<string, string> = { active: 'Activa', resolved: 'Resuelta', at_risk: 'En Riesgo' }
const statusColor: Record<string, string> = { active: 'bg-info/10 text-info', resolved: 'bg-success/10 text-success', at_risk: 'bg-warning/10 text-warning' }

export function DependenciesPage() {
  const { confirm } = useConfirm()
  const { addNotification } = useAppStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const rawDependencies = useLiveQuery(() => db.dependencies.toArray())
  const dependencies = useMemo(() => rawDependencies ?? [], [rawDependencies])
  const rawPlans = useLiveQuery(() => db.plans.toArray())
  const plans = useMemo(() => rawPlans ?? [], [rawPlans])
  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans])

  const getEntityTitle = (type: string, id: string): string => {
    if (type === 'plan') return planMap.get(id)?.title ?? id
    return id.slice(0, 8) + '...'
  }

  const filtered = dependencies.filter((d) => {
    if (typeFilter !== 'all' && d.sourceType !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!d.description.toLowerCase().includes(q)) return false
    }
    return true
  })

  const handleDelete = async (d: Dependency) => {
    if (!(await confirm('¿Eliminar esta dependencia?'))) return
    await db.dependencies.delete(d.id)
    addNotification({ type: 'success', message: 'Dependencia eliminada' })
  }

  const columns: Column<Dependency>[] = [
    { key: 'sourceType', label: 'Origen', sortable: true, render: (d) => (
      <span className="text-sm font-medium text-neutral-90 dark:text-white">{getEntityTitle(d.sourceType, d.sourceId)}</span>
    )},
    { key: 'relationType', label: 'Relación', sortable: true, render: (d) => {
      const colors: Record<string, string> = { blocks: 'bg-danger/10 text-danger', depends_on: 'bg-warning/10 text-warning', related_to: 'bg-info/10 text-info' }
      return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[d.relationType]}`}>{relationLabel[d.relationType]}</span>
    }},
    { key: 'targetType', label: 'Destino', sortable: true, render: (d) => (
      <span className="text-sm text-secondary">{getEntityTitle(d.targetType, d.targetId)}</span>
    )},
    { key: 'description', label: 'Descripción', sortable: true, className: 'max-w-xs', render: (d) => (
      <div className="min-w-0">
        <span className="text-sm text-secondary truncate block">{d.description || '—'}</span>
      </div>
    )},
    { key: 'status', label: 'Estado', sortable: true, render: (d) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[d.status]}`}>{statusLabel[d.status]}</span>
    )},
    { key: 'expectedResolutionDate', label: 'Resolución', sortable: true, render: (d) => (
      <span className="text-sm text-secondary">{d.expectedResolutionDate ? new Date(d.expectedResolutionDate).toLocaleDateString('es-ES') : '—'}</span>
    )},
    { key: 'actions', label: '', render: (d) => (
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
        <Button onClick={() => handleDelete(d)} variant="ghost" size="sm" className="p-1.5 text-neutral-50 hover:text-danger" title="Eliminar"><Trash2 size={14} /></Button>
      </div>
    ), className: 'text-right w-20' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Dependencias</h2>
          <p className="text-sm text-muted mt-1">Gestión de dependencias entre tareas, actividades, planes y compromisos</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input type="text" placeholder="Buscar dependencias..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="min-w-[170px]">
            <Select value={typeFilter} onChange={setTypeFilter} options={[
              { value: 'all', label: 'Todos los tipos' },
              { value: 'task', label: 'Tarea' },
              { value: 'activity', label: 'Actividad' },
              { value: 'plan', label: 'Plan' },
              { value: 'commitment', label: 'Compromiso' },
            ]} />
          </div>
        </div>
      </div>

      <SortableTable
        columns={columns}
        data={filtered}
        onRowClick={() => {}}
        emptyMessage="No se encontraron dependencias"
      />
    </div>
  )
}
