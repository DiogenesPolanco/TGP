import { useEffect, useMemo, useState } from 'react'
import { db } from '@/services/db/database'
import type { TeamSprint, SprintRecord, TeamMember } from '@/types/domain'
import { Plus, Trash2, Edit3, AlertTriangle, CheckCircle2, Loader2, Calendar, RefreshCw } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { useAppStore } from '@/stores/appStore'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { isJiraConfigured } from '@/services/jira/jiraConfigService'
import { getBoards, getSprints, getSprintIssues, calcSprintMetrics, syncJiraSprints } from '@/services/jira/jiraService'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

interface Props {
  teamId: string
  teamName: string
  members: TeamMember[]
}

interface MemberDetail {
  displayName: string
  completedSP: number
  notCompletedSP: number
  totalSP: number
}

interface MemberSprintAgg {
  completedSP: number
  notCompletedSP: number
  totalSP: number
  memberCount: number
  memberDetails: MemberDetail[]
}

export function TeamSprintsSection({ teamId, teamName, members }: Props) {
  const { confirm } = useConfirm()
  const { addNotification } = useAppStore()
  const [sprints, setSprints] = useState<TeamSprint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [validationMsg, setValidationMsg] = useState<{ type: 'ok' | 'warn'; text: string } | null>(null)
  const [syncing, setSyncing] = useState(false)

  const [form, setForm] = useState({
    sprintName: '',
    quarter: 'Q2',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    plannedSP: 0,
    completedSP: 0,
    notCompletedSP: 0,
  })

  const todayStr = () => new Date().toISOString().split('T')[0]

  const jiraConfigured = isJiraConfigured()

  const handleSyncFromJira = async () => {
    if (!jiraConfigured) {
      addNotification({ type: 'error', message: 'Jira no está configurado. Ve a Administración → Jira.' })
      return
    }
    setSyncing(true)
    try {
      const boards = await getBoards()
      const matchBoard = boards.find(
        (b) => b.name.toLowerCase().trim() === teamName.toLowerCase().trim()
      )
      if (!matchBoard) {
        addNotification({
          type: 'error',
          message: `No se encontró un board de Jira llamado "${teamName}". Verifica que el nombre del board coincida exactamente con el nombre del equipo.`,
        })
        setSyncing(false)
        return
      }
      const result = await syncJiraSprints(matchBoard.id, teamId)

      const sprintsFromJira = await getSprints(matchBoard.id)
      let memberSyncCount = 0
      for (const sprint of sprintsFromJira) {
        const issues = await getSprintIssues(sprint.id)
        const metrics = calcSprintMetrics(issues)
        const q = sprint.startDate
          ? `Q${Math.floor(new Date(sprint.startDate).getMonth() / 3) + 1}`
          : `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`
        const yr = sprint.startDate ? new Date(sprint.startDate).getFullYear() : new Date().getFullYear()

        for (const [, data] of Object.entries(metrics.perAssignee)) {
          const matchedMember = members.find(
            (m) => m.displayName.toLowerCase().trim() === data.displayName.toLowerCase().trim()
          )
          if (!matchedMember) continue

          const existing = await db.sprintRecords
            .where('memberId')
            .equals(matchedMember.id)
            .and((r) => r.sprintName === sprint.name)
            .first()

          await db.sprintRecords.put({
            id: existing?.id ?? crypto.randomUUID(),
            memberId: matchedMember.id,
            sprintName: sprint.name,
            quarter: q,
            year: yr,
            storyPointsCompleted: data.completedSP,
            storyPointsNotCompleted: data.notCompletedSP,
            createdAt: existing?.createdAt ?? new Date(),
          })
          memberSyncCount++
        }
      }

      addNotification({
        type: 'success',
        message: `${result.message} + ${memberSyncCount} registros de miembros sincronizados`,
      })
      const updated = await db.teamSprints.where('teamId').equals(teamId).toArray()
      setSprints(updated)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      addNotification({ type: 'error', message: `Error al sincronizar con Jira: ${msg}` })
    } finally {
      setSyncing(false)
    }
  }

  const resetForm = () => {
    setForm({
      sprintName: '',
      quarter: 'Q2',
      year: new Date().getFullYear(),
      startDate: todayStr(),
      endDate: todayStr(),
      plannedSP: 0,
      completedSP: 0,
      notCompletedSP: 0,
    })
    setValidationMsg(null)
  }

  useEffect(() => {
    db.teamSprints.where('teamId').equals(teamId).toArray().then((data) => {
      setSprints(data)
      setLoading(false)
    })
  }, [teamId])

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members])

  const getMemberAgg = async (sprintName: string): Promise<MemberSprintAgg | null> => {
    if (!sprintName.trim() || memberIds.size === 0) return null
    const records: SprintRecord[] = await db.sprintRecords
      .filter((r) => r.sprintName === sprintName && memberIds.has(r.memberId))
      .toArray()
    if (records.length === 0) return null

    const memberMap = new Map<string, { completedSP: number; notCompletedSP: number }>()
    for (const r of records) {
      const cur = memberMap.get(r.memberId) ?? { completedSP: 0, notCompletedSP: 0 }
      cur.completedSP += r.storyPointsCompleted
      cur.notCompletedSP += r.storyPointsNotCompleted
      memberMap.set(r.memberId, cur)
    }

    const memberDetails: MemberDetail[] = Array.from(memberMap.entries()).map(([id, sp]) => ({
      displayName: members.find((m) => m.id === id)?.displayName ?? id,
      completedSP: sp.completedSP,
      notCompletedSP: sp.notCompletedSP,
      totalSP: sp.completedSP + sp.notCompletedSP,
    }))

    return {
      completedSP: memberDetails.reduce((s, m) => s + m.completedSP, 0),
      notCompletedSP: memberDetails.reduce((s, m) => s + m.notCompletedSP, 0),
      totalSP: memberDetails.reduce((s, m) => s + m.totalSP, 0),
      memberCount: memberDetails.length,
      memberDetails,
    }
  }

  const validateAgainstMembers = async (
    sprintName: string,
    completedSP: number,
    notCompletedSP: number
  ): Promise<{ type: 'ok' | 'warn'; text: string } | null> => {
    const agg = await getMemberAgg(sprintName)
    if (!agg) return null
    const teamTotal = completedSP + notCompletedSP

    const memberLines = agg.memberDetails
      .map((m) => `${m.displayName}: (${m.completedSP} ; ${m.notCompletedSP} = ${m.totalSP})`)
      .join(', ')

    if (teamTotal === agg.totalSP) {
      return {
        type: 'ok',
        text: `Coincide con la suma de los ${agg.memberCount} miembros (${agg.completedSP} SP completados, ${agg.notCompletedSP} SP no completados). ${memberLines}`,
      }
    }
    return {
      type: 'warn',
      text: `Los miembros suman ${agg.completedSP} SP completados y ${agg.notCompletedSP} SP no completados (${agg.memberCount} miembros): ${memberLines}. Los valores del equipo (${completedSP}/${notCompletedSP}) no coinciden.`,
    }
  }

  const handleValidate = async () => {
    if (!form.sprintName.trim()) return
    const msg = await validateAgainstMembers(form.sprintName, form.completedSP, form.notCompletedSP)
    setValidationMsg(msg)
  }

  const handleFieldBlur = async () => {
    if (form.sprintName.trim()) {
      const msg = await validateAgainstMembers(form.sprintName, form.completedSP, form.notCompletedSP)
      setValidationMsg(msg)
    }
  }

  const addSprint = async () => {
    if (!form.sprintName.trim() || !form.startDate || !form.endDate) return

    const sprint: TeamSprint = {
      id: crypto.randomUUID(),
      teamId,
      sprintName: form.sprintName.trim(),
      quarter: form.quarter,
      year: form.year,
      startDate: parseLocalDate(form.startDate),
      endDate: parseLocalDate(form.endDate),
      plannedSP: form.plannedSP,
      completedSP: form.completedSP,
      notCompletedSP: form.notCompletedSP,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.teamSprints.add(sprint)
    setSprints([...sprints, sprint])
    setShowForm(false)
    resetForm()
  }

  const startEdit = (s: TeamSprint) => {
    setEditingId(s.id)
    setForm({
      sprintName: s.sprintName,
      quarter: s.quarter,
      year: s.year,
      startDate: s.startDate instanceof Date ? s.startDate.toISOString().split('T')[0] : todayStr(),
      endDate: s.endDate instanceof Date ? s.endDate.toISOString().split('T')[0] : todayStr(),
      plannedSP: s.plannedSP,
      completedSP: s.completedSP,
      notCompletedSP: s.notCompletedSP,
    })
  }

  const saveEdit = async () => {
    if (!editingId || !form.sprintName.trim() || !form.startDate || !form.endDate) return

    const existing = sprints.find((s) => s.id === editingId)
    if (!existing) return

    const updated: TeamSprint = {
      ...existing,
      sprintName: form.sprintName.trim(),
      quarter: form.quarter,
      year: form.year,
      startDate: parseLocalDate(form.startDate),
      endDate: parseLocalDate(form.endDate),
      plannedSP: form.plannedSP,
      completedSP: form.completedSP,
      notCompletedSP: form.notCompletedSP,
      updatedAt: new Date(),
    }

    await db.teamSprints.put(updated)
    setSprints(sprints.map((s) => (s.id === editingId ? updated : s)))
    setEditingId(null)
    resetForm()
    setValidationMsg(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    resetForm()
  }

  const removeSprint = async (id: string) => {
    const ok = await confirm('¿Estás seguro de eliminar este sprint?')
    if (!ok) return
    await db.teamSprints.delete(id)
    setSprints(sprints.filter((s) => s.id !== id))
  }

  const groupedByQuarter = useMemo(() => {
    const copy = [...sprints].sort((a, b) => {
      const dateA = a.startDate instanceof Date ? a.startDate.getTime() : 0
      const dateB = b.startDate instanceof Date ? b.startDate.getTime() : 0
      return dateB - dateA
    })
    return copy.reduce<Record<string, TeamSprint[]>>((acc, s) => {
      const key = `${s.year} ${s.quarter}`
      if (!acc[key]) acc[key] = []
      acc[key].push(s)
      return acc
    }, {})
  }, [sprints])

  const inputClass = 'w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-boundary p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Sprints del Equipo</h2>
        <div className="flex items-center gap-2">
          {jiraConfigured && !showForm && editingId === null && (
            <Button
              onClick={handleSyncFromJira}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sync Jira'}
            </Button>
          )}
          {!showForm && editingId === null && (
            <Button
              onClick={() => { setShowForm(true); resetForm() }}
              className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus size={16} /> Agregar Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Form */}
      {(showForm || editingId !== null) && (
        <div className="mb-6 p-4 border border-boundary rounded-lg bg-neutral-10 dark:bg-neutral-70">
          <div className="grid gap-3 sm:grid-cols-4 mb-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Nombre del Sprint</label>
              <input
                type="text"
                value={form.sprintName}
                onChange={(e) => setForm({ ...form, sprintName: e.target.value })}
                className={inputClass}
                placeholder="Sprint 5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Quarter</label>
              <Select
                value={form.quarter}
                onChange={(v) => setForm({ ...form, quarter: v })}
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
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 mb-3">
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha Inicio</label>
              <DatePicker
                value={form.startDate}
                onChange={(v) => setForm({ ...form, startDate: v })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha Fin</label>
              <DatePicker
                value={form.endDate}
                onChange={(v) => setForm({ ...form, endDate: v })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 mb-3">
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">SP Planificados</label>
              <input
                type="number"
                value={form.plannedSP}
                onChange={(e) => setForm({ ...form, plannedSP: Number(e.target.value) })}
                className={inputClass}
                min={0}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">SP Completados</label>
              <input
                type="number"
                value={form.completedSP}
                onChange={(e) => setForm({ ...form, completedSP: Number(e.target.value) })}
                onBlur={handleFieldBlur}
                className={inputClass}
                min={0}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">SP No Completados</label>
              <input
                type="number"
                value={form.notCompletedSP}
                onChange={(e) => setForm({ ...form, notCompletedSP: Number(e.target.value) })}
                onBlur={handleFieldBlur}
                className={inputClass}
                min={0}
              />
            </div>
          </div>

          {/* Validation message */}
          {validationMsg && (
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs ${
              validationMsg.type === 'ok'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
            }`}>
              {validationMsg.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              <span>{validationMsg.text}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={editingId ? saveEdit : addSprint}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
            >
              {editingId ? 'Guardar Cambios' : 'Guardar Sprint'}
            </Button>
            <Button
              onClick={handleValidate}
              className="px-3 py-2 text-sm text-neutral-60 hover:text-primary border border-neutral-30 dark:border-neutral-60 rounded-lg hover:border-primary/30"
            >
              Validar vs Miembros
            </Button>
            <Button
              onClick={editingId ? cancelEdit : () => { setShowForm(false); resetForm() }}
              className="px-3 py-2 text-sm text-neutral-60 hover:text-neutral-90"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Sprint list */}
      {Object.keys(groupedByQuarter).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-neutral-40">
          <div className="w-12 h-12 rounded-full bg-neutral-10 dark:bg-neutral-70 flex items-center justify-center mb-3">
            <Calendar size={20} className="text-neutral-30" />
          </div>
          <p className="text-sm font-medium">Sin sprints registrados para este equipo</p>
          <p className="text-xs mt-1">Agrega el primer sprint usando el botón superior</p>
        </div>
      ) : (
        Object.entries(groupedByQuarter).map(([quarter, records]) => {
          const qPlanned = records.reduce((s, r) => s + r.plannedSP, 0)
          const qDone = records.reduce((s, r) => s + r.completedSP, 0)
          const qNotDone = records.reduce((s, r) => s + r.notCompletedSP, 0)
          const qEff = qDone + qNotDone > 0 ? Math.round((qDone / (qDone + qNotDone)) * 100) : 0

          return (
            <div key={quarter} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-neutral-90 dark:text-white">{quarter}</h3>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary/10 text-primary">
                    {records.length} sprint{records.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-[11px] text-neutral-50">
                  <span><strong className="text-secondary">{qPlanned}</strong> SP plan.</span>
                  <span className="text-success"><strong>{qDone}</strong> complet.</span>
                  <span className="text-danger"><strong>{qNotDone}</strong> no compl.</span>
                  <span className={qEff >= 80 ? 'text-success' : qEff >= 50 ? 'text-warning' : 'text-danger'}>
                    <strong>{qEff}%</strong> efic.
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {records.map((s) => {
                  const startStr = s.startDate instanceof Date ? s.startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''
                  const endStr = s.endDate instanceof Date ? s.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
                  const doneSP = s.completedSP
                  const notDoneSP = s.notCompletedSP
                  const totalSP = doneSP + notDoneSP
                  const effPct = totalSP > 0 ? Math.round((doneSP / totalSP) * 100) : 0
                  const plannedPct = s.plannedSP > 0 ? Math.round((doneSP / s.plannedSP) * 100) : 0

                  const effColor =
                    effPct >= 80 ? 'text-success' :
                    effPct >= 50 ? 'text-warning' :
                    'text-danger'
                  const effBg =
                    effPct >= 80 ? 'bg-success/10' :
                    effPct >= 50 ? 'bg-warning/10' :
                    'bg-danger/10'
                  const progressColor =
                    effPct >= 80 ? 'bg-success' :
                    effPct >= 50 ? 'bg-warning' :
                    'bg-danger'

                  return (
                    <div
                      key={s.id}
                      className="bg-card rounded-xl border border-boundary p-4 shadow-sm hover:shadow-md transition-all duration-200 group/sprint"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-semibold text-neutral-90 dark:text-white truncate">
                              {s.sprintName}
                            </h4>
                            <div className={`shrink-0 px-2 py-0.5 text-xs font-bold rounded-md ${effBg} ${effColor}`}>
                              {effPct}%
                            </div>
                          </div>
                          <p className="text-xs text-neutral-50 mt-0.5">
                            {startStr} — {endStr}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] text-neutral-50 mb-1">
                          <span>Progreso de ejecución</span>
                          <span>{doneSP}/{totalSP || s.plannedSP} SP</span>
                        </div>
                        <div className="w-full bg-neutral-20 dark:bg-neutral-70 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${Math.min(100, totalSP > 0 ? effPct : plannedPct)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center py-2 px-1 rounded-lg bg-neutral-10 dark:bg-neutral-70">
                          <p className="text-[10px] font-medium text-neutral-50 uppercase tracking-wider">Plan</p>
                          <p className="text-sm font-bold text-neutral-90 dark:text-white mt-0.5">{s.plannedSP}</p>
                        </div>
                        <div className="text-center py-2 px-1 rounded-lg bg-success/5">
                          <p className="text-[10px] font-medium text-success uppercase tracking-wider">Completado</p>
                          <p className="text-sm font-bold text-success mt-0.5">{doneSP}</p>
                        </div>
                        <div className="text-center py-2 px-1 rounded-lg bg-danger/5">
                          <p className="text-[10px] font-medium text-danger uppercase tracking-wider">No Compl.</p>
                          <p className="text-sm font-bold text-danger mt-0.5">{notDoneSP}</p>
                        </div>
                        <div className="text-center py-2 px-1 rounded-lg bg-primary/5">
                          <p className="text-[10px] font-medium text-primary uppercase tracking-wider">Entrega</p>
                          <p className="text-sm font-bold text-primary mt-0.5">{plannedPct}%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-10 dark:border-neutral-70">
                        <div className="text-[11px] text-neutral-40">
                          <span className="inline-flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${doneSP + notDoneSP > 0 ? 'bg-success' : 'bg-neutral-30'}`} />
                            {doneSP + notDoneSP > 0
                              ? `${doneSP} SP completados de ${s.plannedSP} planificados`
                              : 'Sin actividad registrada'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => startEdit(s)}
                            className="p-1.5 rounded-lg text-neutral-40 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Editar sprint"
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            onClick={() => removeSprint(s.id)}
                            className="p-1.5 rounded-lg text-neutral-40 hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Eliminar sprint"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
