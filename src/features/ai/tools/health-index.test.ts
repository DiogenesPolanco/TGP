import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { consultarHealthIndexTool } from './health-index'

const h = (id: string, score: number, over: Record<string, unknown> = {}) => {
  const base = Date.now() - 10 * 24 * 60 * 60 * 1000
  const ts = base + (id === 'h2' ? 3 * 24 * 60 * 60 * 1000 : 0)
  return {
    id,
    businessUnitId: 'bu1',
    overallScore: score,
    deliveryScore: score,
    qualityScore: score,
    securityScore: score,
    availabilityScore: score,
    obsolescenceScore: score,
    riskScore: score,
    complianceScore: score,
    calculatedAt: new Date(ts),
    ...over,
  } as never
}

describe('consultarHealthIndexTool', () => {
  beforeEach(async () => {
    await db.healthIndexHistory.clear()
  })

  it('devuelve sin registros en el período', async () => {
    await db.healthIndexHistory.add(h('h1', 7, { calculatedAt: new Date('2020-01-01') }))
    const out = await consultarHealthIndexTool.execute({})
    expect(out).toBe('No hay registros de Health Index en el período seleccionado (90d).')
  })

  it('muestra evolución y desglose por dimensión', async () => {
    await db.healthIndexHistory.bulkAdd([h('h1', 5), h('h2', 7)])
    const out = await consultarHealthIndexTool.execute({})
    expect(out).toContain('**Evolución general:**')
    expect(out).toContain('📍 Inicio: 5.0/10')
    expect(out).toContain('📍 Actual: 7.0/10')
    expect(out).toContain('📈 Mejorando (+2.0 · 40.0%)')
    expect(out).toContain('**Puntos extremos:**')
    expect(out).toContain('🟢 Máximo: 7.0')
    expect(out).toContain('🔴 Mínimo: 5.0')
    expect(out).toContain('**Desglose por dimensión (último registro):**')
    expect(out).toContain('Entrega: 7.0/10')
  })

  it('detecta deterioro', async () => {
    await db.healthIndexHistory.bulkAdd([h('h1', 8), h('h2', 6)])
    const out = await consultarHealthIndexTool.execute({})
    expect(out).toContain('📉 Deteriorando (-2.0 · -25.0%)')
  })

  it('detecta estabilidad', async () => {
    await db.healthIndexHistory.bulkAdd([h('h1', 6.2), h('h2', 6.4)])
    const out = await consultarHealthIndexTool.execute({})
    expect(out).toContain('➡️ Estable')
  })

  it('maneja score inicial 0', async () => {
    await db.healthIndexHistory.bulkAdd([h('h1', 0), h('h2', 1)])
    const out = await consultarHealthIndexTool.execute({})
    expect(out).toContain('(+1.0 · 0%)')
  })

  it('muestra todo el histórico con periodo all', async () => {
    await db.healthIndexHistory.bulkAdd([h('h1', 6), h('h2', 6.5)])
    const out = await consultarHealthIndexTool.execute({ periodo: 'all' })
    expect(out).toContain('Todo el histórico · 2 registro(s)')
  })

  it('filtra por buId', async () => {
    await db.healthIndexHistory.bulkAdd([
      h('h1', 6, { businessUnitId: 'bu1' }),
      h('h2', 9, { businessUnitId: 'bu2' }),
    ])
    const out = await consultarHealthIndexTool.execute({ buId: 'bu1' })
    expect(out).toContain('📍 Actual: 6.0/10')
    expect(out).not.toContain('Usá buId')
  })

  it('sugiere buId cuando no se filtra', async () => {
    await db.healthIndexHistory.bulkAdd([h('h1', 6), h('h2', 6.5)])
    const out = await consultarHealthIndexTool.execute({})
    expect(out).toContain('Usá buId para ver el THI de una unidad de negocio específica.')
  })

  it('muestra dimensión específica', async () => {
    await db.healthIndexHistory.bulkAdd([
      h('h1', 5, { securityScore: 4 }),
      h('h2', 7, { securityScore: 8 }),
    ])
    const out = await consultarHealthIndexTool.execute({ dimension: 'Seguridad' })
    expect(out).toContain('**Dimensión: Seguridad**')
    expect(out).toContain('📍 Inicio: 4.0/10 → Actual: 8.0/10')
    expect(out).toContain('+4.0')
  })

  it('informa dimensión no reconocida', async () => {
    await db.healthIndexHistory.bulkAdd([h('h1', 6), h('h2', 6.5)])
    const out = await consultarHealthIndexTool.execute({ dimension: 'Blockchain' })
    expect(out).toContain('Dimensión "Blockchain" no reconocida.')
  })
})
