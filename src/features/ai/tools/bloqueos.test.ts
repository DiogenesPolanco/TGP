import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { consultarBloqueosTool } from './bloqueos'

const b = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id,
    title: `Bloqueo ${id}`,
    sourceType: 'task',
    sourceId: 'src1',
    severity: 'high',
    raisedById: 'u1',
    assigneeId: 'u2',
    createdAt: new Date('2025-01-10'),
    description: 'Descripción del bloqueo',
    ...over,
  }) as never

describe('consultarBloqueosTool', () => {
  beforeEach(async () => {
    await Promise.all([
      db.blockers.clear(),
      db.users.clear(),
      db.plans.clear(),
      db.tasks.clear(),
      db.activities.clear(),
      db.commitments.clear(),
    ])
  })

  it('devuelve festejo sin bloqueos', async () => {
    const out = await consultarBloqueosTool.execute({})
    expect(out).toBe('🎉 No se encontraron bloqueos activos con los filtros indicados.')
  })

  it('lista bloqueos con responsables y items resueltos', async () => {
    await db.users.add({ id: 'u1', displayName: 'Ana', email: 'ana@x.com' } as never)
    await db.users.add({ id: 'u2', displayName: 'Bruno', email: 'bruno@x.com' } as never)
    await db.tasks.add({ id: 'src1', title: 'Tarea bloqueada' } as never)
    await db.blockers.add(
      b('b1', { escalatedAt: new Date('2025-01-12'), resolvedAt: new Date('2025-01-20') }),
    )
    const out = await consultarBloqueosTool.execute({})
    expect(out).toContain('🔴 **Bloqueos activos**')
    expect(out).toContain('**Tarea bloqueada** (tarea)')
    expect(out).toContain('Reportó: Ana')
    expect(out).toContain('Asignado: Bruno')
    expect(out).toContain('⚡ Escalado:')
    expect(out).toContain('✅ Resuelto:')
    expect(out).toContain('**Total: 1 bloqueo(s) activo(s)**')
  })

  it('filtra por tipo, severidad, responsable y diasMaximo', async () => {
    const viejo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const nuevo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    await db.blockers.bulkAdd([
      b('b1', { sourceType: 'plan', severity: 'critical', assigneeId: 'u1', createdAt: viejo }),
      b('b2', { sourceType: 'task', severity: 'low', assigneeId: 'u2', createdAt: nuevo }),
    ])
    const porTipo = await consultarBloqueosTool.execute({ tipo: 'plan' })
    expect(porTipo).toContain('plan #src1')
    expect(porTipo).not.toContain('tarea #src1')
    expect(await consultarBloqueosTool.execute({ severidad: 'low' })).toContain('tarea #src1')
    expect(await consultarBloqueosTool.execute({ responsable: 'u1' })).toContain('plan #src1')
    const porDias = await consultarBloqueosTool.execute({ diasMaximo: 7 })
    expect(porDias).toContain('plan #src1')
    expect(porDias).not.toContain('tarea #src1')
  })

  it('resuelve títulos por tipo y cae a fallback', async () => {
    await db.blockers.bulkAdd([
      b('b1', { sourceType: 'plan', sourceId: 'p1' }),
      b('b2', { sourceType: 'activity', sourceId: 'act1' }),
      b('b3', { sourceType: 'commitment', sourceId: 'cm1' }),
      b('b4', { sourceType: 'otro', sourceId: 'zzz' }),
    ])
    const out = await consultarBloqueosTool.execute({})
    expect(out).toContain('plan #p1')
    expect(out).toContain('actividad #act1')
    expect(out).toContain('compromiso #cm1')
    expect(out).toContain('#zzz')
  })

  it('resuelve responsables desde planes y fallbacks de usuarios', async () => {
    await db.blockers.add(
      b('b1', { sourceType: 'plan', sourceId: 'p1', raisedById: 'u9', assigneeId: null }),
    )
    const out = await consultarBloqueosTool.execute({})
    expect(out).toContain('Asignado: —')
    expect(out).toContain('Reportó: u9')
  })
})
