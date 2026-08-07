import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowRight, ChevronDown, ChevronRight, Link2, Plus, Trash2 } from 'lucide-react'
import type { DependencyRelation } from '@/constants/enums'
import { Select } from '@/components/ui/Select'
import { useConfirm } from '@/hooks/useConfirm'

interface DependencyListProps {
  planId: string
}

type EntityType = 'plan' | 'activity' | 'task' | 'deliverable' | 'commitment'

const entityTypeLabels: Record<EntityType, string> = {
  plan: 'Plan',
  activity: 'Actividad',
  task: 'Tarea',
  deliverable: 'Entregable',
  commitment: 'Compromiso',
}

const relationLabels: Record<DependencyRelation, string> = {
  depends_on: 'Depende de',
  blocks: 'Bloquea a',
  related_to: 'Relacionado con',
}

const relationColors: Record<DependencyRelation, string> = {
  depends_on: 'text-warning border-warning/30 bg-warning/5',
  blocks: 'text-danger border-danger/30 bg-danger/5',
  related_to: 'text-primary border-primary/30 bg-primary/5',
}

export function DependencyList({ planId }: DependencyListProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [targetType, setTargetType] = useState<EntityType>('plan')
  const [targetId, setTargetId] = useState('')
  const [relationType, setRelationType] = useState<DependencyRelation>('depends_on')
  const [description, setDescription] = useState('')
  const { confirm } = useConfirm()

  const plans = useLiveQuery(() => db.plans.toArray())
  const activities = useLiveQuery(() => db.activities.where('planId').equals(planId).toArray())
  const tasks = useLiveQuery(() => db.tasks.where('planId').equals(planId).toArray())
  const deliverables = useLiveQuery(() => db.deliverables.toArray())
  const commitments = useLiveQuery(() => db.commitments.toArray())
  const dependencies = useLiveQuery(
    () => db.dependencies.where({ sourceType: 'plan', sourceId: planId }).toArray(),
    [planId],
  )
  const reverseDeps = useLiveQuery(
    () => db.dependencies.where({ targetType: 'plan', targetId: planId }).toArray(),
    [planId],
  )

  const getEntityOptions = () => {
    switch (targetType) {
      case 'plan':
        return (
          plans?.filter((p) => p.id !== planId).map((p) => ({ value: p.id, label: p.title })) ?? []
        )
      case 'activity':
        return activities?.map((act) => ({ value: act.id, label: act.title })) ?? []
      case 'task':
        return tasks?.map((t) => ({ value: t.id, label: t.title })) ?? []
      case 'deliverable':
        return deliverables?.map((d) => ({ value: d.id, label: d.title })) ?? []
      case 'commitment':
        return commitments?.map((c) => ({ value: c.id, label: c.title })) ?? []
      default:
        return []
    }
  }

  const getEntityName = (type: string, id: string): string => {
    switch (type) {
      case 'plan':
        return plans?.find((p) => p.id === id)?.title ?? id
      case 'activity':
        return activities?.find((a) => a.id === id)?.title ?? id
      case 'task':
        return tasks?.find((t) => t.id === id)?.title ?? id
      case 'deliverable':
        return deliverables?.find((d) => d.id === id)?.title ?? id
      case 'commitment':
        return commitments?.find((c) => c.id === id)?.title ?? id
      default:
        return id
    }
  }

  const handleAdd = async () => {
    if (!targetId) return
    await db.dependencies.add({
      id: crypto.randomUUID(),
      sourceType: 'plan',
      sourceId: planId,
      targetType,
      targetId,
      relationType,
      description,
      status: 'active',
      expectedResolutionDate: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    setTargetType('plan')
    setTargetId('')
    setRelationType('depends_on')
    setDescription('')
    setShowForm(false)
  }

  const handleRemove = async (dep: { id: string; targetType: string; targetId: string }) => {
    if (
      !(await confirm(
        `¿Eliminar esta dependencia hacia "${getEntityName(dep.targetType, dep.targetId)}"?`,
      ))
    )
      return
    await db.dependencies.delete(dep.id)
  }

  const allDeps = [
    ...(dependencies?.map((d) => ({
      dep: d,
      relatedName: getEntityName(d.targetType, d.targetId),
      label: relationLabels[d.relationType],
      isIncoming: false,
    })) ?? []),
    ...(reverseDeps
      ?.filter((d) => d.sourceId !== planId)
      .map((d) => ({
        dep: d,
        relatedName: getEntityName(d.sourceType, d.sourceId),
        label: `Depende de este plan`,
        isIncoming: true,
      })) ?? []),
  ]

  return (
    <div className="border border-boundary rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-10 dark:bg-neutral-80 hover:bg-neutral-20 dark:hover:bg-neutral-70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Link2 size={16} className="text-primary" />
          <span className="font-medium text-sm text-neutral-80 dark:text-white">Dependencias</span>
          {allDeps.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
              {allDeps.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowForm(!showForm)
            }}
            className="p-1 rounded-md hover:bg-neutral-30 dark:hover:bg-neutral-60 transition-colors"
            title="Agregar dependencia"
          >
            <Plus size={16} className="text-neutral-50" />
          </button>
          {collapsed ? (
            <ChevronRight size={16} className="text-neutral-50" />
          ) : (
            <ChevronDown size={16} className="text-neutral-50" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {showForm && (
            <div className="p-4 space-y-3 bg-neutral-10 dark:bg-neutral-80">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">
                  Tipo destino
                </label>
                <Select
                  value={targetType}
                  onChange={(v) => {
                    setTargetType(v as EntityType)
                    setTargetId('')
                  }}
                  options={(Object.keys(entityTypeLabels) as EntityType[]).map((key) => ({
                    value: key,
                    label: entityTypeLabels[key],
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">
                  Entidad destino
                </label>
                <Select
                  value={targetId}
                  onChange={(v) => setTargetId(v)}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    ...getEntityOptions()
                      .filter((opt) => opt.value !== planId)
                      .map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      })),
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Relación</label>
                <Select
                  value={relationType}
                  onChange={(v) => setRelationType(v as DependencyRelation)}
                  options={[
                    { value: 'depends_on', label: 'Depende de' },
                    { value: 'blocks', label: 'Bloquea a' },
                    { value: 'related_to', label: 'Relacionado con' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="¿Qué tipo de dependencia?"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-70 dark:text-neutral-50 hover:bg-neutral-20 dark:hover:bg-neutral-60 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!targetId}
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </div>
          )}

          {allDeps.length === 0 && !showForm && (
            <div className="p-4 text-center text-xs text-neutral-50">
              Sin dependencias registradas
            </div>
          )}

          {dependencies?.map((dep) => (
            <div key={dep.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-nowrap px-2 py-0.5 text-[10px] font-semibold rounded-full border ${relationColors[dep.relationType]}`}
                >
                  {relationLabels[dep.relationType]}
                </span>
                <ArrowRight size={12} className="text-neutral-50 shrink-0" />
                <span className="text-sm text-neutral-80 dark:text-white truncate">
                  {getEntityName(dep.targetType, dep.targetId)}
                </span>
                {dep.description && (
                  <span className="text-xs text-neutral-50 hidden sm:inline truncate">
                    - {dep.description}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(dep)}
                className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors shrink-0 ml-2"
              >
                <Trash2 size={14} className="text-neutral-50 hover:text-danger" />
              </button>
            </div>
          ))}

          {reverseDeps
            ?.filter((d) => d.sourceId !== planId)
            .map((dep) => (
              <div
                key={`rev-${dep.id}`}
                className="flex items-center justify-between px-4 py-3 bg-neutral-10 dark:bg-neutral-80"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-nowrap px-2 py-0.5 text-[10px] font-semibold rounded-full border border-neutral-30 bg-neutral-10 text-neutral-60">
                    Depende de este plan
                  </span>
                  <ArrowRight size={12} className="text-neutral-50 shrink-0" />
                  <span className="text-sm text-neutral-80 dark:text-white truncate">
                    {getEntityName(dep.sourceType, dep.sourceId)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
