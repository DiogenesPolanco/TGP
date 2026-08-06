import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { buscarEntregableTool } from './entregables'

const now = new Date()
const d = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id,
    title: `Entregable ${id}`,
    status: 'pending',
    dueDate: new Date('2027-01-01'),
    description: '',
    ...over,
  }) as never

describe('buscarEntregableTool', () => {
  beforeEach(async () => {
    await Promise.all([db.deliverables.clear(), db.applications.clear()])
  })

  it('lista entregables con resumen de pendientes', async () => {
    await db.applications.add({ id: 'a1', name: 'ERP' } as never)
    await db.deliverables.bulkAdd([
      d('x', { applicationId: 'a1', status: 'completed' }),
      d('y', { status: 'in_progress' }),
    ])
    const out = await buscarEntregableTool.execute({})
    expect(out).toContain('Se encontraron 2 entregable(s)')
    expect(out).toContain('✅ **Entregable x** · App: ERP')
    expect(out).toContain('🔄 **Entregable y** · App: —')
    expect(out).toContain('📊 1 pendiente(s) de 2')
  })

  it('busca por texto con normalización', async () => {
    await db.deliverables.add(d('x', { title: 'Migración crítica', description: 'Core bancario' }))
    await db.deliverables.add(d('y', { title: 'Otro' }))
    const out = await buscarEntregableTool.execute({ q: 'migracion' })
    expect(out).toContain('Migración crítica')
    expect(out).not.toContain('Otro')
  })

  it('filtra por applicationId y estado', async () => {
    await db.deliverables.bulkAdd([
      d('x', { applicationId: 'a1', status: 'completed' }),
      d('y', { applicationId: 'a2', status: 'cancelled' }),
    ])
    expect(await buscarEntregableTool.execute({ applicationId: 'a2' })).toContain('Entregable y')
    const out = await buscarEntregableTool.execute({ estado: 'completed' })
    expect(out).toContain('Entregable x')
    expect(out).not.toContain('Entregable y')
  })

  it('filtra vencidos con icono y advertencia', async () => {
    const pasado = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    await db.deliverables.bulkAdd([
      d('v', { dueDate: pasado, status: 'pending' }),
      d('c', { dueDate: pasado, status: 'completed' }),
    ])
    const out = await buscarEntregableTool.execute({ vencidos: true })
    expect(out).toContain('Entregable v')
    expect(out).not.toContain('Entregable c')
    const todas = await buscarEntregableTool.execute({})
    expect(todas).toContain('🔴 **Entregable v**')
    expect(todas).toContain('⚠️ VENCIDO')
  })

  it('muestra ❌ para cancelados', async () => {
    await db.deliverables.add(d('x', { status: 'cancelled' }))
    const out = await buscarEntregableTool.execute({})
    expect(out).toContain('❌ **Entregable x**')
  })

  it('devuelve sin resultados con criterios', async () => {
    await db.deliverables.add(d('x'))
    const out = await buscarEntregableTool.execute({ q: 'zzz' })
    expect(out).toBe('No se encontraron entregables con los criterios indicados.')
  })

  it('aplica limit', async () => {
    await db.deliverables.bulkAdd([d('a'), d('b'), d('c')])
    const out = await buscarEntregableTool.execute({ limit: 2 })
    expect(out).toContain('Se encontraron 2 entregable(s)')
  })
})
