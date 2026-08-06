import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import type { Team, User } from '@/types/domain'
import type { MemberProfile, TeamSprint } from '@/types/domain/performance'
import { equiposTool, buscarPersonaTool, sprintsTool } from './equipo'

const baseTeam = (id: string, name: string, businessUnitId = 'bu1'): Team => ({
  id,
  businessUnitId,
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

const baseUser = (id: string, email: string, displayName: string): User =>
  ({
    id,
    email,
    displayName,
    isActive: 1,
    role: 'manager',
    businessUnitIds: ['bu1'],
    otpRequestIntervalHours: 0,
    createdAt: new Date('2025-01-01'),
  }) as User

const baseSprint = (id: string, teamId: string): TeamSprint => ({
  id,
  teamId,
  sprintName: 'Sprint 1',
  quarter: '1',
  year: 2025,
  startDate: new Date('2025-01-06'),
  endDate: new Date('2025-01-17'),
  plannedSP: 20,
  completedSP: 15,
  notCompletedSP: 5,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
})

describe('equiposTool', () => {
  beforeEach(async () => {
    await Promise.all([
      db.teams.clear(),
      db.memberProfiles.clear(),
      db.users.clear(),
      db.teamSprints.clear(),
    ])
  })

  it('devuelve los equipos y cuenta correcta', async () => {
    await db.teams.bulkAdd([baseTeam('t1', 'Equipo Alpha'), baseTeam('t2', 'Equipo Beta')])
    const out = await equiposTool.execute({})
    expect(out).toContain('2 equipo(s)')
    expect(out).toContain('Equipo Alpha')
    expect(out).toContain('Equipo Beta')
  })

  it('filtra por teamId', async () => {
    await db.teams.bulkAdd([baseTeam('t1', 'Alpha'), baseTeam('t2', 'Beta')])
    const out = await equiposTool.execute({ teamId: 't2' })
    expect(out).toContain('1 equipo(s)')
    expect(out).not.toContain('Alpha')
    expect(out).toContain('Beta')
  })

  it('filtra por businessUnitId', async () => {
    await db.teams.bulkAdd([baseTeam('t1', 'Alpha', 'bu1'), baseTeam('t2', 'Beta', 'bu2')])
    const out = await equiposTool.execute({ businessUnitId: 'bu2' })
    expect(out).toContain('1 equipo(s)')
    expect(out).toContain('Beta')
    expect(out).not.toContain('Alpha')
  })

  it('aplica limit', async () => {
    await db.teams.bulkAdd([baseTeam('t1', 'A'), baseTeam('t2', 'B'), baseTeam('t3', 'C')])
    const out = await equiposTool.execute({ limit: 2 })
    expect(out).toContain('2 equipo(s)')
  })

  it('incluye miembros cuando incluirMiembros es verdadero', async () => {
    const team = baseTeam('t1', 'Alpha')
    team.members = [
      {
        id: 'm1',
        userPrincipal: 'p1@x.com',
        displayName: 'Pedro',
        role: 'developer',
        allocationPct: 100,
        status: 'activo',
      },
    ]
    await db.teams.add(team)
    const out = await equiposTool.execute({ incluirMiembros: true })
    expect(out).toContain('Miembros')
    expect(out).toContain('Pedro')
    expect(out).toContain('(developer)')
  })

  it('incluirMiembros acepta string "true" y "1"', async () => {
    const team = baseTeam('t1', 'Alpha')
    team.members = [
      {
        id: 'm1',
        userPrincipal: 'p1@x.com',
        displayName: 'Pedro',
        role: 'developer',
        allocationPct: 100,
        status: 'activo',
      },
    ]
    await db.teams.add(team)
    expect(await equiposTool.execute({ incluirMiembros: 'true' })).toContain('Pedro')
    expect(await equiposTool.execute({ incluirMiembros: 1 })).toContain('Pedro')
  })

  it('no muestra miembros cuando incluirMiembros es false o equipo sin miembros', async () => {
    await db.teams.add(baseTeam('t1', 'Alpha'))
    const out = await equiposTool.execute({ incluirMiembros: false })
    expect(out).not.toContain('Miembros')
  })

  it('devuelve vacío cuando no hay equipos', async () => {
    const out = await equiposTool.execute({})
    expect(out).toContain('0 equipo(s)')
  })
})

describe('buscarPersonaTool', () => {
  beforeEach(async () => {
    await Promise.all([db.teams.clear(), db.memberProfiles.clear(), db.users.clear()])
  })

  it('falla si falta q', async () => {
    const out = await buscarPersonaTool.execute({})
    expect(out).toBe('Error: parámetro "q" requerido.')
  })

  it('busca en memberProfiles por nombre sin acentos', async () => {
    const team = baseTeam('t1', 'Equipo Alpha')
    team.members = [
      {
        id: 'm1',
        userPrincipal: 'jose@x.com',
        displayName: 'José Pérez',
        role: 'developer',
        allocationPct: 100,
        status: 'activo',
      },
    ]
    await db.teams.add(team)
    await db.memberProfiles.add(baseMember('mp1', 't1', 'jose@x.com'))
    const out = await buscarPersonaTool.execute({ q: 'jose' })
    expect(out).toContain('José Pérez')
    expect(out).toContain('jose@x.com')
    expect(out).toContain('Equipo Alpha')
    expect(out).toContain('memberProfiles')
  })

  it('busca en memberProfiles por teléfono', async () => {
    await db.memberProfiles.add(baseMember('mp1', 't1', 'p@x.com'))
    const out = await buscarPersonaTool.execute({ q: '555-1234' })
    expect(out).toContain('p@x.com')
  })

  it('busca en users y evita duplicados con memberProfiles', async () => {
    await db.memberProfiles.add(baseMember('mp1', 't1', 'same@x.com'))
    await db.users.add(baseUser('u1', 'same@x.com', 'Ana'))
    await db.users.add(baseUser('u2', 'otro@x.com', 'Bruno'))
    const out = await buscarPersonaTool.execute({ q: 'bruno' })
    expect(out).toContain('Bruno')
    expect(out).toContain('(usuario del sistema)')
  })

  it('busca en teams.members y evita duplicados con memberProfiles', async () => {
    const team = baseTeam('t1', 'Equipo Alpha')
    team.members = [
      {
        id: 'mX',
        userPrincipal: 'carla@x.com',
        displayName: 'Carla Gómez',
        role: 'analyst',
        allocationPct: 100,
        status: 'activo',
      },
    ]
    await db.teams.add(team)
    const out = await buscarPersonaTool.execute({ q: 'carla' })
    expect(out).toContain('Carla Gómez')
    expect(out).toContain('teams.members')
    expect(out).toContain('Equipo Alpha')
  })

  it('aplica limit y avisa resultados restantes', async () => {
    for (let i = 0; i < 5; i++) {
      await db.users.add(baseUser(`u${i}`, `user${i}@x.com`, `Persona ${i}`))
    }
    const out = await buscarPersonaTool.execute({ q: 'persona', limit: 2 })
    expect(out).toContain('5 coincidencia(s)')
    expect(out).toContain('3 resultado(s) más')
  })

  it('devuelve mensaje de no encontrado', async () => {
    const out = await buscarPersonaTool.execute({ q: 'zzzz' })
    expect(out).toContain('No se encontraron personas')
  })
})

describe('sprintsTool', () => {
  beforeEach(async () => {
    await Promise.all([db.teamSprints.clear(), db.teams.clear()])
  })

  it('lista sprints con nombre de equipo', async () => {
    await db.teams.add(baseTeam('t1', 'Equipo Alpha'))
    await db.teamSprints.bulkAdd([baseSprint('s1', 't1'), baseSprint('s2', 't1')])
    const out = await sprintsTool.execute({})
    expect(out).toContain('2')
    expect(out).toContain('Equipo Alpha')
    expect(out).toContain('75%')
  })

  it('filtra por teamId, year y quarter', async () => {
    await db.teamSprints.bulkAdd([baseSprint('s1', 't1'), baseSprint('s2', 't2')])
    const out = await sprintsTool.execute({ teamId: 't2', year: 2025, quarter: '1' })
    expect(out).toContain('Registros de sprint encontrados (1)')
  })

  it('aplica limit', async () => {
    for (let i = 0; i < 4; i++) await db.teamSprints.add(baseSprint(`s${i}`, 't1'))
    const out = await sprintsTool.execute({ limit: 2 })
    expect(out).toContain('(2)')
  })

  it('devuelve 0% cuando plannedSP es 0', async () => {
    const s = baseSprint('s1', 't1')
    s.plannedSP = 0
    await db.teamSprints.add(s)
    const out = await sprintsTool.execute({})
    expect(out).toContain('(0%)')
  })

  it('muestra teamId cuando el equipo no existe', async () => {
    await db.teamSprints.add(baseSprint('s1', 't-desconocido'))
    const out = await sprintsTool.execute({})
    expect(out).toContain('t-desconocido')
  })

  it('devuelve sin resultados', async () => {
    const out = await sprintsTool.execute({})
    expect(out).toBe('No se encontraron registros de sprint.')
  })
})
