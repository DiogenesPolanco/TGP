import { describe, it, expect } from 'vitest'
import { normalizeBoolean, normalizeParams, AI_PROVIDER_DEFAULTS } from '../types'

describe('normalizeBoolean', () => {
  it('passthrough booleans', () => {
    expect(normalizeBoolean(true)).toBe(true)
    expect(normalizeBoolean(false)).toBe(false)
  })

  it('coerces numbers (1 = true, resto = false)', () => {
    expect(normalizeBoolean(1)).toBe(true)
    expect(normalizeBoolean(0)).toBe(false)
    expect(normalizeBoolean(2)).toBe(false)
  })

  it('coerces truthy strings', () => {
    expect(normalizeBoolean('true')).toBe(true)
    expect(normalizeBoolean('True')).toBe(true)
    expect(normalizeBoolean('1')).toBe(true)
    expect(normalizeBoolean('false')).toBe(false)
    expect(normalizeBoolean('yes')).toBe(false)
  })

  it('falls back to false for anything else', () => {
    expect(normalizeBoolean(null)).toBe(false)
    expect(normalizeBoolean(undefined)).toBe(false)
    expect(normalizeBoolean({})).toBe(false)
    expect(normalizeBoolean([])).toBe(false)
  })
})

describe('normalizeParams', () => {
  it('drops null and undefined values', () => {
    expect(normalizeParams({ a: null, b: undefined, c: 'x' })).toEqual({ c: 'x' })
  })

  it('drops empty, "null" and "undefined" strings', () => {
    expect(normalizeParams({ a: '', b: 'null', c: 'undefined', d: '  ' })).toEqual({})
  })

  it('coerces boolean strings', () => {
    expect(normalizeParams({ a: 'true', b: 'True', c: 'false', d: 'False' })).toEqual({
      a: true,
      b: true,
      c: false,
      d: false,
    })
  })

  it('coerces numeric strings to numbers', () => {
    expect(normalizeParams({ a: '42', b: '-3.14', c: '0' })).toEqual({ a: 42, b: -3.14, c: 0 })
  })

  it('keeps non-coercible values as-is', () => {
    expect(normalizeParams({ a: 'texto', b: 7, c: { x: 1 }, d: [1, 2] })).toEqual({
      a: 'texto',
      b: 7,
      c: { x: 1 },
      d: [1, 2],
    })
  })

  it('handles real Groq-style messy params', () => {
    const input = {
      nombre: 'Core Banking',
      limite: '10',
      incluirVencidos: 'true',
      notas: 'null',
      etiqueta: '',
    }
    expect(normalizeParams(input)).toEqual({
      nombre: 'Core Banking',
      limite: 10,
      incluirVencidos: true,
    })
  })
})

describe('AI_PROVIDER_DEFAULTS', () => {
  it('defines defaults for all four providers', () => {
    expect(Object.keys(AI_PROVIDER_DEFAULTS)).toEqual(
      expect.arrayContaining(['ollama', 'groq', 'openai', 'anthropic']),
    )
    expect(AI_PROVIDER_DEFAULTS.groq.model).toBe('llama-3.1-8b-instant')
    expect(AI_PROVIDER_DEFAULTS.openai.model).toBe('gpt-4o-mini')
    expect(AI_PROVIDER_DEFAULTS.ollama.baseUrl).toContain('localhost')
  })
})
