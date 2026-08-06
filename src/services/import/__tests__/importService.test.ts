import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  importRows,
  parseExcel,
  getImportableEntities,
  getImportConfig,
  ImportFileError,
  ImportParseError,
} from '../importService'
import type { ParsedRow } from '../importService'

const hoisted = vi.hoisted(() => {
  const makeTable = () => ({
    where: vi.fn(),
    equals: vi.fn(),
    first: vi.fn(),
    toArray: vi.fn(),
    add: vi.fn(),
    put: vi.fn(),
  })
  return {
    db: {
      users: makeTable(),
      applications: makeTable(),
      technologies: makeTable(),
    },
    xlsx: {
      read: vi.fn(),
      sheet_to_json: vi.fn(),
    },
  }
})

vi.mock('@/services/db/database', () => ({ db: hoisted.db }))
vi.mock('xlsx-js-style', () => ({
  read: hoisted.xlsx.read,
  utils: { sheet_to_json: hoisted.xlsx.sheet_to_json },
}))

const table = (name: 'users' | 'applications' | 'technologies') => hoisted.db[name]

function stubIndexedLookup(name: 'users' | 'applications' | 'technologies', existing: unknown) {
  table(name).where.mockReturnValue({
    equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(existing) }),
  })
}

beforeEach(() => {
  for (const t of Object.values(hoisted.db)) {
    t.where.mockReset()
    t.equals.mockReset()
    t.first.mockReset()
    t.toArray.mockReset()
    t.add.mockReset().mockResolvedValue('new-id')
    t.put.mockReset().mockResolvedValue(undefined)
  }
  hoisted.xlsx.read.mockReset()
  hoisted.xlsx.sheet_to_json.mockReset()
})

describe('importRows — users', () => {
  it('normalizes isActive to 0|1 (login queries where("isActive").equals(1))', async () => {
    stubIndexedLookup('users', null)
    const rows: ParsedRow[] = [
      {
        index: 2,
        data: { Email: 'ana@corp.com', Nombre: 'Ana', Rol: 'user', 'Activo (true/false)': 'false' },
        errors: [],
      },
      {
        index: 3,
        data: { Email: 'bob@corp.com', Nombre: 'Bob', Rol: 'user', 'Activo (true/false)': 'true' },
        errors: [],
      },
    ]

    const result = await importRows('users', rows)

    expect(result.successRows).toBe(2)
    expect(result.errorRows).toBe(0)
    const first = table('users').add.mock.calls[0][0] as { isActive: unknown }
    const second = table('users').add.mock.calls[1][0] as { isActive: unknown }
    expect(first.isActive).toBe(0)
    expect(second.isActive).toBe(1)
  })

  it('defaults isActive to 1 when the column is omitted', async () => {
    stubIndexedLookup('users', null)
    const rows: ParsedRow[] = [
      {
        index: 2,
        data: { Email: 'car@corp.com', Nombre: 'Carlos', Rol: 'user' },
        errors: [],
      },
    ]

    await importRows('users', rows)

    const entity = table('users').add.mock.calls[0][0] as { isActive: unknown }
    expect(entity.isActive).toBe(1)
  })
})

describe('importRows — upsert paths', () => {
  it('updates existing record (put) preserving id and createdAt', async () => {
    const existing = { id: 'u1', email: 'ana@corp.com', createdAt: new Date(2020, 0, 1) }
    stubIndexedLookup('users', existing)
    const rows: ParsedRow[] = [
      { index: 2, data: { Email: 'ana@corp.com', Nombre: 'Ana Nueva' }, errors: [] },
    ]

    const result = await importRows('users', rows)

    expect(result.successRows).toBe(1)
    const put = table('users').put.mock.calls[0][0] as {
      id: string
      createdAt: Date
      email: string
    }
    expect(put.id).toBe('u1')
    expect(put.createdAt).toBe(existing.createdAt)
    expect(put.email).toBe('ana@corp.com')
    expect(table('users').add).not.toHaveBeenCalled()
  })

  it('falls back to toArray when match field is not indexed', async () => {
    table('users').where.mockImplementation(() => {
      throw new Error('not indexed')
    })
    table('users').toArray.mockResolvedValue([{ id: 'u9', email: 'old@corp.com' }])
    const rows: ParsedRow[] = [
      { index: 2, data: { Email: 'old@corp.com', Nombre: 'Old' }, errors: [] },
    ]

    const result = await importRows('users', rows)

    expect(result.successRows).toBe(1)
    expect(table('users').put).toHaveBeenCalled()
  })

  it('uses multi-field match (technologies name+version) via toArray', async () => {
    table('technologies').toArray.mockResolvedValue([{ id: 't1', name: 'Java', version: '17' }])
    const rows: ParsedRow[] = [
      {
        index: 2,
        data: {
          Nombre: 'Java',
          Versión: '17',
          Categoría: 'language',
          Vendor: 'Oracle',
          'Estado Soporte': 'active',
        },
        errors: [],
      },
    ]

    const result = await importRows('technologies', rows)

    expect(result.successRows).toBe(1)
    expect(table('technologies').put).toHaveBeenCalled()
    expect(table('technologies').where).not.toHaveBeenCalled()
  })

  it('counts rows with errors without touching the table', async () => {
    stubIndexedLookup('users', null)
    const rows: ParsedRow[] = [
      { index: 2, data: { Email: '' }, errors: ['El campo requerido "Email" está vacío'] },
    ]

    const result = await importRows('users', rows)

    expect(result.successRows).toBe(0)
    expect(result.errorRows).toBe(1)
    expect(result.errors[0]).toEqual({ row: 2, message: 'El campo requerido "Email" está vacío' })
    expect(table('users').add).not.toHaveBeenCalled()
  })

  it('catches build/insert errors into errorRows', async () => {
    stubIndexedLookup('users', null)
    table('users').add.mockRejectedValue(new Error('Constraint failed on line /tmp/x: boom'))
    const rows: ParsedRow[] = [{ index: 2, data: { Email: 'x@corp.com', Nombre: 'X' }, errors: [] }]

    const result = await importRows('users', rows)

    expect(result.successRows).toBe(0)
    expect(result.errorRows).toBe(1)
    expect(result.errors[0].message).toContain('Error al procesar la fila:')
    expect(result.errors[0].message).toContain('Constraint failed')
    expect(result.errors[0].message).not.toContain('\n')
  })

  it('throws for unknown entity type', async () => {
    await expect(importRows('nope', [])).rejects.toThrow('Tipo de entidad desconocido: nope')
  })

  it('preserves ImportFileError messages verbatim', async () => {
    stubIndexedLookup('users', null)
    table('users').add.mockRejectedValue(new ImportFileError('El archivo excede el tamaño máximo'))
    const rows: ParsedRow[] = [{ index: 2, data: { Email: 'x@corp.com', Nombre: 'X' }, errors: [] }]

    const result = await importRows('users', rows)

    expect(result.errors[0].message).toBe('El archivo excede el tamaño máximo')
  })
})

describe('parseExcel', () => {
  const headers = ['Nombre', 'Owner', 'Business Unit ID', 'Criticidad', 'Arquitectura', 'Estado']

  function mockWorkbook(rows: unknown[][]) {
    hoisted.xlsx.read.mockReturnValue({ SheetNames: ['Datos'], Sheets: { Datos: {} } })
    hoisted.xlsx.sheet_to_json.mockReturnValue(rows)
  }

  it('rejects files over 10MB', () => {
    const big = new ArrayBuffer(10 * 1024 * 1024 + 1)
    expect(() => parseExcel(big, 'applications')).toThrow(ImportFileError)
  })

  it('rejects unknown entity type', () => {
    expect(() => parseExcel(new ArrayBuffer(8), 'nope')).toThrow(ImportParseError)
  })

  it('rejects workbook without sheets', () => {
    hoisted.xlsx.read.mockReturnValue({ SheetNames: [], Sheets: {} })
    expect(() => parseExcel(new ArrayBuffer(8), 'applications')).toThrow(ImportParseError)
  })

  it('rejects file without header + data rows', () => {
    mockWorkbook([['Nombre', 'Owner']])
    expect(() => parseExcel(new ArrayBuffer(8), 'applications')).toThrow(ImportParseError)
  })

  it('parses valid rows and skips empty ones', () => {
    mockWorkbook([
      headers,
      ['ERP', 'Ana', 'bu1', 'high', 'microservices', 'active'],
      ['', '', '', '', '', ''],
      ['CRM', 'Bob', 'bu2', 'low', 'monolith', 'planned'],
    ])
    const rows = parseExcel(new ArrayBuffer(8), 'applications')
    expect(rows).toHaveLength(2)
    expect(rows[0].data['Nombre']).toBe('ERP')
    expect(rows[0].errors).toEqual([])
  })

  it('flags required, number and enum violations', () => {
    mockWorkbook([headers, ['', 'Ana', '', 'bogus', 'weird', 'nope']])
    const rows = parseExcel(new ArrayBuffer(8), 'applications')
    const errors = rows[0].errors.join(' | ')
    expect(errors).toContain('"Nombre" está vacío')
    expect(errors).toContain('"Business Unit ID" está vacío')
    expect(errors).toContain('"Criticidad" tiene un valor inválido')
    expect(errors).toContain('"Arquitectura" tiene un valor inválido')
    expect(errors).toContain('"Estado" tiene un valor inválido')
  })

  it('validates numeric cells', () => {
    mockWorkbook([
      ['App ID', 'Título', 'CVSS', 'Severidad'],
      ['app1', 'XSS', '9.5', 'high'],
      ['app2', 'SQLi', 'abc', 'high'],
    ])
    const rows = parseExcel(new ArrayBuffer(8), 'vulnerabilities')
    expect(rows[0].errors).toEqual([])
    expect(rows[1].errors.join('')).toContain('"CVSS" debe ser un número')
  })

  it('sanitizes prototype pollution keys and control characters', () => {
    mockWorkbook([
      ['Nombre', '__proto__', 'constructor', 'prototype'],
      ['ERP', 'polluted', 'polluted2', 'polluted3'],
    ])
    const rows = parseExcel(new ArrayBuffer(8), 'applications')
    const data = rows[0].data as Record<string, unknown>
    expect(Object.getPrototypeOf(data)).toBe(Object.prototype)
    expect(Object.prototype.hasOwnProperty.call(data, '__proto__')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(data, 'constructor')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(data, 'prototype')).toBe(false)
  })

  it('preserves non-string cell values untouched', () => {
    mockWorkbook([
      ['Nombre', 'Owner'],
      ['ERP', 42],
      ['CRM', null],
    ])
    const rows = parseExcel(new ArrayBuffer(8), 'applications')
    expect(rows[0].data['Owner']).toBe(42)
    expect(rows[1].data['Owner']).toBe('')
  })

  it('trims header names', () => {
    mockWorkbook([
      ['  Nombre  ', 'Owner'],
      ['ERP', 'Ana'],
    ])
    const rows = parseExcel(new ArrayBuffer(8), 'applications')
    expect(rows[0].data['Nombre']).toBe('ERP')
  })
})

describe('public API', () => {
  it('getImportableEntities lists all configured entities with columns', () => {
    const entities = getImportableEntities()
    expect(entities.length).toBeGreaterThan(10)
    const users = entities.find((e) => e.id === 'users')
    expect(users?.label).toBe('Usuarios')
    expect(users?.columns.some((c) => c.label === 'Email')).toBe(true)
  })

  it('getImportConfig returns config for known entity and undefined otherwise', () => {
    const cfg = getImportConfig('technologies')
    expect(cfg?.table).toBe('technologies')
    expect(cfg?.matchKey({ Nombre: 'X', Versión: '1' })).toEqual({ name: 'X', version: '1' })
    expect(getImportConfig('nope')).toBeUndefined()
  })
})

describe('all entity configs — buildEntity & matchKey', () => {
  it('buildEntity and matchKey run for every configured entity', () => {
    for (const cfg of getImportableEntities()) {
      const config = getImportConfig(cfg.id)
      if (!config) continue

      const row: Record<string, unknown> = {}
      for (const col of config.columns) {
        if (col.type === 'number') row[col.label] = '3'
        else if (col.type === 'date') row[col.label] = '2026-01-15'
        else if (col.type === 'enum' && col.enumValues?.length) row[col.label] = col.enumValues[0]
        else row[col.label] = `valor-${col.key}`
      }

      const entity = config.buildEntity(row, `id-${cfg.id}`)
      expect(entity.id).toBe(`id-${cfg.id}`)
      expect(typeof entity).toBe('object')

      const match = config.matchKey(row)
      expect(typeof match).toBe('object')
    }
  })

  it('buildEntity handles empty rows with defaults', () => {
    const cfg = getImportConfig('applications')
    const entity = cfg?.buildEntity({}, 'id-x') as Record<string, unknown>
    expect(entity?.name).toBe('')
    expect(entity?.architecture).toBe('monolith')
    expect(entity?.status).toBe('active')
    expect(entity?.criticality).toBe('medium')
  })
})

describe('cell helpers via configs', () => {
  it('parses date cells: Date object, Excel serial, invalid string', () => {
    const cfg = getImportConfig('applications')
    const build = (v: unknown) =>
      (cfg?.buildEntity({ 'Fin Soporte': v }, 'id') as { supportEndDate: Date | null })
        .supportEndDate

    const asDate = new Date(2026, 0, 15)
    expect(build(asDate)).toBe(asDate)
    expect(build(46000)).not.toBeNull()
    expect(build('not-a-date')).toBeNull()
    expect(build('')).toBeNull()
    expect(build(null)).toBeNull()
  })

  it('parses number cells via buildEntity', () => {
    const cfg = getImportConfig('incidents')
    const build = (v: unknown) =>
      (
        cfg?.buildEntity({ 'Downtime (min)': v }, 'id') as {
          downtimeMinutes: number | null
        }
      ).downtimeMinutes

    expect(build('7')).toBe(7)
    expect(build('')).toBeNull()
    expect(build(null)).toBeNull()
    expect(build('abc')).toBeNull()
  })

  it('parses array cells split by semicolons', () => {
    const cfg = getImportConfig('users')
    const build = (v: unknown) =>
      (
        cfg?.buildEntity({ 'Business Unit IDs (separados por ;)': v }, 'id') as {
          businessUnitIds: string[]
        }
      ).businessUnitIds

    expect(build('bu1; bu2 ;bu3')).toEqual(['bu1', 'bu2', 'bu3'])
    expect(build('')).toEqual([])
    expect(build(null)).toEqual([])
  })
})
