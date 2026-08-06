import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import type { Team } from '@/types/domain'
import type { TeamSprint } from '@/types/domain/performance'
import { consultarMetricasSprintTool } from './metricas-sprint'

const baseTeam = (id: string, name: string): Team => ({
  id,
  businessUnitId: 'bu1',
  name,
  sourceSystem: 'manual',
  externalId: '',
  members: [],
  currentMetrics: null,
  metadata: {},
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
})

const baseSprint = (
  id: string,
  teamId: string,
  overrides: Partial<TeamSprint> = {},
): TeamSprint => ({
  id,
  teamId,
  sprintName: 'Sprint 1',
  quarter: '1',
  year: 2025,
  startDate: new Date('2025-01-06'),
  endDate: new Date('2025-01-17'),
  plannedSP: 20,
  completedSP: 15,
  notCompletedSP: 5,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

describe('consultarMetricasSprintTool', () => {
  beforeEach(async () => {
    await Promise.all([db.teamSprints.clear(), db.teams.clear()])
  })

  it('devuelve sin resultados cuando no hay sprints', async () => {
    const out = await consultarMetricasSprintTool.execute({})
    expect(out).toBe('No se encontraron registros de sprint con los filtros indicados.')
  })

  it('calcula salud de sprint por equipo', async () => {
    await db.teams.add(baseTeam('t1', 'Equipo Alpha'))
    await db.teamSprints.bulkAdd([baseSprint('s1', 't1'), baseSprint('s2', 't1')])
    const out = await consultarMetricasSprintTool.execute({})
    expect(out).toContain('Equipo Alpha')
    expect(out).toContain('Sprints: 2 (2 completados)')
    expect(out).toContain('Completitud promedio: 75.0%')
    expect(out).toContain('Velocidad promedio: 15.0 SP/sprint')
  })

  it('filtra por teamId, year y quarter', async () => {
    await db.teamSprints.bulkAdd([
      baseSprint('s1', 't1'),
      baseSprint('s2', 't2', { quarter: '2' }),
      baseSprint('s3', 't2', { year: 2024 }),
    ])
    const out = await consultarMetricasSprintTool.execute({ teamId: 't2', year: 2025, quarter: 2 })
    expect(out).toContain('Sprints: 1 (1 completados)')
  })

  it('muestra tendencia con 3+ sprints (mejora y empeora)', async () => {
    await db.teamSprints.bulkAdd([
      baseSprint('s1', 't1', { completedSP: 5, plannedSP: 20 }),
      baseSprint('s2', 't1', { completedSP: 10, plannedSP: 20 }),
      baseSprint('s3', 't1', { completedSP: 15, plannedSP: 20 }),
    ])
    const out = await consultarMetricasSprintTool.execute({})
    expect(out).toContain('Tendencia (últimos 3): 25% → 50% → 75%')
  })

  it('muestra tendencia negativa cuando empeora', async () => {
    await db.teamSprints.bulkAdd([
      baseSprint('s1', 't1', { completedSP: 15, plannedSP: 20 }),
      baseSprint('s2', 't1', { completedSP: 10, plannedSP: 20 }),
      baseSprint('s3', 't1', { completedSP: 5, plannedSP: 20 }),
    ])
    const out = await consultarMetricasSprintTool.execute({})
    expect(out).toContain('📉 Tendencia')
  })

  it('no muestra tendencia con menos de 3 sprints', async () => {
    await db.teamSprints.add(baseSprint('s1', 't1'))
    const out = await consultarMetricasSprintTool.execute({})
    expect(out).not.toContain('Tendencia')
  })

  it('maneja plannedSP 0', async () => {
    await db.teamSprints.add(baseSprint('s1', 't1', { plannedSP: 0, completedSP: 0 }))
    const out = await consultarMetricasSprintTool.execute({})
    expect(out).toContain('Completitud promedio: 0.0%')
  })

  it('incluye métricas DORA con datos', async () => {
    await db.teams.add(baseTeam('t1', 'Equipo Alpha'))
    await db.teamSprints.bulkAdd([
      baseSprint('s1', 't1', { completedSP: 10, notCompletedSP: 5 }),
      baseSprint('s2', 't1', { completedSP: 0, notCompletedSP: 3 }),
    ])
    const out = await consultarMetricasSprintTool.execute({ incluirDORA: true })
    expect(out).toContain('Métricas DORA')
    expect(out).toContain('Deploy frequency: 1 deploys')
    expect(out).toContain('Change failure rate: 88.9%')
  })

  it('acepta incluirDORA como string "true"', async () => {
    await db.teamSprints.add(baseSprint('s1', 't1'))
    const out = await consultarMetricasSprintTool.execute({ incluirDORA: 'true' })
    expect(out).toContain('Métricas DORA')
  })

  it('muestra sin deploys cuando no hay completitud', async () => {
    await db.teamSprints.add(baseSprint('s1', 't1', { completedSP: 0, notCompletedSP: 0 }))
    const out = await consultarMetricasSprintTool.execute({ incluirDORA: true })
    expect(out).toContain('Métricas DORA')
    expect(out).toContain('Deploy frequency: 0 deploys')
    expect(out).toContain('Change failure rate: 0%')
  })

  it('filtra métricas DORA por teamId', async () => {
    await db.teamSprints.bulkAdd([
      baseSprint('s1', 't1', { completedSP: 10, notCompletedSP: 5 }),
      baseSprint('s2', 't2', { completedSP: 8, notCompletedSP: 2 }),
    ])
    const out = await consultarMetricasSprintTool.execute({ teamId: 't1', incluirDORA: true })
    expect(out).toContain('Deploy frequency: 1 deploys')
    expect(out).toContain('Change failure rate: 83.3%')
    expect(out).not.toContain('t2')
  })

  it('muestra resumen por equipos cuando no hay teamId', async () => {
    await db.teamSprints.add(baseSprint('s1', 't1'))
    const out = await consultarMetricasSprintTool.execute({})
    expect(out).toContain('**Resumen:** 1 equipo(s) con datos de sprint en el período.')
  })

  it('no muestra resumen cuando hay teamId', async () => {
    await db.teamSprints.add(baseSprint('s1', 't1'))
    const out = await consultarMetricasSprintTool.execute({ teamId: 't1' })
    expect(out).not.toContain('**Resumen:**')
  })

  it('muestra el teamId cuando el equipo no existe en el mapa', async () => {
    await db.teamSprints.add(baseSprint('s1', 't-desconocido'))
    const out = await consultarMetricasSprintTool.execute({})
    expect(out).toContain('t-desconocido')
  })
})
