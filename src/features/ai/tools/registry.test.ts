import { describe, it, expect } from 'vitest'
import { getEnabledTools } from './registry'
import type { AiProviderConfig } from '../types'

const allPerms = (): AiProviderConfig['dataPermissions'] => ({
  catalogo: true,
  seguridad: true,
  gobierno: true,
  estrategia: true,
  ejecucion: true,
  personas: true,
  reclutamiento: true,
  equipamiento: true,
  finops: true,
})

const nonePerms = (): AiProviderConfig['dataPermissions'] => ({
  catalogo: false,
  seguridad: false,
  gobierno: false,
  estrategia: false,
  ejecucion: false,
  personas: false,
  reclutamiento: false,
  equipamiento: false,
  finops: false,
})

describe('getEnabledTools', () => {
  it('habilita todas las tools especializadas con todos los permisos', () => {
    const tools = getEnabledTools(allPerms())
    const names = tools.map((t) => t.name)
    expect(names).toContain('consultar_compromisos')
    expect(names).toContain('consultar_objetivos')
    expect(names).toContain('buscar_persona')
    expect(names).toContain('consultar_dependencias')
    expect(names).toContain('consultar_candidato')
    expect(names).toContain('auditar_datos')
    expect(names).toContain('buscar_ticket_equipo')
  })

  it('no habilita nada sin permisos', () => {
    const tools = getEnabledTools(nonePerms())
    expect(tools).toEqual([])
  })

  it('estrategia habilita solo sus tools sin genérica', () => {
    const perms = nonePerms()
    perms.estrategia = true
    const names = getEnabledTools(perms).map((t) => t.name)
    expect(names.sort()).toEqual([
      'consultar_health_index',
      'consultar_indicadores',
      'consultar_objetivos',
    ])
  })

  it('catalogo habilita especializadas + tool genérica consultar_datos', () => {
    const perms = nonePerms()
    perms.catalogo = true
    const names = getEnabledTools(perms).map((t) => t.name)
    expect(names).toContain('buscar_aplicacion')
    expect(names).toContain('consultar_dependencias')
    expect(names).toContain('consultar_datos')
    expect(names).not.toContain('consultar_objetivos')
  })

  it('seguridad habilita sus tools + genérica consultar_datos', () => {
    const perms = nonePerms()
    perms.seguridad = true
    const names = getEnabledTools(perms).map((t) => t.name)
    expect(names.sort()).toEqual(['buscar_incidente', 'buscar_vulnerabilidad', 'consultar_datos'])
  })

  it('ejecucion habilita sus tools sin genérica', () => {
    const perms = nonePerms()
    perms.ejecucion = true
    const names = getEnabledTools(perms).map((t) => t.name)
    expect(names).toContain('consultar_bloqueos')
    expect(names).toContain('buscar_entregable')
    expect(names).not.toContain('consultar_datos')
  })

  it('permisos mixtos combinan dominios', () => {
    const perms = nonePerms()
    perms.personas = true
    perms.reclutamiento = true
    const names = getEnabledTools(perms).map((t) => t.name)
    expect(names).toContain('consultar_metricas_sprint')
    expect(names).toContain('buscar_candidato')
    expect(names).toContain('consultar_datos')
  })

  it('no duplica tools con permisos combinados', () => {
    const tools = getEnabledTools(allPerms())
    const names = tools.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
