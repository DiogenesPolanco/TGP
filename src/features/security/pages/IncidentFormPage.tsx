import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { Select } from '@/components/ui/Select'
import type { Severity, IncidentStatus } from '@/types/domain'

export function IncidentFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const incident = useLiveQuery(() => (id ? db.incidents.get(id) : undefined), [id])
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as Severity,
    status: 'detected' as IncidentStatus,
    downtimeMinutes: null as number | null,
    applicationId: '',
  })

  useEffect(() => {
    if (incident) {
      queueMicrotask(() => {
        setFormData({
          title: incident.title ?? '',
          description: incident.description ?? '',
          severity: incident.severity ?? 'medium',
          status: incident.status ?? 'detected',
          downtimeMinutes: incident.downtimeMinutes ?? null,
          applicationId: incident.applicationId ?? '',
        })
      })
    }
  }, [incident])

  if (id && !incident) return <div className="p-6 text-neutral-50">Cargando...</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...formData, applicationId: formData.applicationId || null, downtimeMinutes: formData.downtimeMinutes ? Number(formData.downtimeMinutes) : null, metadata: incident?.metadata ?? {}, externalId: incident?.externalId ?? `INC-${crypto.randomUUID().slice(0, 8)}`, detectedAt: incident?.detectedAt ?? new Date(), respondedAt: incident?.respondedAt ?? null, resolvedAt: incident?.resolvedAt ?? null, rca: incident?.rca ?? null, createdAt: incident?.createdAt ?? new Date(), updatedAt: new Date() }
    if (incident) { await db.incidents.update(incident.id, data); addNotification({ type: 'success', message: 'Incidente actualizado' }) }
    else { await db.incidents.add({ ...data, id: crypto.randomUUID() }); addNotification({ type: 'success', message: 'Incidente creado' }) }
    navigate('/security/incidents')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/security/incidents')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"><ArrowLeft size={20} className="text-neutral-60" /></button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">{incident ? 'Editar Incidente' : 'Nuevo Incidente'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Título *</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Descripción</label><RichTextEditor value={formData.description} onChange={(html) => setFormData({ ...formData, description: html })} placeholder="Describe el incidente..." /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Select label="Severidad *" required value={formData.severity} onChange={(v) => setFormData({ ...formData, severity: v as Severity })} options={[
            { value: 'critical', label: 'Crítica' },
            { value: 'high', label: 'Alta' },
            { value: 'medium', label: 'Media' },
            { value: 'low', label: 'Baja' },
          ]} /></div>
          <div><Select label="Estado *" required value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as IncidentStatus })} options={[
            { value: 'detected', label: 'Detectado' },
            { value: 'acknowledged', label: 'Reconocido' },
            { value: 'in_progress', label: 'En progreso' },
            { value: 'resolved', label: 'Resuelto' },
            { value: 'closed', label: 'Cerrado' },
          ]} /></div>
        </div>
        <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Downtime (min)</label><input type="number" value={formData.downtimeMinutes ?? ''} onChange={(e) => setFormData({ ...formData, downtimeMinutes: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        <div><Select label="Aplicación" value={formData.applicationId} onChange={(v) => setFormData({ ...formData, applicationId: v })} options={[
          { value: '', label: 'Sin aplicación' },
          ...applications.map((app) => ({ value: app.id, label: app.name })),
        ]} /></div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate('/security/incidents')} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">{incident ? 'Actualizar' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}
