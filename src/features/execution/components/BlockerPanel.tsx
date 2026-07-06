import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { AlertTriangle, ChevronDown, ChevronRight, Plus, RotateCcw, Trash2, X, Check, Pencil } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { MemberSelector } from '@/components/ui/MemberSelector'
import type { Blocker } from '@/types/domain'
import type { BlockerSeverity, BlockerStatus } from '@/constants/enums'
import { Button } from '@/components/ui/Button'
import { HtmlDescription } from '@/components/ui/HtmlDescription'

interface BlockerPanelProps {
  sourceType: 'task' | 'activity' | 'plan' | 'commitment'
  sourceId: string
}

const severityColors: Record<string, string> = {
  low: 'text-neutral-50 dark:text-neutral-40 border-neutral-30 bg-neutral-5',
  medium: 'text-warning border-warning/30 bg-warning/5',
  high: 'text-orange-500 border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20',
  critical: 'text-danger border-danger/30 bg-danger/5',
}

const statusBadge: Record<string, string> = {
  open: 'bg-warning/10 text-warning',
  escalated: 'bg-danger/10 text-danger',
  resolved: 'bg-success/10 text-success',
}

export function BlockerPanel({ sourceType, sourceId }: BlockerPanelProps) {
  const { confirm } = useConfirm()
  const [collapsed, setCollapsed] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSeverity, setEditSeverity] = useState<BlockerSeverity>('medium')
  const [editStatus, setEditStatus] = useState<BlockerStatus>('open')
  const [editAssigneeId, setEditAssigneeId] = useState('')
  const [editResolutionNotes, setEditResolutionNotes] = useState('')

  const blockers = useLiveQuery(
    () => db.blockers.where({ sourceType, sourceId }).toArray(),
    [sourceType, sourceId],
  )

  const resetForm = () => {
    setEditId(null)
    setEditTitle('')
    setEditDescription('')
    setEditSeverity('medium')
    setEditStatus('open')
    setEditAssigneeId('')
    setEditResolutionNotes('')
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!editTitle.trim()) return
    const now = new Date()
    const data = {
      sourceType,
      sourceId,
      title: editTitle.trim(),
      description: editDescription.trim(),
      severity: editSeverity,
      status: editStatus,
      raisedById: editId ? undefined : 'unknown',
      assigneeId: editAssigneeId || null,
      escalatedAt: editId ? undefined : null,
      resolvedAt: editStatus === 'resolved' ? now : (editId ? undefined : null),
      resolutionNotes: editResolutionNotes || null,
      updatedAt: now,
    }

    if (editId) {
      await db.blockers.update(editId, { ...data, createdAt: undefined })
    } else {
      await db.blockers.add({
        id: crypto.randomUUID(),
        ...data,
        raisedById: 'unknown',
        escalatedAt: null,
        resolvedAt: editStatus === 'resolved' ? now : null,
        metadata: {},
        createdAt: now,
      })
    }
    resetForm()
  }

  const handleEdit = (blocker: Blocker) => {
    setEditId(blocker.id)
    setEditTitle(blocker.title)
    setEditDescription(blocker.description)
    setEditSeverity(blocker.severity)
    setEditStatus(blocker.status)
    setEditAssigneeId(blocker.assigneeId ?? '')
    setEditResolutionNotes(blocker.resolutionNotes ?? '')
    setShowForm(true)
  }

  const handleReactivate = async (id: string) => {
    await db.blockers.update(id, {
      status: 'open',
      resolvedAt: null,
      updatedAt: new Date(),
    })
  }

  const handleDelete = async (id: string) => {
    if (!(await confirm('¿Eliminar este bloqueo?'))) return
    await db.blockers.delete(id)
  }

  const openCount = blockers?.filter((b) => b.status !== 'resolved').length ?? 0

  return (
    <div className="border border-boundary rounded-xl overflow-hidden">
      <Button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-10 dark:bg-neutral-80 hover:bg-neutral-20 dark:hover:bg-neutral-70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning" />
          <span className="font-medium text-sm text-neutral-80 dark:text-white">Bloqueos</span>
          {openCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-danger/10 text-danger">
              {openCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={(e) => { e.stopPropagation(); resetForm(); setShowForm(!showForm) }}
            className="p-1 rounded-md hover:bg-neutral-30 dark:hover:bg-neutral-60 transition-colors"
            title="Agregar bloqueo"
          >
            <Plus size={16} className="text-neutral-50" />
          </Button>
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </div>
      </Button>

      {!collapsed && (
        <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {/* Inline form for add/edit */}
          {showForm && (
            <div className="p-4 space-y-3 bg-neutral-10 dark:bg-neutral-80">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Titulo <span className="text-danger">*</span></label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="ej. Certificado SSL vencido"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Descripcion</label>
                <RichTextEditor
                  value={editDescription}
                  onChange={(html) => setEditDescription(html)}
                  placeholder="Que esta bloqueando, desde cuando..."
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Severidad</label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value as BlockerSeverity)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card text-sm"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Critica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Estado</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as BlockerStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card text-sm"
                  >
                    <option value="open">Abierto</option>
                    <option value="escalated">Escalado</option>
                    <option value="resolved">Resuelto</option>
                  </select>
                </div>
                <div>
                  <MemberSelector
                    label="Asignado"
                    value={editAssigneeId}
                    onChange={setEditAssigneeId}
                  />
                </div>
              </div>
              {editStatus === 'resolved' && (
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Notas de resolucion</label>
                  <RichTextEditor
                    value={editResolutionNotes}
                    onChange={(html) => setEditResolutionNotes(html)}
                    placeholder="Notas de resolución..."
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={resetForm}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-70 hover:bg-neutral-20 rounded-lg transition-colors"
                >
                  <X size={14} />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!editTitle.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Check size={14} />
                  {editId ? 'Actualizar' : 'Agregar'}
                </Button>
              </div>
            </div>
          )}

          {(!blockers || blockers.length === 0) && !showForm && (
            <div className="p-4 text-center text-xs text-neutral-50">Sin bloqueos reportados</div>
          )}

          {blockers?.map((blocker) => (
            <div key={blocker.id} className="px-4 py-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium text-neutral-80 dark:text-white truncate ${blocker.status === 'resolved' ? 'line-through' : ''}`}>
                      {blocker.title}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full text-nowrap ${statusBadge[blocker.status]}`}>
                      {blocker.status === 'open' ? 'Abierto' : blocker.status === 'escalated' ? 'Escalado' : 'Resuelto'}
                    </span>
                  </div>
                  {blocker.description && (
                    <HtmlDescription html={blocker.description} lines={2} />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-neutral-50">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${severityColors[blocker.severity]}`}>
                    {blocker.severity === 'low' ? 'Baja' : blocker.severity === 'medium' ? 'Media' : blocker.severity === 'high' ? 'Alta' : 'Critica'}
                  </span>
                  {blocker.assigneeId && (
                    <span>Asignado: {blocker.assigneeId}</span>
                  )}
                  {blocker.escalatedAt && (
                    <span className="text-danger">Escalado {new Date(blocker.escalatedAt).toLocaleDateString()}</span>
                  )}
                  {blocker.resolutionNotes && blocker.status === 'resolved' && (
                    <HtmlDescription html={blocker.resolutionNotes} lines={1} className="text-success max-w-[200px]" />
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {blocker.status === 'resolved' ? (
                    <Button
                      onClick={() => handleReactivate(blocker.id)}
                      className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
                      title="Reabrir"
                    >
                      <RotateCcw size={14} className="text-neutral-50" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleEdit(blocker)}
                      className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-primary transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(blocker.id)}
                    className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} className="text-neutral-50" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
