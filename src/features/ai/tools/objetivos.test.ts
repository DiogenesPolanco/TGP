import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { objetivosTool, planesTool } from './objetivos'

const o = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id,
    title: `Objetivo ${id}`,
    status: 'on_track',
    progress: 50,
    keyResults: [],
    periodStart: new Date('2025-01-01'),
    periodEnd: new Date('2025-12-31'),
    ...over,
  }) as never

const p = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id,
    title: `Plan ${id}`,
    status: 'in_progress',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-06-30'),
    ...over,
  }) as never

describe('objetivosTool', () => {
  beforeEach(async () => {
    await Promise.all([db.objectives.clear(), db.teams.clear(), db.plans.clear()])
  })

  it('lista objetivos con equipo y período', async () => {
    await db.teams.add({ id: 't1', name: 'Equipo Core' } as never)
    await db.objectives.add(o('o1', { teamId: 't1', progress: 75 }))
    const out = await objetivosTool.execute({})
    expect(out).toContain('Se encontraron 1 objetivo(s)')
    expect(out).toContain('Objetivo o1')
    expect(out).toContain('Equipo: Equipo Core')
    expect(out).toContain('Progreso: 75%')
  })

  it('muestra sin equipo y sin KRs', async () => {
    await db.objectives.add(o('o1'))
    const out = await objetivosTool.execute({})
    expect(out).toContain('Equipo: Sin equipo')
    expect(out).toContain('(sin Key Results definidos)')
  })

  it('muestra key results', async () => {
    await db.objectives.add(
      o('o1', {
        keyResults: [{ title: 'KR1', current: 3, target: 5, status: 'on_track' }],
      }),
    )
    const out = await objetivosTool.execute({})
    expect(out).toContain('KR1: 3/5 (on_track)')
  })

  it('filtra por teamId, businessUnitId y status', async () => {
    await db.objectives.bulkAdd([
      o('o1', { teamId: 't1', status: 'achieved' }),
      o('o2', { businessUnitId: 'bu2', status: 'behind' }),
    ])
    expect(await objetivosTool.execute({ teamId: 't1' })).toContain('Objetivo o1')
    expect(await objetivosTool.execute({ businessUnitId: 'bu2' })).toContain('Objetivo o2')
    expect(await objetivosTool.execute({ status: 'behind' })).toContain('Objetivo o2')
  })

  it('filtra activos excluyendo achieved y fuera de período', async () => {
    await db.objectives.bulkAdd([
      o('o1', { status: 'achieved' }),
      o('o2', { status: 'on_track', periodEnd: new Date('2030-01-01') }),
      o('o3', { status: 'on_track', periodEnd: new Date('2020-01-01') }),
    ])
    const out = await objetivosTool.execute({ activos: true })
    expect(out).toContain('Objetivo o2')
    expect(out).not.toContain('Objetivo o1')
    expect(out).not.toContain('Objetivo o3')
  })

  it('aplica limit y ordena por período', async () => {
    await db.objectives.bulkAdd([
      o('b', { periodEnd: new Date('2025-06-01') }),
      o('a', { periodEnd: new Date('2025-03-01') }),
    ])
    const out = await objetivosTool.execute({ limit: 1 })
    expect(out).toContain('Objetivo a')
    expect(out).not.toContain('Objetivo b')
  })
})

describe('planesTool', () => {
  beforeEach(async () => {
    await Promise.all([db.plans.clear(), db.teams.clear()])
  })

  it('lista planes con equipo', async () => {
    await db.teams.add({ id: 't1', name: 'Equipo Core' } as never)
    await db.plans.add(p('p1', { teamId: 't1' }))
    const out = await planesTool.execute({})
    expect(out).toContain('Se encontraron 1 plan(es)')
    expect(out).toContain('Plan p1')
    expect(out).toContain('Equipo: Equipo Core')
    expect(out).toContain('Estado: in_progress')
  })

  it('muestra sin equipo', async () => {
    await db.plans.add(p('p1'))
    const out = await planesTool.execute({})
    expect(out).toContain('Equipo: Sin equipo')
  })

  it('filtra por teamId, status y activos', async () => {
    await db.plans.bulkAdd([
      p('p1', { teamId: 't1', status: 'planned' }),
      p('p2', { teamId: 't2', status: 'completed' }),
    ])
    expect(await planesTool.execute({ teamId: 't2' })).toContain('Plan p2')
    expect(await planesTool.execute({ status: 'completed' })).toContain('Plan p2')
    const activos = await planesTool.execute({ activos: true })
    expect(activos).toContain('Plan p1')
    expect(activos).not.toContain('Plan p2')
  })

  it('aplica limit', async () => {
    await db.plans.bulkAdd([p('a'), p('b'), p('c')])
    const out = await planesTool.execute({ limit: 2 })
    expect(out).toContain('Se encontraron 2 plan(es)')
  })
})
