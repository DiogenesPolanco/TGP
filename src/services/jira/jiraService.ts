import { db } from '@/services/db/database'
import { getJiraConfig, getJiraAuthHeader, isJiraConfigured } from './jiraConfigService'
import type { TeamSprint } from '@/types/domain'

interface JiraBoard {
  id: number
  name: string
  type: string
  location?: { projectKey?: string }
}

interface JiraSprint {
  id: number
  name: string
  state: 'active' | 'closed' | 'future'
  startDate?: string
  endDate?: string
  originBoardId: number
}

interface JiraIssue {
  id: string
  key: string
  fields: {
    assignee?: { accountId: string; displayName: string }
    status: { name: string }
    customfield_10016?: number | null // story points (field id común)
    issuetype: { name: string }
  }
}

async function jiraFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getJiraConfig()
  const baseUrl = config.baseUrl.replace(/\/+$/, '')

  // En desarrollo usamos el proxy de Vite para evitar CORS
  const url = import.meta.env.DEV ? `/jira-proxy${path}` : `${baseUrl}${path}`

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: getJiraAuthHeader(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Jira API error ${res.status}: ${text || res.statusText}`)
  }

  return res.json()
}

async function jiraFetchAll<T>(
  path: string,
  pageSize = 100,
  resultKey: string = 'values',
): Promise<T[]> {
  const items: T[] = []
  let startAt = 0
  let total = 1

  while (startAt < total) {
    const page = await jiraFetch<any>(
      `${path}${path.includes('?') ? '&' : '?'}maxResults=${pageSize}&startAt=${startAt}`,
    )
    const values = page[resultKey] as T[] | undefined
    if (!values) {
      throw new Error(
        `Respuesta de Jira no contiene "${resultKey}" (keys: ${Object.keys(page).join(', ')})`,
      )
    }
    items.push(...values)
    total = page.total
    startAt += page.maxResults
  }

  return items
}

export async function getBoards(): Promise<JiraBoard[]> {
  return jiraFetchAll<JiraBoard>('/rest/agile/1.0/board')
}

/** Obtener los sprints cerrados de un board */
export async function getSprints(boardId: number): Promise<JiraSprint[]> {
  const all = await jiraFetchAll<JiraSprint>(`/rest/agile/1.0/board/${boardId}/sprint`)
  return all.filter((s) => s.state === 'closed')
}

/** Obtener issues de un sprint */
export async function getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
  return jiraFetchAll<JiraIssue>(`/rest/agile/1.0/sprint/${sprintId}/issue`, 100, 'issues')
}

/** Calcular métricas de un sprint a partir de sus issues */
export function calcSprintMetrics(issues: JiraIssue[]): {
  plannedSP: number
  completedSP: number
  notCompletedSP: number
  perAssignee: Record<string, { displayName: string; completedSP: number; notCompletedSP: number }>
} {
  const DONE_STATUSES = new Set([
    'done',
    'completed',
    'closed',
    'resolved',
    'finished',
    'hecho',
    'terminado',
    'cerrado',
  ])

  let plannedSP = 0
  let completedSP = 0
  const perAssignee: Record<
    string,
    { displayName: string; completedSP: number; notCompletedSP: number }
  > = {}

  for (const issue of issues) {
    const points = issue.fields.customfield_10016 ?? 1 // default 1 si no tiene story points
    const status = issue.fields.status?.name?.toLowerCase() ?? ''
    const assignee = issue.fields.assignee
    const assigneeId = assignee?.accountId ?? '__unassigned__'
    const assigneeName = assignee?.displayName ?? 'Sin asignar'

    plannedSP += points

    if (DONE_STATUSES.has(status)) {
      completedSP += points
    }

    if (!perAssignee[assigneeId]) {
      perAssignee[assigneeId] = { displayName: assigneeName, completedSP: 0, notCompletedSP: 0 }
    }

    if (DONE_STATUSES.has(status)) {
      perAssignee[assigneeId].completedSP += points
    } else {
      perAssignee[assigneeId].notCompletedSP += points
    }
  }

  return {
    plannedSP,
    completedSP,
    notCompletedSP: plannedSP - completedSP,
    perAssignee,
  }
}

/** Sincronizar sprints de un board de Jira hacia la tabla teamSprints */
export async function syncJiraSprints(
  boardId: number,
  teamId: string,
): Promise<{
  updated: number
  errors: number
  message: string
}> {
  if (!isJiraConfigured()) {
    throw new Error('Jira no está configurado. Ve a Administración → Jira.')
  }

  const sprints = await getSprints(boardId)
  let updated = 0
  let errors = 0

  for (const sprint of sprints) {
    try {
      const issues = await getSprintIssues(sprint.id)
      const metrics = calcSprintMetrics(issues)

      const existing = await db.teamSprints
        .where('teamId')
        .equals(teamId)
        .and((s) => s.sprintName === sprint.name)
        .first()

      const now = new Date()
      const sprintRecord: TeamSprint = {
        id: existing?.id ?? crypto.randomUUID(),
        teamId,
        sprintName: sprint.name,
        quarter: guessQuarter(sprint.startDate),
        year: sprint.startDate
          ? new Date(sprint.startDate).getFullYear()
          : new Date().getFullYear(),
        startDate: sprint.startDate ? new Date(sprint.startDate) : now,
        endDate: sprint.endDate ? new Date(sprint.endDate) : now,
        plannedSP: metrics.plannedSP,
        completedSP: metrics.completedSP,
        notCompletedSP: metrics.notCompletedSP,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }

      await db.teamSprints.put(sprintRecord)
      updated++
    } catch (err) {
      errors++
      console.error(`Error sync sprint "${sprint.name}":`, err)
    }
  }

  const message = `${updated} sprints sincronizados${errors > 0 ? `, ${errors} errores` : ''} desde el board #${boardId}`
  return { updated, errors, message }
}

/** Sincronizar asignaciones individuales: crear SprintRecord por miembro */
export async function syncJiraMemberSprints(
  boardId: number,
  _teamId: string,
  memberJiraMap: Map<string, string>, // memberId → jiraAccountId
): Promise<{ updated: number; errors: number; message: string }> {
  if (!isJiraConfigured()) {
    throw new Error('Jira no está configurado.')
  }

  const sprints = await getSprints(boardId)
  let updated = 0
  let errors = 0

  for (const sprint of sprints) {
    try {
      const issues = await getSprintIssues(sprint.id)
      const metrics = calcSprintMetrics(issues)

      // Para cada miembro mapeado, buscar sus puntos
      for (const [memberId, jiraAccountId] of memberJiraMap) {
        const assigneeData = metrics.perAssignee[jiraAccountId]
        if (!assigneeData) continue

        const existing = await db.sprintRecords
          .where('memberId')
          .equals(memberId)
          .and((r) => r.sprintName === sprint.name)
          .first()

        const record = {
          id: existing?.id ?? crypto.randomUUID(),
          memberId,
          sprintName: sprint.name,
          quarter: guessQuarter(sprint.startDate),
          year: sprint.startDate
            ? new Date(sprint.startDate).getFullYear()
            : new Date().getFullYear(),
          storyPointsCompleted: assigneeData.completedSP,
          storyPointsNotCompleted: assigneeData.notCompletedSP,
          createdAt: existing?.createdAt ?? new Date(),
        }

        await db.sprintRecords.put(record)
        updated++
      }
    } catch (err) {
      errors++
      console.error(`Error sync member sprint "${sprint.name}":`, err)
    }
  }

  const message = `${updated} registros de miembros sincronizados${errors > 0 ? `, ${errors} errores` : ''}`
  return { updated, errors, message }
}

function guessQuarter(dateStr?: string): string {
  if (!dateStr) return `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`
  const month = new Date(dateStr).getMonth() // 0-indexed
  return `Q${Math.floor(month / 3) + 1}`
}
