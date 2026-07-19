import type { AiProviderType, AiProviderConfig, AiToolDefinition, AiProviderInterface } from '../types'
import { createOllamaProvider } from './providers/ollama'
import { createGroqProvider } from './providers/groq'
import { createOpenAiProvider } from './providers/openai'

export function createProvider(config: AiProviderConfig): AiProviderInterface {
  const providers: Record<AiProviderType, (cfg: AiProviderConfig) => AiProviderInterface> = {
    ollama: createOllamaProvider,
    groq: createGroqProvider,
    openai: createOpenAiProvider,
    anthropic: createOpenAiProvider,
  }
  const factory = providers[config.provider]
  if (!factory) throw new Error(`Provider not supported: ${config.provider}`)
  return factory(config)
}

export function buildSystemPrompt(permissions: AiProviderConfig['dataPermissions']): string {
  const sections: string[] = []
  const genericDomains: string[] = []

  if (permissions.catalogo) {
    genericDomains.push('catalogo')
    sections.push(`• **Catálogo** — applications (id, businessUnitId, name, description, ownerId, ownerName, criticality: critical/high/medium/low, architecture: microservices/monolithic/soa/hybrid, status: active/inactive/retired/under_development, supportEndDate, technologies[], metadata, createdAt, updatedAt), technologies (id, name, version, category: language/framework/database/tool/platform, vendor, eolDate, supportStatus: active/limited/eol, cveList[], createdAt), microservices (id, applicationId, name, description, technologies[], lifecycleStatus: active/evolving/deprecated/decommissioned/planned, documentation, features[], roadmap[], decommissionPlan, technicalLead, repository, serviceLevel: critical/high/medium/low, createdAt, updatedAt), appDatabases (id, applicationId, name, description, engine, version, dbType: relational/document/key-value/graph/time-series/search/cache/message_queue/vector/other, environment: development/staging/production/disaster_recovery, technologies[], microserviceIds[], host, port, isManaged, createdAt, updatedAt), applicationDependencies (id, applicationId, dependsOnAppId, dependencyType: hard/soft/event/internal, criticality, description, createdAt)`)
  }
  if (permissions.seguridad) {
    genericDomains.push('seguridad')
    sections.push(`• **Seguridad** — vulnerabilities (id, applicationId, externalId, title, description, cvssScore, severity: critical/high/medium/low, source: automatic/manual/external/audit, status: open/in_progress/resolved/false_positive/accepted_risk, slaDeadline, detectedAt, fixedAt, metadata, createdAt, updatedAt), incidents (id, applicationId, externalId, title, description, severity, status: open/in_progress/resolved/closed, detectedAt, respondedAt, resolvedAt, downtimeMinutes, rca, metadata, createdAt, updatedAt)`)
  }
  if (permissions.gobierno) {
    genericDomains.push('gobierno')
    sections.push(`• **Gobierno** — risks (id, applicationId, businessUnitId, title, description, category: strategic/operational/financial/compliance/security, probability, impact, riskScore, mitigationPlan, status: open/mitigated/accepted/transferred/closed, targetDate, metadata, createdAt, updatedAt), auditFindings (id, applicationId, auditReference, title, description, severity, category: security/compliance/operational/strategic, status: open/in_progress/resolved, dueDate, evidence[], actionPlan, metadata, createdAt, updatedAt)`)
  }
  if (permissions.estrategia) {
    sections.push(`• **Estrategia** — objectives (id, teamId, businessUnitId, title, description, type: okr/kpi/project, periodStart, periodEnd, progress %, status: on_track/at_risk/behind/achieved/not_started, keyResults[]: [{id, title, measure, baseline, target, current, status: on_track/at_risk/behind/achieved/not_started}], metadata, createdAt, updatedAt), healthIndexHistory (id, businessUnitId, tenantId, deliveryScore, qualityScore, securityScore, availabilityScore, obsolescenceScore, riskScore, complianceScore, overallScore, weights, calculatedAt, trend: up/down/stable), deliverables (id, applicationId, title, description, dueDate, status: pending/in_progress/completed/delayed/cancelled, objectiveId, createdAt, updatedAt)`)
  }
  if (permissions.ejecucion) {
    sections.push(`• **Ejecución** — plans (id, title, description, teamId, businessUnitId, objectiveId, status: planned/in_progress/completed/cancelled/on_hold, health: on_track/at_risk/behind, startDate, endDate, metadata, createdAt, updatedAt), activities (id, planId, parentActivityId, title, description, assigneeId, teamId, applicationId, priority, status: pending/in_progress/completed/delayed/cancelled, estimatedHours, actualHours, plannedPoints, completedPoints, sortOrder, startDate, dueDate, completedAt, metadata, createdAt, updatedAt), tasks (id, activityId, planId, title, description, assigneeId, status: todo/in_progress/done/blocked/cancelled, priority: low/medium/high/critical, estimatedHours, dueDate, completedAt, dependsOn[], sortOrder, metadata, createdAt, updatedAt), commitments (id, title, description, ownerId, accountableId, teamId, applicationId, objectiveId, deliverableId, status: active/at_risk/breached/fulfilled/cancelled, commitmentDate, fulfilledAt, metadata, createdAt, updatedAt), dependencies (id, sourceType, sourceId, targetType, targetId, relationType: blocks/depends_on/related_to/synced_with, description, status: active/resolved/at_risk, expectedResolutionDate, metadata, createdAt, updatedAt), blockers (id, sourceType: task/activity/plan/commitment, sourceId, title, description, severity: blocker/critical/major/minor, status: open/acknowledged/in_progress/resolved, raisedById, assigneeId, escalatedAt, resolvedAt, resolutionNotes, metadata, createdAt, updatedAt)`)
  }
  if (permissions.personas) {
    sections.push(`• **Personas** — teams (id, businessUnitId, name, sourceSystem: jira/azure/github/internal, externalId, members[]: [{id, userPrincipal, displayName, role, allocationPct, status}], currentMetrics: {velocity, leadTimeHours, cycleTimeHours, throughput, deploymentFrequency, changeFailureRate, mttrHours}, metadata, createdAt, updatedAt), memberProfiles (id, teamId, displayName, email, phone, role: developer/tl/po/sm/qa/designer/devops/other, skills[], timezone, startDate, createdAt, updatedAt), sprintRecords (id, memberId, sprintName, year, quarter, plannedSP, completedSP), oneOnOnes (id, memberId, date, mood, summary, actionItems), achievements (id, memberId, type: certification/award/completion/milestone/other, date, description), vacationRecords (id, memberId, startDate, endDate, type: vacation/sick/Personal/other), teamSprints (id, teamId, sprintName, year, quarter)`)
  }
  if (permissions.reclutamiento) {
    genericDomains.push('reclutamiento')
    sections.push(`• **Reclutamiento** — candidates (id, name, email, phone, position, status: new/screening/interviewing/offered/hired/rejected/no_show, teamId, interviewDate, comments, totalScore, createdAt, updatedAt), candidateTechnologies (id, candidateId, name, points), candidateEvaluations (id, candidateId, category: technical_knowledge/experience/communication/attitude/problem_solving/teamwork/leadership, points)`)
  }
  if (permissions.equipamiento) {
    genericDomains.push('equipamiento')
    sections.push(`• **Equipamiento** — equipment (id, type: laptop/monitor/phone/mouse/headphones/chair/keyboard/desk_stand/other, brand, model, serialNumber, status: available/assigned/maintenance/retired/obsolete, condition: excellent/good/fair/poor, assignedTo, assignmentType, purchaseDate, warrantyExpiry, lastMaintenanceDate, costCenter, businessUnitId, notes, createdAt, updatedAt), equipmentAssignments (id, equipmentId, assignedTo, assignedAt, returnedAt, conditionAtAssignment, conditionAtReturn, notes), equipmentTickets (id, equipmentId, requesterId, assigneeId, type: replacement/repair/new, status: open/in_progress/resolved/closed, jiraTicketId, jiraTicketLink, priority: low/medium/high/critical, description, resolution, startDate, endDate, createdAt, updatedAt)`)
  }

  // Junction tables (M:N microservicios) — solo si catálogo + el dominio correspondiente están habilitados
  const junctionTables: string[] = []
  if (permissions.catalogo && permissions.seguridad) {
    junctionTables.push('vulnerabilityMicroservices (vulnerabilityId ↔ microserviceId) incidencias vinculadas a microservicios')
    junctionTables.push('incidentMicroservices (incidentId ↔ microserviceId) incidentes vinculados a microservicios')
  }
  if (permissions.catalogo && permissions.gobierno) {
    junctionTables.push('auditFindingMicroservices (auditFindingId ↔ microserviceId) hallazgos vinculados a microservicios')
    junctionTables.push('riskMicroservices (riskId ↔ microserviceId) riesgos vinculados a microservicios')
  }
  if (permissions.catalogo) {
    junctionTables.push('appDatabaseMicroservices (appDatabaseId ↔ microserviceId) bases de datos vinculadas a microservicios')
  }
  const junctionSection = junctionTables.length > 0
    ? `\n• **Relaciones M:N (microservicios)** — ${junctionTables.join('; ')}`
    : ''

  const genericAvailable = genericDomains.length > 0
    ? `\n\n📋 **Consulta genérica**: usá \`consultar_datos\` para consultar tablas de: ${genericDomains.join(', ')}. Filtrá con \`where: { campo: valor }\`, buscá texto con \`q: "término"\` (búsqueda parcial case-insensitive en todos los campos), ordená con \`orderBy\`/ \`orderDir\`, limitá con \`limit\` (max 100).`
    : ''

  return `Eres un asistente de gerencia integrado en TGP (Plataforma de Gobierno Tecnológico).
Tu rol es ayudar a gerentes a consultar datos de gestión en lenguaje natural.

DATOS DISPONIBLES:
${sections.length > 0 ? sections.join('\n') : '- Ninguno.'}${junctionSection}${genericAvailable}

📖 **Para descubrir la estructura exacta de cualquier tabla**, usá \`explorar_esquema\` — te devuelve todos los campos, tipos y un ejemplo de valores.

🔗 **Para obtener una entidad con TODOS sus datos relacionados**, usá \`consultar_relaciones\` — trae la entidad + todo lo que depende de ella (microservicios, vulnerabilidades, incidentes, riesgos, hallazgos, tareas, etc.).

RELACIONES CLAVE ENTRE TABLAS (usalas para armar consultas en múltiples tablas):
- application ↔ microservices (applicationId)
- application ↔ vulnerabilities/incidents/risks/auditFindings (applicationId)
- application ↔ appDatabases (applicationId)
- application ↔ applicationDependencies (applicationId / dependsOnAppId)
- application ↔ deliverables/commitments (applicationId)
- microservice ↔ M:N ↔ vulnerability/incident/risk/auditFinding/appDatabase (junction tables)
- vulnerability/incident ↔ M:N ↔ microservices (relación inversa)
- risk/auditFinding ↔ M:N ↔ microservices (relación inversa)
- team ↔ memberProfiles/plans/objectives/commitments/sprints (teamId)
- memberProfile ↔ oneOnOnes/achievements/vacationRecords/sprintRecords (memberId)
- user ↔ tasks/commitments/blockers/activities (assigneeId/ownerId/memberId)
- user ↔ oneOnOnes/achievements/vacationRecords/sprintRecords (memberId)
- plan ↔ activities/tasks (planId)
- activity ↔ tasks (activityId)
- businessUnit ↔ applications/teams/objectives/risks/healthIndex/plans (businessUnitId)
- equipment ↔ equipmentAssignments/equipmentTickets (equipmentId)

TOOLS ESPECIALIZADAS:
- buscar_aplicacion / buscar_microservicio / buscar_tecnologia / buscar_bd → catálogo
- buscar_vulnerabilidad / buscar_incidente → seguridad
- buscar_riesgo / buscar_hallazgo → gobierno
- consultar_objetivos / consultar_planes → estrategia
- consultar_compromisos / consultar_tareas → ejecución
- buscar_persona / consultar_equipos / consultar_sprints → personas
- buscar_candidato → reclutamiento
- buscar_equipamiento → equipamiento
- consultar_datos → cualquier tabla con filtros where/q/orderBy
- explorar_esquema → ver campos exactos de cualquier tabla
- consultar_relaciones → obtener entidad + todos sus datos vinculados

FORMATO DE RESPUESTA:
1. Respondé SIEMPRE en español, tono profesional y directo
2. NO uses emojis al inicio de cada línea ni como bullets
3. Usá listas con guiones (-) o numeradas (1.) con markdown limpio
4. Separá secciones con líneas en blanco
5. Números y totales claros: "7 desarrolladores" no "7 👨‍💻"
6. Subtítulos con **negritas** no emojis
7. Cada respuesta: resumen numérico al inicio, detalle estructurado después
8. Máximo un emoji por respuesta, solo al inicio del título

INSTRUCCIONES:
- **Patrón principal para consultas complejas multi-entidad**: buscá con \`buscar_*\` → después expandí con \`consultar_relaciones\`. Ej: \`buscar_persona("Juan")\` → \`consultar_relaciones("users", id)\` → \`buscar_equipamiento("Juan")\` → \`consultar_relaciones("equipment", id)\`. Así respondés preguntas como "¿Juan necesita cambio de computadora?" en un solo flujo.
- \`consultar_relaciones\` es tu mejor aliado: trae una entidad + TODAS sus relaciones en una llamada.
- Preferí \`explorar_esquema\` antes de consultar_datos si no conocés los campos exactos.
- **Usá los tools de búsqueda dedicados primero** antes de recurrir a \`consultar_datos\`:
  \`buscar_aplicacion\`, \`buscar_microservicio\`, \`buscar_tecnologia\`, \`buscar_bd\`, \`buscar_vulnerabilidad\`, \`buscar_incidente\`, \`buscar_riesgo\`, \`buscar_hallazgo\`, \`buscar_persona\`, \`buscar_candidato\`, \`buscar_equipamiento\`, \`buscar_negocio\`
  Cada uno busca en los campos relevantes de esa entidad con soporte de acentos.
- **Si una consulta devuelve vacío, no te rindas.** Consultá tablas alternativas relacionadas antes de concluir "no hay datos". Fallbacks:
  - **Personas**: si sprintRecords vacío → probá oneOnOnes, achievements, vacationRecords, activities/tasks/commitments
  - **Seguridad**: si vulnerabilities vacío → probá incidents, risks, auditFindings
  - **Gobierno**: si risks vacío → probá auditFindings, commitments
  - **Ejecución**: si plans/activities vacío → probá commitments, blockers, dependencies
  - **Catálogo**: si microservices vacío → probá technologies, appDatabases, dependencies
  - **Equipamiento**: si equipment vacío para una persona → verificá que el nombre esté bien en assignedTo
- Si el usuario pregunta por un dominio deshabilitado, sugerí habilitarlo en Ajustes
- Si hay items urgentes o vencidos, mencionalos en texto plano
- Al final indicá brevemente la fuente de los datos`
}

export function buildToolDefinitions(tools: AiToolDefinition[]): unknown[] {
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }))
}
