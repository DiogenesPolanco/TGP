import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { auditarDatosTool } from './auditar-datos'

const appSucia = (id = 'a1') => ({ id, name: 'ERP', technologies: [] }) as never
const appCompleta = {
  id: 'a2',
  name: 'CRM',
  ownerId: 'u1',
  ownerName: 'Ana',
  businessUnitId: 'bu1',
  criticality: 'alta',
  architecture: 'microservices',
  description: 'CRM central',
  technologies: ['react'],
} as never

describe('auditarDatosTool', () => {
  beforeEach(async () => {
    await Promise.all([
      db.applications.clear(),
      db.microservices.clear(),
      db.appDatabases.clear(),
      db.vulnerabilities.clear(),
      db.incidents.clear(),
      db.plans.clear(),
      db.tasks.clear(),
      db.commitments.clear(),
      db.blockers.clear(),
      db.deliverables.clear(),
      db.objectives.clear(),
      db.healthIndexHistory.clear(),
      db.teams.clear(),
      db.memberProfiles.clear(),
      db.risks.clear(),
      db.auditFindings.clear(),
      db.equipment.clear(),
      db.equipmentTickets.clear(),
      db.candidates.clear(),
      db.candidateEvaluations.clear(),
    ])
  })

  it('reporta sin inconsistencias cuando no hay datos', async () => {
    const out = await auditarDatosTool.execute({ dominio: 'reclutamiento' })
    expect(out).toBe(
      '✅ **Auditoría de datos completa** — No se encontraron inconsistencias en el dominio "reclutamiento".',
    )
  })

  it('no audita dominios desconocidos', async () => {
    const out = await auditarDatosTool.execute({ dominio: 'zzz' })
    expect(out).toContain('No se encontraron inconsistencias en el dominio "zzz"')
  })

  it('audita aplicaciones: owner, BU, criticidad, arquitectura, descripción, tecnologías', async () => {
    await db.applications.bulkAdd([appSucia(), appCompleta])
    await db.microservices.add({ id: 'ms1', name: 'MS Auth' } as never)
    await db.appDatabases.add({ id: 'bd1', name: 'BD Core' } as never)
    const out = await auditarDatosTool.execute({ dominio: 'aplicaciones' })
    expect(out).toContain('**Sin owner** (1)')
    expect(out).toContain('**Sin BU** (1)')
    expect(out).toContain('**Sin criticidad** (1)')
    expect(out).toContain('**Sin arquitectura** (1)')
    expect(out).toContain('**Sin descripción** (1)')
    expect(out).toContain('**Sin tecnologías** (1)')
    expect(out).toContain('**Microservicio huérfano** (1)')
    expect(out).toContain('**BD huérfana** (1)')
    expect(out).toContain('**BD sin host** (1)')
    expect(out).not.toContain('**CRM**')
  })

  it('audita seguridad: vulns sin app/CVSS/severidad/SLA y SLA vencido', async () => {
    await db.vulnerabilities.bulkAdd([
      { id: 'v1', title: 'Vuln A', status: 'open' },
      { id: 'v2', title: 'Vuln B', slaDeadline: '2020-01-01', status: 'open' },
      {
        id: 'v3',
        title: 'Vuln OK',
        applicationId: 'a1',
        cvssScore: 7.5,
        severity: 'high',
        status: 'closed',
      },
    ] as never)
    await db.incidents.add({ id: 'i1', title: 'Incidente A' } as never)
    const out = await auditarDatosTool.execute({ dominio: 'seguridad' })
    expect(out).toContain('**Vulnerabilidad huérfana** (2)')
    expect(out).toContain('**Vuln sin CVSS** (2)')
    expect(out).toContain('**Vuln sin severidad** (2)')
    expect(out).toContain('**Vuln sin SLA** (1)')
    expect(out).toContain('**SLA vencido** (1)')
    expect(out).toContain('**Incidente huérfano** (1)')
    expect(out).toContain('**Incidente sin severidad** (1)')
  })

  it('audita incidentes resueltos sin fecha ni RCA', async () => {
    await db.incidents.add({
      id: 'i1',
      title: 'Inc',
      applicationId: 'a1',
      severity: 'alta',
      status: 'resolved',
    } as never)
    const out = await auditarDatosTool.execute({ dominio: 'seguridad' })
    expect(out).toContain('**Incidente resuelto sin fecha** (1)')
    expect(out).toContain('**Incidente sin RCA** (1)')
  })

  it('audita ejecución: planes, tareas, compromisos, bloqueos, entregables', async () => {
    await db.plans.add({ id: 'p1', title: 'Plan' } as never)
    await db.tasks.add({ id: 'tk1', title: 'Tarea' } as never)
    await db.commitments.add({ id: 'c1', title: 'Compromiso' } as never)
    await db.blockers.add({ id: 'b1', title: 'Bloqueo' } as never)
    await db.deliverables.add({ id: 'd1', title: 'Entregable' } as never)
    const out = await auditarDatosTool.execute({ dominio: 'ejecucion' })
    expect(out).toContain('**Plan sin dueño** (1)')
    expect(out).toContain('**Plan sin OKR** (1)')
    expect(out).toContain('**Tarea huérfana** (1)')
    expect(out).toContain('**Tarea sin asignar** (1)')
    expect(out).toContain('**Compromiso sin owner** (1)')
    expect(out).toContain('**Bloqueo sin asignado** (1)')
    expect(out).toContain('**Entregable sin contexto** (1)')
  })

  it('audita vencidos: plan, tarea, compromiso, entregable, bloqueo añejo', async () => {
    const viejo = '2020-01-01'
    await db.plans.add({
      id: 'p1',
      title: 'Plan',
      teamId: 't1',
      objectiveId: 'o1',
      endDate: viejo,
      status: 'in_progress',
    } as never)
    await db.tasks.add({
      id: 'tk1',
      title: 'Tarea',
      activityId: 'act1',
      assigneeId: 'u1',
      dueDate: viejo,
      status: 'in_progress',
    } as never)
    await db.commitments.add({
      id: 'c1',
      title: 'Compromiso',
      ownerId: 'u1',
      commitmentDate: viejo,
      status: 'open',
    } as never)
    await db.blockers.add({
      id: 'b1',
      title: 'Bloqueo',
      assigneeId: 'u1',
      status: 'open',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    } as never)
    await db.deliverables.add({
      id: 'd1',
      title: 'Entregable',
      applicationId: 'a1',
      dueDate: viejo,
      status: 'in_progress',
    } as never)
    const out = await auditarDatosTool.execute({ dominio: 'ejecucion' })
    expect(out).toContain('**Plan vencido** (1)')
    expect(out).toContain('**Tarea vencida** (1)')
    expect(out).toContain('**Compromiso vencido** (1)')
    expect(out).toContain('**Bloqueo añejo** (1)')
    expect(out).toContain('**Entregable vencido** (1)')
  })

  it('no marca vencidos cuando están completados', async () => {
    await db.plans.add({
      id: 'p1',
      title: 'Plan',
      teamId: 't1',
      objectiveId: 'o1',
      endDate: '2020-01-01',
      status: 'completed',
    } as never)
    await db.tasks.add({
      id: 'tk1',
      title: 'Tarea',
      activityId: 'act1',
      assigneeId: 'u1',
      dueDate: '2020-01-01',
      status: 'done',
    } as never)
    await db.commitments.add({
      id: 'c1',
      title: 'Compromiso',
      ownerId: 'u1',
      commitmentDate: '2020-01-01',
      status: 'fulfilled',
    } as never)
    await db.deliverables.add({
      id: 'd1',
      title: 'Entregable',
      applicationId: 'a1',
      dueDate: '2020-01-01',
      status: 'completed',
    } as never)
    const out = await auditarDatosTool.execute({ dominio: 'ejecucion' })
    expect(out).not.toContain('vencido')
  })

  it('audita estrategia: OKRs sin dueño/KRs/vencidos y gap de THI', async () => {
    await db.objectives.add({ id: 'o1', title: 'OKR' } as never)
    await db.healthIndexHistory.bulkAdd([
      { id: 'h1', businessUnitId: 'bu1', calculatedAt: new Date('2025-01-01') },
      { id: 'h2', businessUnitId: 'bu1', calculatedAt: new Date('2025-03-15') },
    ] as never)
    const out = await auditarDatosTool.execute({ dominio: 'estrategia' })
    expect(out).toContain('**OKR sin dueño** (1)')
    expect(out).toContain('**OKR sin KRs** (1)')
    expect(out).toContain('**Gap en THI** (1)')
  })

  it('audita OKR vencido', async () => {
    await db.objectives.add({
      id: 'o1',
      title: 'OKR',
      teamId: 't1',
      keyResults: [{}],
      periodEnd: '2020-01-01',
      status: 'in_progress',
    } as never)
    const out = await auditarDatosTool.execute({ dominio: 'estrategia' })
    expect(out).toContain('**OKR vencido** (1)')
  })

  it('audita personas: equipos vacíos, sin BU y perfiles sin equipo', async () => {
    await db.teams.add({ id: 't1', name: 'Equipo' } as never)
    await db.memberProfiles.add({ id: 'mp1', email: 'a@x.com' } as never)
    const out = await auditarDatosTool.execute({ dominio: 'personas' })
    expect(out).toContain('**Equipo vacío** (1)')
    expect(out).toContain('**Equipo sin BU** (1)')
    expect(out).toContain('**Persona sin equipo** (1)')
  })

  it('audita riesgos y hallazgos en dominio seguridad', async () => {
    await db.risks.add({
      id: 'r1',
      title: 'Riesgo',
      status: 'open',
      targetDate: '2020-01-01',
    } as never)
    await db.auditFindings.add({ id: 'f1', title: 'Hallazgo' } as never)
    const out = await auditarDatosTool.execute({ dominio: 'seguridad' })
    expect(out).toContain('**Riesgo sin score** (1)')
    expect(out).toContain('**Riesgo sin plan** (1)')
    expect(out).toContain('**Riesgo vencido** (1)')
    expect(out).toContain('**Hallazgo huérfano** (1)')
  })

  it('audita hallazgos vencidos', async () => {
    await db.auditFindings.add({
      id: 'f1',
      title: 'Hallazgo',
      applicationId: 'a1',
      dueDate: '2020-01-01',
      status: 'open',
    } as never)
    const out = await auditarDatosTool.execute({ dominio: 'seguridad' })
    expect(out).toContain('**Hallazgo vencido** (1)')
  })

  it('audita equipamiento: asignación, completitud, serial, centro de costo y tickets', async () => {
    await db.equipment.add({
      id: 'e1',
      brand: '',
      model: '',
      status: 'assigned',
      assignedTo: null,
    } as never)
    await db.equipmentTickets.add({ id: 'et1', type: 'repair', status: 'open' } as never)
    await db.equipmentTickets.add({ id: 'et2', type: 'repair', status: 'resolved' } as never)
    const out = await auditarDatosTool.execute({ dominio: 'equipamiento' })
    expect(out).toContain('**Equipo asignado sin dueño** (1)')
    expect(out).toContain('**Equipo incompleto** (1)')
    expect(out).toContain('**Equipo sin serial** (1)')
    expect(out).toContain('**Equipo sin centro de costo** (1)')
    expect(out).toContain('**Ticket sin técnico** (2)')
    expect(out).toContain('**Ticket sin resolución** (1)')
    expect(out).toContain('**Ticket sin fecha cierre** (1)')
  })

  it('no marca tickets cerrados', async () => {
    await db.equipmentTickets.add({
      id: 'et1',
      type: 'repair',
      status: 'closed',
      assigneeId: null,
    } as never)
    const out = await auditarDatosTool.execute({ dominio: 'equipamiento' })
    expect(out).not.toContain('Ticket sin técnico')
  })

  it('audita reclutamiento: email, posición, score y evaluación', async () => {
    await db.candidates.add({ id: 'c1', name: 'Cand' } as never)
    await db.candidates.add({
      id: 'c2',
      name: 'Cand2',
      email: 'c@x.com',
      position: 'dev',
      totalScore: 8,
      status: 'in_review',
    } as never)
    const out = await auditarDatosTool.execute({ dominio: 'reclutamiento' })
    expect(out).toContain('**Candidato sin email** (1)')
    expect(out).toContain('**Candidato sin posición** (1)')
    expect(out).toContain('**Candidato sin score** (1)')
    expect(out).toContain('**Candidato sin evaluación** (2)')
  })

  it('filtra por severidad mínima', async () => {
    await db.applications.bulkAdd([appSucia()])
    const out = await auditarDatosTool.execute({ dominio: 'aplicaciones', severidadMinima: 'alta' })
    expect(out).toContain('Sin owner')
    expect(out).not.toContain('Sin arquitectura')
    expect(out).not.toContain('Sin descripción')
  })

  it('filtra solo críticos con boolean, string y número', async () => {
    await db.applications.bulkAdd([appSucia()])
    for (const soloCriticos of [true, 'true', '1'] as const) {
      const out = await auditarDatosTool.execute({ dominio: 'aplicaciones', soloCriticos })
      expect(out).toContain('Sin owner')
      expect(out).not.toContain('Sin arquitectura')
    }
  })

  it('ordena por severidad', async () => {
    const appSucia2 = { id: 'a9', name: 'Otro', technologies: [] } as never
    await db.applications.bulkAdd([appSucia(), appSucia2])
    const out = await auditarDatosTool.execute({ dominio: 'aplicaciones' })
    const idxOwner = out.indexOf('**Sin owner**')
    const idxArq = out.indexOf('Sin arquitectura')
    const idxDesc = out.indexOf('Sin descripción')
    expect(idxOwner).toBeGreaterThan(-1)
    expect(idxArq).toBeGreaterThan(-1)
    expect(idxDesc).toBeGreaterThan(-1)
    expect(idxOwner).toBeLessThan(idxDesc)
    expect(idxDesc).toBeLessThan(idxArq)
  })

  it('limita resultados y avisa de los restantes', async () => {
    const appSucia2 = { id: 'a9', name: 'Otro', technologies: [] } as never
    await db.applications.bulkAdd([appSucia(), appSucia2])
    const out = await auditarDatosTool.execute({ dominio: 'aplicaciones', limit: 3 })
    expect(out).toContain('... y 9 issue(s) más.')
  })

  it('muestra resumen por severidad', async () => {
    await db.applications.bulkAdd([appSucia()])
    const out = await auditarDatosTool.execute({ dominio: 'aplicaciones' })
    expect(out).toContain('**Resumen:** 🔴 3 alta · 🟡 2 media · ⚪ 1 baja')
  })

  it('audita todo el sistema con dominio todo', async () => {
    await db.applications.bulkAdd([appSucia()])
    await db.microservices.add({ id: 'ms1', name: 'MS' } as never)
    const out = await auditarDatosTool.execute({})
    expect(out).toContain('**Sin owner** (1)')
    expect(out).toContain('**Microservicio huérfano** (1)')
  })
})
