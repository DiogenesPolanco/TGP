import { Edit3, Trash2 } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { SprintRecord, TeamSprint } from '@/types/domain'

interface Props {
  sprint: SprintRecord
  isEditing: boolean
  editSprintName: string
  editQuarter: string
  editYear: number
  editSpCompleted: number
  editSpNotCompleted: number
  teamSprints: TeamSprint[]
  onEdit: (sp: SprintRecord) => void
  onSave: () => void
  onCancel: () => void
  onRemove: (id: string) => void
  onEditField: (field: string, value: string | number) => void
  onEditSprintSelect: (sprintName: string) => void
}

export function SprintListItem({
  sprint,
  isEditing,
  editSprintName,
  editQuarter,
  editYear: _editYear,
  editSpCompleted,
  editSpNotCompleted,
  teamSprints,
  onEdit,
  onSave,
  onCancel,
  onRemove,
  onEditField,
  onEditSprintSelect,
}: Props) {
  if (isEditing) {
    return (
      <div className="p-3 bg-card rounded-lg border border-neutral-30 dark:border-neutral-60">
        <div className="grid gap-2 sm:grid-cols-5 mb-2">
          <div className="sm:col-span-2">
            <select
              value={editSprintName}
              onChange={(e) => onEditSprintSelect(e.target.value)}
              className="w-full rounded border border-neutral-30 dark:border-neutral-60 bg-transparent px-2 py-1 text-xs"
            >
              <option value="">Seleccionar...</option>
              {teamSprints.map((ts) => (
                <option key={ts.id} value={ts.sprintName}>
                  {ts.sprintName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Select
              value={editQuarter}
              onChange={(v) => onEditField('quarter', v)}
              options={[
                { value: 'Q1', label: 'Q1' },
                { value: 'Q2', label: 'Q2' },
                { value: 'Q3', label: 'Q3' },
                { value: 'Q4', label: 'Q4' },
              ]}
            />
          </div>
          <div>
            <input
              type="number"
              value={editSpCompleted}
              onChange={(e) => onEditField('storyPointsCompleted', Number(e.target.value))}
              className="w-full rounded border border-neutral-30 dark:border-neutral-60 bg-transparent px-2 py-1 text-xs"
              placeholder="SP completados"
              min={0}
            />
          </div>
          <div>
            <input
              type="number"
              value={editSpNotCompleted}
              onChange={(e) => onEditField('storyPointsNotCompleted', Number(e.target.value))}
              className="w-full rounded border border-neutral-30 dark:border-neutral-60 bg-transparent px-2 py-1 text-xs"
              placeholder="SP no completados"
              min={0}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSave}
            className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark"
          >
            Guardar
          </Button>
          <Button
            onClick={onCancel}
            className="px-3 py-1 text-xs text-neutral-60 hover:text-neutral-90"
          >
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg group/sprint">
      <div>
        <p className="text-sm font-medium text-neutral-90 dark:text-white">{sprint.sprintName}</p>
        <p className="text-xs text-neutral-50">
          {sprint.storyPointsCompleted} SP completados · {sprint.storyPointsNotCompleted} SP no
          completados
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-primary">{sprint.storyPointsCompleted} SP</span>
        <button
          onClick={() => onEdit(sprint)}
          className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted hover:text-neutral-90 dark:hover:text-white"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={() => onRemove(sprint.id)}
          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-muted hover:text-red-600 dark:hover:text-red-400"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
