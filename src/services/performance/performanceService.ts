import { db } from '@/services/db/database'
import type { Team, TeamMember, MemberRole } from '@/types/domain'

/** Roles considerados para análisis de métricas y rendimiento */
export const DEV_ROLES: MemberRole[] = ['developer', 'senior_developer', 'tech_lead']

export interface MemberWithTeam {
  member: TeamMember
  team: Team
}

export interface MemberKPIs {
  memberId: string
  memberName: string
  totalSP: number
  efficiencyPct: number
  avgMood: number
  oneOnOneCount: number
  openOpportunitiesCount: number
  achievementCount: number
  lastOneOnOneDate: Date | null
  attentionScore: number
}

const ATTENTION_WEIGHTS = {
  efficiency: 0.35,
  opportunities: 0.35,
  mood: 0.2,
  achievement: 0.1,
} as const

function calcAttentionScore(
  kpis: Pick<
    MemberKPIs,
    'efficiencyPct' | 'openOpportunitiesCount' | 'avgMood' | 'oneOnOneCount' | 'achievementCount'
  >,
): number {
  const efficiencyScore = ((100 - kpis.efficiencyPct) / 100) * ATTENTION_WEIGHTS.efficiency * 100

  const cappedOpps = Math.min(kpis.openOpportunitiesCount, 5)
  const opportunityScore = (cappedOpps / 5) * ATTENTION_WEIGHTS.opportunities * 100

  let moodScore = 0
  if (kpis.oneOnOneCount > 0) {
    moodScore = ((5 - kpis.avgMood) / 4) * ATTENTION_WEIGHTS.mood * 100
  }

  const achievementScore = kpis.achievementCount === 0 ? ATTENTION_WEIGHTS.achievement * 100 : 0

  return Math.round(efficiencyScore + opportunityScore + moodScore + achievementScore)
}

export async function getMemberKPIs(memberId: string): Promise<MemberKPIs> {
  const [sprints, oneOnOnes, achievementsList] = await Promise.all([
    db.sprintRecords.where('memberId').equals(memberId).toArray(),
    db.oneOnOnes.where('memberId').equals(memberId).toArray(),
    db.achievements.where('memberId').equals(memberId).toArray(),
  ])

  const totalSP = sprints.reduce((s, sp) => s + sp.storyPointsCompleted, 0)
  const totalNotDone = sprints.reduce((s, sp) => s + sp.storyPointsNotCompleted, 0)
  const efficiencyPct =
    totalSP + totalNotDone > 0 ? Math.round((totalSP / (totalSP + totalNotDone)) * 100) : 0
  const avgMood =
    oneOnOnes.length > 0
      ? Math.round(oneOnOnes.reduce((s, o) => s + o.estadoAnimo, 0) / oneOnOnes.length)
      : 0
  const oneOnOneCount = oneOnOnes.length
  const openOpportunitiesCount = oneOnOnes.reduce(
    (count, o) =>
      count +
      o.oportunidades.filter((op) => op.status === 'pendiente' || op.status === 'en_progreso')
        .length,
    0,
  )
  const achievementCount = achievementsList.length
  const lastOneOnOneDate =
    oneOnOnes.length > 0
      ? oneOnOnes.sort((a, b) => b.date.getTime() - a.date.getTime())[0].date
      : null

  const kpis = {
    memberId,
    memberName: '',
    totalSP,
    efficiencyPct,
    avgMood,
    oneOnOneCount,
    openOpportunitiesCount,
    achievementCount,
    lastOneOnOneDate,
    attentionScore: 0,
  }
  kpis.attentionScore = calcAttentionScore(kpis)
  return kpis
}

export async function getTeamPerformanceIndicators(team: Team): Promise<{
  bestPerformer: { member: TeamMember; kpis: MemberKPIs } | null
  worstPerformer: { member: TeamMember; kpis: MemberKPIs } | null
  topSP: { member: TeamMember; sp: number } | null
  bottomSP: { member: TeamMember; sp: number } | null
}> {
  const devMembers = team.members.filter((m) => DEV_ROLES.includes(m.role))
  if (!devMembers || devMembers.length === 0) {
    return { bestPerformer: null, worstPerformer: null, topSP: null, bottomSP: null }
  }

  const kpisList = await Promise.all(
    devMembers.map(async (m) => {
      const kpis = await getMemberKPIs(m.id)
      kpis.memberName = m.displayName
      return { member: m, kpis }
    }),
  )

  const withSP = kpisList.filter((k) => k.kpis.totalSP > 0)

  const bestPerformer =
    withSP.length > 0
      ? withSP.reduce((a, b) => (a.kpis.efficiencyPct > b.kpis.efficiencyPct ? a : b))
      : null

  const worstPerformer =
    withSP.length > 0
      ? withSP.reduce((a, b) => (a.kpis.efficiencyPct < b.kpis.efficiencyPct ? a : b))
      : null

  const topSP =
    withSP.length > 0 ? withSP.reduce((a, b) => (a.kpis.totalSP > b.kpis.totalSP ? a : b)) : null

  const bottomSP =
    withSP.length > 0 ? withSP.reduce((a, b) => (a.kpis.totalSP < b.kpis.totalSP ? a : b)) : null

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

export async function getGlobalMembersKPIs() {
  const teams = await db.teams.toArray()
  const allMembers = teams.flatMap((t) => t.members.map((m) => ({ member: m, team: t })))
  const kpisList = await Promise.all(
    allMembers.map(async ({ member, team }) => {
      const kpis = await getMemberKPIs(member.id)
      kpis.memberName = member.displayName
      return { member, team, kpis }
    }),
  )

  // Estadísticas solo con roles de desarrollo (dev, senior, tech lead)
  const devKpis = kpisList.filter((k) => DEV_ROLES.includes(k.member.role))
  const withSP = devKpis.filter((k) => k.kpis.totalSP > 0)
  const bestPerformer =
    withSP.length > 0
      ? withSP.reduce((a, b) => (a.kpis.efficiencyPct > b.kpis.efficiencyPct ? a : b))
      : null
  const worstPerformer =
    withSP.length > 0
      ? withSP.reduce((a, b) => (a.kpis.efficiencyPct < b.kpis.efficiencyPct ? a : b))
      : null
  const topSP =
    withSP.length > 0 ? withSP.reduce((a, b) => (a.kpis.totalSP > b.kpis.totalSP ? a : b)) : null

  const withAttention = devKpis.filter((k) => k.kpis.attentionScore > 0)
  const needsAttention =
    withAttention.length > 0
      ? withAttention.reduce((a, b) => (a.kpis.attentionScore > b.kpis.attentionScore ? a : b))
      : null

  return { kpisList, bestPerformer, worstPerformer, topSP, needsAttention }
}

export type GlobalMemberKPIs = Awaited<ReturnType<typeof getGlobalMembersKPIs>>
