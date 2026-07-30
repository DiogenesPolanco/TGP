import { useState, useCallback } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { TeamMember } from '@/types/domain'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { todayStr, inputClass, validateAgainstMembers } from './teamSprintHelpers'

interface FormValues {
  sprintName: string
  quarter: string
  year: number
  startDate: string
  endDate: string
  plannedSP: number
  completedSP: number
  notCompletedSP: number
}

interface Props {
  initial?: FormValues
  members: TeamMember[]
  memberIds: Set<string>
  onSave: (values: FormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function SprintForm({ initial, members, memberIds, onSave, onCancel, submitLabel }: Props) {
  const [form, setForm] = useState<FormValues>(
    initial ?? {
      sprintName: '',
      quarter: 'Q2',
      year: new Date().getFullYear(),
      startDate: todayStr(),
      endDate: todayStr(),
      plannedSP: 0,
      completedSP: 0,
      notCompletedSP: 0,
    },
  )
  const [validationMsg, setValidationMsg] = useState<{ type: 'ok' | 'warn'; text: string } | null>(
    null,
  )

  const handleValidate = useCallback(async () => {
    if (!form.sprintName.trim()) return
    const msg = await validateAgainstMembers(
      form.sprintName,
      form.completedSP,
      form.notCompletedSP,
      memberIds,
      members,
    )
    setValidationMsg(msg)
  }, [form.sprintName, form.completedSP, form.notCompletedSP, memberIds, members])

  const handleFieldBlur = useCallback(async () => {
    if (form.sprintName.trim()) {
      const msg = await validateAgainstMembers(
        form.sprintName,
        form.completedSP,
        form.notCompletedSP,
        memberIds,
        members,
      )
      setValidationMsg(msg)
    }
  }, [form.sprintName, form.completedSP, form.notCompletedSP, memberIds, members])

  const update = (patch: Partial<FormValues>) => setForm({ ...form, ...patch })

  return (
    <div className="mb-6 p-4 border border-boundary rounded-lg bg-neutral-10 dark:bg-neutral-70">
      <div className="grid gap-3 sm:grid-cols-4 mb-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-neutral-60 mb-1 block">
            Nombre del Sprint
          </label>
          <input
            type="text"
            value={form.sprintName}
            onChange={(e) => update({ sprintName: e.target.value })}
            className={inputClass}
            placeholder="Sprint 5"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">Quarter</label>
          <Select
            value={form.quarter}
            onChange={(v) => update({ quarter: v })}
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
            value={form.year}
            onChange={(e) => update({ year: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha Inicio</label>
          <DatePicker
            value={form.startDate}
            onChange={(v) => update({ startDate: v })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha Fin</label>
          <DatePicker
            value={form.endDate}
            onChange={(v) => update({ endDate: v })}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 mb-3">
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">
            SP Planificados
          </label>
          <input
            type="number"
            value={form.plannedSP}
            onChange={(e) => update({ plannedSP: Number(e.target.value) })}
            className={inputClass}
            min={0}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">SP Completados</label>
          <input
            type="number"
            value={form.completedSP}
            onChange={(e) => update({ completedSP: Number(e.target.value) })}
            onBlur={handleFieldBlur}
            className={inputClass}
            min={0}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">
            SP No Completados
          </label>
          <input
            type="number"
            value={form.notCompletedSP}
            onChange={(e) => update({ notCompletedSP: Number(e.target.value) })}
            onBlur={handleFieldBlur}
            className={inputClass}
            min={0}
          />
        </div>
      </div>

      {validationMsg && (
        <div
          className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs ${
            validationMsg.type === 'ok'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
          }`}
        >
          {validationMsg.type === 'ok' ? (
            <CheckCircle2 size={14} />
          ) : (
            <AlertTriangle size={14} />
          )}
          <span>{validationMsg.text}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => onSave(form)}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
        >
          {submitLabel ?? 'Guardar Sprint'}
        </Button>
        <Button
          onClick={handleValidate}
          className="px-3 py-2 text-sm text-neutral-60 hover:text-primary border border-neutral-30 dark:border-neutral-60 rounded-lg hover:border-primary/30"
        >
          Validar vs Miembros
        </Button>
        <Button
          onClick={onCancel}
          className="px-3 py-2 text-sm text-neutral-60 hover:text-neutral-90"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
