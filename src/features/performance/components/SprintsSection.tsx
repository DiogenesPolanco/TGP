import { useEffect, useMemo, useState } from 'react'
import { db } from '@/services/db/database'
import type { SprintRecord, TeamSprint } from '@/types/domain'
import { Plus, Trash2, Edit3, BarChart3, List } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface Props {
  memberId: string
  teamId: string
}

type ViewMode = 'list' | 'chart'

export function SprintsSection({ memberId, teamId }: Props) {
  const { confirm } = useConfirm()
  const [sprints, setSprints] = useState<SprintRecord[]>([])
  const [teamSprints, setTeamSprints] = useState<TeamSprint[]>([])
  const [loadingTeamSprints, setLoadingTeamSprints] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('chart')
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [quarterFilter, setQuarterFilter] = useState<string | 'all'>('all')

  const [newSprint, setNewSprint] = useState({
    sprintName: '',
    quarter: 'Q2',
    year: new Date().getFullYear(),
    storyPointsCompleted: 0,
    storyPointsNotCompleted: 0,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    sprintName: '',
    quarter: 'Q1',
    year: new Date().getFullYear(),
    storyPointsCompleted: 0,
    storyPointsNotCompleted: 0,
  })

  useEffect(() => {
    db.sprintRecords.where('memberId').equals(memberId).toArray().then(setSprints)
  }, [memberId])

  useEffect(() => {
    db.teamSprints.where('teamId').equals(teamId).toArray().then((data) => {
      setTeamSprints(data)
      setLoadingTeamSprints(false)
    })
  }, [teamId])

  const availableYears = useMemo(() => {
    const years = new Set(sprints.map((s) => s.year))
    return Array.from(years).sort((a, b) => b - a)
  }, [sprints])

  const filteredSprints = useMemo(() => {
    return sprints.filter((s) => {
      if (yearFilter !== 'all' && s.year !== yearFilter) return false
      if (quarterFilter !== 'all' && s.quarter !== quarterFilter) return false
      return true
    })
  }, [sprints, yearFilter, quarterFilter])

  const chartData = useMemo(() => {
    return [...filteredSprints]
      .sort((a, b) => {
        const nameA = a.sprintName.toLowerCase()
        const nameB = b.sprintName.toLowerCase()
        return nameA.localeCompare(nameB)
      })
      .map((s) => ({
        name: s.sprintName.length > 12 ? s.sprintName.slice(0, 12) + '...' : s.sprintName,
        completados: s.storyPointsCompleted,
        noCompletados: s.storyPointsNotCompleted,
        eficiencia: s.storyPointsCompleted + s.storyPointsNotCompleted > 0
          ? Math.round((s.storyPointsCompleted / (s.storyPointsCompleted + s.storyPointsNotCompleted)) * 100)
          : 0,
      }))
  }, [filteredSprints])

  const handleTeamSprintSelect = (sprintName: string, setter: typeof setNewSprint | typeof setEditData, current: typeof newSprint | typeof editData) => {
    const ts = teamSprints.find((s) => s.sprintName === sprintName)
    setter({
      ...current,
      sprintName,
      quarter: ts?.quarter ?? current.quarter,
      year: ts?.year ?? current.year,
    })
  }

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

  const startEdit = (sp: SprintRecord) => {
    setEditingId(sp.id)
    setEditData({
      sprintName: sp.sprintName,
      quarter: sp.quarter,
      year: sp.year,
      storyPointsCompleted: sp.storyPointsCompleted,
      storyPointsNotCompleted: sp.storyPointsNotCompleted,
    })
  }

  const saveEdit = async () => {
    if (!editingId || !editData.sprintName.trim()) return
    const updated = sprints.map((sp) =>
      sp.id === editingId
        ? { ...sp, ...editData, sprintName: editData.sprintName.trim() }
        : sp
    )
    const record = updated.find((sp) => sp.id === editingId)!
    await db.sprintRecords.put(record)
    setSprints(updated)
    setEditingId(null)
  }

  const removeSprint = async (id: string) => {
    const ok = await confirm('¿Estás seguro de eliminar este sprint?')
    if (!ok) return
    await db.sprintRecords.delete(id)
    setSprints(sprints.filter((s) => s.id !== id))
  }

  const totalSP = filteredSprints.reduce((s, sp) => s + sp.storyPointsCompleted, 0)
  const totalNotDone = filteredSprints.reduce((s, sp) => s + sp.storyPointsNotCompleted, 0)
  const efficiency = totalSP + totalNotDone > 0 ? Math.round((totalSP / (totalSP + totalNotDone)) * 100) : 0

  const groupedByQuarter = filteredSprints.reduce<Record<string, SprintRecord[]>>((acc, s) => {
    const key = `${s.year} ${s.quarter}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const sprintSelectOptions = useMemo(() => {
    const existing = new Set(sprints.map((s) => s.sprintName))
    return teamSprints
      .filter((ts) => !existing.has(ts.sprintName))
      .sort((a, b) => {
        const dateA = a.startDate instanceof Date ? a.startDate.getTime() : 0
        const dateB = b.startDate instanceof Date ? b.startDate.getTime() : 0
        return dateB - dateA
      })
  }, [teamSprints, sprints])

  const inputClass = 'w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className="bg-card rounded-xl border border-boundary p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Sprints</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-10 dark:bg-neutral-70 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted hover:text-neutral-90 dark:hover:text-white">
              <List size={16} />
            </button>
            <button onClick={() => setViewMode('chart')} className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted hover:text-neutral-90 dark:hover:text-white">
              <BarChart3 size={16} />
            </button>
          </div>
          <Button onClick={() => setShowForm(true)} variant="ghost" className="flex items-center gap-1">
            <Plus size={16} /> Agregar Sprint
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
          <p className="text-xl font-bold text-primary">{totalSP}</p>
          <p className="text-xs text-neutral-50">SP Completados</p>
        </div>
        <div className="text-center p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
          <p className={cn('text-xl font-bold', efficiency >= 80 ? 'text-green-600' : efficiency >= 50 ? 'text-amber-600' : 'text-red-600')}>{efficiency}%</p>
          <p className="text-xs text-neutral-50">Eficiencia</p>
        </div>
        <div className="text-center p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
          <p className="text-xl font-bold text-neutral-90 dark:text-white">{filteredSprints.length}</p>
          <p className="text-xs text-neutral-50">Sprints</p>
        </div>
      </div>

      {sprints.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <Select
            value={typeof yearFilter === 'number' ? String(yearFilter) : 'all'}
            onChange={(v) => setYearFilter(v === 'all' ? 'all' : Number(v))}
            options={[
              { value: 'all', label: 'Todos los años' },
              ...availableYears.map((y) => ({ value: String(y), label: String(y) })),
            ]}
          />
          <Select
            value={quarterFilter}
            onChange={(v) => setQuarterFilter(v)}
            options={[
              { value: 'all', label: 'Todos los quarters' },
              { value: 'Q1', label: 'Q1' },
              { value: 'Q2', label: 'Q2' },
              { value: 'Q3', label: 'Q3' },
              { value: 'Q4', label: 'Q4' },
            ]}
          />
        </div>
      )}

      {viewMode === 'chart' && chartData.length > 0 && (
        <div className="mb-6 p-4 bg-neutral-10 dark:bg-neutral-70 rounded-xl">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(156,163,175,0.2)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgb(156,163,175,0.6)" />
              <YAxis tick={{ fontSize: 11 }} stroke="rgb(156,163,175,0.6)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(30,30,30)',
                  border: '1px solid rgb(60,60,60)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => [
                  value,
                  'SP',
                ]}
              />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs text-neutral-60">
                    {value === 'completados' ? 'Completados' : 'No completados'}
                  </span>
                )}
              />
              <Bar dataKey="completados" fill="#22c55e" radius={[4, 4, 0, 0]} name="completados" />
              <Bar dataKey="noCompletados" fill="#ef4444" radius={[4, 4, 0, 0]} name="noCompletados" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'chart' && chartData.length === 0 && (
        <p className="text-center py-6 text-neutral-40 text-sm">No hay datos para mostrar en el gráfico</p>
      )}

      {showForm && (
        <div className="mb-6 p-4 border border-boundary rounded-lg bg-neutral-10 dark:bg-neutral-70">
          <div className="grid gap-3 sm:grid-cols-5 mb-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Sprint del Equipo</label>
              <select
                value={newSprint.sprintName}
                onChange={(e) => handleTeamSprintSelect(e.target.value, setNewSprint, newSprint)}
                className={inputClass}
              >
                <option value="">Seleccionar sprint...</option>
                {sprintSelectOptions.map((ts) => {
                  const startStr = ts.startDate instanceof Date ? ts.startDate.toLocaleDateString('es-ES') : ''
                  const endStr = ts.endDate instanceof Date ? ts.endDate.toLocaleDateString('es-ES') : ''
                  return (
                    <option key={ts.id} value={ts.sprintName}>
                      {ts.sprintName} ({startStr} — {endStr}) — Plan: {ts.plannedSP} SP
                    </option>
                  )
                })}
                {!loadingTeamSprints && sprintSelectOptions.length === 0 && teamSprints.length === 0 && (
                  <option value="" disabled>No hay sprints registrados para este equipo. Agrégalos desde la página del equipo.</option>
                )}
                {!loadingTeamSprints && sprintSelectOptions.length === 0 && teamSprints.length > 0 && (
                  <option value="" disabled>Todos los sprints del equipo ya están registrados</option>
                )}
                {loadingTeamSprints && (
                  <option value="" disabled>Cargando sprints del equipo...</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Quarter</label>
              <Select
                value={newSprint.quarter}
                onChange={(v) => setNewSprint({ ...newSprint, quarter: v })}
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
            <Button onClick={addSprint} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">
              Guardar Sprint
            </Button>
            <Button onClick={() => setShowForm(false)} variant="ghost" className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        Object.keys(groupedByQuarter).length === 0 ? (
          <p className="text-center py-8 text-neutral-40">Sin sprints registrados</p>
        ) : (
          Object.entries(groupedByQuarter).map(([quarter, records]) => (
            <div key={quarter} className="mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-50 mb-2">{quarter}</h3>
              <div className="space-y-2">
                {records.map((sp) =>
                  editingId === sp.id ? (
                    <div key={sp.id} className="p-3 bg-card rounded-lg border border-neutral-30 dark:border-neutral-60">
                      <div className="grid gap-2 sm:grid-cols-5 mb-2">
                        <div className="sm:col-span-2">
                          <select
                            value={editData.sprintName}
                            onChange={(e) => handleTeamSprintSelect(e.target.value, setEditData, editData)}
                            className="w-full rounded border border-neutral-30 dark:border-neutral-60 bg-transparent px-2 py-1 text-xs"
                          >
                            <option value="">Seleccionar...</option>
                            {teamSprints.map((ts) => (
                              <option key={ts.id} value={ts.sprintName}>{ts.sprintName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Select
                            value={editData.quarter}
                            onChange={(v) => setEditData({ ...editData, quarter: v })}
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
                            value={editData.storyPointsCompleted}
                            onChange={(e) => setEditData({ ...editData, storyPointsCompleted: Number(e.target.value) })}
                            className="w-full rounded border border-neutral-30 dark:border-neutral-60 bg-transparent px-2 py-1 text-xs"
                            placeholder="SP completados"
                            min={0}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={editData.storyPointsNotCompleted}
                            onChange={(e) => setEditData({ ...editData, storyPointsNotCompleted: Number(e.target.value) })}
                            className="w-full rounded border border-neutral-30 dark:border-neutral-60 bg-transparent px-2 py-1 text-xs"
                            placeholder="SP no completados"
                            min={0}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark">Guardar</Button>
                        <Button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-neutral-60 hover:text-neutral-90">Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={sp.id}
                      className="flex items-center justify-between p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg group/sprint"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-90 dark:text-white">{sp.sprintName}</p>
                        <p className="text-xs text-neutral-50">
                          {sp.storyPointsCompleted} SP completados · {sp.storyPointsNotCompleted} SP no completados
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{sp.storyPointsCompleted} SP</span>
                        <button onClick={() => startEdit(sp)} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted hover:text-neutral-90 dark:hover:text-white">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => removeSprint(sp.id)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-muted hover:text-red-600 dark:hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )
      )}
    </div>
  )
}
