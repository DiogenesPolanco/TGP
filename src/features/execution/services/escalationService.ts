import { db } from '@/services/db/database'

/**
 * Escalation rules:
 * - Blockers with status 'open' that are 48h+ old → auto-escalate to 'escalated'
 * - Blockers with severity 'critical' that are 24h+ old → auto-escalate
 * - Commitments with commitmentDate past due and status 'active' → auto-set to 'at_risk'
 * - Commitments with commitmentDate 7+ days past due and not fulfilled → auto-set to 'breached'
 */
export async function runEscalation(): Promise<{ blockersEscalated: number; commitmentsAtRisk: number; commitmentsBreached: number }> {
  const now = new Date()
  const HOURS_48 = 48 * 60 * 60 * 1000
  const HOURS_24 = 24 * 60 * 60 * 1000
  const DAYS_7 = 7 * 24 * 60 * 60 * 1000

  let blockersEscalated = 0
  let commitmentsAtRisk = 0
  let commitmentsBreached = 0

  // Escalate blockers
  const openBlockers = await db.blockers.where('status').equals('open').toArray()
  for (const blocker of openBlockers) {
    const age = now.getTime() - new Date(blocker.createdAt).getTime()
    const shouldEscalate = blocker.severity === 'critical' ? age >= HOURS_24 : age >= HOURS_48
    if (shouldEscalate) {
      await db.blockers.update(blocker.id, { status: 'escalated', escalatedAt: now, updatedAt: now })
      blockersEscalated++
    }
  }

  // Auto-update commitments — process active and at_risk
  const pendingCommitments = await db.commitments
    .where('status')
    .anyOf(['active', 'at_risk'])
    .toArray()
  for (const c of pendingCommitments) {
    const dueDate = new Date(c.commitmentDate)
    const overdue = now.getTime() - dueDate.getTime()
    if (overdue > 0 && overdue < DAYS_7 && c.status === 'active') {
      await db.commitments.update(c.id, { status: 'at_risk', updatedAt: now })
      commitmentsAtRisk++
    } else if (overdue >= DAYS_7) {
      await db.commitments.update(c.id, { status: 'breached', updatedAt: now })
      commitmentsBreached++
    }
  }

  return { blockersEscalated, commitmentsAtRisk, commitmentsBreached }
}

/**
 * Returns counts of items needing attention (for badge/dashboard display)
 */
export async function getAttentionCounts(): Promise<{
  activeBlockers: number
  escalatedBlockers: number
  atRiskCommitments: number
  breachedCommitments: number
  overdueActivities: number
}> {
  const now = new Date()
  const [blockers, commitments, activities] = await Promise.all([
    db.blockers.toArray(),
    db.commitments.toArray(),
    db.activities.toArray(),
  ])

  return {
    activeBlockers: blockers.filter((b) => b.status === 'open').length,
    escalatedBlockers: blockers.filter((b) => b.status === 'escalated').length,
    atRiskCommitments: commitments.filter((c) => c.status === 'at_risk').length,
    breachedCommitments: commitments.filter((c) => c.status === 'breached').length,
    overdueActivities: activities.filter((a) => {
      if (!a.dueDate || a.status === 'completed' || a.status === 'cancelled') return false
      return new Date(a.dueDate) < now
    }).length,
  }
}
