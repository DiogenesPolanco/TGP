import { useState } from 'react'
import { Plus, Check, Trash2, Calendar } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import type { MicroserviceRoadmapItem } from '@/types/domain'

const roadmapStatusColor: Record<string, string> = {
  planned: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
}

const roadmapPriorityColor: Record<string, string> = {
  critical: 'text-danger',
  high: 'text-warning',
  medium: 'text-info',
  low: 'text-neutral-50',
}

export function RoadmapSection({
  roadmap,
  onChange,
}: {
  roadmap: MicroserviceRoadmapItem[]
  onChange: (roadmap: MicroserviceRoadmapItem[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'upgrade' as MicroserviceRoadmapItem['type'],
    priority: 'medium' as MicroserviceRoadmapItem['priority'],
    targetDate: '',
  })

  const add = () => {
    if (!form.title.trim()) return
    onChange([
      ...roadmap,
      {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        priority: form.priority,
        targetDate: form.targetDate || null,
        status: 'planned',
      },
    ])
    setForm({ title: '', description: '', type: 'upgrade', priority: 'medium', targetDate: '' })
    setOpen(false)
  }

  const remove = (id: string) => onChange(roadmap.filter((r) => r.id !== id))

  const toggleStatus = (id: string) => {
    onChange(
      roadmap.map((r) => {
        if (r.id !== id) return r
        const cycle: MicroserviceRoadmapItem['status'][] = [
          'planned',
          'in_progress',
          'completed',
          'cancelled',
        ]
        const idx = cycle.indexOf(r.status)
        return { ...r, status: cycle[(idx + 1) % cycle.length] }
      }),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-90 dark:text-white">Hoja de Ruta</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Plus size={14} />
          Añadir Item
        </button>
      </div>

      {open && (
        <div className="border border-boundary rounded-xl p-4 space-y-3 bg-card shadow-sm">
          <div>
            <label className="block text-xs font-medium text-neutral-50 mb-1">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ej. Migrar a PostgreSQL 16"
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-50 mb-1">Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalle del plan"
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-50 mb-1">Tipo</label>
              <Select
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v as MicroserviceRoadmapItem['type'] })}
                options={[
                  { value: 'upgrade', label: 'Upgrade' },
                  { value: 'migration', label: 'Migración' },
                  { value: 'decommission', label: 'Decomiso' },
                  { value: 'feature', label: 'Funcionalidad' },
                  { value: 'security', label: 'Seguridad' },
                  { value: 'performance', label: 'Rendimiento' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-50 mb-1">Prioridad</label>
              <Select
                value={form.priority}
                onChange={(v) =>
                  setForm({ ...form, priority: v as MicroserviceRoadmapItem['priority'] })
                }
                options={[
                  { value: 'critical', label: 'Crítica' },
                  { value: 'high', label: 'Alta' },
                  { value: 'medium', label: 'Media' },
                  { value: 'low', label: 'Baja' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-50 mb-1">Fecha Objetivo</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={add}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              Agregar
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm text-neutral-50 hover:text-neutral-70 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {roadmap.length === 0 && !open && (
        <p className="text-sm text-neutral-50">
          Sin items de roadmap. Planifica actualizaciones, migraciones o decomisos.
        </p>
      )}

      <div className="space-y-2">
        {roadmap.map((item) => {
          const isOverdue =
            item.targetDate &&
            new Date(item.targetDate) < new Date() &&
            item.status !== 'completed' &&
            item.status !== 'cancelled'
          return (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-boundary bg-card shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-neutral-90 dark:text-white">
                    {item.title}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${roadmapStatusColor[item.status]}`}
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
                    {item.status === 'planned'
                      ? 'Planificado'
                      : item.status === 'in_progress'
                        ? 'En Progreso'
                        : item.status === 'completed'
                          ? 'Completado'
                          : 'Cancelado'}
                  </span>
                  <span
                    className={`text-xs font-medium ${roadmapPriorityColor[item.priority]} flex items-center gap-1`}
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        item.priority === 'critical'
                          ? 'bg-danger'
                          : item.priority === 'high'
                            ? 'bg-warning'
                            : item.priority === 'medium'
                              ? 'bg-info'
                              : 'bg-neutral-40'
                      }`}
                    />
                    {item.priority}
                  </span>
                  <span className="text-xs text-neutral-50 capitalize bg-neutral-10 dark:bg-neutral-70 px-1.5 py-0.5 rounded">
                    {item.type}
                  </span>
                  {isOverdue && (
                    <span className="text-xs text-danger font-medium">Vencido</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-muted mt-0.5">{item.description}</p>
                )}
                {item.targetDate && (
                  <p className="text-xs text-neutral-50 mt-0.5">
                    <Calendar size={12} className="inline mr-0.5" />
                    {new Date(item.targetDate).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => toggleStatus(item.id)}
                  className="p-1 rounded text-neutral-50 hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Cambiar estado"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="p-1 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Eliminar item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
