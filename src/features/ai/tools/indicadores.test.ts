import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { consultarIndicadoresTool } from './indicadores'

const now = new Date()
const health = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id,
    businessUnitId: 'bu1',
    overallScore: 7.5,
    deliveryScore: 7,
    qualityScore: 6,
    securityScore: 8,
    availabilityScore: 7.5,
    obsolescenceScore: 5,
    riskScore: 6.5,
    complianceScore: 9,
    calculatedAt: now,
    ...over,
  }) as never

describe('consultarIndicadoresTool', () => {
  beforeEach(async () => {
    await Promise.all([
      db.healthIndexHistory.clear(),
      db.vulnerabilities.clear(),
      db.incidents.clear(),
      db.risks.clear(),
      db.objectives.clear(),
      db.commitments.clear(),
      db.tasks.clear(),
      db.teams.clear(),
    ])
  })

  it('muestra placeholder sin datos', async () => {
    const out = await consultarIndicadoresTool.execute({})
    expect(out).toContain('No hay datos disponibles para mostrar indicadores.')
  })

  it('muestra THI con dimensiones', async () => {
    await db.healthIndexHistory.add(health('h1'))
    const out = await consultarIndicadoresTool.execute({})
    expect(out).toContain('📊 **Dashboard ejecutivo**')
    expect(out).toContain('🏥 **THI (Technology Health Index):** 7.5/10')
    expect(out).toContain('· Entrega: 7.0')
    expect(out).toContain('· Seguridad: 8.0')
  })

  it('filtra THI por buId y maneja overallScore string', async () => {
    await db.healthIndexHistory.bulkAdd([
      health('h1', { businessUnitId: 'bu1', overallScore: 8 }),
      health('h2', { businessUnitId: 'bu2', overallScore: '6.2' }),
    ])
    const out = await consultarIndicadoresTool.execute({ buId: 'bu2' })
    expect(out).toContain('(filtrado por BU)')
    expect(out).toContain('**THI (Technology Health Index):** 6.2/10')
  })

  it('muestra vulnerabilidades, incidentes, riesgos y OKRs', async () => {
    await db.vulnerabilities.add({ id: 'v1', severity: 'critical', status: 'open' } as never)
    await db.vulnerabilities.add({ id: 'v2', severity: 'high', status: 'fixed' } as never)
    await db.incidents.add({ id: 'i1', severity: 'critical', status: 'active' } as never)
    await db.incidents.add({ id: 'i2', severity: 'high', status: 'resolved' } as never)
    await db.risks.add({ id: 'r1', riskScore: 16, status: 'open' } as never)
    await db.risks.add({ id: 'r2', riskScore: 12, status: 'mitigated' } as never)
    await db.objectives.add({ id: 'o1', status: 'at_risk' } as never)
    await db.objectives.add({ id: 'o2', status: 'achieved' } as never)
    const out = await consultarIndicadoresTool.execute({})
    expect(out).toContain('🔒 **Vulnerabilidades:** 1 abiertas (1 críticas, 0 altas)')
    expect(out).toContain('🚨 **Incidentes:** 1 activos (1 P1, 0 P2)')
    expect(out).toContain('⚠️  **Riesgos:** 1 abiertos (1 críticos, 0 altos)')
    expect(out).toContain('🎯 **OKRs:** 1 activos (1 en riesgo, 0 atrasados, 1 logrados)')
  })

  it('muestra compromisos y tareas vencidas con filtro por BU vía equipos', async () => {
    const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    await db.teams.add({ id: 't1', businessUnitId: 'bu1' } as never)
    await db.teams.add({ id: 't2', businessUnitId: 'bu2' } as never)
    await db.commitments.bulkAdd([
      { id: 'c1', teamId: 't1', status: 'active', commitmentDate: ayer },
      { id: 'c2', teamId: 't2', status: 'active', commitmentDate: ayer },
    ] as never)
    await db.tasks.add({ id: 'tk1', status: 'todo', dueDate: ayer } as never)
    await db.tasks.add({ id: 'tk2', status: 'done', dueDate: ayer } as never)
    const out = await consultarIndicadoresTool.execute({ buId: 'bu1' })
    expect(out).toContain('📅 **Compromisos vencidos:** 1')
    expect(out).toContain('✅ **Tareas vencidas:** 1')
  })

  it('omite secciones sin datos', async () => {
    const out = await consultarIndicadoresTool.execute({})
    expect(out).not.toContain('**Vulnerabilidades:**')
    expect(out).not.toContain('**Incidentes:**')
    expect(out).not.toContain('**Riesgos:**')
    expect(out).not.toContain('**OKRs:**')
  })
})
