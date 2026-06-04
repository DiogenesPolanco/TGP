import { db } from '@/services/db/database'
import type { ReportSection } from './pdfService'

function statusBadge(s: string): string {
  const map: Record<string, string> = {
    open: 'Abierto', in_progress: 'En Progreso', fixed: 'Solucionado',
    accepted: 'Aceptado', resolved: 'Resuelto', active: 'Activo',
    eol: 'EOL', extended: 'S. Extendido', unknown: '?',
    completed: 'Completado', cancelled: 'Cancelado', pending: 'Pendiente',
    on_track: 'Encaminado', at_risk: 'En Riesgo', behind: 'Atrasado',
    achieved: 'Logrado', fulfilled: 'Cumplido', breached: 'Incumplido',
    closed: 'Cerrado', escalated: 'Escalado',
  }
  return map[s] || s
}

/* ─── 1. Obsolescencia de Aplicaciones ─── */

export interface ObsolescenceRow {
  aplicación: string
  tecnología: string
  versión: string
  vendor: string
  estado: string
  eolDate: string
  cvss: string
}

export async function getObsolescenceReport() {
  const [apps, techs, microservices] = await Promise.all([
    db.applications.toArray(),
    db.technologies.toArray(),
    db.microservices.toArray(),
  ])

  const rows: ObsolescenceRow[] = []
  const eolIds = new Set(techs.filter((t) => t.supportStatus === 'eol').map((t) => t.id))

  for (const app of apps) {
    const allTechIds = [...app.technologies]
    const msOfApp = microservices.filter((ms) => ms.applicationId === app.id)
    for (const ms of msOfApp) allTechIds.push(...ms.technologies)

    const uniqueIds = [...new Set(allTechIds)]
    for (const tId of uniqueIds) {
      const t = techs.find((x) => x.id === tId)
      if (!t) continue
      rows.push({
        aplicación: app.name,
        tecnología: t.name,
        versión: t.version,
        vendor: t.vendor,
        estado: statusBadge(t.supportStatus),
        eolDate: t.eolDate ? new Date(t.eolDate).toLocaleDateString('es-ES') : '-',
        cvss: t.cveList.length > 0 ? `${t.cveList.length} CVE` : '0',
      })
    }
  }

  const totalApps = apps.length
  const appsWithEol = new Set(rows.filter((r) => r.estado === 'EOL').map((r) => r.aplicación)).size

  const sections: ReportSection[] = [
    {
      title: 'Tecnologías en uso por aplicación',
      columns: [
        { header: 'Aplicación', dataKey: 'aplicación' },
        { header: 'Tecnología', dataKey: 'tecnología' },
        { header: 'Versión', dataKey: 'versión' },
        { header: 'Vendor', dataKey: 'vendor' },
        { header: 'Estado', dataKey: 'estado', align: 'center' },
        { header: 'EOL Date', dataKey: 'eolDate', align: 'center' },
        { header: 'Vulns', dataKey: 'cvss', align: 'center' },
      ],
      rows,
    },
  ]

  return {
    title: 'Reporte de Obsolescencia Tecnológica',
    filename: `obsolescencia-${Date.now()}.pdf`,
    summary: [
      { label: 'Total Aplicaciones', value: String(totalApps), color: '#2563eb' },
      { label: 'Apps con EOL', value: String(appsWithEol), color: appsWithEol > 0 ? '#dc2626' : '#16a34a' },
      { label: 'Tecnologías EOL', value: String(eolIds.size), color: eolIds.size > 0 ? '#dc2626' : '#16a34a' },
      { label: 'Total Tecnologías', value: String(techs.length), color: '#6366f1' },
    ],
    sections,
  }
}

/* ─── 2. Rendimiento de Miembros ─── */

export async function getPerformanceReport() {
  const [profiles, teams, sprintRecords, teamSprints] = await Promise.all([
    db.memberProfiles.toArray(),
    db.teams.toArray(),
    db.sprintRecords.toArray(),
    db.teamSprints.toArray(),
  ])

  const teamMap = new Map(teams.map((t) => [t.id, t.name]))
  const sprintMap = new Map(sprintRecords.map((s) => [s.memberId, s]))

  const rows = profiles.map((p) => {
    const team = teamMap.get(p.teamId)
    const sp = sprintMap.get(p.id)
    const completedSP = sp?.storyPointsCompleted ?? 0
    const notCompletedSP = sp?.storyPointsNotCompleted ?? 0
    return {
      miembro: p.email,
      equipo: team || '-',
      role: statusBadge(p.role),
      skills: p.skills.length,
      avgSP: String(p.avgStoryPoints),
      spCompletados: String(completedSP),
      spPendientes: String(notCompletedSP),
    }
  })

  const totalTeamSP = teamSprints.reduce((s, ts) => s + (ts.completedSP || 0), 0)

  const sections: ReportSection[] = [
    {
      title: 'Rendimiento de Miembros',
      columns: [
        { header: 'Miembro', dataKey: 'miembro' },
        { header: 'Equipo', dataKey: 'equipo' },
        { header: 'Role', dataKey: 'role', align: 'center' },
        { header: 'Skills', dataKey: 'skills', align: 'center' },
        { header: 'Prom. SP', dataKey: 'avgSP', align: 'center' },
        { header: 'SP Compl.', dataKey: 'spCompletados', align: 'center' },
        { header: 'SP Pend.', dataKey: 'spPendientes', align: 'center' },
      ],
      rows,
    },
  ]

  return {
    title: 'Reporte de Rendimiento de Miembros',
    filename: `rendimiento-${Date.now()}.pdf`,
    summary: [
      { label: 'Total Miembros', value: String(profiles.length), color: '#2563eb' },
      { label: 'Equipos', value: String(teams.length), color: '#6366f1' },
      { label: 'SP Totales (Equipo)', value: String(totalTeamSP), color: '#16a34a' },
      { label: 'Con Registros', value: String(sprintRecords.length), color: '#ca8a04' },
    ],
    sections,
  }
}

/* ─── 3. Incidentes por Aplicación ─── */

export async function getIncidentsReport() {
  const [incidents, apps] = await Promise.all([
    db.incidents.toArray(),
    db.applications.toArray(),
  ])

  const appMap = new Map(apps.map((a) => [a.id, a.name]))
  const byStatus: Record<string, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 }
  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }

  const rows = incidents.map((inc) => {
    byStatus[inc.status] = (byStatus[inc.status] || 0) + 1
    bySeverity[inc.severity] = (bySeverity[inc.severity] || 0) + 1
    const downtime = inc.downtimeMinutes ? `${inc.downtimeMinutes} min` : '-'
    return {
      título: inc.title,
      aplicación: inc.applicationId ? appMap.get(inc.applicationId) || '-' : '-',
      severidad: statusBadge(inc.severity),
      estado: statusBadge(inc.status),
      detectado: inc.detectedAt.toLocaleDateString('es-ES'),
      respondido: inc.respondedAt?.toLocaleDateString('es-ES') || '-',
      resuelto: inc.resolvedAt?.toLocaleDateString('es-ES') || '-',
      downtime,
    }
  })

  const sections: ReportSection[] = [
    {
      title: 'Incidentes Registrados',
      columns: [
        { header: 'Título', dataKey: 'título' },
        { header: 'Aplicación', dataKey: 'aplicación' },
        { header: 'Severidad', dataKey: 'severidad', align: 'center' },
        { header: 'Estado', dataKey: 'estado', align: 'center' },
        { header: 'Detectado', dataKey: 'detectado', align: 'center' },
        { header: 'Respondido', dataKey: 'respondido', align: 'center' },
        { header: 'Resuelto', dataKey: 'resuelto', align: 'center' },
        { header: 'Downtime', dataKey: 'downtime', align: 'center' },
      ],
      rows,
    },
  ]

  return {
    title: 'Reporte de Incidentes',
    filename: `incidentes-${Date.now()}.pdf`,
    summary: [
      { label: 'Total Incidentes', value: String(incidents.length), color: '#2563eb' },
      { label: 'Críticos', value: String(bySeverity.critical), color: '#dc2626' },
      { label: 'Altos', value: String(bySeverity.high), color: '#ea580c' },
      { label: 'Abiertos', value: String(byStatus.open), color: '#ca8a04' },
    ],
    sections,
  }
}

/* ─── 4. Vulnerabilidades por Aplicación ─── */

export async function getVulnerabilitiesReport() {
  const [vulns, apps] = await Promise.all([
    db.vulnerabilities.toArray(),
    db.applications.toArray(),
  ])

  const appMap = new Map(apps.map((a) => [a.id, a.name]))
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  const byStatus = { open: 0, in_progress: 0, fixed: 0, accepted: 0 }

  const rows = vulns.map((v) => {
    bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1
    byStatus[v.status] = (byStatus[v.status] || 0) + 1
    return {
      título: v.title,
      aplicación: v.applicationId ? appMap.get(v.applicationId) || '-' : '-',
      severidad: statusBadge(v.severity),
      cvss: v.cvssScore.toFixed(1),
      estado: statusBadge(v.status),
      fuente: v.source,
      detectado: v.detectedAt.toLocaleDateString('es-ES'),
      sla: v.slaDeadline.toLocaleDateString('es-ES'),
    }
  })

  const sections: ReportSection[] = [
    {
      title: 'Vulnerabilidades Registradas',
      columns: [
        { header: 'Título', dataKey: 'título' },
        { header: 'Aplicación', dataKey: 'aplicación' },
        { header: 'Severidad', dataKey: 'severidad', align: 'center' },
        { header: 'CVSS', dataKey: 'cvss', align: 'center' },
        { header: 'Estado', dataKey: 'estado', align: 'center' },
        { header: 'Fuente', dataKey: 'fuente', align: 'center' },
        { header: 'Detectado', dataKey: 'detectado', align: 'center' },
        { header: 'SLA', dataKey: 'sla', align: 'center' },
      ],
      rows,
    },
  ]

  return {
    title: 'Reporte de Vulnerabilidades',
    filename: `vulnerabilidades-${Date.now()}.pdf`,
    summary: [
      { label: 'Total Vulnerabilidades', value: String(vulns.length), color: '#2563eb' },
      { label: 'Críticas', value: String(bySeverity.critical), color: '#dc2626' },
      { label: 'Altas', value: String(bySeverity.high), color: '#ea580c' },
      { label: 'Abiertas', value: String(byStatus.open), color: '#ca8a04' },
    ],
    sections,
  }
}

/* ─── 5. Predictibilidad de Sprints ─── */

export async function getSprintPredictabilityReport() {
  const [teamSprints, teams] = await Promise.all([
    db.teamSprints.toArray(),
    db.teams.toArray(),
  ])

  const teamMap = new Map(teams.map((t) => [t.id, t.name]))

  const rows = teamSprints.map((ts) => {
    const predictability = ts.plannedSP > 0
      ? Math.round((ts.completedSP / ts.plannedSP) * 100)
      : 0
    return {
      equipo: teamMap.get(ts.teamId) || '-',
      sprint: ts.sprintName,
      quarter: ts.quarter,
      year: String(ts.year),
      planificados: String(ts.plannedSP),
      completados: String(ts.completedSP),
      noCompletados: String(ts.notCompletedSP),
      predictabilidad: `${predictability}%`,
    }
  })

  const avgPredictability = teamSprints.length > 0
    ? Math.round(teamSprints.reduce((s, ts) => {
      const pct = ts.plannedSP > 0 ? (ts.completedSP / ts.plannedSP) * 100 : 0
      return s + pct
    }, 0) / teamSprints.length)
    : 0

  const sections: ReportSection[] = [
    {
      title: 'Predictibilidad de Sprints',
      columns: [
        { header: 'Equipo', dataKey: 'equipo' },
        { header: 'Sprint', dataKey: 'sprint' },
        { header: 'Q', dataKey: 'quarter', align: 'center' },
        { header: 'Año', dataKey: 'year', align: 'center' },
        { header: 'SP Planif.', dataKey: 'planificados', align: 'center' },
        { header: 'SP Compl.', dataKey: 'completados', align: 'center' },
        { header: 'SP Pend.', dataKey: 'noCompletados', align: 'center' },
        { header: 'Predictib.', dataKey: 'predictabilidad', align: 'center' },
      ],
      rows,
    },
  ]

  const totalPlanned = teamSprints.reduce((s, ts) => s + (ts.plannedSP || 0), 0)
  const totalCompleted = teamSprints.reduce((s, ts) => s + (ts.completedSP || 0), 0)

  return {
    title: 'Reporte de Predictibilidad de Sprints',
    filename: `predictibilidad-${Date.now()}.pdf`,
    summary: [
      { label: 'Total Sprints', value: String(teamSprints.length), color: '#2563eb' },
      { label: 'SP Planif.', value: String(totalPlanned), color: '#6366f1' },
      { label: 'SP Compl.', value: String(totalCompleted), color: '#16a34a' },
      { label: 'Predict. Prom.', value: `${avgPredictability}%`, color: avgPredictability >= 80 ? '#16a34a' : avgPredictability >= 60 ? '#ca8a04' : '#dc2626' },
    ],
    sections,
  }
}

/* ─── 6. Riesgos ─── */

export async function getRisksReport() {
  const [risks, apps] = await Promise.all([
    db.risks.toArray(),
    db.applications.toArray(),
  ])

  const appMap = new Map(apps.map((a) => [a.id, a.name]))

  const rows = risks.map((r) => ({
    título: r.title,
    aplicación: r.applicationId ? appMap.get(r.applicationId) || '-' : '-',
    categoría: r.category,
    probabilidad: `${r.probability}/5`,
    impacto: `${r.impact}/5`,
    score: String(r.riskScore),
    estado: statusBadge(r.status),
    vence: r.targetDate ? r.targetDate.toLocaleDateString('es-ES') : '-',
  }))

  const byStatus: Record<string, number> = { open: 0, in_progress: 0, mitigated: 0, closed: 0 }
  risks.forEach((r) => { byStatus[r.status] = (byStatus[r.status] || 0) + 1 })

  const sections: ReportSection[] = [
    {
      title: 'Riesgos Registrados',
      columns: [
        { header: 'Título', dataKey: 'título' },
        { header: 'Aplicación', dataKey: 'aplicación' },
        { header: 'Categoría', dataKey: 'categoría' },
        { header: 'Prob.', dataKey: 'probabilidad', align: 'center' },
        { header: 'Impacto', dataKey: 'impacto', align: 'center' },
        { header: 'Score', dataKey: 'score', align: 'center' },
        { header: 'Estado', dataKey: 'estado', align: 'center' },
        { header: 'Vencimiento', dataKey: 'vence', align: 'center' },
      ],
      rows,
    },
  ]

  const highRiskCount = risks.filter((r) => r.riskScore >= 15).length

  return {
    title: 'Reporte de Riesgos',
    filename: `riesgos-${Date.now()}.pdf`,
    summary: [
      { label: 'Total Riesgos', value: String(risks.length), color: '#2563eb' },
      { label: 'Riesgo Alto (15+)', value: String(highRiskCount), color: highRiskCount > 0 ? '#dc2626' : '#16a34a' },
      { label: 'Abiertos', value: String(byStatus.open || 0), color: '#ca8a04' },
      { label: 'Mitigados', value: String(byStatus.mitigated || 0), color: '#16a34a' },
    ],
    sections,
  }
}

/* ─── 7. Auditorías ─── */

export async function getAuditReport() {
  const [findings, apps] = await Promise.all([
    db.auditFindings.toArray(),
    db.applications.toArray(),
  ])

  const appMap = new Map(apps.map((a) => [a.id, a.name]))

  const rows = findings.map((f) => ({
    título: f.title,
    aplicación: f.applicationId ? appMap.get(f.applicationId) || '-' : '-',
    severidad: statusBadge(f.severity),
    categoría: f.category,
    estado: statusBadge(f.status),
    vence: f.dueDate.toLocaleDateString('es-ES'),
    acciones: f.actionPlan ? f.actionPlan.items.length : 0,
  }))

  const overdue = findings.filter((f) => f.status !== 'closed' && f.dueDate < new Date())

  const sections: ReportSection[] = [
    {
      title: 'Hallazgos de Auditoría',
      columns: [
        { header: 'Título', dataKey: 'título' },
        { header: 'Aplicación', dataKey: 'aplicación' },
        { header: 'Severidad', dataKey: 'severidad', align: 'center' },
        { header: 'Categoría', dataKey: 'categoría' },
        { header: 'Estado', dataKey: 'estado', align: 'center' },
        { header: 'Vence', dataKey: 'vence', align: 'center' },
        { header: 'Acciones', dataKey: 'acciones', align: 'center' },
      ],
      rows,
    },
  ]

  return {
    title: 'Reporte de Auditoría',
    filename: `auditoria-${Date.now()}.pdf`,
    summary: [
      { label: 'Total Hallazgos', value: String(findings.length), color: '#2563eb' },
      { label: 'Vencidos', value: String(overdue.length), color: overdue.length > 0 ? '#dc2626' : '#16a34a' },
      { label: 'Abiertos', value: String(findings.filter((f) => f.status !== 'closed').length), color: '#ca8a04' },
      { label: 'Con Plan de Acción', value: String(findings.filter((f) => f.actionPlan).length), color: '#6366f1' },
    ],
    sections,
  }
}

/* ─── 8. Entregables ─── */

export async function getDeliverablesReport() {
  const [deliverables, apps] = await Promise.all([
    db.deliverables.toArray(),
    db.applications.toArray(),
  ])

  const appMap = new Map(apps.map((a) => [a.id, a.name]))

  const overdueCount = deliverables.filter(
    (d) => d.status !== 'completed' && d.status !== 'cancelled' && d.dueDate && d.dueDate < new Date(),
  ).length

  const rows = deliverables.map((d) => ({
    título: d.title,
    aplicación: d.applicationId ? appMap.get(d.applicationId) || '-' : '-',
    estado: statusBadge(d.status),
    vence: d.dueDate ? d.dueDate.toLocaleDateString('es-ES') : '-',
  }))

  const sections: ReportSection[] = [
    {
      title: 'Entregables',
      columns: [
        { header: 'Título', dataKey: 'título' },
        { header: 'Aplicación', dataKey: 'aplicación' },
        { header: 'Estado', dataKey: 'estado', align: 'center' },
        { header: 'Vencimiento', dataKey: 'vence', align: 'center' },
      ],
      rows,
    },
  ]

  return {
    title: 'Reporte de Entregables',
    filename: `entregables-${Date.now()}.pdf`,
    summary: [
      { label: 'Total Entregables', value: String(deliverables.length), color: '#2563eb' },
      { label: 'Completados', value: String(deliverables.filter((d) => d.status === 'completed').length), color: '#16a34a' },
      { label: 'Pendientes', value: String(deliverables.filter((d) => d.status !== 'completed' && d.status !== 'cancelled').length), color: '#ca8a04' },
      { label: 'Vencidos', value: String(overdueCount), color: overdueCount > 0 ? '#dc2626' : '#16a34a' },
    ],
    sections,
  }
}
