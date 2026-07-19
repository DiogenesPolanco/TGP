import type { AiProviderType, AiProviderConfig, AiToolDefinition, AiProviderInterface } from '../types'
import { createOllamaProvider } from './providers/ollama'
import { createGroqProvider } from './providers/groq'
import { createOpenAiProvider } from './providers/openai'
import { createAnthropicProvider } from './providers/anthropic'

export function createProvider(config: AiProviderConfig): AiProviderInterface {
  const providers: Record<AiProviderType, (cfg: AiProviderConfig) => AiProviderInterface> = {
    ollama: createOllamaProvider,
    groq: createGroqProvider,
    openai: createOpenAiProvider,
    anthropic: createAnthropicProvider,
  }
  const factory = providers[config.provider]
  if (!factory) throw new Error(`Provider not supported: ${config.provider}`)
  return factory(config)
}

export function buildSystemPrompt(permissions: AiProviderConfig['dataPermissions']): string {
  const parts: string[] = [
    `Eres un asistente de gerencia integrado en TGP (Plataforma de Gobierno Tecnológico).
Ayudás a gerentes a consultar datos de gestión en lenguaje natural.`,
  ]

  // ── Tablas disponibles (solo nombre + joins clave) ──
  const tables: string[] = []
  if (permissions.catalogo) tables.push('catalogo: applications, technologies, microservices, appDatabases, applicationDependencies')
  if (permissions.seguridad) tables.push('seguridad: vulnerabilities, incidents')
  if (permissions.gobierno) tables.push('gobierno: risks, auditFindings')
  if (permissions.estrategia) tables.push('estrategia: objectives, healthIndexHistory, deliverables')
  if (permissions.ejecucion) tables.push('ejecucion: plans, activities, tasks, commitments, dependencies, blockers')
  if (permissions.personas) tables.push('personas: teams, memberProfiles, sprintRecords, oneOnOnes, achievements, vacationRecords, teamSprints')
  if (permissions.reclutamiento) tables.push('reclutamiento: candidates, candidateTechnologies, candidateEvaluations')
  if (permissions.equipamiento) tables.push('equipamiento: equipment, equipmentAssignments, equipmentTickets')

  parts.push(`DATOS DISPONIBLES:\n${tables.length > 0 ? tables.map(t => `• ${t}`).join('\n') : '- Ninguno.'}`)

  // ── Joins clave (compacto) ──
  parts.push(`RELACIONES: application↔microservices/vulnerabilities/incidents/risks/findings/databases/dependencies (applicationId) | microservice↔vulnerability/incident/risk/finding/database (M:N junction) | team↔members/plans/objectives/sprints (teamId) | member↔oneOnOnes/achievements/vacations/sprints (memberId) | plan↔activities↔tasks (planId) | businessUnit↔applications/teams/objectives (businessUnitId) | equipment↔assignments/tickets (equipmentId)`)

  // ── Herramientas principales ──
  parts.push(`HERRAMIENTAS:
- Usá \`explorar_esquema\` para ver campos exactos de cualquier tabla (SIEMPRE ante la duda)
- Usá \`consultar_relaciones\` para obtener una entidad + todo lo vinculado
- Usá \`buscar_*\` (aplicacion, microservicio, tecnologia, vulnerabilidad, incidente, riesgo, hallazgo, persona, candidato, equipamiento) para búsquedas parciales con acentos
- Usá \`consultar_datos(table, where, q, limit, orderBy)\` para consultas sobre cualquier tabla
- Tools de dominio: consultar_compromisos, consultar_tareas, consultar_planes, consultar_equipos, consultar_sprints, consultar_objetivos`)

  // ── Fallbacks cuando una consulta devuelve vacío ──
  parts.push(`SI VACÍO: personas→probá oneOnOnes/achievements/vacations | seguridad→incidents/risks | gobierno→findings/commitments | ejecución→commitments/blockers | catálogo→technologies/databases | equipamiento→verificá nombre en assignedTo`)

  // ── Formato de respuesta ──
  parts.push(`FORMATO: español, profesional, sin emojis como bullets. Subtítulos en **negritas**. Resumen numérico al inicio, detalle después. Máximo 1 emoji por respuesta, solo en título.`)

  // ── Instrucciones ──
  parts.push(`INSTRUCCIONES:
- Patrón multi-entidad: buscar_* → consultar_relaciones
- Preferí buscar_* antes que consultar_datos
- Si dominio deshabilitado, sugerí habilitarlo en Ajustes
- Items urgentes/vencidos: mencionálos en texto plano
- Al final indicá brevemente la fuente de los datos`)

  return parts.join('\n\n')
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
