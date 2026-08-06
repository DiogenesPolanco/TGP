import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import type { Team, Risk } from '@/types/domain'
import type { MemberProfile } from '@/types/domain/performance'
import { consultarPersonaTool } from './persona'

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
  phoneCell: '555-1234',
  phoneHome: '555-0000',
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

describe('consultarPersonaTool', () => {
  beforeEach(async () => {
    await Promise.all([
      db.memberProfiles.clear(),
      db.teams.clear(),
      db.commitments.clear(),
      db.tasks.clear(),
      db.equipmentTickets.clear(),
      db.auditFindings.clear(),
      db.risks.clear(),
    ])
  })

  it('exige el parámetro id', async () => {
    const out = await consultarPersonaTool.execute({})
    expect(out).toBe('Error: parámetro "id" requerido. Usá buscar_persona para encontrar el ID.')
  })

  it('busca por id en memberProfiles y muestra datos de contacto', async () => {
    await db.memberProfiles.add(baseMember('mp1', 't1', 'jose@x.com'))
    const out = await consultarPersonaTool.execute({ id: 'mp1' })
    expect(out).toContain('jose@x.com')
    expect(out).toContain('555-1234 (cel)')
    expect(out).toContain('555-0000 (fijo)')
    expect(out).toContain('developer')
    expect(out).toContain('**Perfil completo**')
  })

  it('busca por email (case-insensitive)', async () => {
    await db.memberProfiles.add(baseMember('mp1', 't1', 'jose@x.com'))
    const out = await consultarPersonaTool.execute({ id: 'JOSE@X.COM' })
    expect(out).toContain('jose@x.com')
  })

  it('muestra cargo, depto y ubicación si existen', async () => {
    await db.memberProfiles.add({
      ...baseMember('mp1', 't1', 'a@x.com'),
      jobTitle: 'CTO',
      department: 'TI',
      location: 'Santiago',
    } as MemberProfile)
    const out = await consultarPersonaTool.execute({ id: 'mp1' })
    expect(out).toContain('CTO')
    expect(out).toContain('TI')
    expect(out).toContain('Santiago')
  })

  it('muestra los equipos de la persona por coincidencia directa', async () => {
    const t = baseTeam('t1', 'Equipo Alpha')
    t.members = [
      {
        id: 'm1',
        userPrincipal: 'jose@x.com',
        displayName: 'José',
        role: 'developer',
        allocationPct: 100,
        status: 'activo',
      },
    ]
    await db.teams.add(t)
    const out = await consultarPersonaTool.execute({ id: 'm1' })
    expect(out).toContain('Equipos (1)')
    expect(out).toContain('Equipo Alpha')
    expect(out).toContain('(developer)')
  })

  it('muestra equipos por coincidencia con member id', async () => {
    await db.memberProfiles.add(baseMember('mp1', 't1', 'a@x.com'))
    const t = baseTeam('t1', 'Equipo Beta')
    t.members = [
      {
        id: 'mp1',
        userPrincipal: 'a@x.com',
        displayName: 'Ana',
        role: 'analyst',
        allocationPct: 100,
        status: 'activo',
      },
    ]
    await db.teams.add(t)
    const out = await consultarPersonaTool.execute({ id: 'mp1' })
    expect(out).toContain('Equipo Beta')
  })

  it('lista compromisos, tareas, tickets y hallazgos asignados', async () => {
    await db.memberProfiles.add(baseMember('mp1', 't1', 'a@x.com'))
    await db.commitments.add({
      id: 'c1',
      assignedTo: 'mp1',
      title: 'Compromiso crítico',
      commitmentDate: new Date('2025-03-01'),
      status: 'open',
    } as never)
    await db.tasks.add({
      id: 'tk1',
      assignedTo: 'mp1',
      title: 'Tarea X',
      status: 'pending',
    } as never)
    await db.equipmentTickets.add({
      id: 'et1',
      equipmentId: 'eq1',
      requesterId: 'u-otro',
      assigneeId: 'mp1',
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
    })
    await db.auditFindings.add({
      id: 'af1',
      assignedTo: 'mp1',
      title: 'Hallazgo H1',
      severity: 'high',
      status: 'open',
    } as never)

    const out = await consultarPersonaTool.execute({ id: 'mp1' })
    expect(out).toContain('Compromisos (1)')
    expect(out).toContain('Compromiso crítico')
    expect(out).toContain('Tareas (1)')
    expect(out).toContain('Tarea X')
    expect(out).toContain('Tickets de equipamiento (1)')
    expect(out).toContain('Hallazgos (1)')
    expect(out).toContain('Hallazgo H1')
  })

  it('lista riesgos asignados', async () => {
    await db.memberProfiles.add(baseMember('mp1', 't1', 'a@x.com'))
    await db.risks.add({
      id: 'r1',
      applicationId: null,
      businessUnitId: 'bu1',
      title: 'Riesgo de seguridad',
      description: '',
      category: 'security',
      probability: 0.5,
      impact: 0.8,
      riskScore: 40,
      mitigationPlan: null,
      status: 'open',
      targetDate: null,
      metadata: {},
      owner: 'mp1',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    } as unknown as Risk)
    const out = await consultarPersonaTool.execute({ id: 'mp1' })
    expect(out).toContain('Riesgos asignados (1)')
    expect(out).toContain('Riesgo de seguridad')
    expect(out).toContain('Score: 40')
  })

  it('devuelve mensaje cuando la persona no existe', async () => {
    const out = await consultarPersonaTool.execute({ id: 'no-existe' })
    expect(out).toContain('No se encontró una persona con ID o email "no-existe"')
    expect(out).not.toContain('a@x.com')
  })
})
