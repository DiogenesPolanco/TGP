import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import type { Team, EquipmentItem, Risk } from '@/types/domain'
import {
  buscarAplicacionTool,
  buscarTecnologiaTool,
  buscarRiesgoTool,
  buscarEquipamientoTool,
} from './buscadores'

const baseTeam = (id: string, name: string, members: Team['members'] = []): Team => ({
  id,
  businessUnitId: 'bu1',
  name,
  sourceSystem: 'manual',
  externalId: '',
  members,
  currentMetrics: null,
  metadata: {},
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
})

const baseEquipment = (id: string, brand = 'Dell', model = 'XPS'): EquipmentItem => ({
  id,
  type: 'laptop',
  brand,
  model,
  serialNumber: 'SN-1',
  status: 'available',
  condition: 'good',
  assignedTo: null,
  assignmentType: null,
  purchaseDate: null,
  warrantyExpiry: null,
  lastMaintenanceDate: null,
  costCenter: null,
  businessUnitId: null,
  notes: '',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
})

describe('defineBuscador (buscarTecnologiaTool)', () => {
  beforeEach(async () => {
    await Promise.all([
      db.technologies.clear(),
      db.applications.clear(),
      db.risks.clear(),
      db.equipment.clear(),
      db.teams.clear(),
      db.memberProfiles.clear(),
    ])
  })

  it('lista todo sin query', async () => {
    await db.technologies.bulkAdd([
      {
        id: 't1',
        name: 'React',
        vendor: 'Meta',
        version: '19',
        category: 'frontend',
        supportStatus: 'supported',
      },
      {
        id: 't2',
        name: 'PostgreSQL',
        vendor: 'PostgreSQL Global',
        version: '16',
        category: 'database',
        supportStatus: 'supported',
      },
    ] as never)
    const out = await buscarTecnologiaTool.execute({})
    expect(out).toContain('Se encontraron 2 tecnologías')
    expect(out).toContain('1. **React**')
    expect(out).toContain('2. **PostgreSQL**')
  })

  it('busca parcial sin acentos', async () => {
    await db.technologies.add({
      id: 't1',
      name: 'Oracle DB',
      vendor: 'Oracle',
      version: '19c',
      category: 'database',
      supportStatus: 'supported',
    } as never)
    const out = await buscarTecnologiaTool.execute({ q: 'oracle' })
    expect(out).toContain('Se encontraron 1 tecnologías')
    expect(out).toContain('**Oracle DB**')
  })

  it('devuelve mensaje sin resultados con query', async () => {
    await db.technologies.add({
      id: 't1',
      name: 'React',
      vendor: 'Meta',
      version: '19',
      category: 'frontend',
      supportStatus: 'supported',
    } as never)
    const out = await buscarTecnologiaTool.execute({ q: 'mongodb' })
    expect(out).toBe('No se encontraron tecnologías que coincidan con "mongodb".')
  })

  it('devuelve mensaje cuando la tabla está vacía', async () => {
    const out = await buscarTecnologiaTool.execute({})
    expect(out).toBe('No hay tecnologías registrados en el sistema.')
  })

  it('aplica el límite', async () => {
    await db.technologies.bulkAdd([
      {
        id: 't1',
        name: 'React',
        vendor: 'Meta',
        version: '19',
        category: 'frontend',
        supportStatus: 'supported',
      },
      {
        id: 't2',
        name: 'Vue',
        vendor: 'Evan You',
        version: '3',
        category: 'frontend',
        supportStatus: 'supported',
      },
      {
        id: 't3',
        name: 'Svelte',
        vendor: 'Svelte',
        version: '5',
        category: 'frontend',
        supportStatus: 'supported',
      },
    ] as never)
    const out = await buscarTecnologiaTool.execute({ limit: 1 })
    expect(out).toContain('Se encontraron 1 tecnologías')
  })

  it('trunca strings largos en el display', async () => {
    await db.technologies.add({
      id: 't1',
      name: 'A'.repeat(80),
      vendor: 'V',
      version: '1',
      category: 'c',
      supportStatus: 'supported',
    } as never)
    const out = await buscarTecnologiaTool.execute({})
    expect(out).toContain('A'.repeat(60) + '…')
  })

  it('muestra (sin nombre) cuando falta el campo principal', async () => {
    await db.technologies.add({ id: 't1' } as never)
    const out = await buscarTecnologiaTool.execute({})
    expect(out).toContain('(sin nombre)')
  })
})

describe('buscarAplicacionTool (con personIdFields)', () => {
  beforeEach(async () => {
    await Promise.all([db.applications.clear(), db.teams.clear(), db.memberProfiles.clear()])
  })

  it('resuelve búsqueda por nombre de persona asignada (ownerId)', async () => {
    await db.teams.add(
      baseTeam('t1', 'Equipo Core', [
        {
          id: 'm1',
          userPrincipal: 'carla@x.com',
          displayName: 'Carla Gómez',
          role: 'manager',
          allocationPct: 100,
          status: 'activo',
        },
      ]),
    )
    await db.applications.add({
      id: 'a1',
      name: 'ERP Central',
      description: 'ERP',
      ownerName: 'Carla Gómez',
      ownerId: 'm1',
      criticality: 'alta',
      status: 'production',
      architecture: 'monolith',
    } as never)
    const out = await buscarAplicacionTool.execute({ q: 'carla' })
    expect(out).toContain('Se encontraron 1 aplicaciones')
    expect(out).toContain('**ERP Central**')
  })

  it('busca por texto en aplicaciones', async () => {
    await db.applications.add({
      id: 'a1',
      name: 'CRM',
      description: 'Gestión de clientes',
      ownerName: '',
      ownerId: null,
      criticality: 'media',
      status: 'production',
      architecture: 'microservices',
    } as never)
    const out = await buscarAplicacionTool.execute({ q: 'CRM' })
    expect(out).toContain('Se encontraron 1 aplicaciones')
    expect(out).toContain('**CRM**')
  })

  it('no matchea por persona cuando el nombre no existe', async () => {
    await db.applications.add({
      id: 'a1',
      name: 'CRM',
      description: '',
      ownerName: '',
      ownerId: 'zzz',
      criticality: 'media',
      status: 'production',
      architecture: '',
    } as never)
    const out = await buscarAplicacionTool.execute({ q: 'carla' })
    expect(out).toBe('No se encontraron aplicaciones que coincidan con "carla".')
  })
})

describe('buscarRiesgoTool (match numérico)', () => {
  beforeEach(async () => {
    await db.risks.clear()
  })

  it('matchea por probabilidad numérica', async () => {
    await db.risks.add({
      id: 'r1',
      applicationId: null,
      businessUnitId: 'bu1',
      title: 'Riesgo operativo',
      description: '',
      category: 'operational',
      probability: 0.5,
      impact: 0.8,
      riskScore: 40,
      mitigationPlan: null,
      status: 'open',
      targetDate: null,
      metadata: {},
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    } as Risk)
    const out = await buscarRiesgoTool.execute({ q: '0.5' })
    expect(out).toContain('Se encontraron 1 riesgos')
    expect(out).toContain('**Riesgo operativo**')
  })
})

describe('buscarEquipamientoTool (custom)', () => {
  beforeEach(async () => {
    await Promise.all([db.equipment.clear(), db.teams.clear(), db.memberProfiles.clear()])
  })

  it('lista todo sin query', async () => {
    await db.equipment.bulkAdd([
      baseEquipment('e1', 'Dell', 'XPS 13'),
      baseEquipment('e2', 'HP', 'ProBook'),
    ])
    const out = await buscarEquipamientoTool.execute({})
    expect(out).toContain('Se encontraron 2 equipo(s)')
    expect(out).toContain('**Dell XPS 13**')
  })

  it('busca por texto (marca)', async () => {
    await db.equipment.bulkAdd([
      baseEquipment('e1', 'Dell', 'XPS 13'),
      baseEquipment('e2', 'HP', 'ProBook'),
    ])
    const out = await buscarEquipamientoTool.execute({ q: 'dell' })
    expect(out).toContain('Se encontraron 1 equipo(s)')
  })

  it('resuelve búsqueda por nombre de persona asignada', async () => {
    await db.teams.add(
      baseTeam('t1', 'Equipo Core', [
        {
          id: 'm1',
          userPrincipal: 'carla@x.com',
          displayName: 'Carla Gómez',
          role: 'manager',
          allocationPct: 100,
          status: 'activo',
        },
      ]),
    )
    await db.equipment.add({ ...baseEquipment('e1'), assignedTo: 'm1' })
    const out = await buscarEquipamientoTool.execute({ q: 'carla' })
    expect(out).toContain('Se encontraron 1 equipo(s)')
    expect(out).toContain('Asignado a: Carla Gómez')
  })

  it('muestra el ID crudo cuando la persona asignada no está en el mapa', async () => {
    await db.equipment.add({ ...baseEquipment('e1'), assignedTo: 'id-sin-mapa' })
    const out = await buscarEquipamientoTool.execute({})
    expect(out).toContain('Asignado a: id-sin-mapa')
  })

  it('devuelve mensaje sin resultados con query', async () => {
    await db.equipment.add(baseEquipment('e1'))
    const out = await buscarEquipamientoTool.execute({ q: 'thinkpad' })
    expect(out).toBe('No se encontraron equipos que coincidan con "thinkpad".')
  })

  it('devuelve mensaje cuando no hay equipos', async () => {
    const out = await buscarEquipamientoTool.execute({})
    expect(out).toBe('No hay equipos registrados en el sistema.')
  })

  it('avisa cuando hay más resultados que el límite', async () => {
    await db.equipment.bulkAdd([baseEquipment('e1'), baseEquipment('e2'), baseEquipment('e3')])
    const out = await buscarEquipamientoTool.execute({ limit: 2 })
    expect(out).toContain('Se encontraron 3 equipo(s)')
    expect(out).toContain('... y 1 más.')
  })
})
