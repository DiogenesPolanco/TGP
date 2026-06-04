import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import type { OneOnOne, Oportunidad } from '@/types/domain'
import { Plus, MessageSquare, Trash2, Target, Edit3 } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'

interface Props {
  memberId: string
}

const tipoLabels: Record<string, string> = {
  semanal: 'Semanal',
  quincenal: 'Quincenal',
  mensual: 'Mensual',
}

const opStatusColors: Record<string, string> = {
  pendiente: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  en_progreso: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  completada: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  cancelada: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
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
      date: new Date(newMeeting.date),
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
  const addOportunidad = async (meetingId: string, descripcion: string, tipo: Oportunidad['tipo']) => {
    const meeting = meetings.find((m) => m.id === meetingId)
    if (!meeting) return
    const op: Oportunidad = {
      id: crypto.randomUUID(),
      descripcion,
      tipo,
      status: 'pendiente',
      createdAt: new Date(),
    }
    const updated = { ...meeting, oportunidades: [...meeting.oportunidades, op], updatedAt: new Date() }
    await db.oneOnOnes.put(updated)
    setMeetings(meetings.map((m) => (m.id === meetingId ? updated : m)))
  }

  const updateOportunidadStatus = async (meetingId: string, opId: string, status: Oportunidad['status']) => {
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
        <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">One-on-One Meetings</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Nuevo Meeting
        </button>
      </div>

      {/* New Meeting Form */}
      {showForm && (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha</label>
              <input
                type="date"
                value={newMeeting.date}
                onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Tipo</label>
              <select
                value={newMeeting.tipo}
                onChange={(e) => setNewMeeting({ ...newMeeting, tipo: e.target.value as OneOnOne['tipo'] })}
                className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
              >
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Estado de Ánimo (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={newMeeting.estadoAnimo}
                onChange={(e) => setNewMeeting({ ...newMeeting, estadoAnimo: Number(e.target.value) })}
                className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Feedback del Líder</label>
              <textarea
                value={newMeeting.feedbackDelLider}
                onChange={(e) => setNewMeeting({ ...newMeeting, feedbackDelLider: e.target.value })}
                className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm min-h-[80px]"
                placeholder="Retroalimentación del líder..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Feedback del Miembro</label>
              <textarea
                value={newMeeting.feedbackDelMiembro}
                onChange={(e) => setNewMeeting({ ...newMeeting, feedbackDelMiembro: e.target.value })}
                className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm min-h-[80px]"
                placeholder="Retroalimentación del miembro..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addMeeting} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">
              Guardar Meeting
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90">
              Cancelar
            </button>
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

function MeetingCard({
  meeting,
  onDelete,
  onEdit,
  onAddOportunidad,
  onUpdateOportunidadStatus,
  onDeleteOportunidad,
  onUpdateOportunidad,
}: {
  meeting: OneOnOne
  onDelete: (id: string) => void
  onEdit: (id: string, data: Partial<OneOnOne>) => void
  onAddOportunidad: (meetingId: string, descripcion: string, tipo: Oportunidad['tipo']) => void
  onUpdateOportunidadStatus: (meetingId: string, opId: string, status: Oportunidad['status']) => void
  onDeleteOportunidad: (meetingId: string, opId: string) => void
  onUpdateOportunidad: (meetingId: string, opId: string, data: Partial<Oportunidad>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    date: meeting.date.toISOString().split('T')[0],
    tipo: meeting.tipo,
    estadoAnimo: meeting.estadoAnimo,
    feedbackDelLider: meeting.feedbackDelLider,
    feedbackDelMiembro: meeting.feedbackDelMiembro,
  })
  const [newOpDesc, setNewOpDesc] = useState('')
  const [newOpTipo, setNewOpTipo] = useState<Oportunidad['tipo']>('mejora')
  const [editingOpId, setEditingOpId] = useState<string | null>(null)
  const [editOpData, setEditOpData] = useState({ descripcion: '', tipo: 'mejora' as Oportunidad['tipo'] })

  const startEdit = () => {
    setEditData({
    date: new Date(meeting.date).toISOString().split('T')[0],
      tipo: meeting.tipo,
      estadoAnimo: meeting.estadoAnimo,
      feedbackDelLider: meeting.feedbackDelLider,
      feedbackDelMiembro: meeting.feedbackDelMiembro,
    })
    setEditing(true)
  }

  const saveEdit = () => {
    onEdit(meeting.id, {
      date: new Date(editData.date),
      tipo: editData.tipo,
      estadoAnimo: editData.estadoAnimo,
      feedbackDelLider: editData.feedbackDelLider,
      feedbackDelMiembro: editData.feedbackDelMiembro,
    })
    setEditing(false)
  }

  const startEditOp = (op: Oportunidad) => {
    setEditingOpId(op.id)
    setEditOpData({ descripcion: op.descripcion, tipo: op.tipo })
  }

  const saveEditOp = () => {
    if (!editingOpId || !editOpData.descripcion.trim()) return
    onUpdateOportunidad(meeting.id, editingOpId, { descripcion: editOpData.descripcion.trim(), tipo: editOpData.tipo })
    setEditingOpId(null)
  }

  const inputClass = 'w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm text-neutral-90 dark:text-white'

  if (editing) {
    return (
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
        <h4 className="text-sm font-semibold text-neutral-90 dark:text-white mb-3">Editar Meeting</h4>
        <div className="grid gap-3 sm:grid-cols-3 mb-3">
          <div>
            <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha</label>
            <input type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-60 mb-1 block">Tipo</label>
            <select value={editData.tipo} onChange={(e) => setEditData({ ...editData, tipo: e.target.value as OneOnOne['tipo'] })} className={inputClass}>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-60 mb-1 block">Ánimo (1-10)</label>
            <input type="number" min={1} max={10} value={editData.estadoAnimo} onChange={(e) => setEditData({ ...editData, estadoAnimo: Number(e.target.value) })} className={inputClass} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 mb-3">
          <div>
            <label className="text-xs font-medium text-neutral-60 mb-1 block">Feedback del Líder</label>
            <textarea value={editData.feedbackDelLider} onChange={(e) => setEditData({ ...editData, feedbackDelLider: e.target.value })} className={`${inputClass} min-h-[60px]`} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-60 mb-1 block">Feedback del Miembro</label>
            <textarea value={editData.feedbackDelMiembro} onChange={(e) => setEditData({ ...editData, feedbackDelMiembro: e.target.value })} className={`${inputClass} min-h-[60px]`} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={saveEdit} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">Guardar</button>
          <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90">Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            meeting.estadoAnimo >= 7 ? 'bg-green-500' : meeting.estadoAnimo >= 4 ? 'bg-amber-500' : 'bg-red-500'
          }`} />
          <div>
            <p className="text-sm font-medium text-neutral-90 dark:text-white">
              {new Date(meeting.date).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-neutral-50">
              {tipoLabels[meeting.tipo]} · Ánimo: {meeting.estadoAnimo}/10
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meeting.oportunidades.length > 0 && (
            <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
              {meeting.oportunidades.length} ops
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); startEdit() }}
            className="p-1.5 text-neutral-50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Editar meeting"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(meeting.id) }}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Eliminar meeting"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-neutral-20 dark:border-neutral-70 pt-3">
          {/* Feedback */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
              <p className="text-xs font-semibold text-neutral-60 mb-1">Feedback del Líder</p>
              <p className="text-sm text-neutral-90 dark:text-white">{meeting.feedbackDelLider}</p>
            </div>
            <div className="p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
              <p className="text-xs font-semibold text-neutral-60 mb-1">Feedback del Miembro</p>
              <p className="text-sm text-neutral-90 dark:text-white">{meeting.feedbackDelMiembro || '—'}</p>
            </div>
          </div>

          {/* Oportunidades */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-neutral-50" />
              <h4 className="text-sm font-semibold text-neutral-70 dark:text-neutral-30">Oportunidades</h4>
            </div>
            {meeting.oportunidades.length === 0 ? (
              <p className="text-xs text-neutral-40 mb-2">Sin oportunidades registradas</p>
            ) : (
              <div className="space-y-1.5 mb-2">
                {meeting.oportunidades.map((op) =>
                  editingOpId === op.id ? (
                    <div key={op.id} className="flex items-center gap-2 p-2 bg-white dark:bg-neutral-80 rounded-lg border border-neutral-30 dark:border-neutral-60">
                      <input
                        type="text"
                        value={editOpData.descripcion}
                        onChange={(e) => setEditOpData({ ...editOpData, descripcion: e.target.value })}
                        className="flex-1 rounded border border-neutral-30 dark:border-neutral-60 px-2 py-1 text-xs bg-transparent"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEditOp(); if (e.key === 'Escape') setEditingOpId(null) }}
                      />
                      <select
                        value={editOpData.tipo}
                        onChange={(e) => setEditOpData({ ...editOpData, tipo: e.target.value as Oportunidad['tipo'] })}
                        className="rounded border border-neutral-30 dark:border-neutral-60 px-2 py-1 text-xs bg-transparent"
                      >
                        <option value="mejora">Mejora</option>
                        <option value="crecimiento">Crecimiento</option>
                        <option value="capacitacion">Capacitación</option>
                        <option value="ascenso">Ascenso</option>
                        <option value="mentoria">Mentoría</option>
                      </select>
                      <button onClick={saveEditOp} className="px-2 py-1 bg-primary text-white text-xs font-medium rounded-lg">OK</button>
                      <button onClick={() => setEditingOpId(null)} className="px-2 py-1 text-xs text-neutral-60">X</button>
                    </div>
                  ) : (
                    <div key={op.id} className="flex items-center justify-between p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg group/op">
                      <div className="flex-1">
                        <p className="text-sm text-neutral-90 dark:text-white">{op.descripcion}</p>
                        <p className="text-xs text-neutral-50 capitalize">{op.tipo}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <select
                          value={op.status}
                          onChange={(e) => onUpdateOportunidadStatus(meeting.id, op.id, e.target.value as Oportunidad['status'])}
                          className={`text-xs px-2 py-0.5 rounded-full border-0 ${opStatusColors[op.status]}`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_progreso">En Progreso</option>
                          <option value="completada">Completada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                        <button onClick={() => startEditOp(op)} className="p-1 opacity-0 group-hover/op:opacity-100 text-neutral-50 hover:text-primary rounded" title="Editar oportunidad">
                          <Edit3 size={11} />
                        </button>
                        <button onClick={() => onDeleteOportunidad(meeting.id, op.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Eliminar oportunidad">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newOpDesc}
                onChange={(e) => setNewOpDesc(e.target.value)}
                placeholder="Nueva oportunidad..."
                className="flex-1 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-1.5 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newOpDesc.trim()) {
                    onAddOportunidad(meeting.id, newOpDesc.trim(), newOpTipo)
                    setNewOpDesc('')
                  }
                }}
              />
              <select
                value={newOpTipo}
                onChange={(e) => setNewOpTipo(e.target.value as Oportunidad['tipo'])}
                className="rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-2 py-1.5 text-xs"
              >
                <option value="mejora">Mejora</option>
                <option value="crecimiento">Crecimiento</option>
                <option value="capacitacion">Capacitación</option>
                <option value="ascenso">Ascenso</option>
                <option value="mentoria">Mentoría</option>
              </select>
              <button
                onClick={() => {
                  if (newOpDesc.trim()) {
                    onAddOportunidad(meeting.id, newOpDesc.trim(), newOpTipo)
                    setNewOpDesc('')
                  }
                }}
                className="px-2 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
