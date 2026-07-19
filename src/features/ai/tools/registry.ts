import type { AiToolDefinition, AiProviderConfig } from '../types'
import { compromisosTool, tareasTool } from './compromisos'
import { objetivosTool, planesTool } from './objetivos'
import { equiposTool, sprintsTool, buscarPersonaTool } from './equipo'
import { createConsultarDatosTool } from './consultar-datos'
import { explorarEsquemaTool, consultarRelacionesTool } from './schema'
import {
  buscarAplicacionTool,
  buscarMicroservicioTool,
  buscarTecnologiaTool,
  buscarBDTool,
  buscarVulnerabilidadTool,
  buscarIncidenteTool,
  buscarRiesgoTool,
  buscarHallazgoTool,
  buscarEquipamientoTool,
  buscarCandidatoTool,
  buscarNegocioTool,
} from './buscadores'

const SPECIALIZED_TOOLS: AiToolDefinition[] = [
  compromisosTool,
  tareasTool,
  objetivosTool,
  planesTool,
  equiposTool,
  sprintsTool,
  buscarPersonaTool,
  buscarAplicacionTool,
  buscarMicroservicioTool,
  buscarTecnologiaTool,
  buscarBDTool,
  buscarVulnerabilidadTool,
  buscarIncidenteTool,
  buscarRiesgoTool,
  buscarHallazgoTool,
  buscarEquipamientoTool,
  buscarCandidatoTool,
  buscarNegocioTool,
  explorarEsquemaTool,
  consultarRelacionesTool,
]

// Mapping de cada dominio a las tools especializadas que habilita.
const PERMISSION_TO_TOOL: Record<keyof AiProviderConfig['dataPermissions'], string[]> = {
  catalogo: ['buscar_aplicacion', 'buscar_microservicio', 'buscar_tecnologia', 'buscar_bd'],
  seguridad: ['buscar_vulnerabilidad', 'buscar_incidente'],
  gobierno: ['buscar_riesgo', 'buscar_hallazgo'],
  estrategia: ['consultar_objetivos'],
  ejecucion: ['consultar_compromisos', 'consultar_tareas', 'consultar_planes'],
  personas: ['consultar_equipos', 'consultar_sprints', 'buscar_persona'],
  reclutamiento: ['buscar_candidato'],
  equipamiento: ['buscar_equipamiento'],
}

/**
 * Retorna las tools habilitadas según los permisos del usuario.
 * - Tools especializadas para los dominios que las tienen (estrategia, ejecucion, personas)
 * - Tool genérica `consultar_datos` para dominios sin tools especializadas (catalogo, seguridad, gobierno, reclutamiento, equipamiento)
 */
export function getEnabledTools(permissions: AiProviderConfig['dataPermissions']): AiToolDefinition[] {
  const enabledNames = new Set<string>()

  for (const [perm, names] of Object.entries(PERMISSION_TO_TOOL)) {
    if (permissions[perm as keyof AiProviderConfig['dataPermissions']]) {
      for (const name of names) {
        enabledNames.add(name)
      }
    }
  }

  const tools: AiToolDefinition[] = SPECIALIZED_TOOLS.filter((t) => enabledNames.has(t.name))

  // Agregar tool genérica para dominios que la necesitan (sin tools especializadas)
  const needsGenericTool =
    permissions.catalogo || permissions.seguridad || permissions.gobierno ||
    permissions.reclutamiento || permissions.equipamiento

  if (needsGenericTool) {
    tools.push(createConsultarDatosTool(permissions))
  }

  return tools
}
