import { useState } from 'react'
import { createTicket } from '@/services/equipment/equipmentService'
import { useAppStore } from '@/stores/appStore'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { X, ExternalLink } from 'lucide-react'
import type { TicketType, TicketPriority } from '@/types/domain'

interface Props {
  equipmentId: string
  requesterId: string
  equipmentName: string
  onClose: () => void
  onCreated: () => void
}

export function EquipmentTicketForm({ equipmentId, requesterId, equipmentName, onClose, onCreated }: Props) {
  const { addNotification } = useAppStore()
  const [saving, setSaving] = useState(false)
  const [type, setType] = useState<TicketType>('repair')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [description, setDescription] = useState('')
  const [jiraTicketId, setJiraTicketId] = useState('')
  const [jiraTicketLink, setJiraTicketLink] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    try {
      await createTicket({
        equipmentId,
        requesterId,
        assigneeId: null,
        type,
        priority,
        status: 'open',
        description: description.trim(),
        jiraTicketId: jiraTicketId.trim() || null,
        jiraTicketLink: jiraTicketLink.trim() || null,
        resolution: null,
        startDate: null,
        endDate: null,
      })
      addNotification({ type: 'success', message: 'Ticket creado correctamente' })
      onCreated()
      onClose()
    } catch {
      addNotification({ type: 'error', message: 'Error al crear ticket' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl border border-boundary shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-boundary">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">Nuevo Ticket</h3>
          <Button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <X size={18} className="text-neutral-50" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-secondary">Equipo: <span className="font-medium text-neutral-90 dark:text-white">{equipmentName}</span></p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary">Tipo</label>
              <Select value={type} onChange={(v) => setType(v as TicketType)} options={[
                { value: 'repair', label: 'Reparación' },
                { value: 'replacement', label: 'Reemplazo' },
                { value: 'new', label: 'Nuevo' },
              ]} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary">Prioridad</label>
              <Select value={priority} onChange={(v) => setPriority(v as TicketPriority)} options={[
                { value: 'low', label: 'Baja' },
                { value: 'medium', label: 'Media' },
                { value: 'high', label: 'Alta' },
                { value: 'critical', label: 'Crítica' },
              ]} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Descripción *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>

          <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-neutral-50 uppercase tracking-wider">Ticket Jira (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted">ID del ticket</label>
                <input type="text" value={jiraTicketId} onChange={(e) => setJiraTicketId(e.target.value)}
                  placeholder="Ej: PROJ-123"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Enlace externo</label>
                <div className="relative">
                  <input type="url" value={jiraTicketLink} onChange={(e) => setJiraTicketLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 pl-8 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <ExternalLink size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-50" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" onClick={onClose} className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90 transition-colors">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !description.trim()}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
              {saving ? 'Creando...' : 'Crear Ticket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
