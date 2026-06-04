import { db } from '@/services/db/database'
import type { Team, TeamMember } from '@/types/domain'

export interface MemberKPIs {
  memberId: string
  memberName: string
  totalSP: number
  efficiencyPct: number
  avgMood: number
  oneOnOneCount: number
  achievementCount: number
  lastOneOnOneDate: Date | null
}

export async function getMemberKPIs(memberId: string): Promise<MemberKPIs> {
  const [sprints, oneOnOnes, achievementsList] = await Promise.all([
    db.sprintRecords.where('memberId').equals(memberId).toArray(),
    db.oneOnOnes.where('memberId').equals(memberId).toArray(),
    db.achievements.where('memberId').equals(memberId).toArray(),
  ])

  const totalSP = sprints.reduce((s, sp) => s + sp.storyPointsCompleted, 0)
  const totalNotDone = sprints.reduce((s, sp) => s + sp.storyPointsNotCompleted, 0)
  const efficiencyPct = totalSP + totalNotDone > 0
    ? Math.round((totalSP / (totalSP + totalNotDone)) * 100)
    : 0
  const avgMood = oneOnOnes.length > 0
    ? Math.round(oneOnOnes.reduce((s, o) => s + o.estadoAnimo, 0) / oneOnOnes.length)
    : 0
  const oneOnOneCount = oneOnOnes.length
  const achievementCount = achievementsList.length
  const lastOneOnOneDate = oneOnOnes.length > 0
    ? oneOnOnes.sort((a, b) => b.date.getTime() - a.date.getTime())[0].date
    : null

  return {
    memberId,
    memberName: '',
    totalSP,
    efficiencyPct,
    avgMood,
    oneOnOneCount,
    achievementCount,
    lastOneOnOneDate,
  }
}

export async function getTeamPerformanceIndicators(team: Team): Promise<{
  bestPerformer: { member: TeamMember; kpis: MemberKPIs } | null
  worstPerformer: { member: TeamMember; kpis: MemberKPIs } | null
  topSP: { member: TeamMember; sp: number } | null
  bottomSP: { member: TeamMember; sp: number } | null
}> {
  if (!team.members || team.members.length === 0) {
    return { bestPerformer: null, worstPerformer: null, topSP: null, bottomSP: null }
  }

  const kpisList = await Promise.all(
    team.members.map(async (m) => {
      const kpis = await getMemberKPIs(m.id)
      kpis.memberName = m.displayName
      return { member: m, kpis }
    })
  )

  const withSP = kpisList.filter((k) => k.kpis.totalSP > 0)

  const bestPerformer = withSP.length > 0
    ? withSP.reduce((a, b) => (a.kpis.efficiencyPct > b.kpis.efficiencyPct ? a : b))
    : null

  const worstPerformer = withSP.length > 0
    ? withSP.reduce((a, b) => (a.kpis.efficiencyPct < b.kpis.efficiencyPct ? a : b))
    : null

  const topSP = withSP.length > 0
    ? withSP.reduce((a, b) => (a.kpis.totalSP > b.kpis.totalSP ? a : b))
    : null

  const bottomSP = withSP.length > 0
    ? withSP.reduce((a, b) => (a.kpis.totalSP < b.kpis.totalSP ? a : b))
    : null

  return {
    bestPerformer: bestPerformer
      ? { member: bestPerformer.member, kpis: bestPerformer.kpis }
      : null,
    worstPerformer: worstPerformer
      ? { member: worstPerformer.member, kpis: worstPerformer.kpis }
      : null,
    topSP: topSP ? { member: topSP.member, sp: topSP.kpis.totalSP } : null,
    bottomSP: bottomSP ? { member: bottomSP.member, sp: bottomSP.kpis.totalSP } : null,
  }
}
