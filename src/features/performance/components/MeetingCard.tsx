import { useState } from 'react'
import { Target, Plus, Edit3, Trash2 } from 'lucide-react'
import type { OneOnOne, Oportunidad } from '@/types/domain'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

const tipoLabels: Record<string, string> = {
  semanal: 'Semanal',
  quincenal: 'Quincenal',
  mensual: 'Mensual',
}

interface MeetingCardProps {
  meeting: OneOnOne
  onDelete: (id: string) => void
  onEdit: (id: string, data: Partial<OneOnOne>) => void
  onAddOportunidad: (meetingId: string, descripcion: string, tipo: Oportunidad['tipo']) => void
  onUpdateOportunidadStatus: (
    meetingId: string,
    opId: string,
    status: Oportunidad['status'],
  ) => void
  onDeleteOportunidad: (meetingId: string, opId: string) => void
  onUpdateOportunidad: (meetingId: string, opId: string, data: Partial<Oportunidad>) => void
}

export function MeetingCard({
  meeting,
  onDelete,
  onEdit,
  onAddOportunidad,
  onUpdateOportunidadStatus,
  onDeleteOportunidad,
  onUpdateOportunidad,
}: MeetingCardProps) {
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
  const [editOpData, setEditOpData] = useState({
    descripcion: '',
    tipo: 'mejora' as Oportunidad['tipo'],
  })

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
      date: parseLocalDate(editData.date),
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
    onUpdateOportunidad(meeting.id, editingOpId, {
      descripcion: editOpData.descripcion.trim(),
      tipo: editOpData.tipo,
    })
    setEditingOpId(null)
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm text-neutral-90 dark:text-white'

  if (editing) {
    return (
      <div className="bg-card rounded-xl border border-boundary p-4">
        <h4 className="text-sm font-semibold text-neutral-90 dark:text-white mb-3">
          Editar Meeting
        </h4>
        <div className="grid gap-3 sm:grid-cols-3 mb-3">
          <div>
            <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha</label>
            <DatePicker
              value={editData.date}
              onChange={(v) => setEditData({ ...editData, date: v })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-60 mb-1 block">Tipo</label>
            <Select
              value={editData.tipo}
              onChange={(v) => setEditData({ ...editData, tipo: v as OneOnOne['tipo'] })}
              options={[
                { value: 'semanal', label: 'Semanal' },
                { value: 'quincenal', label: 'Quincenal' },
                { value: 'mensual', label: 'Mensual' },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-60 mb-1 block">Ánimo (1-10)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={editData.estadoAnimo}
              onChange={(e) => setEditData({ ...editData, estadoAnimo: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 mb-3">
          <div>
            <label className="text-xs font-medium text-neutral-60 mb-1 block">
              Feedback del Líder
            </label>
            <RichTextEditor
              value={editData.feedbackDelLider}
              onChange={(html) => setEditData({ ...editData, feedbackDelLider: html })}
              placeholder="Retroalimentación del líder..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-60 mb-1 block">
              Feedback del Miembro
            </label>
            <RichTextEditor
              value={editData.feedbackDelMiembro}
              onChange={(html) => setEditData({ ...editData, feedbackDelMiembro: html })}
              placeholder="Retroalimentación del miembro..."
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={saveEdit}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
          >
            Guardar
          </Button>
          <Button
            onClick={() => setEditing(false)}
            className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90"
          >
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-boundary">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${
              meeting.estadoAnimo >= 7
                ? 'bg-green-500'
                : meeting.estadoAnimo >= 4
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
          />
          <div>
            <p className="text-sm font-medium text-neutral-90 dark:text-white">
              {new Date(meeting.date).toLocaleDateString('es-PE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
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
            onClick={(e) => {
              e.stopPropagation()
              startEdit()
            }}
            className="p-1.5 text-neutral-50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Editar meeting"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(meeting.id)
            }}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Eliminar meeting"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-boundary pt-3">
          {/* Feedback */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
              <p className="text-xs font-semibold text-neutral-60 mb-1">Feedback del Líder</p>
              <p className="text-sm text-neutral-90 dark:text-white">{meeting.feedbackDelLider}</p>
            </div>
            <div className="p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
              <p className="text-xs font-semibold text-neutral-60 mb-1">Feedback del Miembro</p>
              <p className="text-sm text-neutral-90 dark:text-white">
                {meeting.feedbackDelMiembro || '—'}
              </p>
            </div>
          </div>

          {/* Oportunidades */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-neutral-50" />
              <h4 className="text-sm font-semibold text-secondary">Oportunidades</h4>
            </div>
            {meeting.oportunidades.length === 0 ? (
              <p className="text-xs text-neutral-40 mb-2">Sin oportunidades registradas</p>
            ) : (
              <div className="space-y-1.5 mb-2">
                {meeting.oportunidades.map((op) =>
                  editingOpId === op.id ? (
                    <div
                      key={op.id}
                      className="flex items-center gap-2 p-2 bg-card rounded-lg border border-neutral-30 dark:border-neutral-60"
                    >
                      <input
                        type="text"
                        value={editOpData.descripcion}
                        onChange={(e) =>
                          setEditOpData({ ...editOpData, descripcion: e.target.value })
                        }
                        className="flex-1 rounded border border-neutral-30 dark:border-neutral-60 px-2 py-1 text-xs bg-transparent"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditOp()
                          if (e.key === 'Escape') setEditingOpId(null)
                        }}
                      />
                      <Select
                        value={editOpData.tipo}
                        onChange={(v) =>
                          setEditOpData({ ...editOpData, tipo: v as Oportunidad['tipo'] })
                        }
                        options={[
                          { value: 'mejora', label: 'Mejora' },
                          { value: 'crecimiento', label: 'Crecimiento' },
                          { value: 'capacitacion', label: 'Capacitación' },
                          { value: 'ascenso', label: 'Ascenso' },
                          { value: 'mentoria', label: 'Mentoría' },
                        ]}
                        className="w-32"
                      />
                      <Button
                        onClick={saveEditOp}
                        className="px-2 py-1 bg-primary text-white text-xs font-medium rounded-lg"
                      >
                        OK
                      </Button>
                      <Button
                        onClick={() => setEditingOpId(null)}
                        className="px-2 py-1 text-xs text-neutral-60"
                      >
                        X
                      </Button>
                    </div>
                  ) : (
                    <div
                      key={op.id}
                      className="flex items-center justify-between p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg group/op"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-neutral-90 dark:text-white">{op.descripcion}</p>
                        <p className="text-xs text-neutral-50 capitalize">{op.tipo}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={op.status}
                          onChange={(v) =>
                            onUpdateOportunidadStatus(meeting.id, op.id, v as Oportunidad['status'])
                          }
                          options={[
                            { value: 'pendiente', label: 'Pendiente' },
                            { value: 'en_progreso', label: 'En Progreso' },
                            { value: 'completada', label: 'Completada' },
                            { value: 'cancelada', label: 'Cancelada' },
                          ]}
                          className="w-32"
                        />
                        <Button
                          onClick={() => startEditOp(op)}
                          className="p-1 opacity-0 group-hover/op:opacity-100 text-neutral-50 hover:text-primary rounded"
                          title="Editar oportunidad"
                        >
                          <Edit3 size={11} />
                        </Button>
                        <Button
                          onClick={() => onDeleteOportunidad(meeting.id, op.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Eliminar oportunidad"
                        >
                          <Trash2 size={11} />
                        </Button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newOpDesc}
                onChange={(e) => setNewOpDesc(e.target.value)}
                placeholder="Nueva oportunidad..."
                className="flex-1 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-1.5 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newOpDesc.trim()) {
                    onAddOportunidad(meeting.id, newOpDesc.trim(), newOpTipo)
                    setNewOpDesc('')
                  }
                }}
              />
              <Select
                value={newOpTipo}
                onChange={(v) => setNewOpTipo(v as Oportunidad['tipo'])}
                options={[
                  { value: 'mejora', label: 'Mejora' },
                  { value: 'crecimiento', label: 'Crecimiento' },
                  { value: 'capacitacion', label: 'Capacitación' },
                  { value: 'ascenso', label: 'Ascenso' },
                  { value: 'mentoria', label: 'Mentoría' },
                ]}
                className="w-32"
              />
              <Button
                onClick={() => {
                  if (newOpDesc.trim()) {
                    onAddOportunidad(meeting.id, newOpDesc.trim(), newOpTipo)
                    setNewOpDesc('')
                  }
                }}
                className="px-2 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark"
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
