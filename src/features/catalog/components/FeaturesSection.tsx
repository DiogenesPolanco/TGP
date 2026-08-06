import { useState } from 'react'
import { Plus, Check, Trash2 } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import type { MicroserviceFeature } from '@/types/domain'

const featureStatusColor: Record<string, string> = {
  planned: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60',
  in_progress: 'bg-info/10 text-info',
  active: 'bg-success/10 text-success',
  deprecated: 'bg-warning/10 text-warning',
}

export function FeaturesSection({
  features,
  onChange,
}: {
  features: MicroserviceFeature[]
  onChange: (features: MicroserviceFeature[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'other' as MicroserviceFeature['category'],
  })

  const add = () => {
    if (!form.name.trim()) return
    onChange([
      ...features,
      {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        description: form.description.trim(),
        status: 'planned',
        category: form.category,
      },
    ])
    setForm({ name: '', description: '', category: 'other' })
    setOpen(false)
  }

  const remove = (id: string) => onChange(features.filter((f) => f.id !== id))

  const toggleStatus = (id: string) => {
    onChange(
      features.map((f) => {
        if (f.id !== id) return f
        const cycle: MicroserviceFeature['status'][] = [
          'planned',
          'in_progress',
          'active',
          'deprecated',
        ]
        const idx = cycle.indexOf(f.status)
        return { ...f, status: cycle[(idx + 1) % cycle.length] }
      }),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-90 dark:text-white">Funcionalidades</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Plus size={14} />
          Añadir funcionalidad
        </button>
      </div>

      {open && (
        <div className="border border-boundary rounded-xl p-4 space-y-3 bg-card shadow-sm">
          <div>
            <label className="block text-xs font-medium text-neutral-50 mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ej. Autenticación OAuth2"
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-50 mb-1">Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Breve descripción"
              className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v as MicroserviceFeature['category'] })}
              options={[
                { value: 'api', label: 'API' },
                { value: 'integration', label: 'Integración' },
                { value: 'performance', label: 'Performance' },
                { value: 'security', label: 'Seguridad' },
                { value: 'observability', label: 'Observabilidad' },
                { value: 'business', label: 'Funcionalidad' },
                { value: 'other', label: 'Otro' },
              ]}
              className="flex-1"
            />
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

      {features.length === 0 && !open && (
        <p className="text-sm text-neutral-50">
          Sin funcionalidades registradas. Añade la primera para describir las capacidades de este
          microservicio.
        </p>
      )}

      <div className="space-y-2">
        {features.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-boundary bg-card shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-90 dark:text-white">
                  {f.name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${featureStatusColor[f.status]}`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
                  {f.status === 'planned'
                    ? 'Planificado'
                    : f.status === 'in_progress'
                      ? 'En Progreso'
                      : f.status === 'active'
                        ? 'Activo'
                        : 'Deprecado'}
                </span>
                <span className="text-xs text-neutral-50 capitalize">{f.category}</span>
              </div>
              {f.description && <p className="text-xs text-muted mt-0.5">{f.description}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => toggleStatus(f.id)}
                className="p-1 rounded text-neutral-50 hover:text-primary hover:bg-primary/10 transition-colors"
                title="Cambiar estado"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => remove(f.id)}
                className="p-1 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
                title="Eliminar funcionalidad"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
