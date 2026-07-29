import type {
  AiProviderType,
  AiProviderConfig,
  AiToolDefinition,
  AiProviderInterface,
} from '../types'
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
Ayudás a gerentes a consultar datos de gestión en lenguaje natural.

Elegí la herramienta adecuada según lo que pida el usuario. No necesitás enumerar las opciones.`,
  ]

  const tables: string[] = []
  if (permissions.catalogo)
    tables.push(
      'catalogo: applications, technologies, microservices, appDatabases, applicationDependencies',
    )
  if (permissions.seguridad) tables.push('seguridad: vulnerabilities, incidents')
  if (permissions.gobierno) tables.push('gobierno: risks, auditFindings')
  if (permissions.estrategia)
    tables.push('estrategia: objectives, healthIndexHistory, deliverables')
  if (permissions.ejecucion)
    tables.push('ejecucion: plans, activities, tasks, commitments, dependencies, blockers')
  if (permissions.personas)
    tables.push(
      'personas: teams, memberProfiles, sprintRecords, oneOnOnes, achievements, vacationRecords, teamSprints',
    )
  if (permissions.reclutamiento)
    tables.push('reclutamiento: candidates, candidateTechnologies, candidateEvaluations')
  if (permissions.equipamiento)
    tables.push('equipamiento: equipment, equipmentAssignments, equipmentTickets')

  parts.push(
    `DATOS DISPONIBLES:\n${tables.length > 0 ? tables.map((t) => `• ${t}`).join('\n') : '- Ninguno.'}`,
  )

  parts.push(
    `RELACIONES: application↔microservices/vulnerabilities/incidents/risks/findings/databases/dependencies (applicationId) | microservice↔vulnerability/incident/risk/finding/database (M:N junction) | team↔members/plans/objectives/sprints (teamId) | member↔oneOnOnes/achievements/vacations/sprints (memberId) | plan↔activities↔tasks (planId) | businessUnit↔applications/teams/objectives (businessUnitId) | equipment↔assignments/tickets (equipmentId)`,
  )

  parts.push(`INSTRUCCIONES:
- Las herramientas disponibles se autodescubren. Elegí la que mejor se ajuste a cada consulta.
- Preferí buscar_* (búsqueda parcial con acentos) antes que consultar_datos.
- Patrón multi-entidad: buscar_* → consultar_relaciones para profundizar.
- Si un dominio está deshabilitado, sugerí al usuario habilitarlo en Ajustes.
- Si una consulta vuelve vacía, probá términos alternativos o tablas relacionadas.
- Al final indicá brevemente la fuente de los datos.
- **Formato**: español profesional. Subtítulos en **negritas**. Resumen numérico al inicio, detalle después. Máximo 1 emoji por respuesta, solo en el título.`)

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
