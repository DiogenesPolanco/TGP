import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { Risk } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

interface RiskFormProps {
  risk: Risk | null
  onClose: () => void
  onSave: () => void
}

export function RiskForm({ risk, onClose, onSave }: RiskFormProps) {
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const [formData, setFormData] = useState({
    title: risk?.title ?? '',
    description: risk?.description ?? '',
    applicationId: risk?.applicationId ?? '',
    businessUnitId: risk?.businessUnitId ?? '',
    category: risk?.category ?? 'technical',
    probability: risk?.probability ?? 3,
    impact: risk?.impact ?? 3,
    mitigationPlan: risk?.mitigationPlan ?? '',
    status: risk?.status ?? 'open',
    targetDate: risk?.targetDate ? new Date(risk.targetDate).toISOString().split('T')[0] : '',
  })

  const riskScore = formData.probability * formData.impact

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      applicationId: formData.applicationId || null,
      riskScore,
      targetDate: formData.targetDate ? parseLocalDate(formData.targetDate) : null,
      metadata: risk?.metadata ?? {},
      createdAt: risk?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }

    if (risk) {
      await db.risks.update(risk.id, data)
    } else {
      await db.risks.add({ ...data, id: crypto.randomUUID() })
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl border border-boundary shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-boundary">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {risk ? 'Editar Riesgo' : 'Nuevo Riesgo'}
          </h3>
          <Button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Título *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Descripción</label>
            <RichTextEditor
              value={formData.description}
              onChange={(html) => setFormData({ ...formData, description: html })}
              placeholder="Describe el riesgo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="Aplicación"
                value={formData.applicationId}
                onChange={(v) => setFormData({ ...formData, applicationId: v })}
                options={[
                  { value: '', label: 'Sin aplicación' },
                  ...applications.map((app) => ({ value: app.id, label: app.name })),
                ]}
              />
            </div>
            <div>
              <Select
                label="Business Unit *"
                required
                value={formData.businessUnitId}
                onChange={(v) => setFormData({ ...formData, businessUnitId: v })}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
                ]}
              />
            </div>
          </div>

          <div>
            <Select
              label="Categoría"
              value={formData.category}
              onChange={(v) =>
                setFormData({ ...formData, category: v as typeof formData.category })
              }
              options={[
                { value: 'technical', label: 'Técnico' },
                { value: 'security', label: 'Seguridad' },
                { value: 'operational', label: 'Operacional' },
                { value: 'regulatory', label: 'Regulatorio' },
                { value: 'financial', label: 'Financiero' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Probabilidad (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                required
                value={formData.probability}
                onChange={(e) =>
                  setFormData({ ...formData, probability: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Impacto (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                required
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Risk Score</label>
              <input
                type="text"
                readOnly
                value={riskScore}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-neutral-10 dark:bg-neutral-70 text-sm font-bold text-neutral-90 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Plan de mitigación
            </label>
            <RichTextEditor
              value={formData.mitigationPlan}
              onChange={(html) => setFormData({ ...formData, mitigationPlan: html })}
              placeholder="Describe el plan de mitigación..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="Estado"
                value={formData.status}
                onChange={(v) => setFormData({ ...formData, status: v as typeof formData.status })}
                options={[
                  { value: 'open', label: 'Abierto' },
                  { value: 'mitigated', label: 'Mitigado' },
                  { value: 'accepted', label: 'Aceptado' },
                  { value: 'closed', label: 'Cerrado' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Fecha objetivo
              </label>
              <DatePicker
                value={formData.targetDate}
                onChange={(v) => setFormData({ ...formData, targetDate: v })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              {risk ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
