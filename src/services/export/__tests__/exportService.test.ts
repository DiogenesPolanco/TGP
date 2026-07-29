import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DATE_KEYS,
  isIsoDateString,
  dateReviver,
  isDateObject,
  reviveDatesDeep,
  saveBackupToStorage,
  loadBackupFromStorage,
  getBackupInfo,
  readBackupFromFile,
  exportDatabase,
  importBackup,
} from '../exportService'
import type { DatabaseBackup } from '../exportService'

const BACKUP_KEY = 'tgp-db-backup'

const { mockTableObj, mockDb } = vi.hoisted(() => {
  const mockTable = { toArray: vi.fn(), bulkPut: vi.fn(), put: vi.fn() }
  return {
    mockTableObj: mockTable,
    mockDb: { table: vi.fn().mockReturnValue(mockTable) },
  }
})

vi.mock('@/services/db/database', () => ({ db: mockDb }))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DATE_KEYS', () => {
  it('contains common date field names', () => {
    expect(DATE_KEYS.has('createdAt')).toBe(true)
    expect(DATE_KEYS.has('updatedAt')).toBe(true)
    expect(DATE_KEYS.has('startDate')).toBe(true)
    expect(DATE_KEYS.has('eolDate')).toBe(true)
  })
})

describe('isIsoDateString', () => {
  it('returns true for ISO date-only string', () => {
    expect(isIsoDateString('2026-01-15')).toBe(true)
  })

  it('returns true for full ISO datetime with Z', () => {
    expect(isIsoDateString('2026-01-15T10:30:00.000Z')).toBe(true)
  })

  it('returns true for datetime with timezone offset', () => {
    expect(isIsoDateString('2026-01-15T10:30:00-05:00')).toBe(true)
  })

  it('returns false for non-date strings', () => {
    expect(isIsoDateString('hello')).toBe(false)
    expect(isIsoDateString('12345')).toBe(false)
    expect(isIsoDateString('')).toBe(false)
  })

  it('returns false for non-string values', () => {
    expect(isIsoDateString(42)).toBe(false)
    expect(isIsoDateString(null)).toBe(false)
    expect(isIsoDateString(undefined)).toBe(false)
  })
})

describe('dateReviver', () => {
  it('wraps Date instances with __date marker', () => {
    const d = new Date('2026-01-15')
    const result = dateReviver('createdAt', d)
    expect(result).toEqual({ __date: d.toISOString() })
  })

  it('wraps ISO date strings on known date keys', () => {
    const result = dateReviver('createdAt', '2026-01-15T00:00:00.000Z')
    expect(result).toEqual({ __date: '2026-01-15T00:00:00.000Z' })
  })

  it('passes non-date values through', () => {
    expect(dateReviver('name', 'hello')).toBe('hello')
    expect(dateReviver('count', 42)).toBe(42)
    expect(dateReviver('flag', true)).toBe(true)
    expect(dateReviver('data', null)).toBeNull()
  })
})

describe('isDateObject', () => {
  it('returns true for { __date: string } objects', () => {
    expect(isDateObject({ __date: '2026-01-15' })).toBe(true)
  })

  it('returns false for other objects', () => {
    expect(isDateObject({ foo: 'bar' })).toBe(false)
    expect(isDateObject(null)).toBe(false)
    expect(isDateObject(42)).toBe(false)
  })
})

describe('reviveDatesDeep', () => {
  it('revives bare ISO strings on known date keys', () => {
    const result = reviveDatesDeep('2026-01-15T00:00:00.000Z', 'createdAt')
    expect(result).toBeInstanceOf(Date)
    expect((result as Date).getFullYear()).toBe(2026)
  })

  it('keeps already-revived Date objects', () => {
    const d = new Date('2026-06-15')
    expect(reviveDatesDeep(d)).toBe(d)
  })

  it('handles null and undefined', () => {
    expect(reviveDatesDeep(null)).toBeNull()
    expect(reviveDatesDeep(undefined)).toBeUndefined()
  })

  it('passes primitives through', () => {
    expect(reviveDatesDeep('hello')).toBe('hello')
    expect(reviveDatesDeep(42)).toBe(42)
    expect(reviveDatesDeep(true)).toBe(true)
  })

  it('revives __date marker objects in arrays', () => {
    const result = reviveDatesDeep([{ __date: '2026-01-15T00:00:00.000Z' }, 'hello']) as any[]
    expect(result[0]).toBeInstanceOf(Date)
    expect(result[1]).toBe('hello')
  })

  it('revives __date marker objects', () => {
    const result = reviveDatesDeep({ __date: '2026-01-15T00:00:00.000Z' })
    expect(result).toBeInstanceOf(Date)
  })

  it('recursively processes nested objects', () => {
    const input = { app: { createdAt: '2026-01-15T00:00:00.000Z' }, name: 'Test' }
    const result = reviveDatesDeep(input) as any
    expect(result.app.createdAt).toBeInstanceOf(Date)
    expect(result.name).toBe('Test')
  })
})

describe('saveBackupToStorage', () => {
  it('stores serialized backup with dateReviver', () => {
    const backup: DatabaseBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tables: { apps: [{ createdAt: new Date('2026-01-15') }] },
    }
    const result = saveBackupToStorage(backup)
    expect(result).toBe(true)
    const stored = localStorage.getItem(BACKUP_KEY)
    expect(stored).toBeTruthy()
    expect(stored).toContain('__date')
  })

  it('returns false when localStorage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    const backup: DatabaseBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tables: {},
    }
    expect(saveBackupToStorage(backup)).toBe(false)
  })
})

describe('loadBackupFromStorage', () => {
  it('returns null when no backup stored', () => {
    expect(loadBackupFromStorage()).toBeNull()
  })

  it('revives dates when loading', () => {
    const backup: DatabaseBackup = {
      version: '1.0',
      exportedAt: '2026-01-15T00:00:00.000Z',
      tables: { apps: [{ createdAt: { __date: '2026-01-15T00:00:00.000Z' } }] },
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
    const loaded = loadBackupFromStorage()
    expect(loaded).not.toBeNull()
    expect(loaded!.tables.apps[0].createdAt).toBeInstanceOf(Date)
  })

  it('returns null on parse error', () => {
    localStorage.setItem(BACKUP_KEY, 'not-json')
    expect(loadBackupFromStorage()).toBeNull()
  })
})

describe('getBackupInfo', () => {
  it('returns default when no backup', () => {
    const info = getBackupInfo()
    expect(info.exists).toBe(false)
    expect(info.size).toBe('0 B')
    expect(info.lastBackup).toBeNull()
  })

  it('returns size and lastBackup when present', () => {
    const backup: DatabaseBackup = {
      version: '1.0',
      exportedAt: '2026-06-15T10:00:00.000Z',
      tables: {},
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
    const info = getBackupInfo()
    expect(info.exists).toBe(true)
    expect(info.size).toBeTruthy()
    expect(info.lastBackup).toBeTruthy()
  })

  it('handles corrupted backup gracefully', () => {
    localStorage.setItem(BACKUP_KEY, 'corrupted')
    const info = getBackupInfo()
    expect(info.exists).toBe(false)
    expect(info.size).toBe('0 B')
  })
})

describe('exportDatabase', () => {
  beforeEach(() => {
    mockTableObj.toArray.mockResolvedValue([{ id: 'r1' }])
  })

  it('exports all tables', async () => {
    const result = await exportDatabase()
    expect(result.version).toBe('1.0')
    expect(result.tables).toBeDefined()
    expect(typeof result.exportedAt).toBe('string')
  })

  it('handles empty tables', async () => {
    mockTableObj.toArray.mockResolvedValue([])
    const result = await exportDatabase()
    expect(result.version).toBe('1.0')
    expect(Object.keys(result.tables).length).toBeGreaterThan(0)
  })

  it('falls back gracefully when table throws', async () => {
    mockTableObj.toArray.mockRejectedValue(new Error('fail'))
    const result = await exportDatabase()
    expect(result.version).toBe('1.0')
  })
})

describe('importBackup', () => {
  beforeEach(() => {
    mockTableObj.bulkPut.mockReset()
    mockTableObj.put.mockReset()
    mockTableObj.toArray.mockReset()
    mockDb.table.mockClear()
  })

  it('imports tables in order', async () => {
    const backup: DatabaseBackup = {
      version: '1.0',
      exportedAt: '2026-01-01T00:00:00.000Z',
      tables: { tenants: [{ id: 't1', name: 'Test' }] },
    }
    const result = await importBackup(backup)
    expect(result.success).toBe(true)
    expect(result.tablesRestored.length).toBe(1)
    expect(result.tablesRestored[0]).toContain('tenants')
    expect(result.totalRecords).toBe(1)
  })

  it('skips empty tables', async () => {
    const backup: DatabaseBackup = {
      version: '1.0',
      exportedAt: '2026-01-01T00:00:00.000Z',
      tables: { tenants: [] },
    }
    const result = await importBackup(backup)
    expect(result.success).toBe(true)
    expect(result.tablesRestored).toHaveLength(0)
  })

  it('falls back to individual puts when bulkPut fails', async () => {
    mockTableObj.bulkPut.mockRejectedValue(new Error('bulk error'))
    const backup: DatabaseBackup = {
      version: '1.0',
      exportedAt: '2026-01-01T00:00:00.000Z',
      tables: { tenants: [{ id: 't1' }] },
    }
    const result = await importBackup(backup)
    expect(result.tablesRestored.length).toBe(1)
  })

  it('handles individual put failure', async () => {
    mockTableObj.bulkPut.mockRejectedValue(new Error('bulk error'))
    mockTableObj.put.mockRejectedValue(new Error('put error'))
    const backup: DatabaseBackup = {
      version: '1.0',
      exportedAt: '2026-01-01T00:00:00.000Z',
      tables: { tenants: [{ id: 't1' }] },
    }
    const result = await importBackup(backup)
    expect(result.tablesWithErrors.length).toBe(1)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles missing table gracefully', async () => {
    mockDb.table.mockImplementation(() => {
      throw new Error('table not found')
    })
    const backup: DatabaseBackup = {
      version: '1.0',
      exportedAt: '2026-01-01T00:00:00.000Z',
      tables: { tenants: [{ id: 't1' }] },
    }
    const result = await importBackup(backup)
    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('readBackupFromFile', () => {
  it('resolves parsed backup on success', async () => {
    const file = new File(
      ['{"version":"1.0","exportedAt":"2026-01-15T00:00:00.000Z","tables":{}}'],
      'backup.json',
      { type: 'application/json' },
    )
    const result = await readBackupFromFile(file)
    expect(result.version).toBe('1.0')
  })

  it('revives __date markers in file', async () => {
    const content = JSON.stringify({
      version: '1.0',
      exportedAt: '2026-01-15T00:00:00.000Z',
      tables: { apps: [{ createdAt: { __date: '2026-01-15T00:00:00.000Z' } }] },
    })
    const file = new File([content], 'backup.json', { type: 'application/json' })
    const result = await readBackupFromFile(file)
    expect(result.tables.apps[0].createdAt).toBeInstanceOf(Date)
  })

  it('rejects on invalid JSON', async () => {
    const file = new File(['not json'], 'backup.json', { type: 'application/json' })
    await expect(readBackupFromFile(file)).rejects.toThrow('Archivo de backup inv')
  })

  it('rejects on file read error', async () => {
    const file = new File([''], 'backup.json', { type: 'application/json' })
    const origFileReader = globalThis.FileReader
    const ref: {
      current: {
        onerror: ((ev: Event) => void) | null
        onload: ((ev: ProgressEvent<FileReader>) => void) | null
        readAsText: (blob: Blob) => void
        result: string | null
      }
    } = {
      current: { onerror: null, onload: null, readAsText: vi.fn(), result: null },
    }
    function MockFileReader(this: any) {
      this.onerror = null
      this.onload = null
      this.readAsText = (blob: Blob) => {
        ref.current.onerror = this.onerror
        ref.current.onload = this.onload
        ref.current.readAsText(blob)
      }
      this.result = null
    }
    ;(globalThis as any).FileReader = MockFileReader as any
    const promise = readBackupFromFile(file)
    if (ref.current.onerror) {
      ref.current.onerror({} as Event)
    }
    await expect(promise).rejects.toThrow('Error al leer el archivo')
    ;(globalThis as any).FileReader = origFileReader
  })
})
