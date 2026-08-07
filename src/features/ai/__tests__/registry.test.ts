import { describe, it, expect } from 'vitest'
import { getEnabledTools } from '../tools/registry'
import type { AiProviderConfig } from '../types'

type Perms = AiProviderConfig['dataPermissions']

const basePerms = (overrides: Partial<Perms> = {}): Perms => ({
  catalogo: false,
  seguridad: false,
  gobierno: false,
  estrategia: false,
  ejecucion: false,
  personas: false,
  reclutamiento: false,
  equipamiento: false,
  finops: false,
  ...overrides,
})

function names(perms: Perms): string[] {
  return getEnabledTools(perms).map((t) => t.name)
}

describe('getEnabledTools', () => {
  it('returns no tools when no permission is enabled', () => {
    expect(names(basePerms())).toEqual([])
  })

  it('enables catalogo specialized tools and the generic consultar_datos', () => {
    const toolNames = names(basePerms({ catalogo: true }))
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'buscar_aplicacion',
        'buscar_microservicio',
        'buscar_tecnologia',
        'buscar_bd',
        'consultar_dependencias',
        'consultar_obsolescencia',
        'consultar_datos',
      ]),
    )
  })

  it('enables seguridad tools and generic tool', () => {
    const toolNames = names(basePerms({ seguridad: true }))
    expect(toolNames).toEqual(
      expect.arrayContaining(['buscar_vulnerabilidad', 'buscar_incidente', 'consultar_datos']),
    )
  })

  it('enables gobierno tools and generic tool', () => {
    const toolNames = names(basePerms({ gobierno: true }))
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'buscar_riesgo',
        'buscar_hallazgo',
        'auditar_datos',
        'consultar_datos',
      ]),
    )
  })

  it('enables estrategia specialized tools without the generic tool', () => {
    const toolNames = names(basePerms({ estrategia: true }))
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'consultar_objetivos',
        'consultar_indicadores',
        'consultar_health_index',
      ]),
    )
    expect(toolNames).not.toContain('consultar_datos')
  })

  it('enables ejecucion specialized tools without the generic tool', () => {
    const toolNames = names(basePerms({ ejecucion: true }))
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'consultar_compromisos',
        'consultar_tareas',
        'consultar_planes',
        'consultar_bloqueos',
      ]),
    )
    expect(toolNames).not.toContain('consultar_datos')
  })

  it('enables personas specialized tools without the generic tool', () => {
    const toolNames = names(basePerms({ personas: true }))
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'consultar_equipos',
        'consultar_sprints',
        'buscar_persona',
        'consultar_persona',
      ]),
    )
    expect(toolNames).not.toContain('consultar_datos')
  })

  it('enables reclutamiento tools and generic tool', () => {
    const toolNames = names(basePerms({ reclutamiento: true }))
    expect(toolNames).toEqual(
      expect.arrayContaining(['buscar_candidato', 'consultar_candidato', 'consultar_datos']),
    )
  })

  it('enables equipamiento tools and generic tool', () => {
    const toolNames = names(basePerms({ equipamiento: true }))
    expect(toolNames).toEqual(
      expect.arrayContaining(['buscar_equipamiento', 'buscar_ticket_equipo', 'consultar_datos']),
    )
  })

  it('deduplicates tools across overlapping permissions', () => {
    const toolNames = names(basePerms({ catalogo: true, ejecucion: true }))
    const unique = new Set(toolNames)
    expect(unique.size).toBe(toolNames.length)
    expect(toolNames).toContain('consultar_datos')
    expect(toolNames).toContain('buscar_aplicacion')
    expect(toolNames).toContain('consultar_compromisos')
  })

  it('every tool returned has a name, description and execute fn', () => {
    const tools = getEnabledTools(basePerms({ catalogo: true, personas: true, estrategia: true }))
    for (const t of tools) {
      expect(typeof t.name).toBe('string')
      expect(t.name.length).toBeGreaterThan(0)
      expect(typeof t.description).toBe('string')
      expect(typeof t.execute).toBe('function')
    }
  })
})
