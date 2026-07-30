import { db } from '@/services/db/database'
import type { SprintRecord, TeamMember, TeamSprint } from '@/types/domain'

export interface MemberDetail {
  displayName: string
  completedSP: number
  notCompletedSP: number
  totalSP: number
}

export interface MemberSprintAgg {
  completedSP: number
  notCompletedSP: number
  totalSP: number
  memberCount: number
  memberDetails: MemberDetail[]
}

export const todayStr = () => new Date().toISOString().split('T')[0]

export const inputClass =
  'w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary'

export async function getMemberAgg(
  sprintName: string,
  memberIds: Set<string>,
  members: TeamMember[],
): Promise<MemberSprintAgg | null> {
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

export async function validateAgainstMembers(
  sprintName: string,
  completedSP: number,
  notCompletedSP: number,
  memberIds: Set<string>,
  members: TeamMember[],
): Promise<{ type: 'ok' | 'warn'; text: string } | null> {
  const agg = await getMemberAgg(sprintName, memberIds, members)
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

export function sortAndGroupSprints(sprints: TeamSprint[]): Record<string, TeamSprint[]> {
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
}
