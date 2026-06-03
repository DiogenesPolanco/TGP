import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { AlertTriangle, ChevronDown, ChevronRight, Plus, RotateCcw, X } from 'lucide-react'
import { BlockerForm } from './BlockerForm'
import type { Blocker } from '@/types/domain'

interface BlockerPanelProps {
  sourceType: 'task' | 'activity' | 'plan' | 'commitment'
  sourceId: string
}

const severityColors: Record<string, string> = {
  low: 'text-neutral-50 dark:text-neutral-40',
  medium: 'text-warning',
  high: 'text-orange-500',
  critical: 'text-danger',
}

const statusBadge: Record<string, string> = {
  open: 'bg-warning/10 text-warning',
  escalated: 'bg-danger/10 text-danger',
  resolved: 'bg-success/10 text-success',
}

export function BlockerPanel({ sourceType, sourceId }: BlockerPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingBlocker, setEditingBlocker] = useState<Blocker | null>(null)
  const [resolvingBlocker, setResolvingBlocker] = useState<Blocker | null>(null)

  const blockers = useLiveQuery(
    () => db.blockers.where({ sourceType, sourceId }).toArray(),
    [sourceType, sourceId],
  )

  const handleReactivate = async (id: string) => {
    await db.blockers.update(id, {
      status: 'open',
      resolvedAt: null,
      updatedAt: new Date(),
    })
  }

  const handleDelete = async (id: string) => {
    await db.blockers.delete(id)
  }

  const openCount = blockers?.filter((b) => b.status !== 'resolved').length ?? 0

  return (
    <div className="border border-neutral-20 dark:border-neutral-70 rounded-xl overflow-hidden">
      <button
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
          <button
            onClick={(e) => { e.stopPropagation(); setShowForm(true) }}
            className="p-1 rounded-md hover:bg-neutral-30 dark:hover:bg-neutral-60 transition-colors"
            title="Reportar bloqueo"
          >
            <Plus size={16} className="text-neutral-50" />
          </button>
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {!collapsed && (
        <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {(!blockers || blockers.length === 0) && (
            <div className="p-4 text-center text-xs text-neutral-50">Sin bloqueos reportados</div>
          )}
          {blockers?.map((blocker) => (
            <div key={blocker.id} className="p-4 space-y-2">
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
                    <p className="mt-1 text-xs text-neutral-60 dark:text-neutral-40">{blocker.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingBlocker(blocker)}
                    className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
                    title="Editar"
                  >
                    <span className="text-xs text-neutral-50">Editar</span>
                  </button>
                  {blocker.status === 'resolved' ? (
                    <button
                      onClick={() => handleReactivate(blocker.id)}
                      className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
                      title="Reabrir"
                    >
                      <RotateCcw size={14} className="text-neutral-50" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setResolvingBlocker(blocker)}
                      className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
                      title="Resolver"
                    >
                      <span className="text-xs text-success">Resolver</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(blocker.id)}
                    className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
                    title="Eliminar"
                  >
                    <X size={14} className="text-neutral-50" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-50">
                <span className={`font-medium ${severityColors[blocker.severity]}`}>
                  {blocker.severity === 'low' ? 'Baja' : blocker.severity === 'medium' ? 'Media' : blocker.severity === 'high' ? 'Alta' : 'Critica'}
                </span>
                {blocker.assigneeId && (
                  <span>Asignado: {blocker.assigneeId}</span>
                )}
                {blocker.escalatedAt && (
                  <span className="text-danger">Escalado {new Date(blocker.escalatedAt).toLocaleDateString()}</span>
                )}
                {blocker.resolutionNotes && blocker.status === 'resolved' && (
                  <span className="text-success">{blocker.resolutionNotes}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <BlockerForm
          blocker={null}
          sourceType={sourceType}
          sourceId={sourceId}
          onClose={() => setShowForm(false)}
          onSave={() => setShowForm(false)}
        />
      )}

      {editingBlocker && (
        <BlockerForm
          blocker={editingBlocker}
          sourceType={sourceType}
          sourceId={sourceId}
          onClose={() => setEditingBlocker(null)}
          onSave={() => setEditingBlocker(null)}
        />
      )}

      {resolvingBlocker && (
        <BlockerForm
          blocker={{ ...resolvingBlocker, status: 'resolved' as const }}
          sourceType={sourceType}
          sourceId={sourceId}
          onClose={() => setResolvingBlocker(null)}
          onSave={() => setResolvingBlocker(null)}
        />
      )}
    </div>
  )
}
