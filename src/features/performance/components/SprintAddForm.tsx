import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { TeamSprint } from '@/types/domain'

interface Props {
  sprintName: string
  quarter: string
  year: number
  storyPointsCompleted: number
  storyPointsNotCompleted: number
  loadingTeamSprints: boolean
  sprintSelectOptions: TeamSprint[]
  teamSprints: TeamSprint[]
  onChange: (data: {
    sprintName: string
    quarter: string
    year: number
    storyPointsCompleted: number
    storyPointsNotCompleted: number
  }) => void
  onSave: () => void
  onCancel: () => void
  onSelectTeamSprint: (name: string) => void
}

const inputClass =
  'w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary'

export function SprintAddForm({
  sprintName,
  quarter,
  year,
  storyPointsCompleted,
  storyPointsNotCompleted,
  loadingTeamSprints,
  sprintSelectOptions,
  teamSprints,
  onChange,
  onSave,
  onCancel,
  onSelectTeamSprint,
}: Props) {
  const noOptionsLabel =
    !loadingTeamSprints && sprintSelectOptions.length === 0 && teamSprints.length === 0
      ? 'No hay sprints registrados para este equipo. Agrégalos desde la página del equipo.'
      : 'Todos los sprints del equipo ya están registrados'

  return (
    <div className="mb-6 p-4 border border-boundary rounded-lg bg-neutral-10 dark:bg-neutral-70">
      <div className="grid gap-3 sm:grid-cols-5 mb-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-neutral-60 mb-1 block">
            Sprint del Equipo
          </label>
          <select
            value={sprintName}
            onChange={(e) => onSelectTeamSprint(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar sprint...</option>
            {sprintSelectOptions.map((ts) => {
              const startStr =
                ts.startDate instanceof Date ? ts.startDate.toLocaleDateString('es-ES') : ''
              const endStr =
                ts.endDate instanceof Date ? ts.endDate.toLocaleDateString('es-ES') : ''
              return (
                <option key={ts.id} value={ts.sprintName}>
                  {ts.sprintName} ({startStr} — {endStr}) — Plan: {ts.plannedSP} SP
                </option>
              )
            })}
            {!loadingTeamSprints && sprintSelectOptions.length === 0 && (
              <option value="" disabled>
                {noOptionsLabel}
              </option>
            )}
            {loadingTeamSprints && (
              <option value="" disabled>
                Cargando sprints del equipo...
              </option>
            )}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">Quarter</label>
          <Select
            value={quarter}
            onChange={(v) =>
              onChange({
                sprintName,
                quarter: v,
                year,
                storyPointsCompleted,
                storyPointsNotCompleted,
              })
            }
            options={[
              { value: 'Q1', label: 'Q1' },
              { value: 'Q2', label: 'Q2' },
              { value: 'Q3', label: 'Q3' },
              { value: 'Q4', label: 'Q4' },
            ]}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">Año</label>
          <input
            type="number"
            value={year}
            onChange={(e) =>
              onChange({
                sprintName,
                quarter,
                year: Number(e.target.value),
                storyPointsCompleted,
                storyPointsNotCompleted,
              })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">
            SP No Completados
          </label>
          <input
            type="number"
            value={storyPointsNotCompleted}
            onChange={(e) =>
              onChange({
                sprintName,
                quarter,
                year,
                storyPointsCompleted,
                storyPointsNotCompleted: Number(e.target.value),
              })
            }
            className={inputClass}
            min={0}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">SP Completados</label>
          <input
            type="number"
            value={storyPointsCompleted}
            onChange={(e) =>
              onChange({
                sprintName,
                quarter,
                year,
                storyPointsCompleted: Number(e.target.value),
                storyPointsNotCompleted,
              })
            }
            className={inputClass}
            min={0}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
        >
          Guardar Sprint
        </Button>
        <Button
          onClick={onCancel}
          variant="ghost"
          className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
