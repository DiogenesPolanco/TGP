import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { createConsultarDatosTool } from './consultar-datos'

const perms = (p: Record<string, boolean>) => p as never

describe('createConsultarDatosTool', () => {
  beforeEach(async () => {
    await Promise.all([db.applications.clear(), db.risks.clear(), db.users.clear()])
  })

  it('devuelve sin permisos cuando ningún dominio está habilitado', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: false }))
    const out = await tool.execute({ table: 'applications' })
    expect(out).toBe('No hay permisos de datos habilitados para esta consulta.')
  })

  it('rechaza tabla inválida con sugerencias', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    const out = await tool.execute({ table: 'zzz' })
    expect(out).toContain('Error: "zzz" no es una tabla válida.')
    expect(out).toContain('Tablas disponibles: tenants, businessUnits, users, applications')
  })

  it('deniega acceso a dominio no habilitado', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    const out = await tool.execute({ table: 'risks' })
    expect(out).toBe(
      'Acceso denegado: "risks" pertenece al dominio "gobierno" que no está habilitado. Activá el permiso en Ajustes del Asistente.',
    )
  })

  it('permite tablas públicas sin permiso de su dominio', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    await db.users.add({ id: 'u1', name: 'Ana', email: 'ana@x.com', role: 'admin' } as never)
    const out = await tool.execute({ table: 'users' })
    expect(out).toContain('Resultados en "users" (1):')
  })

  it('consulta tabla habilitada', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    await db.applications.add({ id: 'a1', name: 'ERP', status: 'active' } as never)
    const out = await tool.execute({ table: 'applications' })
    expect(out).toContain('Resultados en "applications" (1):')
    expect(out).toContain('1. id: a1 | name: ERP | status: active')
  })

  it('filtra con where object', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    await db.applications.bulkAdd([
      { id: 'a1', name: 'ERP', status: 'active' },
      { id: 'a2', name: 'CRM', status: 'retired' },
    ] as never)
    const out = await tool.execute({ table: 'applications', where: { status: 'active' } })
    expect(out).toContain('Resultados en "applications" (1):')
    expect(out).toContain('ERP')
    expect(out).not.toContain('CRM')
  })

  it('parsea where como JSON string', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    await db.applications.bulkAdd([
      { id: 'a1', name: 'ERP', status: 'active' },
      { id: 'a2', name: 'CRM', status: 'retired' },
    ] as never)
    const out = await tool.execute({ table: 'applications', where: '{"status":"retired"}' })
    expect(out).toContain('Resultados en "applications" (1):')
    expect(out).toContain('CRM')
  })

  it('ignora where malformado', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    await db.applications.add({ id: 'a1', name: 'ERP', status: 'active' } as never)
    const out = await tool.execute({ table: 'applications', where: '{rotto' })
    expect(out).toContain('Resultados en "applications" (1):')
  })

  it('busca por texto con normalización de acentos', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    await db.applications.bulkAdd([
      { id: 'a1', name: 'Sistema crítico', status: 'active' },
      { id: 'a2', name: 'CRM', status: 'active' },
    ] as never)
    const out = await tool.execute({ table: 'applications', q: 'critico' })
    expect(out).toContain('Resultados en "applications" (1):')
    expect(out).toContain('Sistema crítico')
  })

  it('busca por número', async () => {
    const tool = createConsultarDatosTool(perms({ gobierno: true }))
    await db.risks.add({ id: 'r1', title: 'Riesgo', probability: 0.5 } as never)
    const out = await tool.execute({ table: 'risks', q: '0.5' })
    expect(out).toContain('Resultados en "risks" (1):')
  })

  it('ordena asc y desc', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    await db.applications.bulkAdd([
      { id: 'a1', name: 'ERP', status: 'active' },
      { id: 'a2', name: 'CRM', status: 'active' },
    ] as never)
    const asc = await tool.execute({ table: 'applications', orderBy: 'name', orderDir: 'asc' })
    expect(asc.indexOf('CRM')).toBeLessThan(asc.indexOf('ERP'))
    const desc = await tool.execute({ table: 'applications', orderBy: 'name', orderDir: 'desc' })
    expect(desc.indexOf('ERP')).toBeLessThan(desc.indexOf('CRM'))
  })

  it('aplica limit numérico y de string', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    await db.applications.bulkAdd([
      { id: 'a1', name: 'A', status: 'active' },
      { id: 'a2', name: 'B', status: 'active' },
      { id: 'a3', name: 'C', status: 'active' },
    ] as never)
    const outNum = await tool.execute({ table: 'applications', limit: 1 })
    expect(outNum).toContain('(1)')
    const outStr = await tool.execute({ table: 'applications', limit: '2' })
    expect(outStr).toContain('(2)')
  })

  it('devuelve sin resultados', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    const out = await tool.execute({ table: 'applications' })
    expect(out).toBe('No se encontraron registros en "applications".')
  })

  it('serializa Date, arrays y objetos', async () => {
    const tool = createConsultarDatosTool(perms({ catalogo: true }))
    await db.applications.add({
      id: 'a1',
      name: 'ERP',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      tags: ['core', 'finanzas'],
      meta: { nivel: 1 },
      desc: null,
    } as never)
    const out = await tool.execute({ table: 'applications' })
    expect(out).toContain('createdAt: 2025-01-01T00:00:00.000Z')
    expect(out).toContain('tags: [core, finanzas]')
    expect(out).toContain('meta: {"nivel":1}')
    expect(out).toContain('desc: —')
  })
})
