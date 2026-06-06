import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { Plus, X, Save, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import type { Deliverable, DeliverableStatus, Objective } from '@/types/domain'

const statusColors: Record<DeliverableStatus, string> = {
  pending: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40 border-neutral-30 dark:border-neutral-60',
  in_progress: 'bg-info/10 text-info border-info/30',
  completed: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-danger/10 text-danger border-danger/30',
}

const statusLabel: Record<DeliverableStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export function DeliverablesTab({ applicationId }: { applicationId: string }) {
  const deliverables = useLiveQuery(
    () => db.deliverables.where('applicationId').equals(applicationId).toArray(),
    [applicationId],
  ) ?? []

  const allObjectives = useLiveQuery(() => db.objectives.toArray()) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Entregables
        </h4>
      </div>

      {/* New deliverable form */}
      <DeliverableForm applicationId={applicationId} allObjectives={allObjectives} />

      {/* List */}
      {deliverables.length === 0 ? (
        <p className="text-sm text-neutral-50 mt-4">No hay entregables registrados</p>
      ) : (
        <div className="mt-4 space-y-2">
          {deliverables.map((del) => (
            <DeliverableRow
              key={del.id}
              deliverable={del}
              allObjectives={allObjectives}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── New deliverable form ─── */

function DeliverableForm({
  applicationId,
  allObjectives,
}: {
  applicationId: string
  allObjectives: Objective[]
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [objectiveId, setObjectiveId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await db.deliverables.add({
        id: crypto.randomUUID(),
        applicationId,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'pending',
        objectiveId: objectiveId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setTitle('')
      setDescription('')
      setDueDate('')
      setObjectiveId('')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-neutral-20 dark:border-neutral-70 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors rounded-lg"
      >
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <Plus size={16} />
        Nuevo entregable
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-neutral-20 dark:border-neutral-70 pt-3">
          <input
            type="text"
            placeholder="Título del entregable"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <RichTextEditor
            value={description}
            onChange={(html) => setDescription(html)}
            placeholder="Descripción (opcional)"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-neutral-50 mb-1">Fecha límite</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-neutral-50 mb-1">Objetivo relacionado</label>
              <select
                value={objectiveId}
                onChange={(e) => setObjectiveId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Sin objetivo</option>
                {allObjectives.map((obj) => (
                  <option key={obj.id} value={obj.id}>{obj.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Deliverable row ─── */

function DeliverableRow({
  deliverable,
  allObjectives,
}: {
  deliverable: Deliverable
  allObjectives: Objective[]
}) {
  const { confirm } = useConfirm()
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(deliverable.status)
  const [dueDate, setDueDate] = useState(
    deliverable.dueDate ? new Date(deliverable.dueDate).toISOString().split('T')[0] : '',
  )
  const [objectiveId, setObjectiveId] = useState(deliverable.objectiveId ?? '')

  const handleUpdate = async () => {
    await db.deliverables.update(deliverable.id, {
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      objectiveId: objectiveId || null,
      updatedAt: new Date(),
    })
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!(await confirm('¿Eliminar este entregable?'))) return
    await db.deliverables.delete(deliverable.id)
  }

  const obj = allObjectives.find((o) => o.id === deliverable.objectiveId)

  return (
    <div className="flex items-start gap-3 p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-90 dark:text-white">
            {deliverable.title}
          </span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full border', statusColors[status])}>
            {statusLabel[status]}
          </span>
        </div>
        {deliverable.description && (
          <p className="text-xs text-neutral-60 dark:text-neutral-40 mt-0.5">
            {deliverable.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-50">
          {deliverable.dueDate && (
            <span>
              {new Date(deliverable.dueDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
          {obj && <span>→ {obj.title}</span>}
        </div>
      </div>

      {/* Inline edit */}
      {editing ? (
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DeliverableStatus)}
            className="px-2 py-1 text-xs rounded border border-neutral-30 dark:border-neutral-60 bg-transparent"
          >
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-2 py-1 text-xs rounded border border-neutral-30 dark:border-neutral-60 bg-transparent w-32"
          />
          <select
            value={objectiveId}
            onChange={(e) => setObjectiveId(e.target.value)}
            className="px-2 py-1 text-xs rounded border border-neutral-30 dark:border-neutral-60 bg-transparent max-w-[140px]"
          >
            <option value="">Sin OKR</option>
            {allObjectives.map((o) => (
              <option key={o.id} value={o.id}>{o.title}</option>
            ))}
          </select>
          <button
            onClick={handleUpdate}
            className="p-1 rounded text-success hover:bg-success/10 transition-colors"
          >
            <Save size={14} />
          </button>
          <button
            onClick={() => {
              setEditing(false)
              setStatus(deliverable.status)
              setDueDate(deliverable.dueDate ? new Date(deliverable.dueDate).toISOString().split('T')[0] : '')
              setObjectiveId(deliverable.objectiveId ?? '')
            }}
            className="p-1 rounded text-neutral-50 hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded text-neutral-50 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
