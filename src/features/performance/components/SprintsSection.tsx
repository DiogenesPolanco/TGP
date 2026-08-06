import { useEffect, useMemo, useState } from 'react'
import { db } from '@/services/db/database'
import type { SprintRecord, TeamSprint } from '@/types/domain'
import { Plus, BarChart3, List } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { cn } from '@/lib/utils'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { SprintChartSection } from './SprintChartSection'
import { SprintAddForm } from './SprintAddForm'
import { SprintListItem } from './SprintListItem'

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
    db.teamSprints
      .where('teamId')
      .equals(teamId)
      .toArray()
      .then((data) => {
        setTeamSprints(data)
        setLoadingTeamSprints(false)
      })
  }, [teamId])

  const availableYears = useMemo(
    () => Array.from(new Set(sprints.map((s) => s.year))).sort((a, b) => b - a),
    [sprints],
  )
  const filteredSprints = useMemo(
    () =>
      sprints.filter(
        (s) =>
          (yearFilter === 'all' || s.year === yearFilter) &&
          (quarterFilter === 'all' || s.quarter === quarterFilter),
      ),
    [sprints, yearFilter, quarterFilter],
  )

  const chartData = useMemo(
    () =>
      [...filteredSprints]
        .sort((a, b) => a.sprintName.toLowerCase().localeCompare(b.sprintName.toLowerCase()))
        .map((s) => ({
          name: s.sprintName.length > 12 ? s.sprintName.slice(0, 12) + '...' : s.sprintName,
          completados: s.storyPointsCompleted,
          noCompletados: s.storyPointsNotCompleted,
          eficiencia:
            s.storyPointsCompleted + s.storyPointsNotCompleted > 0
              ? Math.round(
                  (s.storyPointsCompleted / (s.storyPointsCompleted + s.storyPointsNotCompleted)) *
                    100,
                )
              : 0,
        })),
    [filteredSprints],
  )

  const handleTeamSprintSelect = (
    sprintName: string,
    setter: typeof setNewSprint | typeof setEditData,
    current: typeof newSprint,
  ) => {
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
    setNewSprint({
      sprintName: '',
      quarter: 'Q1',
      year: new Date().getFullYear(),
      storyPointsCompleted: 0,
      storyPointsNotCompleted: 0,
    })
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
      sp.id === editingId ? { ...sp, ...editData, sprintName: editData.sprintName.trim() } : sp,
    )
    const record = updated.find((sp) => sp.id === editingId)!
    await db.sprintRecords.put(record)
    setSprints(updated)
    setEditingId(null)
  }

  const removeSprint = async (id: string) => {
    if (!(await confirm('¿Estás seguro de eliminar este sprint?'))) return
    await db.sprintRecords.delete(id)
    setSprints(sprints.filter((s) => s.id !== id))
  }

  const handleEditField = (field: string, value: string | number) =>
    setEditData({ ...editData, [field]: value })
  const handleEditSprintSelect = (sprintName: string) =>
    handleTeamSprintSelect(sprintName, setEditData, editData)

  const totalSP = filteredSprints.reduce((s, sp) => s + sp.storyPointsCompleted, 0)
  const totalNotDone = filteredSprints.reduce((s, sp) => s + sp.storyPointsNotCompleted, 0)
  const efficiency =
    totalSP + totalNotDone > 0 ? Math.round((totalSP / (totalSP + totalNotDone)) * 100) : 0

  const groupedByQuarter = filteredSprints.reduce<Record<string, SprintRecord[]>>((acc, s) => {
    const key = `${s.year} ${s.quarter}`
    ;(acc[key] ??= []).push(s)
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

  return (
    <div className="bg-card rounded-xl border border-boundary p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Sprints</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-10 dark:bg-neutral-70 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted hover:text-neutral-90 dark:hover:text-white"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted hover:text-neutral-90 dark:hover:text-white"
            >
              <BarChart3 size={16} />
            </button>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            variant="ghost"
            className="flex items-center gap-1"
          >
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
          <p
            className={cn(
              'text-xl font-bold',
              efficiency >= 80
                ? 'text-green-600'
                : efficiency >= 50
                  ? 'text-amber-600'
                  : 'text-red-600',
            )}
          >
            {efficiency}%
          </p>
          <p className="text-xs text-neutral-50">Eficiencia</p>
        </div>
        <div className="text-center p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
          <p className="text-xl font-bold text-neutral-90 dark:text-white">
            {filteredSprints.length}
          </p>
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

      <SprintChartSection data={chartData} />

      {showForm && (
        <SprintAddForm
          sprintName={newSprint.sprintName}
          quarter={newSprint.quarter}
          year={newSprint.year}
          storyPointsCompleted={newSprint.storyPointsCompleted}
          storyPointsNotCompleted={newSprint.storyPointsNotCompleted}
          loadingTeamSprints={loadingTeamSprints}
          sprintSelectOptions={sprintSelectOptions}
          teamSprints={teamSprints}
          onChange={(d) => setNewSprint({ ...newSprint, ...d })}
          onSelectTeamSprint={(name) => handleTeamSprintSelect(name, setNewSprint, newSprint)}
          onSave={addSprint}
          onCancel={() => setShowForm(false)}
        />
      )}

      {viewMode === 'list' &&
        (Object.keys(groupedByQuarter).length === 0 ? (
          <p className="text-center py-8 text-neutral-40">Sin sprints registrados</p>
        ) : (
          Object.entries(groupedByQuarter).map(([quarter, records]) => (
            <div key={quarter} className="mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-50 mb-2">
                {quarter}
              </h3>
              <div className="space-y-2">
                {records.map((sp) => (
                  <SprintListItem
                    key={sp.id}
                    sprint={sp}
                    isEditing={editingId === sp.id}
                    editSprintName={editData.sprintName}
                    editQuarter={editData.quarter}
                    editYear={editData.year}
                    editSpCompleted={editData.storyPointsCompleted}
                    editSpNotCompleted={editData.storyPointsNotCompleted}
                    teamSprints={teamSprints}
                    onEdit={startEdit}
                    onSave={saveEdit}
                    onCancel={() => setEditingId(null)}
                    onRemove={removeSprint}
                    onEditField={handleEditField}
                    onEditSprintSelect={handleEditSprintSelect}
                  />
                ))}
              </div>
            </div>
          ))
        ))}
    </div>
  )
}
