import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

interface Issue {
  tipo: string
  entidad: string
  descripcion: string
  id: string
  nombre: string
  severidad: 'alta' | 'media' | 'baja'
}

function nameOrId(item: Record<string, unknown>): string {
  return (item.title as string) ?? (item.name as string) ?? (item.displayName as string) ?? idSnippet(item.id as string)
}

function idSnippet(id: string): string {
  return `#${id.slice(0, 8)}…`
}

function tiene(val: unknown): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'string' && val.trim() === '') return false
  if (typeof val === 'number' && val === 0) return true
  return true
}

function count(arr: unknown[]): number {
  return arr.length
}

async function checkOrphans<T extends { id: string }>(
  table: { toArray: () => Promise<T[]> },
  field: keyof T,
  parentTable: string,
  tipo: string,
  issues: Issue[],
  severidad: 'alta' | 'media' | 'baja' = 'media'
) {
  try {
    const items = await table.toArray()
    const orphans = items.filter((item) => !tiene(item[field]))
    for (const o of orphans) {
      issues.push({
        tipo,
        entidad: parentTable,
        descripcion: `No está vinculad@ a ninguna entidad padre`,
        id: o.id,
        nombre: nameOrId(o as unknown as Record<string, unknown>),
        severidad,
      })
    }
  } catch {}
}

export const auditarDatosTool: AiToolDefinition = {
  name: 'auditar_datos',
  description: 'Auditoría de calidad de datos: encontrá registros incompletos, huérfanos o inconsistentes en toda la plataforma que puedan afectar reportes. Revisa aplicaciones, vulnerabilidades, incidentes, riesgos, hallazgos, OKRs, planes, actividades, tareas, compromisos, blockers, entregables, microservicios, BBDD, equipos, personas, equipamiento y candidatos.',
  parameters: {
    type: 'object',
    properties: {
      dominio: {
        type: 'string',
        enum: ['aplicaciones', 'seguridad', 'ejecucion', 'personas', 'estrategia', 'catalogo', 'equipamiento', 'reclutamiento', 'todo'],
        description: 'Dominio a auditar. "todo" revisa todos los dominios (default)',
      },
      severidadMinima: {
        type: 'string',
        enum: ['alta', 'media', 'baja'],
        description: 'Filtrar por severidad mínima (default: baja = todas)',
      },
      soloCriticos: {
        type: ['boolean', 'string', 'number'],
        description: 'Solo issues de severidad alta (true)',
      },
      limit: { type: 'number', description: 'Máximo de issues a mostrar (default 50)' },
    },
  },
  execute: async (params) => {
    const dominio = (params.dominio as string) ?? 'todo'
    const severidadMinima = (params.severidadMinima as string) ?? 'baja'
    const soloCriticos = typeof params.soloCriticos === 'boolean' ? params.soloCriticos :
      params.soloCriticos === 'true' || params.soloCriticos === '1'
    const limit = Math.min(Math.max(1, (params.limit as number) ?? 50), 200)
    const issues: Issue[] = []
    const sevOrder: Record<string, number> = { alta: 3, media: 2, baja: 1 }
    const minSev = sevOrder[severidadMinima] ?? 1

    const check = dominio === 'todo'

    async function audit(categoria: string, fn: () => Promise<void>) {
      if (dominio === 'todo' || dominio === categoria) {
        try { await fn() } catch {}
      }
    }

    await audit('aplicaciones', async () => {
      const apps = await db.applications.toArray()
      for (const a of apps) {
        const nom = a.name

        if (!tiene(a.ownerId) || !tiene(a.ownerName)) {
          issues.push({ tipo: 'Sin owner', entidad: 'Application', descripcion: `Falta owner (ownerId=${a.ownerId}, ownerName=${a.ownerName})`, id: a.id, nombre: nom, severidad: 'alta' })
        }
        if (!tiene(a.businessUnitId)) {
          issues.push({ tipo: 'Sin BU', entidad: 'Application', descripcion: `No está asignada a ninguna unidad de negocio`, id: a.id, nombre: nom, severidad: 'alta' })
        }
        if (!tiene(a.criticality)) {
          issues.push({ tipo: 'Sin criticidad', entidad: 'Application', descripcion: `Falta nivel de criticidad — impacta priorización en reportes`, id: a.id, nombre: nom, severidad: 'alta' })
        }
        if (!tiene(a.architecture)) {
          issues.push({ tipo: 'Sin arquitectura', entidad: 'Application', descripcion: `Falta tipo de arquitectura — necesario para mapa tecnológico`, id: a.id, nombre: nom, severidad: 'baja' })
        }
        if (!tiene(a.description)) {
          issues.push({ tipo: 'Sin descripción', entidad: 'Application', descripcion: `Falta descripción del negocio`, id: a.id, nombre: nom, severidad: 'media' })
        }
        if (a.technologies.length === 0) {
          issues.push({ tipo: 'Sin tecnologías', entidad: 'Application', descripcion: `No tiene tecnologías registradas — el stack aparece vacío`, id: a.id, nombre: nom, severidad: 'media' })
        }
      }

      const mservices = await db.microservices.toArray()
      for (const ms of mservices) {
        if (!ms.applicationId) {
          issues.push({ tipo: 'Microservicio huérfano', entidad: 'Microservice', descripcion: `No está vinculado a ninguna aplicación`, id: ms.id, nombre: ms.name, severidad: 'alta' })
        }
      }

      const dbs = await db.appDatabases.toArray()
      for (const d of dbs) {
        if (!d.applicationId) {
          issues.push({ tipo: 'BD huérfana', entidad: 'AppDatabase', descripcion: `No está vinculada a ninguna aplicación`, id: d.id, nombre: d.name, severidad: 'alta' })
        }
        if (!tiene(d.host)) {
          issues.push({ tipo: 'BD sin host', entidad: 'AppDatabase', descripcion: `Falta host o endpoint de conexión`, id: d.id, nombre: d.name, severidad: 'media' })
        }
      }
    })

    await audit('seguridad', async () => {
      const vulns = await db.vulnerabilities.toArray()
      for (const v of vulns) {
        const nom = v.title || idSnippet(v.id)

        if (!tiene(v.applicationId)) {
          issues.push({ tipo: 'Vulnerabilidad huérfana', entidad: 'Vulnerability', descripcion: `No está vinculada a ninguna aplicación — no aparece en reportes por app`, id: v.id, nombre: nom, severidad: 'alta' })
        }
        if (!tiene(v.cvssScore)) {
          issues.push({ tipo: 'Vuln sin CVSS', entidad: 'Vulnerability', descripcion: `Falta puntuación CVSS — no se puede priorizar`, id: v.id, nombre: nom, severidad: 'alta' })
        }
        if (!tiene(v.severity)) {
          issues.push({ tipo: 'Vuln sin severidad', entidad: 'Vulnerability', descripcion: `Falta nivel de severidad`, id: v.id, nombre: nom, severidad: 'alta' })
        }
        if (v.status === 'open' || v.status === 'in_progress') {
          if (!tiene(v.slaDeadline)) {
            issues.push({ tipo: 'Vuln sin SLA', entidad: 'Vulnerability', descripcion: `Está abierta pero no tiene fecha tope SLA — no se puede medir cumplimiento`, id: v.id, nombre: nom, severidad: 'alta' })
          } else if (new Date(v.slaDeadline) < new Date() && v.status !== 'fixed' && v.status !== 'accepted') {
            issues.push({ tipo: 'SLA vencido', entidad: 'Vulnerability', descripcion: `SLA vencido el ${new Date(v.slaDeadline).toLocaleDateString('es-ES')} y sigue sin resolver`, id: v.id, nombre: nom, severidad: 'alta' })
          }
        }
      }

      const incidents = await db.incidents.toArray()
      for (const inc of incidents) {
        const nom = inc.title || idSnippet(inc.id)

        if (!tiene(inc.applicationId)) {
          issues.push({ tipo: 'Incidente huérfano', entidad: 'Incident', descripcion: `No está vinculado a ninguna aplicación — no aparece en reportes por app`, id: inc.id, nombre: nom, severidad: 'alta' })
        }
        if (!tiene(inc.severity)) {
          issues.push({ tipo: 'Incidente sin severidad', entidad: 'Incident', descripcion: `Falta nivel de severidad`, id: inc.id, nombre: nom, severidad: 'alta' })
        }
        if (inc.status === 'resolved' && !tiene(inc.resolvedAt)) {
          issues.push({ tipo: 'Incidente resuelto sin fecha', entidad: 'Incident', descripcion: `Está resuelto pero falta fecha de resolución — no se puede calcular MTTR`, id: inc.id, nombre: nom, severidad: 'media' })
        }
        if (inc.status === 'resolved' && !tiene(inc.rca)) {
          issues.push({ tipo: 'Incidente sin RCA', entidad: 'Incident', descripcion: `Está resuelto pero no tiene Root Cause Analysis`, id: inc.id, nombre: nom, severidad: 'media' })
        }
      }
    })

    await audit('ejecucion', async () => {
      const plans = await db.plans.toArray()
      for (const p of plans) {
        if (!tiene(p.teamId) && !tiene(p.businessUnitId)) {
          issues.push({ tipo: 'Plan sin dueño', entidad: 'Plan', descripcion: `No tiene equipo ni BU asignada`, id: p.id, nombre: p.title, severidad: 'alta' })
        }
        if (!tiene(p.objectiveId)) {
          issues.push({ tipo: 'Plan sin OKR', entidad: 'Plan', descripcion: `No está vinculado a ningún objetivo estratégico — no se refleja en reportes de OKRs`, id: p.id, nombre: p.title, severidad: 'media' })
        }
        if (p.endDate && new Date(p.endDate) < new Date() && p.status !== 'completed' && p.status !== 'cancelled') {
          issues.push({ tipo: 'Plan vencido', entidad: 'Plan', descripcion: `Fecha fin ${new Date(p.endDate).toLocaleDateString('es-ES')} pero sigue en estado "${p.status}"`, id: p.id, nombre: p.title, severidad: 'alta' })
        }
      }

      const tasks = await db.tasks.toArray()
      for (const t of tasks) {
        if (!tiene(t.activityId) && !tiene(t.planId)) {
          issues.push({ tipo: 'Tarea huérfana', entidad: 'Task', descripcion: `No está vinculada a ninguna actividad ni plan — no aparece en seguimiento`, id: t.id, nombre: t.title, severidad: 'alta' })
        }
        if (!tiene(t.assigneeId)) {
          issues.push({ tipo: 'Tarea sin asignar', entidad: 'Task', descripcion: `No tiene responsable asignado`, id: t.id, nombre: t.title, severidad: 'media' })
        }
        if (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done') {
          issues.push({ tipo: 'Tarea vencida', entidad: 'Task', descripcion: `Vencía el ${new Date(t.dueDate).toLocaleDateString('es-ES')} y no está completada`, id: t.id, nombre: t.title, severidad: 'alta' })
        }
      }

      const commitments = await db.commitments.toArray()
      for (const c of commitments) {
        if (!tiene(c.ownerId)) {
          issues.push({ tipo: 'Compromiso sin owner', entidad: 'Commitment', descripcion: `No tiene responsable (owner)`, id: c.id, nombre: c.title, severidad: 'alta' })
        }
        if (c.commitmentDate && new Date(c.commitmentDate) < new Date() && c.status !== 'fulfilled' && c.status !== 'cancelled') {
          issues.push({ tipo: 'Compromiso vencido', entidad: 'Commitment', descripcion: `Vencía el ${new Date(c.commitmentDate).toLocaleDateString('es-ES')} pero estado es "${c.status}"`, id: c.id, nombre: c.title, severidad: 'alta' })
        }
      }

      const blockers = await db.blockers.toArray()
      for (const b of blockers) {
        if (!tiene(b.assigneeId)) {
          issues.push({ tipo: 'Bloqueo sin asignado', entidad: 'Blocker', descripcion: `No tiene responsable para resolverlo`, id: b.id, nombre: b.title, severidad: 'alta' })
        }
        if (b.status === 'open' && b.createdAt && (Date.now() - new Date(b.createdAt).getTime()) > 7 * 24 * 60 * 60 * 1000) {
          issues.push({ tipo: 'Bloqueo añejo', entidad: 'Blocker', descripcion: `Lleva más de 7 días abierto sin escalar`, id: b.id, nombre: b.title, severidad: 'media' })
        }
      }

      const deliverables = await db.deliverables.toArray()
      for (const d of deliverables) {
        if (!tiene(d.applicationId) && !tiene(d.objectiveId)) {
          issues.push({ tipo: 'Entregable sin contexto', entidad: 'Deliverable', descripcion: `No está vinculado a ninguna app ni objetivo`, id: d.id, nombre: d.title, severidad: 'media' })
        }
        if (d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'completed' && d.status !== 'cancelled') {
          issues.push({ tipo: 'Entregable vencido', entidad: 'Deliverable', descripcion: `Vencía el ${new Date(d.dueDate).toLocaleDateString('es-ES')} y no está completado`, id: d.id, nombre: d.title, severidad: 'alta' })
        }
      }
    })

    await audit('estrategia', async () => {
      const objectives = await db.objectives.toArray()
      for (const o of objectives) {
        if (!tiene(o.teamId) && !tiene(o.businessUnitId)) {
          issues.push({ tipo: 'OKR sin dueño', entidad: 'Objective', descripcion: `No tiene equipo ni BU asignada — no se puede asignar en reportes`, id: o.id, nombre: o.title, severidad: 'alta' })
        }
        if (!o.keyResults || o.keyResults.length === 0) {
          issues.push({ tipo: 'OKR sin KRs', entidad: 'Objective', descripcion: `No tiene Key Results definidos — no se puede medir progreso`, id: o.id, nombre: o.title, severidad: 'alta' })
        }
        if (o.periodEnd && new Date(o.periodEnd) < new Date() && o.status !== 'achieved' && o.status !== 'not_started') {
          issues.push({ tipo: 'OKR vencido', entidad: 'Objective', descripcion: `Período terminó el ${new Date(o.periodEnd).toLocaleDateString('es-ES')} pero estado es "${o.status}"`, id: o.id, nombre: o.title, severidad: 'alta' })
        }
      }

      const hi = await db.healthIndexHistory.toArray()
      if (hi.length > 0) {
        const fechas = hi.map((h) => new Date(h.date ?? h.calculatedAt).getTime()).sort((a, b) => a - b)
        for (let i = 1; i < fechas.length; i++) {
          const gap = fechas[i] - fechas[i - 1]
          if (gap > 45 * 24 * 60 * 60 * 1000) {
            issues.push({
              tipo: 'Gap en THI',
              entidad: 'HealthIndex',
              descripcion: `Hay un lapso de ${Math.round(gap / (24 * 60 * 60 * 1000))} días entre mediciones — reportes de tendencia pueden ser imprecisos`,
              id: hi[i].id,
              nombre: `${new Date(fechas[i]).toLocaleDateString('es-ES')}`,
              severidad: 'media',
            })
            break
          }
        }
      }
    })

    await audit('personas', async () => {
      const teams = await db.teams.toArray()
      for (const t of teams) {
        if (!t.members || t.members.length === 0) {
          issues.push({ tipo: 'Equipo vacío', entidad: 'Team', descripcion: `No tiene miembros asignados — no aporta a métricas de capacidad`, id: t.id, nombre: t.name, severidad: 'media' })
        }
        if (!tiene(t.businessUnitId)) {
          issues.push({ tipo: 'Equipo sin BU', entidad: 'Team', descripcion: `No está asignado a ninguna unidad de negocio`, id: t.id, nombre: t.name, severidad: 'alta' })
        }
      }

      try {
        const profiles = await db.memberProfiles.toArray()
        for (const p of profiles) {
          if (!p.teamId) {
            issues.push({ tipo: 'Persona sin equipo', entidad: 'MemberProfile', descripcion: `No pertenece a ningún equipo — no aparece en reportes de dotación`, id: p.id, nombre: p.displayName, severidad: 'media' })
          }
        }
      } catch {}
    })

    await audit('seguridad', async () => {
      const risks = await db.risks.toArray()
      for (const r of risks) {
        if (r.riskScore === null || r.riskScore === undefined) {
          issues.push({ tipo: 'Riesgo sin score', entidad: 'Risk', descripcion: `Falta puntuación de riesgo (probabilidad × impacto) — no se puede priorizar`, id: r.id, nombre: r.title, severidad: 'alta' })
        }
        if (!tiene(r.mitigationPlan)) {
          issues.push({ tipo: 'Riesgo sin plan', entidad: 'Risk', descripcion: `No tiene plan de mitigación`, id: r.id, nombre: r.title, severidad: 'media' })
        }
        if (r.status === 'open' && r.targetDate && new Date(r.targetDate) < new Date()) {
          issues.push({ tipo: 'Riesgo vencido', entidad: 'Risk', descripcion: `Fecha target ${new Date(r.targetDate).toLocaleDateString('es-ES')} pasó y sigue abierto`, id: r.id, nombre: r.title, severidad: 'alta' })
        }
      }

      const findings = await db.auditFindings.toArray()
      for (const f of findings) {
        if (!tiene(f.applicationId)) {
          issues.push({ tipo: 'Hallazgo huérfano', entidad: 'AuditFinding', descripcion: `No está vinculado a ninguna aplicación`, id: f.id, nombre: f.title, severidad: 'alta' })
        }
        if (f.dueDate && new Date(f.dueDate) < new Date() && f.status !== 'resolved' && f.status !== 'closed') {
          issues.push({ tipo: 'Hallazgo vencido', entidad: 'AuditFinding', descripcion: `Vencía el ${new Date(f.dueDate).toLocaleDateString('es-ES')} y no está resuelto`, id: f.id, nombre: f.title, severidad: 'alta' })
        }
      }
    })

    await audit('equipamiento', async () => {
      const equip = await db.equipment.toArray()
      for (const e of equip) {
        if (e.status === 'assigned' && !tiene(e.assignedTo)) {
          issues.push({ tipo: 'Equipo asignado sin dueño', entidad: 'EquipmentItem', descripcion: `Estado es "assigned" pero no tiene persona asignada`, id: e.id, nombre: `${e.brand} ${e.model}`, severidad: 'alta' })
        }
        if (!tiene(e.brand) || !tiene(e.model)) {
          issues.push({ tipo: 'Equipo incompleto', entidad: 'EquipmentItem', descripcion: `Falta marca o modelo`, id: e.id, nombre: e.serialNumber ?? idSnippet(e.id), severidad: 'media' })
        }
        if (!tiene(e.serialNumber)) {
          issues.push({ tipo: 'Equipo sin serial', entidad: 'EquipmentItem', descripcion: `Falta número de serie — no se puede rastrear`, id: e.id, nombre: `${e.brand} ${e.model}`, severidad: 'alta' })
        }
        if (!tiene(e.costCenter)) {
          issues.push({ tipo: 'Equipo sin centro de costo', entidad: 'EquipmentItem', descripcion: `Falta centro de costo — no se puede asignar el gasto`, id: e.id, nombre: `${e.brand} ${e.model}`, severidad: 'baja' })
        }
      }

      const tickets = await db.equipmentTickets.toArray()
      for (const t of tickets) {
        if (!tiene(t.assigneeId) && t.status !== 'closed') {
          issues.push({ tipo: 'Ticket sin técnico', entidad: 'EquipmentTicket', descripcion: `No tiene técnico asignado para resolverlo`, id: t.id, nombre: `${t.type} #${t.id.slice(0, 8)}`, severidad: 'alta' })
        }
        if (t.status === 'resolved' && !tiene(t.resolution)) {
          issues.push({ tipo: 'Ticket sin resolución', entidad: 'EquipmentTicket', descripcion: `Está resuelto pero no tiene detalle de resolución`, id: t.id, nombre: `${t.type} #${t.id.slice(0, 8)}`, severidad: 'media' })
        }
        if (t.status === 'resolved' && !tiene(t.endDate)) {
          issues.push({ tipo: 'Ticket sin fecha cierre', entidad: 'EquipmentTicket', descripcion: `Resuelto pero sin fecha de cierre — no se puede medir tiempo de respuesta`, id: t.id, nombre: `${t.type} #${t.id.slice(0, 8)}`, severidad: 'media' })
        }
      }
    })

    await audit('reclutamiento', async () => {
      const candidates = await db.candidates.toArray()
      for (const c of candidates) {
        if (!tiene(c.email)) {
          issues.push({ tipo: 'Candidato sin email', entidad: 'Candidate', descripcion: `Falta email de contacto`, id: c.id, nombre: c.name, severidad: 'alta' })
        }
        if (!tiene(c.position)) {
          issues.push({ tipo: 'Candidato sin posición', entidad: 'Candidate', descripcion: `Falta el puesto al que aplica`, id: c.id, nombre: c.name, severidad: 'media' })
        }
        if (c.totalScore === null || c.totalScore === undefined) {
          issues.push({ tipo: 'Candidato sin score', entidad: 'Candidate', descripcion: `No tiene puntuación total — no rankea en reportes`, id: c.id, nombre: c.name, severidad: 'media' })
        }
        if (c.status !== 'pending' && c.status !== 'no_show' && c.status !== 'rejected') {
          const evals = await db.candidateEvaluations.where('candidateId').equals(c.id).toArray()
          if (evals.length === 0) {
            issues.push({ tipo: 'Candidato sin evaluación', entidad: 'Candidate', descripcion: `Estado es "${c.status}" pero no tiene evaluaciones registradas`, id: c.id, nombre: c.name, severidad: 'alta' })
          }
        }
      }
    })

    let filtered = issues.filter((i) => (sevOrder[i.severidad] ?? 0) >= minSev)
    if (soloCriticos) filtered = filtered.filter((i) => i.severidad === 'alta')

    if (filtered.length === 0) {
      return `✅ **Auditoría de datos completa** — No se encontraron inconsistencias en el dominio "${dominio}".`
    }

    const sorted = filtered.sort((a, b) => (sevOrder[b.severidad] ?? 0) - (sevOrder[a.severidad] ?? 0))
    const sliced = sorted.slice(0, limit)

    const totalAlta = filtered.filter((i) => i.severidad === 'alta').length
    const totalMedia = filtered.filter((i) => i.severidad === 'media').length
    const totalBaja = filtered.filter((i) => i.severidad === 'baja').length

    const output: string[] = []
    let lastTipo = ''
    output.push(`🔍 **Auditoría de calidad de datos**`)
    output.push(`_${filtered.length} inconsistencia(s) encontrada(s) en "${dominio}"_`)
    output.push('')

    if (filtered.length > 0) {
      output.push(`**Resumen:** 🔴 ${totalAlta} alta · 🟡 ${totalMedia} media · ⚪ ${totalBaja} baja`)
      output.push('')

      for (const issue of sliced) {
        if (issue.tipo !== lastTipo) {
          if (lastTipo) output.push('')
          const count = filtered.filter((i) => i.tipo === issue.tipo).length
          output.push(`**${issue.tipo}** (${count})`)
          lastTipo = issue.tipo
        }
        const icon = issue.severidad === 'alta' ? '🔴' : issue.severidad === 'media' ? '🟡' : '⚪'
        output.push(`  ${icon} **${issue.nombre}** · ${issue.descripcion} · \`${issue.id.slice(0, 8)}…\``)
      }
    }

    if (filtered.length > limit) {
      output.push(`\n... y ${filtered.length - limit} issue(s) más. Usá filtros para acotar.`)
    }

    output.push('')
    output.push('💡 Usá `auditar_datos({ dominio: "seguridad", soloCriticos: true })` para ver solo los issues más graves de un dominio específico.')

    return output.join('\n')
  },
}
