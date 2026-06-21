import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { AuditFinding } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

interface AuditFormProps {
  finding: AuditFinding | null
  onClose: () => void
  onSave: () => void
}

export function AuditForm({ finding, onClose, onSave }: AuditFormProps) {
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const [formData, setFormData] = useState({
    auditReference: finding?.auditReference ?? '',
    title: finding?.title ?? '',
    description: finding?.description ?? '',
    applicationId: finding?.applicationId ?? '',
    severity: finding?.severity ?? 'medium',
    category: finding?.category ?? 'security',
    status: finding?.status ?? 'open',
    dueDate: finding?.dueDate ? new Date(finding.dueDate).toISOString().split('T')[0] : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      applicationId: formData.applicationId || null,
      dueDate: parseLocalDate(formData.dueDate),
      evidence: finding?.evidence ?? [],
      actionPlan: finding?.actionPlan ?? null,
      metadata: finding?.metadata ?? {},
      createdAt: finding?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }

    if (finding) {
      await db.auditFindings.update(finding.id, data)
    } else {
      await db.auditFindings.add({ ...data, id: crypto.randomUUID() })
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl border border-boundary shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-boundary">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {finding ? 'Editar Hallazgo' : 'Nuevo Hallazgo'}
          </h3>
          <Button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Referencia</label>
              <input
                type="text"
                value={formData.auditReference}
                onChange={(e) => setFormData({ ...formData, auditReference: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Select label="Aplicación" value={formData.applicationId} onChange={(v) => setFormData({ ...formData, applicationId: v })} options={[
                { value: '', label: 'Sin aplicación' },
                ...applications.map((app) => ({ value: app.id, label: app.name })),
              ]} />
            </div>
          </div>

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
              placeholder="Describe el hallazgo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Severidad" value={formData.severity} onChange={(v) => setFormData({ ...formData, severity: v as typeof formData.severity })} options={[
                { value: 'critical', label: 'Crítica' },
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Media' },
                { value: 'low', label: 'Baja' },
                { value: 'info', label: 'Info' },
              ]} />
            </div>
            <div>
              <Select label="Categoría" value={formData.category} onChange={(v) => setFormData({ ...formData, category: v as typeof formData.category })} options={[
                { value: 'security', label: 'Seguridad' },
                { value: 'compliance', label: 'Cumplimiento' },
                { value: 'architecture', label: 'Arquitectura' },
                { value: 'process', label: 'Proceso' },
                { value: 'data_governance', label: 'Data Governance' },
                { value: 'access_control', label: 'Control de Acceso' },
                { value: 'business_continuity', label: 'Continuidad' },
              ]} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Estado" value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as typeof formData.status })} options={[
                { value: 'open', label: 'Abierto' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'resolved', label: 'Resuelto' },
                { value: 'closed', label: 'Cerrado' },
                { value: 'overdue', label: 'Vencido' },
              ]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Fecha vencimiento *</label>
              <DatePicker
                required
                value={formData.dueDate}
                onChange={(v) => setFormData({ ...formData, dueDate: v })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button"
              onClick={onClose} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
              Cancelar
            </Button>
            <Button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
              {finding ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
