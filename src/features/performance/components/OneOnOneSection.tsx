import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import type { OneOnOne, Oportunidad } from '@/types/domain'
import { Plus, MessageSquare } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'
import { MeetingCard } from './MeetingCard'

interface Props {
  memberId: string
}

export function OneOnOneSection({ memberId }: Props) {
  const { confirm } = useConfirm()
  const [meetings, setMeetings] = useState<OneOnOne[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newMeeting, setNewMeeting] = useState({
    date: new Date().toISOString().split('T')[0],
    tipo: 'semanal' as OneOnOne['tipo'],
    feedbackDelLider: '',
    feedbackDelMiembro: '',
    estadoAnimo: 7,
  })

  useEffect(() => {
    db.oneOnOnes.where('memberId').equals(memberId).toArray().then(setMeetings)
  }, [memberId])

  const addMeeting = async () => {
    if (!newMeeting.feedbackDelLider.trim()) return
    const meeting: OneOnOne = {
      id: crypto.randomUUID(),
      memberId,
      date: parseLocalDate(newMeeting.date),
      tipo: newMeeting.tipo,
      feedbackDelLider: newMeeting.feedbackDelLider,
      feedbackDelMiembro: newMeeting.feedbackDelMiembro,
      estadoAnimo: newMeeting.estadoAnimo,
      oportunidades: [],
      acciones: [],
      compromisos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.oneOnOnes.add(meeting)
    setMeetings([...meetings, meeting])
    setShowForm(false)
    setNewMeeting({
      date: new Date().toISOString().split('T')[0],
      tipo: 'semanal',
      feedbackDelLider: '',
      feedbackDelMiembro: '',
      estadoAnimo: 7,
    })
  }

  const removeMeeting = async (id: string) => {
    const ok = await confirm('¿Estás seguro de eliminar este meeting?')
    if (!ok) return
    await db.oneOnOnes.delete(id)
    setMeetings(meetings.filter((m) => m.id !== id))
  }

  const updateMeeting = async (id: string, data: Partial<OneOnOne>) => {
    const meeting = meetings.find((m) => m.id === id)
    if (!meeting) return
    const updated = { ...meeting, ...data, updatedAt: new Date() }
    await db.oneOnOnes.put(updated)
    setMeetings(meetings.map((m) => (m.id === id ? updated : m)))
  }

  const removeOportunidad = async (meetingId: string, opId: string) => {
    const meeting = meetings.find((m) => m.id === meetingId)
    if (!meeting) return
    const updated = {
      ...meeting,
      oportunidades: meeting.oportunidades.filter((o) => o.id !== opId),
      updatedAt: new Date(),
    }
    await db.oneOnOnes.put(updated)
    setMeetings(meetings.map((m) => (m.id === meetingId ? updated : m)))
  }

  const updateOportunidad = async (meetingId: string, opId: string, data: Partial<Oportunidad>) => {
    const meeting = meetings.find((m) => m.id === meetingId)
    if (!meeting) return
    const updated = {
      ...meeting,
      oportunidades: meeting.oportunidades.map((o) => (o.id === opId ? { ...o, ...data } : o)),
      updatedAt: new Date(),
    }
    await db.oneOnOnes.put(updated)
    setMeetings(meetings.map((m) => (m.id === meetingId ? updated : m)))
  }

  // For the opportunities/actions inline editing
  const addOportunidad = async (
    meetingId: string,
    descripcion: string,
    tipo: Oportunidad['tipo'],
  ) => {
    const meeting = meetings.find((m) => m.id === meetingId)
    if (!meeting) return
    const op: Oportunidad = {
      id: crypto.randomUUID(),
      descripcion,
      tipo,
      status: 'pendiente',
      createdAt: new Date(),
    }
    const updated = {
      ...meeting,
      oportunidades: [...meeting.oportunidades, op],
      updatedAt: new Date(),
    }
    await db.oneOnOnes.put(updated)
    setMeetings(meetings.map((m) => (m.id === meetingId ? updated : m)))
  }

  const updateOportunidadStatus = async (
    meetingId: string,
    opId: string,
    status: Oportunidad['status'],
  ) => {
    const meeting = meetings.find((m) => m.id === meetingId)
    if (!meeting) return
    const updated = {
      ...meeting,
      oportunidades: meeting.oportunidades.map((o) => (o.id === opId ? { ...o, status } : o)),
      updatedAt: new Date(),
    }
    await db.oneOnOnes.put(updated)
    setMeetings(meetings.map((m) => (m.id === meetingId ? updated : m)))
  }

  const sorted = [...meetings].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">
          Reuniones Uno a Uno
        </h2>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Nuevo Meeting
        </Button>
      </div>

      {/* New Meeting Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-boundary p-4">
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha</label>
              <DatePicker
                value={newMeeting.date}
                onChange={(v) => setNewMeeting({ ...newMeeting, date: v })}
                className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Tipo</label>
              <Select
                value={newMeeting.tipo}
                onChange={(v) => setNewMeeting({ ...newMeeting, tipo: v as OneOnOne['tipo'] })}
                options={[
                  { value: 'semanal', label: 'Semanal' },
                  { value: 'quincenal', label: 'Quincenal' },
                  { value: 'mensual', label: 'Mensual' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">
                Estado de Ánimo (1-10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={newMeeting.estadoAnimo}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, estadoAnimo: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">
                Feedback del Líder
              </label>
              <RichTextEditor
                value={newMeeting.feedbackDelLider}
                onChange={(html) => setNewMeeting({ ...newMeeting, feedbackDelLider: html })}
                placeholder="Retroalimentación del líder..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">
                Feedback del Miembro
              </label>
              <RichTextEditor
                value={newMeeting.feedbackDelMiembro}
                onChange={(html) => setNewMeeting({ ...newMeeting, feedbackDelMiembro: html })}
                placeholder="Retroalimentación del miembro..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={addMeeting}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
            >
              Guardar Meeting
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Meeting List */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-neutral-40">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
          <p>Sin meetings registrados</p>
        </div>
      ) : (
        sorted.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            onDelete={removeMeeting}
            onEdit={updateMeeting}
            onAddOportunidad={addOportunidad}
            onUpdateOportunidadStatus={updateOportunidadStatus}
            onDeleteOportunidad={removeOportunidad}
            onUpdateOportunidad={updateOportunidad}
          />
        ))
      )}
    </div>
  )
}


