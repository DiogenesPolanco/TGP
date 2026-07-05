import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { createTicket, updateTicket } from '@/services/equipment/equipmentService'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { Select } from '@/components/ui/Select'
import { MemberSelector } from '@/components/ui/MemberSelector'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, ExternalLink, Calendar } from 'lucide-react'
import { EQUIPMENT_TYPE_LABELS } from '../components/EquipmentStatusBadge'
import type { TicketType, TicketPriority } from '@/types/domain'

type Params = { id: string; ticketId?: string }

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().split('T')[0]
}

export function EquipmentTicketFormPage() {
  const { id: equipmentId, ticketId } = useParams<Params>()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const [saving, setSaving] = useState(false)
  const [type, setType] = useState<TicketType>('repair')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [description, setDescription] = useState('')
  const [jiraTicketId, setJiraTicketId] = useState('')
  const [jiraTicketLink, setJiraTicketLink] = useState('')
  const [status, setStatus] = useState<string>('open')
  const [assigneeId, setAssigneeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const isEdit = !!ticketId

  const equipment = useLiveQuery(() => (equipmentId ? db.equipment.get(equipmentId) : undefined), [equipmentId])
  const existingTicket = useLiveQuery(
    () => (ticketId ? db.equipmentTickets.get(ticketId) : undefined),
    [ticketId],
  )

  useEffect(() => {
    if (existingTicket) {
      setType(existingTicket.type)
      setPriority(existingTicket.priority)
      setDescription(existingTicket.description)
      setJiraTicketId(existingTicket.jiraTicketId ?? '')
      setJiraTicketLink(existingTicket.jiraTicketLink ?? '')
      setStatus(existingTicket.status)
      setAssigneeId(existingTicket.assigneeId ?? '')
      setStartDate(formatDate(existingTicket.startDate))
      setEndDate(formatDate(existingTicket.endDate))
    }
  }, [existingTicket])

  if (!equipmentId) return null
  if (!equipment) return <div className="p-6 text-neutral-50">Cargando...</div>
  if (isEdit && !existingTicket) return <div className="p-6 text-neutral-50">Cargando ticket...</div>

  const equipmentName = `${EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type} - ${equipment.brand} ${equipment.model}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    try {
      const ticketData = {
        type,
        priority,
        description: description.trim(),
        jiraTicketId: jiraTicketId.trim() || null,
        jiraTicketLink: jiraTicketLink.trim() || null,
        assigneeId: assigneeId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      }

      if (isEdit) {
        await updateTicket(ticketId!, {
          ...ticketData,
          status: status as any,
        })
        addNotification({ type: 'success', message: 'Ticket actualizado correctamente' })
      } else {
        await createTicket({
          equipmentId,
          requesterId: equipment.assignedTo ?? 'unknown',
          ...ticketData,
          status: 'open',
          resolution: null,
        })
        addNotification({ type: 'success', message: 'Ticket creado correctamente' })
      }
      navigate(`/equipment/${equipmentId}`)
    } catch {
      addNotification({ type: 'error', message: isEdit ? 'Error al actualizar ticket' : 'Error al crear ticket' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate(`/equipment/${equipmentId}`)} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <ArrowLeft size={20} className="text-neutral-60" />
        </Button>
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">{isEdit ? 'Editar Ticket' : 'Nuevo Ticket'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-boundary overflow-hidden">
        <div className="p-6 space-y-6">
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

          {isEdit && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary">Estado</label>
              <Select value={status} onChange={(v) => setStatus(v)} options={[
                { value: 'open', label: 'Abierto' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'resolved', label: 'Resuelto' },
                { value: 'closed', label: 'Cerrado' },
              ]} />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Asignado a</label>
            <MemberSelector
              value={assigneeId}
              onChange={setAssigneeId}
              placeholder="Sin asignar"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary flex items-center gap-1.5">
                <Calendar size={14} className="text-neutral-50" />
                Fecha de inicio
              </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary flex items-center gap-1.5">
                <Calendar size={14} className="text-neutral-50" />
                Fecha de fin
              </label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">Descripción *</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe el problema o solicitud..."
              minHeight="200px"
            />
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
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <ExternalLink size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-5 dark:bg-neutral-85 border-t border-boundary">
          <Button type="button" onClick={() => navigate(`/equipment/${equipmentId}`)} className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90 transition-colors">
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !description.trim()}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Ticket')}
          </Button>
        </div>
      </form>
    </div>
  )
}
