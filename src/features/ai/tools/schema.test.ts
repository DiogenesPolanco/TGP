import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import type { Team } from '@/types/domain'
import { explorarEsquemaTool, consultarRelacionesTool } from './schema'

const baseTeam = (id: string, name: string): Team => ({
  id,
  businessUnitId: 'bu1',
  name,
  sourceSystem: 'manual',
  externalId: '',
  members: [],
  currentMetrics: null,
  metadata: {},
  createdAt: new Date('2025-01-01T10:00:00.000Z'),
  updatedAt: new Date('2025-01-01T10:00:00.000Z'),
})

describe('explorarEsquemaTool', () => {
  beforeEach(async () => {
    await db.teams.clear()
  })

  it('devuelve error con tabla inválida y sugerencias', async () => {
    const out = await explorarEsquemaTool.execute({ tabla: 'no-existe' })
    expect(out).toContain('Error: "no-existe" no es una tabla válida.')
    expect(out).toContain('Tablas disponibles: applications')
  })

  it('informa tabla vacía', async () => {
    const out = await explorarEsquemaTool.execute({ tabla: 'teams' })
    expect(out).toBe('La tabla "teams" (Equipos) está vacía. No hay datos para inferir estructura.')
  })

  it('muestra la estructura con un registro', async () => {
    await db.teams.add(baseTeam('t1', 'Equipo Alpha'))
    const out = await explorarEsquemaTool.execute({ tabla: 'teams' })
    expect(out).toContain('Registros disponibles: 1')
    expect(out).toContain('- name: string (ej: Equipo Alpha)')
    expect(out).toContain('- createdAt: Date')
  })

  it('muestra 3+ cuando hay más de 2 registros', async () => {
    await db.teams.bulkAdd([baseTeam('t1', 'A'), baseTeam('t2', 'B'), baseTeam('t3', 'C')])
    const out = await explorarEsquemaTool.execute({ tabla: 'teams' })
    expect(out).toContain('Registros disponibles: 3+')
  })

  it('infiere tipos array, object y null', async () => {
    await db.teams.add({
      ...baseTeam('t1', 'Equipo'),
      members: [
        {
          id: 'm1',
          userPrincipal: 'a@x.com',
          displayName: 'A',
          role: 'developer',
          allocationPct: 100,
          status: 'activo',
        },
      ],
      metadata: { riesgo: 'alto' },
      externalId: null,
    } as never)
    const out = await explorarEsquemaTool.execute({ tabla: 'teams' })
    expect(out).toContain('- members: array<object>')
    expect(out).toContain('- metadata: object')
    expect(out).toContain('- externalId: any')
  })

  it('serializa arrays vacíos', async () => {
    await db.teams.add(baseTeam('t1', 'Equipo'))
    const out = await explorarEsquemaTool.execute({ tabla: 'teams' })
    expect(out).toContain('- members: array (ej: [])')
  })

  it('toma el registro más completo cuando hay varios', async () => {
    await db.teams.add({ ...baseTeam('t1', 'Pobre'), name: 'Pobre' } as Team)
    const rico = baseTeam('t2', 'Rico')
    ;(rico as any).extra = 'valor-extra'
    await db.teams.add(rico)
    const out = await explorarEsquemaTool.execute({ tabla: 'teams' })
    expect(out).toContain('- extra: string (ej: valor-extra)')
  })
})

describe('consultarRelacionesTool', () => {
  beforeEach(async () => {
    await Promise.all([
      db.applications.clear(),
      db.microservices.clear(),
      db.vulnerabilities.clear(),
      db.vulnerabilityMicroservices.clear(),
      db.technologies.clear(),
      db.incidents.clear(),
      db.incidentMicroservices.clear(),
    ])
  })

  it('devuelve error con tabla inválida', async () => {
    const out = await consultarRelacionesTool.execute({ tabla: 'no-existe', id: 'x' })
    expect(out).toBe('Error: "no-existe" no es una tabla válida.')
  })

  it('devuelve error cuando el id no existe', async () => {
    const out = await consultarRelacionesTool.execute({ tabla: 'applications', id: 'zzz' })
    expect(out).toBe('No se encontró un registro en "applications" con ID "zzz".')
  })

  it('indica cuando la entidad no tiene relaciones definidas', async () => {
    await db.technologies.add({ id: 't1', name: 'React' } as never)
    const out = await consultarRelacionesTool.execute({ tabla: 'technologies', id: 't1' })
    expect(out).toContain('No hay relaciones definidas para esta entidad.')
    expect(out).toContain('📋 **Tecnologías** (`technologies`)')
  })

  it('lista relaciones directas', async () => {
    await db.applications.add({ id: 'a1', name: 'ERP', description: 'ERP central' } as never)
    await db.microservices.add({ id: 'ms1', applicationId: 'a1', name: 'MS Auth' } as never)
    const out = await consultarRelacionesTool.execute({ tabla: 'applications', id: 'a1' })
    expect(out).toContain('🔗 **Microservicios** (1)')
    expect(out).toContain('MS Auth')
  })

  it('omite sección cuando no hay registros relacionados', async () => {
    await db.applications.add({ id: 'a1', name: 'ERP', description: 'ERP' } as never)
    const out = await consultarRelacionesTool.execute({ tabla: 'applications', id: 'a1' })
    expect(out).not.toContain('🔗')
  })

  it('resuelve relación inversa con localKey', async () => {
    await db.applications.add({ id: 'a1', name: 'ERP', description: 'ERP' } as never)
    await db.microservices.add({ id: 'ms1', applicationId: 'a1', name: 'MS Auth' } as never)
    const out = await consultarRelacionesTool.execute({ tabla: 'microservices', id: 'ms1' })
    expect(out).toContain('🔗 **Aplicación padre** (1)')
  })

  it('omite relación inversa cuando localKey es null', async () => {
    await db.microservices.add({ id: 'ms1', applicationId: null, name: 'MS Auth' } as never)
    const out = await consultarRelacionesTool.execute({ tabla: 'microservices', id: 'ms1' })
    expect(out).not.toContain('🔗')
  })

  it('resuelve relaciones M:N vía junction', async () => {
    await db.vulnerabilities.add({ id: 'v1', applicationId: null, title: 'CVE-2025' } as never)
    await db.microservices.add({ id: 'ms1', applicationId: null, name: 'MS Auth' } as never)
    await db.vulnerabilityMicroservices.add({
      id: 'vjm1',
      vulnerabilityId: 'v1',
      microserviceId: 'ms1',
    } as never)
    const out = await consultarRelacionesTool.execute({ tabla: 'vulnerabilities', id: 'v1' })
    expect(out).toContain('🔗 **Microservicios afectados** (1)')
    expect(out).toContain('MS Auth')
  })

  it('omite junction sin registros puente', async () => {
    await db.vulnerabilities.add({ id: 'v1', applicationId: null, title: 'CVE-2025' } as never)
    const out = await consultarRelacionesTool.execute({ tabla: 'vulnerabilities', id: 'v1' })
    expect(out).not.toContain('🔗')
  })
})
