import { describe, it, expect, vi } from 'vitest'
import {
  DEV_ROLES,
  getMemberKPIs,
  getTeamPerformanceIndicators,
  getGlobalMembersKPIs,
} from '../performanceService'
import type { Team, TeamMember } from '@/types/domain'

const mockDb = vi.hoisted(() => ({
  sprintRecords: { where: vi.fn() },
  oneOnOnes: { where: vi.fn() },
  achievements: { where: vi.fn() },
  teams: { toArray: vi.fn() },
}))

vi.mock('@/services/db/database', () => ({
  db: mockDb,
}))

function setupMockWhere(store: any, results: any[]) {
  store.where.mockReturnValue({
    equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(results) }),
  })
}

function makeMember(id: string, role: string, name = 'Member'): TeamMember {
  return {
    id,
    userPrincipal: `${id}@test.com`,
    displayName: name,
    role: role as any,
    allocationPct: 100,
    status: 'activo',
  }
}

function makeTeam(id: string, members: TeamMember[]): Team {
  return {
    id,
    name: `Team ${id}`,
    businessUnitId: 'bu1',
    sourceSystem: 'internal' as any,
    externalId: id,
    members,
    currentMetrics: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe('DEV_ROLES', () => {
  it('includes developer role', () => {
    expect(DEV_ROLES).toContain('developer')
  })

  it('includes senior_developer role', () => {
    expect(DEV_ROLES).toContain('senior_developer')
  })

  it('includes tech_lead role', () => {
    expect(DEV_ROLES).toContain('tech_lead')
  })

  it('has exactly 3 roles', () => {
    expect(DEV_ROLES).toHaveLength(3)
  })

  it('does not include non-dev roles', () => {
    expect(DEV_ROLES).not.toContain('manager')
    expect(DEV_ROLES).not.toContain('designer')
    expect(DEV_ROLES).not.toContain('po')
  })
})

describe('getMemberKPIs', () => {
  it('returns defaults when no data', async () => {
    setupMockWhere(mockDb.sprintRecords, [])
    setupMockWhere(mockDb.oneOnOnes, [])
    setupMockWhere(mockDb.achievements, [])

    const kpis = await getMemberKPIs('m1')
    expect(kpis.memberId).toBe('m1')
    expect(kpis.totalSP).toBe(0)
    expect(kpis.efficiencyPct).toBe(0)
    expect(kpis.avgMood).toBe(0)
    expect(kpis.oneOnOneCount).toBe(0)
    expect(kpis.openOpportunitiesCount).toBe(0)
    expect(kpis.achievementCount).toBe(0)
    expect(kpis.lastOneOnOneDate).toBeNull()
  })

  it('calculates efficiency from sprint data', async () => {
    setupMockWhere(mockDb.sprintRecords, [
      { storyPointsCompleted: 8, storyPointsNotCompleted: 2 },
      { storyPointsCompleted: 7, storyPointsNotCompleted: 3 },
    ])
    setupMockWhere(mockDb.oneOnOnes, [])
    setupMockWhere(mockDb.achievements, [])

    const kpis = await getMemberKPIs('m1')
    expect(kpis.totalSP).toBe(15)
    expect(kpis.efficiencyPct).toBe(75)
  })

  it('calculates avg mood from one-on-ones', async () => {
    setupMockWhere(mockDb.sprintRecords, [])
    setupMockWhere(mockDb.oneOnOnes, [
      { date: new Date('2026-01-01'), estadoAnimo: 5, oportunidades: [] },
      { date: new Date('2026-06-01'), estadoAnimo: 3, oportunidades: [] },
    ])
    setupMockWhere(mockDb.achievements, [])

    const kpis = await getMemberKPIs('m1')
    expect(kpis.avgMood).toBe(4)
    expect(kpis.oneOnOneCount).toBe(2)
  })

  it('counts open opportunities', async () => {
    setupMockWhere(mockDb.sprintRecords, [])
    setupMockWhere(mockDb.oneOnOnes, [
      {
        date: new Date(),
        estadoAnimo: 3,
        oportunidades: [
          { status: 'pendiente' },
          { status: 'en_progreso' },
          { status: 'completada' },
        ],
      },
    ])
    setupMockWhere(mockDb.achievements, [])

    const kpis = await getMemberKPIs('m1')
    expect(kpis.openOpportunitiesCount).toBe(2)
  })

  it('uses most recent 1:1 date as lastOneOnOneDate', async () => {
    setupMockWhere(mockDb.sprintRecords, [])
    setupMockWhere(mockDb.oneOnOnes, [
      { date: new Date('2025-01-01'), estadoAnimo: 3, oportunidades: [] },
      { date: new Date('2026-06-15'), estadoAnimo: 4, oportunidades: [] },
    ])
    setupMockWhere(mockDb.achievements, [])

    const kpis = await getMemberKPIs('m1')
    expect(kpis.lastOneOnOneDate!.getFullYear()).toBe(2026)
  })

  it('counts achievements', async () => {
    setupMockWhere(mockDb.sprintRecords, [])
    setupMockWhere(mockDb.oneOnOnes, [])
    setupMockWhere(mockDb.achievements, [{ id: 'a1' }, { id: 'a2' }])

    const kpis = await getMemberKPIs('m1')
    expect(kpis.achievementCount).toBe(2)
  })
})

describe('getTeamPerformanceIndicators', () => {
  it('returns nulls for empty members', async () => {
    const team = makeTeam('t1', [])
    const result = await getTeamPerformanceIndicators(team)
    expect(result.bestPerformer).toBeNull()
    expect(result.worstPerformer).toBeNull()
    expect(result.topSP).toBeNull()
    expect(result.bottomSP).toBeNull()
  })

  it('returns nulls when no dev-role members', async () => {
    const team = makeTeam('t1', [makeMember('m1', 'admin')])
    const result = await getTeamPerformanceIndicators(team)
    expect(result.bestPerformer).toBeNull()
    expect(result.worstPerformer).toBeNull()
  })

  it('identifies best/worst performer among dev members', async () => {
    const team = makeTeam('t1', [
      makeMember('m1', 'developer', 'Alice'),
      makeMember('m2', 'senior_developer', 'Bob'),
    ])

    const whereSpy = vi.spyOn(mockDb.sprintRecords, 'where')
    whereSpy
      .mockReturnValueOnce({
        equals: vi.fn().mockReturnValue({
          toArray: vi
            .fn()
            .mockResolvedValue([{ storyPointsCompleted: 10, storyPointsNotCompleted: 0 }]),
        }),
      })
      .mockReturnValueOnce({
        equals: vi.fn().mockReturnValue({
          toArray: vi
            .fn()
            .mockResolvedValue([{ storyPointsCompleted: 5, storyPointsNotCompleted: 5 }]),
        }),
      })

    setupMockWhere(mockDb.oneOnOnes, [])
    setupMockWhere(mockDb.achievements, [])

    const result = await getTeamPerformanceIndicators(team)
    expect(result.bestPerformer!.member.id).toBe('m1')
    expect(result.worstPerformer!.member.id).toBe('m2')
    expect(result.topSP!.member.id).toBe('m1')
    expect(result.topSP!.sp).toBe(10)
    expect(result.bottomSP!.member.id).toBe('m2')
    expect(result.bottomSP!.sp).toBe(5)
  })
})

describe('getGlobalMembersKPIs', () => {
  it('returns empty when no teams', async () => {
    mockDb.teams.toArray.mockResolvedValue([])
    const result = await getGlobalMembersKPIs()
    expect(result.kpisList).toHaveLength(0)
    expect(result.bestPerformer).toBeNull()
    expect(result.needsAttention).toBeNull()
  })

  it('aggregates across teams filtering dev roles', async () => {
    mockDb.teams.toArray.mockResolvedValue([
      makeTeam('t1', [makeMember('m1', 'developer', 'Alice')]),
      makeTeam('t2', [makeMember('m2', 'tech_lead', 'Bob')]),
    ])

    setupMockWhere(mockDb.sprintRecords, [{ storyPointsCompleted: 10, storyPointsNotCompleted: 0 }])
    setupMockWhere(mockDb.oneOnOnes, [])
    setupMockWhere(mockDb.achievements, [])

    const result = await getGlobalMembersKPIs()
    expect(result.kpisList).toHaveLength(2)
    expect(result.bestPerformer).not.toBeNull()
  })
})
