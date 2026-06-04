import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import type { SprintRecord } from '@/types/domain'
import { Plus, Trash2 } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'

interface Props {
  memberId: string
}

export function SprintsSection({ memberId }: Props) {
  const { confirm } = useConfirm()
  const [sprints, setSprints] = useState<SprintRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newSprint, setNewSprint] = useState({
    sprintName: '',
    quarter: 'Q1',
    year: new Date().getFullYear(),
    storyPointsCompleted: 0,
    storyPointsNotCompleted: 0,
  })

  useEffect(() => {
    db.sprintRecords.where('memberId').equals(memberId).toArray().then(setSprints)
  }, [memberId])

  const addSprint = async () => {
    if (!newSprint.sprintName.trim()) return
    const record: SprintRecord = {
      id: crypto.randomUUID(),
      memberId,
      ...newSprint,
      createdAt: new Date(),
    }
    await db.sprintRecords.add(record)
    setSprints([...sprints, record])
    setShowForm(false)
    setNewSprint({ sprintName: '', quarter: 'Q1', year: new Date().getFullYear(), storyPointsCompleted: 0, storyPointsNotCompleted: 0 })
  }

  const removeSprint = async (id: string) => {
    const ok = await confirm('¿Estás seguro de eliminar este sprint?')
    if (!ok) return
    await db.sprintRecords.delete(id)
    setSprints(sprints.filter((s) => s.id !== id))
  }

  const totalSP = sprints.reduce((s, sp) => s + sp.storyPointsCompleted, 0)
  const totalNotDone = sprints.reduce((s, sp) => s + sp.storyPointsNotCompleted, 0)
  const efficiency = totalSP + totalNotDone > 0 ? Math.round((totalSP / (totalSP + totalNotDone)) * 100) : 0

  const groupedByQuarter = sprints.reduce<Record<string, SprintRecord[]>>((acc, s) => {
    const key = `${s.year} ${s.quarter}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const inputClass = 'w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Sprints</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Agregar Sprint
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
          <p className="text-xl font-bold text-primary">{totalSP}</p>
          <p className="text-xs text-neutral-50">SP Completados</p>
        </div>
        <div className="text-center p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
          <p className="text-xl font-bold text-green-600">{efficiency}%</p>
          <p className="text-xs text-neutral-50">Eficiencia</p>
        </div>
        <div className="text-center p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
          <p className="text-xl font-bold text-neutral-90 dark:text-white">{sprints.length}</p>
          <p className="text-xs text-neutral-50">Sprints</p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-6 p-4 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-neutral-10 dark:bg-neutral-70">
          <div className="grid gap-3 sm:grid-cols-5 mb-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Nombre del Sprint</label>
              <input
                type="text"
                value={newSprint.sprintName}
                onChange={(e) => setNewSprint({ ...newSprint, sprintName: e.target.value })}
                className={inputClass}
                placeholder="Sprint 1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Quarter</label>
              <select
                value={newSprint.quarter}
                onChange={(e) => setNewSprint({ ...newSprint, quarter: e.target.value })}
                className={inputClass}
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Año</label>
              <input
                type="number"
                value={newSprint.year}
                onChange={(e) => setNewSprint({ ...newSprint, year: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">SP No Completados</label>
              <input
                type="number"
                value={newSprint.storyPointsNotCompleted}
                onChange={(e) => setNewSprint({ ...newSprint, storyPointsNotCompleted: Number(e.target.value) })}
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
                value={newSprint.storyPointsCompleted}
                onChange={(e) => setNewSprint({ ...newSprint, storyPointsCompleted: Number(e.target.value) })}
                className={inputClass}
                min={0}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addSprint} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">
              Guardar Sprint
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {Object.keys(groupedByQuarter).length === 0 ? (
        <p className="text-center py-8 text-neutral-40">Sin sprints registrados</p>
      ) : (
        Object.entries(groupedByQuarter).map(([quarter, records]) => (
          <div key={quarter} className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-50 mb-2">{quarter}</h3>
            <div className="space-y-2">
              {records.map((sp) => (
                <div
                  key={sp.id}
                  className="flex items-center justify-between p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-90 dark:text-white">{sp.sprintName}</p>
                    <p className="text-xs text-neutral-50">
                      {sp.storyPointsCompleted} SP done · {sp.storyPointsNotCompleted} SP no completados
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">{sp.storyPointsCompleted} SP</span>
                    <button
                      onClick={() => removeSprint(sp.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar sprint"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
