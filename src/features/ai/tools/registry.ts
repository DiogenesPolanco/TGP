import type { AiToolDefinition, AiProviderConfig } from '../types'
import { compromisosTool, tareasTool } from './compromisos'
import { objetivosTool, planesTool } from './objetivos'
import { equiposTool, sprintsTool, buscarPersonaTool } from './equipo'
import { createConsultarDatosTool } from './consultar-datos'
import { explorarEsquemaTool, consultarRelacionesTool } from './schema'

const SPECIALIZED_TOOLS: AiToolDefinition[] = [
  compromisosTool,
  tareasTool,
  objetivosTool,
  planesTool,
  equiposTool,
  sprintsTool,
  buscarPersonaTool,
  explorarEsquemaTool,
  consultarRelacionesTool,
]

// Mapping de cada dominio a las tools especializadas que habilita.
// Los dominios sin tools especializadas usan la tool genérica consultar_datos
// para acceder a sus tablas mediante la función createConsultarDatosTool().
const PERMISSION_TO_TOOL: Record<keyof AiProviderConfig['dataPermissions'], string[]> = {
  catalogo: [],
  seguridad: [],
  gobierno: [],
  estrategia: ['consultar_objetivos'],
  ejecucion: ['consultar_compromisos', 'consultar_tareas', 'consultar_planes'],
  personas: ['consultar_equipos', 'consultar_sprints', 'buscar_persona'],
  reclutamiento: [],
  equipamiento: [],
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
