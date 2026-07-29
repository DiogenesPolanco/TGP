import { describe, it, expect, beforeEach, vi } from 'vitest'
import { runEscalation, getAttentionCounts } from '../escalationService'
import type { Blocker, Commitment, Activity } from '@/types/domain'

const mockBlockers = new Map<string, Blocker>()
const mockCommitments = new Map<string, Commitment>()
const mockActivities = new Map<string, Activity>()

vi.mock('@/services/db/database', () => ({
  db: {
    blockers: {
      where: () => ({
        equals: () => ({
          toArray: async () => Array.from(mockBlockers.values()).filter((b) => b.status === 'open'),
        }),
      }),
      update: async (id: string, changes: Partial<Blocker>) => {
        const existing = mockBlockers.get(id)
        if (existing) mockBlockers.set(id, { ...existing, ...changes })
      },
      toArray: async () => Array.from(mockBlockers.values()),
      clear: async () => mockBlockers.clear(),
    },
    commitments: {
      where: () => ({
        anyOf: () => ({
          toArray: async () =>
            Array.from(mockCommitments.values()).filter((c) =>
              ['active', 'at_risk'].includes(c.status),
            ),
        }),
      }),
      update: async (id: string, changes: Partial<Commitment>) => {
        const existing = mockCommitments.get(id)
        if (existing) mockCommitments.set(id, { ...existing, ...changes })
      },
      toArray: async () => Array.from(mockCommitments.values()),
      clear: async () => mockCommitments.clear(),
    },
    activities: {
      toArray: async () => Array.from(mockActivities.values()),
      clear: async () => mockActivities.clear(),
    },
  },
}))

function createBlocker(overrides: Partial<Blocker> = {}): Blocker {
  const id = overrides.id ?? 'b-' + crypto.randomUUID()
  const blocker: Blocker = {
    id,
    title: 'Test blocker',
    status: 'open',
    severity: 'medium',
    applicationId: 'app1',
    businessUnitId: 'bu1',
    tenantId: 'default',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Blocker
  mockBlockers.set(id, blocker)
  return blocker
}

function createCommitment(overrides: Partial<Commitment> = {}): Commitment {
  const id = overrides.id ?? 'c-' + crypto.randomUUID()
  const commitment: Commitment = {
    id,
    title: 'Test commitment',
    status: 'active',
    businessUnitId: 'bu1',
    tenantId: 'default',
    commitmentDate: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Commitment
  mockCommitments.set(id, commitment)
  return commitment
}

describe('runEscalation', () => {
  beforeEach(() => {
    mockBlockers.clear()
    mockCommitments.clear()
    vi.useFakeTimers({ now: 1_700_000_000_000 })
  })

  it('escalates blocker older than 48h', async () => {
    createBlocker({
      id: 'b1',
      createdAt: new Date(1_700_000_000_000 - 49 * 60 * 60 * 1000),
      severity: 'medium',
    })
    const result = await runEscalation()
    expect(result.blockersEscalated).toBe(1)
    expect(mockBlockers.get('b1')?.status).toBe('escalated')
  })

  it('escalates critical blocker older than 24h', async () => {
    createBlocker({
      id: 'b2',
      createdAt: new Date(1_700_000_000_000 - 25 * 60 * 60 * 1000),
      severity: 'critical',
    })
    const result = await runEscalation()
    expect(result.blockersEscalated).toBe(1)
  })

  it('does NOT escalate recent blocker', async () => {
    createBlocker({
      id: 'b3',
      createdAt: new Date(1_700_000_000_000 - 1000),
      severity: 'medium',
    })
    const result = await runEscalation()
    expect(result.blockersEscalated).toBe(0)
  })

  it('sets active commitment to at_risk when overdue < 7 days', async () => {
    createCommitment({
      id: 'c1',
      commitmentDate: new Date(1_700_000_000_000 - 2 * 24 * 60 * 60 * 1000),
      status: 'active',
    })
    const result = await runEscalation()
    expect(result.commitmentsAtRisk).toBe(1)
    expect(mockCommitments.get('c1')?.status).toBe('at_risk')
  })

  it('sets overdue commitment to breached after 7+ days', async () => {
    createCommitment({
      id: 'c2',
      commitmentDate: new Date(1_700_000_000_000 - 8 * 24 * 60 * 60 * 1000),
      status: 'active',
    })
    const result = await runEscalation()
    expect(result.commitmentsBreached).toBe(1)
    expect(mockCommitments.get('c2')?.status).toBe('breached')
  })

  it('skips commitments already fulfilled', async () => {
    createCommitment({
      id: 'c3',
      commitmentDate: new Date(1_700_000_000_000 - 10 * 24 * 60 * 60 * 1000),
      status: 'fulfilled',
    })
    const result = await runEscalation()
    expect(result.commitmentsAtRisk).toBe(0)
    expect(result.commitmentsBreached).toBe(0)
  })

  it('returns zeros when no data', async () => {
    const result = await runEscalation()
    expect(result).toEqual({ blockersEscalated: 0, commitmentsAtRisk: 0, commitmentsBreached: 0 })
  })
})

describe('getAttentionCounts', () => {
  beforeEach(() => {
    mockBlockers.clear()
    mockCommitments.clear()
    mockActivities.clear()
  })

  it('counts active and escalated blockers', async () => {
    createBlocker({ id: 'b1', status: 'open', severity: 'low' })
    createBlocker({ id: 'b2', status: 'escalated', severity: 'high' })

    const counts = await getAttentionCounts()
    expect(counts.activeBlockers).toBe(1)
    expect(counts.escalatedBlockers).toBe(1)
  })

  it('counts at_risk and breached commitments', async () => {
    createCommitment({ id: 'c1', status: 'at_risk' })
    createCommitment({ id: 'c2', status: 'breached' })
    createCommitment({ id: 'c3', status: 'active' })

    const counts = await getAttentionCounts()
    expect(counts.atRiskCommitments).toBe(1)
    expect(counts.breachedCommitments).toBe(1)
  })

  it('counts overdue activities', async () => {
    mockActivities.set('a1', {
      id: 'a1',
      title: 'Overdue',
      status: 'in_progress',
      dueDate: new Date(1_600_000_000_000),
      planId: 'plan1',
      tenantId: 'default',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Activity)
    mockActivities.set('a2', {
      id: 'a2',
      title: 'Done',
      status: 'completed',
      dueDate: new Date(1_600_000_000_000),
      planId: 'plan1',
      tenantId: 'default',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Activity)

    const counts = await getAttentionCounts()
    expect(counts.overdueActivities).toBe(1)
  })
})
