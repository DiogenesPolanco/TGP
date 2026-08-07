import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import type { VacationRecord } from '@/types/domain'
import { DatePicker } from '@/components/ui/DatePicker'
import { Plus, Trash2, Save, X, Umbrella, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/hooks/useConfirm'
import { parseLocalDate } from '@/lib/utils'

interface Props {
  memberId: string
}

function calcBusinessDays(start: Date, end: Date): number {
  let count = 0
  const d = new Date(start)
  while (d <= end) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

interface FormState {
  startDate: string
  endDate: string
  reason: string
}

const emptyForm: FormState = { startDate: todayStr(), endDate: todayStr(), reason: '' }

export function VacationsSection({ memberId }: Props) {
  const records =
    useLiveQuery(
      () => db.vacationRecords.where('memberId').equals(memberId).toArray(),
      [memberId],
    ) ?? []

  const profile = useLiveQuery(() => db.memberProfiles.get(memberId), [memberId]) ?? null

  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)
  const { confirm } = useConfirm()

  const totalUsed = records.reduce((s, r) => s + r.days, 0)
  const vacationDaysPerYear = profile?.vacationDaysPerYear ?? 14
  const remaining = vacationDaysPerYear - totalUsed

  const syncVacationUsed = async () => {
    const allRecords = await db.vacationRecords.where('memberId').equals(memberId).toArray()
    const newTotal = allRecords.reduce((s, r) => s + r.days, 0)
    const existing = await db.memberProfiles.get(memberId)
    if (existing) {
      await db.memberProfiles.put({ ...existing, vacationUsed: newTotal, updatedAt: new Date() })
    }
  }

  const handleAdd = async () => {
    const start = parseLocalDate(form.startDate)
    const end = parseLocalDate(form.endDate)
    const days = calcBusinessDays(start, end)
    if (days === 0) return
    const record: VacationRecord = {
      id: crypto.randomUUID(),
      memberId,
      startDate: start,
      endDate: end,
      days,
      reason: form.reason,
      createdAt: new Date(),
    }
    await db.vacationRecords.add(record)
    await syncVacationUsed()
    setForm(emptyForm)
    setAdding(false)
  }

  const handleUpdate = async (id: string) => {
    const start = parseLocalDate(editForm.startDate)
    const end = parseLocalDate(editForm.endDate)
    const days = calcBusinessDays(start, end)
    if (days === 0) return
    await db.vacationRecords.update(id, {
      startDate: start,
      endDate: end,
      days,
      reason: editForm.reason,
    })
    await syncVacationUsed()
    setEditingId(null)
  }

  const handleDelete = async (r: VacationRecord) => {
    if (
      !(await confirm(
        `¿Eliminar este registro de vacaciones (${r.days} días, desde ${formatDate(r.startDate)})?`,
      ))
    )
      return
    await db.vacationRecords.delete(r.id)
    await syncVacationUsed()
  }

  const startEdit = (r: VacationRecord) => {
    setEditingId(r.id)
    setEditForm({
      startDate: formatDate(r.startDate),
      endDate: formatDate(r.endDate),
      reason: r.reason,
    })
  }

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Umbrella size={20} className="text-info" />
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-90 dark:text-white">
                {totalUsed} / {vacationDaysPerYear} días
              </p>
              <p className="text-xs text-neutral-50">Usados / Disponibles por año</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${remaining < 0 ? 'text-danger' : 'text-success'}`}>
              {remaining >= 0 ? remaining : `-${Math.abs(remaining)}`}
            </p>
            <p className="text-xs text-neutral-50">Restantes</p>
          </div>
        </div>
      </div>

      {/* Records list */}
      <div className="bg-card rounded-xl border border-boundary shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-boundary">
          <h3 className="text-sm font-medium text-neutral-90 dark:text-white">
            Registro de Vacaciones
          </h3>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>

        {adding && (
          <div className="p-4 border-b border-boundary bg-neutral-10 dark:bg-neutral-70 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-50 mb-1">Inicio</label>
                <DatePicker
                  value={form.startDate}
                  onChange={(v) => setForm({ ...form, startDate: v })}
                  className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-50 mb-1">Fin</label>
                <DatePicker
                  value={form.endDate}
                  onChange={(v) => setForm({ ...form, endDate: v })}
                  className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-50 mb-1">Motivo</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-1.5 text-sm"
                placeholder="Vacaciones anuales, permiso personal, etc."
              />
            </div>
            {form.startDate && form.endDate && (
              <p className="text-xs text-neutral-50">
                Días hábiles:{' '}
                <span className="font-semibold text-neutral-90 dark:text-white">
                  {calcBusinessDays(parseLocalDate(form.startDate), parseLocalDate(form.endDate))}
                </span>
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAdd}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Save size={14} /> Guardar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setAdding(false)
                  setForm(emptyForm)
                }}
                className="flex items-center gap-1 px-3 py-1.5 border border-neutral-30 dark:border-neutral-60 text-sm rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
              >
                <X size={14} /> Cancelar
              </Button>
            </div>
          </div>
        )}

        {records.length === 0 && !adding && (
          <div className="text-center py-8">
            <Calendar size={32} className="mx-auto text-neutral-30 mb-2" />
            <p className="text-sm text-neutral-50">Sin registros de vacaciones</p>
          </div>
        )}

        <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {records.toReversed().map((record) => (
            <div
              key={record.id}
              className="px-4 py-3 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors group"
            >
              {editingId === record.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-50 mb-1">Inicio</label>
                      <DatePicker
                        value={editForm.startDate}
                        onChange={(v) => setEditForm({ ...editForm, startDate: v })}
                        className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-50 mb-1">Fin</label>
                      <DatePicker
                        value={editForm.endDate}
                        onChange={(v) => setEditForm({ ...editForm, endDate: v })}
                        className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editForm.reason}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-1.5 text-sm"
                  />
                  {editForm.startDate && editForm.endDate && (
                    <p className="text-xs text-neutral-50">
                      Días hábiles:{' '}
                      <span className="font-semibold">
                        {calcBusinessDays(
                          parseLocalDate(editForm.startDate),
                          parseLocalDate(editForm.endDate),
                        )}
                      </span>
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handleUpdate(record.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <Save size={14} /> Guardar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-neutral-30 dark:border-neutral-60 text-sm rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                    >
                      <X size={14} /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="shrink-0 text-center">
                      <p className="text-sm font-bold text-neutral-90 dark:text-white">
                        {record.days}
                      </p>
                      <p className="text-[10px] text-neutral-50">días</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-neutral-90 dark:text-white">
                        {new Date(record.startDate).toLocaleDateString()} →{' '}
                        {new Date(record.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-neutral-50 truncate">
                        {record.reason || 'Sin motivo'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(record)}
                      className="p-1.5 rounded-md text-neutral-50 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Editar"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(record)}
                      className="p-1.5 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
