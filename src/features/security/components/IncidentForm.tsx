import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { Incident } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

interface IncidentFormProps {
  incident: Incident | null
  onClose: () => void
  onSave: () => void
}

export function IncidentForm({ incident, onClose, onSave }: IncidentFormProps) {
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const [formData, setFormData] = useState({
    title: incident?.title ?? '',
    description: incident?.description ?? '',
    applicationId: incident?.applicationId ?? '',
    severity: incident?.severity ?? 'medium',
    status: incident?.status ?? 'detected',
    detectedAt: incident?.detectedAt ? new Date(incident.detectedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    respondedAt: incident?.respondedAt ? new Date(incident.respondedAt).toISOString().split('T')[0] : '',
    resolvedAt: incident?.resolvedAt ? new Date(incident.resolvedAt).toISOString().split('T')[0] : '',
    downtimeMinutes: incident?.downtimeMinutes ?? 0,
    rca: incident?.rca ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      applicationId: formData.applicationId || null,
      externalId: incident?.externalId ?? `INC-${Date.now()}`,
      detectedAt: parseLocalDate(formData.detectedAt),
      respondedAt: formData.respondedAt ? parseLocalDate(formData.respondedAt) : null,
      resolvedAt: formData.resolvedAt ? parseLocalDate(formData.resolvedAt) : null,
      metadata: incident?.metadata ?? {},
      createdAt: incident?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }

    if (incident) {
      await db.incidents.update(incident.id, data)
    } else {
      await db.incidents.add({ ...data, id: crypto.randomUUID() })
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl border border-boundary shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-boundary">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {incident ? 'Editar Incidente' : 'Nuevo Incidente'}
          </h3>
          <Button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
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
              placeholder="Describe el incidente..."
            />
          </div>

          <div>
            <Select label="Aplicación" value={formData.applicationId} onChange={(v) => setFormData({ ...formData, applicationId: v })} options={[
              { value: '', label: 'Sin aplicación' },
              ...applications.map((app) => ({ value: app.id, label: app.name })),
            ]} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Severidad *" required value={formData.severity} onChange={(v) => setFormData({ ...formData, severity: v as typeof formData.severity })} options={[
                { value: 'critical', label: 'Crítica' },
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Media' },
                { value: 'low', label: 'Baja' },
                { value: 'info', label: 'Info' },
              ]} />
            </div>
            <div>
              <Select label="Estado *" required value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as typeof formData.status })} options={[
                { value: 'detected', label: 'Detectado' },
                { value: 'acknowledged', label: 'Reconocido' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'resolved', label: 'Resuelto' },
                { value: 'closed', label: 'Cerrado' },
              ]} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Fecha detección</label>
              <DatePicker
                value={formData.detectedAt}
                onChange={(v) => setFormData({ ...formData, detectedAt: v })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Downtime (min)</label>
              <input
                type="number"
                value={formData.downtimeMinutes}
                onChange={(e) => setFormData({ ...formData, downtimeMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">RCA</label>
            <RichTextEditor
              value={formData.rca}
              onChange={(html) => setFormData({ ...formData, rca: html })}
              placeholder="Análisis de causa raíz..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button"
              onClick={onClose} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
              Cancelar
            </Button>
            <Button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
              {incident ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
