import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { compromisosTool, tareasTool } from './compromisos'

const now = new Date()
const c = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id,
    title: `Compromiso ${id}`,
    status: 'active',
    ownerId: 'u1',
    accountableId: 'u2',
    commitmentDate: new Date('2025-01-15'),
    ...over,
  }) as never

describe('compromisosTool', () => {
  beforeEach(async () => {
    await Promise.all([db.commitments.clear(), db.users.clear()])
  })

  it('lista compromisos con responsables resueltos', async () => {
    await db.users.add({ id: 'u1', displayName: 'Ana' } as never)
    await db.commitments.add(c('c1'))
    const out = await compromisosTool.execute({})
    expect(out).toContain('Se encontraron 1 compromiso(s)')
    expect(out).toContain('Compromiso c1')
    expect(out).toContain('Responsable: Ana')
    expect(out).toContain('Rinde: u2')
    expect(out).toContain('Estado: active')
  })

  it('filtra por status, teamId y ownerId (owner o accountable)', async () => {
    await db.commitments.bulkAdd([
      c('c1', { status: 'fulfilled', teamId: 't1', ownerId: 'u1' }),
      c('c2', { status: 'active', teamId: 't2', ownerId: 'u9' }),
    ])
    expect(await compromisosTool.execute({ status: 'fulfilled' })).toContain('Compromiso c1')
    expect(await compromisosTool.execute({ teamId: 't2' })).toContain('Compromiso c2')
    expect(await compromisosTool.execute({ ownerId: 'u1' })).toContain('Compromiso c1')
    const byAccountable = await compromisosTool.execute({ ownerId: 'u2' })
    expect(byAccountable).toContain('Compromiso c1')
  })

  it('filtra vencidos y esta semana', async () => {
    const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const manana = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    await db.commitments.bulkAdd([
      c('viejo', { commitmentDate: ayer }),
      c('futuro', { commitmentDate: manana }),
      c('cumplido', { commitmentDate: ayer, status: 'fulfilled' }),
    ])
    const vencidos = await compromisosTool.execute({ vencidos: true })
    expect(vencidos).toContain('Compromiso viejo')
    expect(vencidos).not.toContain('Compromiso cumplido')
    const semana = await compromisosTool.execute({ estaSemana: 'true' })
    expect(semana).toContain('Compromiso futuro')
    expect(semana).not.toContain('Compromiso viejo')
  })

  it('marca vencidos y resume', async () => {
    const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    await db.commitments.bulkAdd([
      c('v1', { commitmentDate: ayer }),
      c('v2', { commitmentDate: ayer }),
    ])
    const out = await compromisosTool.execute({})
    expect(out).toContain('Se encontraron 2 compromiso(s), 2 vencido(s)')
    expect(out).toContain('[VENCIDO]')
  })

  it('aplica limit y ordena por fecha', async () => {
    await db.commitments.bulkAdd([
      c('b', { commitmentDate: new Date('2025-02-01') }),
      c('a', { commitmentDate: new Date('2025-01-01') }),
    ])
    const out = await compromisosTool.execute({ limit: 1 })
    expect(out).toContain('Se encontraron 1 compromiso(s)')
    expect(out).toContain('Compromiso a')
    expect(out).not.toContain('Compromiso b')
  })
})

describe('tareasTool', () => {
  beforeEach(async () => {
    await Promise.all([db.tasks.clear(), db.users.clear()])
  })

  it('lista tareas ordenadas por prioridad', async () => {
    await db.users.add({ id: 'u1', displayName: 'Ana' } as never)
    await db.tasks.bulkAdd([
      { id: 't1', title: 'Baja', status: 'todo', assigneeId: 'u1', priority: 'low' },
      { id: 't2', title: 'Critica', status: 'todo', assigneeId: null, priority: 'critical' },
    ] as never)
    const out = await tareasTool.execute({})
    expect(out).toContain('Se encontraron 2 tarea(s)')
    expect(out.indexOf('Critica')).toBeLessThan(out.indexOf('Baja'))
    expect(out).toContain('Asignado: Ana')
    expect(out).toContain('Asignado: Sin asignar')
    expect(out).toContain('Vence: Sin fecha')
  })

  it('filtra por status, assigneeId, priority y planId', async () => {
    await db.tasks.bulkAdd([
      { id: 't1', title: 'A', status: 'done', assigneeId: 'u1', priority: 'high', planId: 'p1' },
      { id: 't2', title: 'B', status: 'todo', assigneeId: 'u2', priority: 'low', planId: 'p2' },
    ] as never)
    expect(await tareasTool.execute({ status: 'done' })).toContain('A')
    expect(await tareasTool.execute({ assigneeId: 'u2' })).toContain('B')
    expect(await tareasTool.execute({ priority: 'high' })).toContain('A')
    expect(await tareasTool.execute({ planId: 'p2' })).toContain('B')
  })

  it('filtra vencidas y marca [VENCIDA]', async () => {
    const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    await db.tasks.bulkAdd([
      { id: 't1', title: 'Vencida', status: 'todo', priority: 'medium', dueDate: ayer },
      { id: 't2', title: 'Hecha', status: 'done', priority: 'medium', dueDate: ayer },
    ] as never)
    const out = await tareasTool.execute({ vencidas: true })
    expect(out).toContain('Vencida')
    expect(out).not.toContain('Hecha')
    const todas = await tareasTool.execute({})
    expect(todas).toContain('[VENCIDA]')
  })
})
