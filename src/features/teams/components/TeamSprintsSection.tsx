import { useEffect, useMemo, useState } from 'react'
import { db } from '@/services/db/database'
import type { TeamSprint, TeamMember } from '@/types/domain'
import { Plus, RefreshCw, Loader2, Calendar } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { useAppStore } from '@/stores/appStore'
import { isJiraConfigured } from '@/services/jira/jiraConfigService'
import {
  getBoards,
  getSprints,
  getSprintIssues,
  calcSprintMetrics,
  syncJiraSprints,
} from '@/services/jira/jiraService'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'
import { SprintCard } from './SprintCard'
import { SprintForm } from './SprintForm'
import { sortAndGroupSprints } from './teamSprintHelpers'

interface Props {
  teamId: string
  teamName: string
  members: TeamMember[]
}

export function TeamSprintsSection({ teamId, teamName, members }: Props) {
  const { confirm } = useConfirm()
  const { addNotification } = useAppStore()
  const [sprints, setSprints] = useState<TeamSprint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const jiraConfigured = isJiraConfigured()
  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members])

  useEffect(() => {
    db.teamSprints
      .where('teamId')
      .equals(teamId)
      .toArray()
      .then((data) => {
        setSprints(data)
        setLoading(false)
      })
  }, [teamId])

  const handleSyncFromJira = async () => {
    if (!jiraConfigured) {
      addNotification({
        type: 'error',
        message: 'Jira no está configurado. Ve a Administración → Jira.',
      })
      return
    }
    setSyncing(true)
    try {
      const boards = await getBoards()
      const matchBoard = boards.find(
        (b) => b.name.toLowerCase().trim() === teamName.toLowerCase().trim(),
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
        const yr = sprint.startDate
          ? new Date(sprint.startDate).getFullYear()
          : new Date().getFullYear()

        for (const [, data] of Object.entries(metrics.perAssignee)) {
          const matchedMember = members.find(
            (m) => m.displayName.toLowerCase().trim() === data.displayName.toLowerCase().trim(),
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

  const addSprint = async (values: {
    sprintName: string
    quarter: string
    year: number
    startDate: string
    endDate: string
    plannedSP: number
    completedSP: number
    notCompletedSP: number
  }) => {
    if (!values.sprintName.trim() || !values.startDate || !values.endDate) return
    const sprint: TeamSprint = {
      id: crypto.randomUUID(),
      teamId,
      sprintName: values.sprintName.trim(),
      quarter: values.quarter,
      year: values.year,
      startDate: parseLocalDate(values.startDate),
      endDate: parseLocalDate(values.endDate),
      plannedSP: values.plannedSP,
      completedSP: values.completedSP,
      notCompletedSP: values.notCompletedSP,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.teamSprints.add(sprint)
    setSprints([...sprints, sprint])
    setShowForm(false)
  }

  const saveEdit = async (values: {
    sprintName: string
    quarter: string
    year: number
    startDate: string
    endDate: string
    plannedSP: number
    completedSP: number
    notCompletedSP: number
  }) => {
    if (!editingId || !values.sprintName.trim() || !values.startDate || !values.endDate) return
    const existing = sprints.find((s) => s.id === editingId)
    if (!existing) return
    const updated: TeamSprint = {
      ...existing,
      sprintName: values.sprintName.trim(),
      quarter: values.quarter,
      year: values.year,
      startDate: parseLocalDate(values.startDate),
      endDate: parseLocalDate(values.endDate),
      plannedSP: values.plannedSP,
      completedSP: values.completedSP,
      notCompletedSP: values.notCompletedSP,
      updatedAt: new Date(),
    }
    await db.teamSprints.put(updated)
    setSprints(sprints.map((s) => (s.id === editingId ? updated : s)))
    setEditingId(null)
  }

  const startEdit = (s: TeamSprint) => {
    setEditingId(s.id)
    setShowForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowForm(false)
  }

  const removeSprint = async (id: string) => {
    const ok = await confirm('¿Estás seguro de eliminar este sprint?')
    if (!ok) return
    await db.teamSprints.delete(id)
    setSprints(sprints.filter((s) => s.id !== id))
  }

  const groupedByQuarter = useMemo(() => sortAndGroupSprints(sprints), [sprints])

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
        <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">
          Sprints del Equipo
        </h2>
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
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus size={16} /> Agregar Sprint
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <SprintForm
          members={members}
          memberIds={memberIds}
          onSave={addSprint}
          onCancel={() => setShowForm(false)}
        />
      )}
      {editingId !== null && (
        <SprintForm
          key={editingId}
          initial={(() => {
            const s = sprints.find((x) => x.id === editingId)
            if (!s) return undefined
            return {
              sprintName: s.sprintName,
              quarter: s.quarter,
              year: s.year,
              startDate: s.startDate instanceof Date ? s.startDate.toISOString().split('T')[0] : '',
              endDate: s.endDate instanceof Date ? s.endDate.toISOString().split('T')[0] : '',
              plannedSP: s.plannedSP,
              completedSP: s.completedSP,
              notCompletedSP: s.notCompletedSP,
            }
          })()}
          members={members}
          memberIds={memberIds}
          onSave={saveEdit}
          onCancel={cancelEdit}
          submitLabel="Guardar Cambios"
        />
      )}

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
                  <span>
                    <strong className="text-secondary">{qPlanned}</strong> SP plan.
                  </span>
                  <span className="text-success">
                    <strong>{qDone}</strong> complet.
                  </span>
                  <span className="text-danger">
                    <strong>{qNotDone}</strong> no compl.
                  </span>
                  <span
                    className={
                      qEff >= 80 ? 'text-success' : qEff >= 50 ? 'text-warning' : 'text-danger'
                    }
                  >
                    <strong>{qEff}%</strong> efic.
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {records.map((s) => (
                  <SprintCard key={s.id} sprint={s} onEdit={startEdit} onDelete={removeSprint} />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
