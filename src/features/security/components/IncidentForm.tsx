import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import type { Incident } from '@/types/domain'

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
      detectedAt: new Date(formData.detectedAt),
      respondedAt: formData.respondedAt ? new Date(formData.respondedAt) : null,
      resolvedAt: formData.resolvedAt ? new Date(formData.resolvedAt) : null,
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
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-20 dark:border-neutral-70">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {incident ? 'Editar Incidente' : 'Nuevo Incidente'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Título *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Descripción</label>
            <RichTextEditor
              value={formData.description}
              onChange={(html) => setFormData({ ...formData, description: html })}
              placeholder="Describe el incidente..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Aplicación</label>
            <select
              value={formData.applicationId}
              onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin aplicación</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Severidad *</label>
              <select
                required
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as typeof formData.severity })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="critical">Crítica</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Estado *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="detected">Detectado</option>
                <option value="acknowledged">Reconocido</option>
                <option value="in_progress">En Progreso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Fecha detección</label>
              <input
                type="date"
                value={formData.detectedAt}
                onChange={(e) => setFormData({ ...formData, detectedAt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Downtime (min)</label>
              <input
                type="number"
                value={formData.downtimeMinutes}
                onChange={(e) => setFormData({ ...formData, downtimeMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">RCA</label>
            <RichTextEditor
              value={formData.rca}
              onChange={(html) => setFormData({ ...formData, rca: html })}
              placeholder="Análisis de causa raíz..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              {incident ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
