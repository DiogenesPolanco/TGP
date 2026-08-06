import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { consultarDependenciasTool } from './dependencias'

describe('consultarDependenciasTool', () => {
  beforeEach(async () => {
    await Promise.all([
      db.applications.clear(),
      db.technologies.clear(),
      db.applicationDependencies.clear(),
    ])
  })

  it('exige id o q', async () => {
    const out = await consultarDependenciasTool.execute({})
    expect(out).toBe(
      'Error: proporcioná un `id` (UUID) o un `q` (nombre) para buscar la aplicación.',
    )
  })

  it('no encuentra por id', async () => {
    const out = await consultarDependenciasTool.execute({ id: 'zzz' })
    expect(out).toContain('No se encontró una aplicación con ID "zzz".')
  })

  it('no encuentra por q', async () => {
    const out = await consultarDependenciasTool.execute({ q: 'nada' })
    expect(out).toContain('No se encontró una aplicación con "nada".')
  })

  it('busca por q parcial sin acentos', async () => {
    await db.applications.add({
      id: 'a1',
      name: 'Gestión de Clientes',
      architecture: 'microservices',
      criticality: 'alta',
      status: 'production',
      technologies: [],
    } as never)
    const out = await consultarDependenciasTool.execute({ q: 'gestion' })
    expect(out).toContain('🔗 **Gestión de Clientes**')
    expect(out).toContain(
      '**Arquitectura:** microservices · **Criticidad:** alta · **Estado:** production',
    )
  })

  it('muestra stack con tecnologías vencidas, expirando y sanas', async () => {
    await db.applications.add({
      id: 'a1',
      name: 'ERP',
      technologies: ['Java 8', 'React', 'Oracle 19c'],
    } as never)
    await db.technologies.bulkAdd([
      {
        id: 't1',
        name: 'Java 8',
        version: '1.8',
        supportStatus: 'eol',
        eolDate: new Date('2020-01-01'),
        cveList: ['CVE-1'],
      },
      {
        id: 't2',
        name: 'React',
        version: '19',
        supportStatus: 'extended',
        eolDate: new Date('2027-01-01'),
        cveList: [],
      },
      {
        id: 't3',
        name: 'Oracle 19c',
        version: '19c',
        supportStatus: 'supported',
        eolDate: null,
        cveList: [],
      },
    ] as never)
    const out = await consultarDependenciasTool.execute({ id: 'a1' })
    expect(out).toContain('**Stack tecnológico** (3 tecnologías):')
    expect(out).toContain('⛔ Java 8 1.8')
    expect(out).toContain('1 CVE')
    expect(out).toContain('⚠️  React 19')
    expect(out).toContain('✅ Oracle 19c 19c')
  })

  it('muestra consume y dependientes', async () => {
    await db.applications.bulkAdd([
      { id: 'a1', name: 'ERP', technologies: [] },
      { id: 'a2', name: 'CRM', technologies: [] },
      { id: 'a3', name: 'BI', technologies: [] },
    ] as never)
    await db.applicationDependencies.bulkAdd([
      { id: 'd1', applicationId: 'a1', dependsOnAppId: 'a2', criticality: 'alta' },
      { id: 'd2', applicationId: 'a3', dependsOnAppId: 'a1' },
    ] as never)
    const out = await consultarDependenciasTool.execute({ id: 'a1' })
    expect(out).toContain('**Consume** (depende de 1 aplicación(es)):')
    expect(out).toContain('→ **CRM** · alta')
    expect(out).toContain('**Dependientes** (1 aplicación(es) la consumen):')
    expect(out).toContain('← **BI**')
  })

  it('no muestra hint cuando no hay datos', async () => {
    await db.applications.add({ id: 'a1', name: 'ERP', technologies: [] } as never)
    const out = await consultarDependenciasTool.execute({ id: 'a1' })
    expect(out).not.toContain('consultar_relaciones')
  })

  it('muestra hint cuando hay stack o dependencias', async () => {
    await db.applications.add({ id: 'a1', name: 'ERP', technologies: [] } as never)
    await db.applicationDependencies.add({
      id: 'd1',
      applicationId: 'a2',
      dependsOnAppId: 'a1',
    } as never)
    const out = await consultarDependenciasTool.execute({ id: 'a1' })
    expect(out).toContain('consultar_relaciones')
  })
})
