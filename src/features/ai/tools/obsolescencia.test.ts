import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { consultarObsolescenciaTool } from './obsolescencia'

const tech = (id: string, over: Record<string, unknown> = {}) =>
  ({
    id,
    name: `Tech ${id}`,
    version: '1.0',
    vendor: 'Oracle',
    category: 'database',
    supportStatus: 'active',
    eolDate: null,
    cveList: [],
    ...over,
  }) as never

describe('consultarObsolescenciaTool', () => {
  beforeEach(async () => {
    await db.technologies.clear()
  })

  it('muestra panorama general sin filtros', async () => {
    await db.technologies.bulkAdd([
      tech('t1', { supportStatus: 'eol', eolDate: new Date(2020, 0, 1), cveList: ['C1', 'C2'] }),
      tech('t2', { supportStatus: 'extended' }),
      tech('t3'),
    ])
    const out = await consultarObsolescenciaTool.execute({})
    expect(out).toContain('📊 **Panorama de obsolescencia tecnológica**')
    expect(out).toContain('**Total tecnologías:** 3')
    expect(out).toContain('**⛔ Vencidas (EOL/Obsoletas):** 1')
    expect(out).toContain('**⚠️  Por vencer (≤6 meses):** 1')
    expect(out).toContain('**✅ Saludables:** 1')
    expect(out).toContain('⛔ **Tech t1** 1.0 · Oracle · eol · EOL: 1/1/2020 · 2 CVE')
    expect(out).toContain('⚡ **Tech t2**')
    expect(out).toContain('✅ **Tech t3**')
    expect(out).toContain('soloCriticas: true')
  })

  it('filtra por categoria, vendor y estado', async () => {
    await db.technologies.bulkAdd([
      tech('t1', { category: 'framework', vendor: 'Apache', supportStatus: 'eol' }),
      tech('t2', { category: 'database', vendor: 'Oracle', supportStatus: 'extended' }),
      tech('t3', { category: 'framework', vendor: 'Microsoft', supportStatus: 'active' }),
    ])
    const out = await consultarObsolescenciaTool.execute({
      categoria: 'framework',
      vendor: 'microsoft',
      estado: 'active',
    })
    expect(out).toContain('✅ **Tech t3**')
    expect(out).not.toContain('Tech t1')
    expect(out).not.toContain('Tech t2')
    expect(out).not.toContain('📊 **Panorama')
  })

  it('maneja soloCriticas boolean, string y number', async () => {
    await db.technologies.bulkAdd([
      tech('t1', { supportStatus: 'eol' }),
      tech('t2', { supportStatus: 'active' }),
    ])
    const b = await consultarObsolescenciaTool.execute({ soloCriticas: true })
    expect(b).toContain('**Tecnologías críticas (EOL/Obsoletas):**')
    expect(b).toContain('⛔ **Tech t1**')
    expect(b).not.toContain('Tech t2')

    await db.technologies.clear()
    await db.technologies.bulkAdd([tech('t1', { supportStatus: 'eol' })])
    const s = await consultarObsolescenciaTool.execute({ soloCriticas: 'true' })
    expect(s).toContain('Tech t1')
    const num = await consultarObsolescenciaTool.execute({ soloCriticas: '1' })
    expect(num).toContain('Tech t1')
  })

  it('sin críticas con soloCriticas felicita', async () => {
    await db.technologies.add(tech('t1', { supportStatus: 'active' }))
    const out = await consultarObsolescenciaTool.execute({ soloCriticas: true })
    expect(out).toBe('🎉 No se encontraron tecnologías críticas (EOL u obsoletas).')
  })

  it('sin resultados con filtros', async () => {
    await db.technologies.add(tech('t1', { supportStatus: 'active' }))
    const out = await consultarObsolescenciaTool.execute({ estado: 'eol' })
    expect(out).toBe('No se encontraron tecnologías con los filtros indicados.')
  })

  it('expira por fecha EOL dentro de 6 meses y respeta limit', async () => {
    const en3m = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    const en1y = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    await db.technologies.bulkAdd([
      tech('t1', { supportStatus: 'active', eolDate: en3m }),
      tech('t2', { supportStatus: 'active', eolDate: en1y }),
    ])
    const out = await consultarObsolescenciaTool.execute({ limit: 1 })
    expect(out).toContain('**⚠️  Por vencer (≤6 meses):** 1')
    expect(out).toContain('Tech t1')
    expect(out).not.toContain('Tech t2')
  })

  it('ordena EOL primero y trata unknown', async () => {
    await db.technologies.bulkAdd([
      tech('t1', { supportStatus: 'active' }),
      tech('t2', { supportStatus: 'unknown' }),
      tech('t3', { supportStatus: 'eol' }),
    ])
    const out = await consultarObsolescenciaTool.execute({})
    expect(out.indexOf('Tech t3')).toBeLessThan(out.indexOf('Tech t2'))
    expect(out).toContain('❓ **Tech t2**')
  })

  it('ordena por fecha EOL entre tecnologías del mismo estado', async () => {
    await db.technologies.bulkAdd([
      tech('t1', { supportStatus: 'eol', eolDate: new Date(2025, 0, 1) }),
      tech('t2', { supportStatus: 'eol', eolDate: new Date(2023, 0, 1) }),
    ])
    const out = await consultarObsolescenciaTool.execute({})
    expect(out.indexOf('Tech t2')).toBeLessThan(out.indexOf('Tech t1'))
  })

  it('ordena por estado de soporte en el sort', async () => {
    await db.technologies.bulkAdd([
      tech('t1', { supportStatus: 'unknown' }),
      tech('t2', { supportStatus: 'eol' }),
      tech('t3', { supportStatus: 'eol', eolDate: new Date(2022, 0, 1) }),
    ])
    const out = await consultarObsolescenciaTool.execute({})
    expect(out.indexOf('Tech t2')).toBeLessThan(out.indexOf('Tech t1'))
    expect(out.indexOf('Tech t3')).toBeLessThan(out.indexOf('Tech t1'))
  })
})
