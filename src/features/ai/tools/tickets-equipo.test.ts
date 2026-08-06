import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import type { Team, EquipmentItem, EquipmentTicket } from '@/types/domain'
import type { MemberProfile } from '@/types/domain/performance'
import { buscarTicketEquipoTool } from './tickets-equipo'

const baseTeam = (id: string, name: string): Team => ({
  id,
  businessUnitId: 'bu1',
  name,
  sourceSystem: 'manual',
  externalId: '',
  members: [],
  currentMetrics: null,
  metadata: {},
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
})

const baseMember = (id: string, teamId: string, email: string): MemberProfile => ({
  id,
  teamId,
  email,
  phoneCell: '',
  phoneHome: '',
  address: '',
  role: 'developer',
  skills: [],
  technologies: [],
  microservices: [],
  avgStoryPoints: 5,
  vacationDaysPerYear: 20,
  vacationUsed: 0,
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

const baseTicket = (id: string, overrides: Partial<EquipmentTicket> = {}): EquipmentTicket => ({
  id,
  equipmentId: 'eq1',
  requesterId: 'u1',
  assigneeId: null,
  type: 'repair',
  status: 'open',
  jiraTicketId: null,
  jiraTicketLink: null,
  priority: 'high',
  description: 'No enciende',
  resolution: null,
  startDate: null,
  endDate: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

describe('buscarTicketEquipoTool', () => {
  beforeEach(async () => {
    await Promise.all([
      db.equipmentTickets.clear(),
      db.teams.clear(),
      db.memberProfiles.clear(),
      db.equipment.clear(),
    ])
  })

  it('devuelve sin tickets cuando no hay ninguno', async () => {
    const out = await buscarTicketEquipoTool.execute({})
    expect(out).toBe('No hay tickets de equipamiento registrados.')
  })

  it('lista tickets con detalles de equipo y persona', async () => {
    await db.equipment.add(baseEquipment('eq1', 'Dell', 'XPS 13'))
    await db.memberProfiles.add(baseMember('u1', 't1', 'jose@x.com'))
    await db.equipmentTickets.add(baseTicket('t1'))
    const out = await buscarTicketEquipoTool.execute({})
    expect(out).toContain('Se encontraron 1 ticket(s) de equipamiento')
    expect(out).toContain('Dell XPS 13 (laptop)')
    expect(out).toContain('jose@x.com')
    expect(out).toContain('1 abierto(s) de 1')
  })

  it('filtra por tipo, estado, prioridad y equipmentId', async () => {
    await db.equipmentTickets.bulkAdd([
      baseTicket('t1', { type: 'repair', status: 'open', priority: 'high', equipmentId: 'eq1' }),
      baseTicket('t2', { type: 'new', status: 'closed', priority: 'low', equipmentId: 'eq2' }),
    ])
    const outTipo = await buscarTicketEquipoTool.execute({ tipo: 'new' })
    expect(outTipo).toContain('Se encontraron 1 ticket(s)')
    expect(outTipo).toContain('**new**')
    const out = await buscarTicketEquipoTool.execute({
      tipo: 'repair',
      estado: 'open',
      prioridad: 'high',
      equipmentId: 'eq1',
    })
    expect(out).toContain('Se encontraron 1 ticket(s)')
    expect(out).toContain('**repair**')
  })

  it('busca por descripción sin acentos', async () => {
    await db.equipmentTickets.add(baseTicket('t1', { description: 'PANTALLA ROTA' }))
    const out = await buscarTicketEquipoTool.execute({ q: 'pantalla' })
    expect(out).toContain('Se encontraron 1 ticket(s)')
  })

  it('busca por jiraTicketId', async () => {
    await db.equipmentTickets.add(baseTicket('t1', { jiraTicketId: 'TGP-123' }))
    const out = await buscarTicketEquipoTool.execute({ q: 'TGP-123' })
    expect(out).toContain('TGP-123')
    expect(out).toContain('Jira: TGP-123')
  })

  it('busca por nombre de persona en teams.members', async () => {
    const t = baseTeam('t1', 'Equipo')
    t.members = [
      {
        id: 'm1',
        userPrincipal: 'carla@x.com',
        displayName: 'Carla Gómez',
        role: 'developer',
        allocationPct: 100,
        status: 'activo',
      },
    ]
    await db.teams.add(t)
    await db.equipmentTickets.add(baseTicket('t1', { requesterId: 'm1' }))
    const out = await buscarTicketEquipoTool.execute({ q: 'carla' })
    expect(out).toContain('Carla Gómez')
  })

  it('busca por email de persona en memberProfiles', async () => {
    await db.memberProfiles.add(baseMember('u1', 't1', 'bruno@x.com'))
    await db.equipmentTickets.add(baseTicket('t1', { assigneeId: 'u1' }))
    const out = await buscarTicketEquipoTool.execute({ q: 'bruno@x.com' })
    expect(out).toContain('bruno@x.com')
  })

  it('no encuentra coincidencias y devuelve mensaje con q', async () => {
    await db.equipmentTickets.add(baseTicket('t1'))
    const out = await buscarTicketEquipoTool.execute({ q: 'zzz' })
    expect(out).toBe('No se encontraron tickets de equipamiento que coincidan con "zzz".')
  })

  it('aplica limit y muestra ids truncados cuando no hay mapas', async () => {
    await db.equipmentTickets.bulkAdd([baseTicket('t1'), baseTicket('t2'), baseTicket('t3')])
    const out = await buscarTicketEquipoTool.execute({ limit: 2 })
    expect(out).toContain('Se encontraron 2 ticket(s)')
  })

  it('muestra guiones para equipo y persona desconocidos', async () => {
    await db.equipmentTickets.add(baseTicket('t1'))
    const out = await buscarTicketEquipoTool.execute({})
    expect(out).toContain('Eq: eq1')
    expect(out).toContain('Solicitante: u1')
    expect(out).toContain('Asignado: —')
  })
})
