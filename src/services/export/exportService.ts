import Dexie from 'dexie'
import { db } from '@/services/db/database'
import {
  generatePortableBackupKey,
  importPortableBackupKey,
  encryptFieldWithKey,
  decryptFieldWithKey,
  decryptField,
} from '@/services/crypto/fieldCipher'
import type { PortableBackupKey } from '@/services/crypto/fieldCipher'

const BACKUP_STORAGE_KEY = 'tgp-db-backup'

export interface DatabaseBackup {
  version: string
  exportedAt: string
  tables: Record<string, Record<string, unknown>[]>
  /** Per-table read failures during export (table → error message). */
  exportWarnings?: string[]
  /** Portable AES-GCM-256 key material so the backup decrypts on any device. */
  crypto?: { key: string; algorithm: string }
}

const TABLE_NAMES = [
  'tenants',
  'businessUnits',
  'applications',
  'technologies',
  'applicationDependencies',
  'vulnerabilities',
  'incidents',
  'risks',
  'auditFindings',
  'teams',
  'objectives',
  'healthIndexHistory',
  'deliverables',
  'microservices',
  'appDatabases',
  'users',
  'plans',
  'activities',
  'tasks',
  'commitments',
  'dependencies',
  'blockers',
  'memberProfiles',
  'sprintRecords',
  'oneOnOnes',
  'achievements',
  'vacationRecords',
  'teamSprints',
] as const

async function getTableData(tableName: string): Promise<{
  records: Record<string, unknown>[]
  error: string | null
}> {
  try {
    return {
      records: (await db.table(tableName).toArray()) as Record<string, unknown>[],
      error: null,
    }
  } catch (err) {
    return { records: [], error: err instanceof Error ? err.message : String(err) }
  }
}

const SENSITIVE_FIELD_TABLES = new Set(['applications', 'auditFindings'])
const SENSITIVE_FIELDS: Record<string, string[]> = {
  applications: ['name', 'description'],
  auditFindings: ['title', 'description'],
}

async function encryptSensitiveFields(
  tableName: string,
  records: Record<string, unknown>[],
  key: CryptoKey,
): Promise<Record<string, unknown>[]> {
  const fields = SENSITIVE_FIELDS[tableName]
  if (!fields) return records
  return Promise.all(
    records.map(async (r) => {
      const out: Record<string, unknown> = { ...r }
      for (const field of fields) {
        if (typeof out[field] === 'string') out[field] = await encryptFieldWithKey(out[field], key)
      }
      return out
    }),
  )
}

async function decryptSensitiveFields(
  tableName: string,
  records: Record<string, unknown>[],
  key: CryptoKey,
): Promise<Record<string, unknown>[]> {
  const fields = SENSITIVE_FIELDS[tableName]
  if (!fields) return records
  return Promise.all(
    records.map(async (r) => {
      const out: Record<string, unknown> = { ...r }
      for (const field of fields) {
        const value = out[field]
        if (typeof value === 'string' && value.includes(':')) {
          out[field] = await decryptFieldWithKey(value, key)
        }
      }
      return out
    }),
  )
}

async function decryptSensitiveFieldsWithFingerprint(
  tableName: string,
  records: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const fields = SENSITIVE_FIELDS[tableName]
  if (!fields) return records
  return Promise.all(
    records.map(async (r) => {
      const out: Record<string, unknown> = { ...r }
      for (const field of fields) {
        const value = out[field]
        if (typeof value === 'string' && value.includes(':')) {
          out[field] = await decryptField(value)
        }
      }
      return out
    }),
  )
}

// ─── Date helpers ─────────────────────────────────────────────────────

/** Keys whose string values are likely ISO date strings stored by Dexie. */
export const DATE_KEYS = new Set([
  'date',
  'startDate',
  'endDate',
  'dueDate',
  'commitmentDate',
  'eolDate',
  'periodStart',
  'periodEnd',
  'supportEndDate',
  'targetDate',
  'slaDeadline',
  'createdAt',
  'updatedAt',
  'exportedAt',
  'detectedAt',
  'respondedAt',
  'resolvedAt',
  'escalatedAt',
])

/** Rough ISO 8601 check — catches "2026-01-15" and "2026-01-15T00:00:00.000Z". */
export function isIsoDateString(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(value)
  )
}

/**
 * Reviver for JSON.stringify that wraps ISO date strings
 * (and actual Date objects) with a `{__date: …}` marker so the
 * import side can revive them back to Date instances.
 */
export function dateReviver(_key: string, value: unknown): unknown {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    return { __date: value.toISOString() }
  }
  if (DATE_KEYS.has(_key) && isIsoDateString(value)) {
    return { __date: value as string }
  }
  return value
}

export function isDateObject(value: unknown): value is { __date: string } {
  return (
    typeof value === 'object' && value !== null && '__date' in (value as Record<string, unknown>)
  )
}

// ─── Export ──────────────────────────────────────────────────────────

export interface ExportOptions {
  /** Encrypt sensitive fields (applications/auditFindings) with a portable per-backup key. */
  encrypt?: boolean
}

export async function exportDatabase(options?: ExportOptions): Promise<DatabaseBackup> {
  const tables: Record<string, Record<string, unknown>[]> = {}
  const exportWarnings: string[] = []

  let portableKey: PortableBackupKey | null = null
  if (options?.encrypt) portableKey = await generatePortableBackupKey()

  await Promise.all(
    TABLE_NAMES.map(async (name) => {
      const { records, error } = await getTableData(name)
      if (error) exportWarnings.push(`${name}: ${error}`)
      let data = records
      if (portableKey && SENSITIVE_FIELD_TABLES.has(name)) {
        data = await encryptSensitiveFields(name, records, portableKey.key)
      }
      tables[name] = data
    }),
  )

  const backup: DatabaseBackup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tables,
  }
  if (exportWarnings.length > 0) backup.exportWarnings = exportWarnings
  if (portableKey) backup.crypto = { key: portableKey.raw, algorithm: 'AES-GCM-256' }

  return backup
}

export function saveBackupToStorage(backup: DatabaseBackup) {
  try {
    const serialized = JSON.stringify(backup, dateReviver)
    localStorage.setItem(BACKUP_STORAGE_KEY, serialized)
    return true
  } catch {
    // localStorage might be full
    return false
  }
}

// ─── Import ──────────────────────────────────────────────────────────

export function reviveDatesDeep(obj: unknown, parentKey?: string): unknown {
  // Backward compat: bare ISO date string on a known date key → revive
  if (parentKey && DATE_KEYS.has(parentKey) && isIsoDateString(obj)) {
    const d = new Date(obj as string)
    return isNaN(d.getTime()) ? null : d
  }
  // Date already revived by JSON.parse — return as-is
  if (obj instanceof Date) return obj
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map((item) => reviveDatesDeep(item))

  const asRecord = obj as Record<string, unknown>

  // Detect our serialized date marker
  if (
    '__date' in asRecord &&
    typeof asRecord.__date === 'string' &&
    Object.keys(asRecord).length === 1
  ) {
    const d = new Date(asRecord.__date)
    return isNaN(d.getTime()) ? null : d
  }

  const result: Record<string, unknown> = {}
  for (const key of Object.keys(asRecord)) {
    result[key] = reviveDatesDeep(asRecord[key], key)
  }
  return result
}

// Tables that may have dependencies on others — import independent first
const IMPORT_ORDER: string[] = [
  // Independent (no foreign keys)
  'tenants',
  'businessUnits',
  'technologies',
  'users',
  // Depend on businessUnits / tenants
  'applications',
  'objectives',
  'healthIndexHistory',
  'deliverables',
  'microservices',
  'appDatabases',
  // Depend on applications
  'applicationDependencies',
  'vulnerabilities',
  'incidents',
  'risks',
  'auditFindings',
  // Depend on users / apps
  'plans',
  // Depend on plans
  'activities',
  // Depend on plans / activities
  'tasks',
  'commitments',
  'dependencies',
  'blockers',
  // Depend on teams
  'teams',
  // Rendimiento — depend on teams / members
  'memberProfiles',
  'sprintRecords',
  'oneOnOnes',
  'achievements',
  'vacationRecords',
  'teamSprints',
]

export function isValidBackup(value: unknown): value is DatabaseBackup {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DatabaseBackup>
  if (typeof candidate.version !== 'string' || candidate.version.length === 0) return false
  if (
    !candidate.tables ||
    typeof candidate.tables !== 'object' ||
    Array.isArray(candidate.tables)
  ) {
    return false
  }
  return Object.values(candidate.tables).some((records) => Array.isArray(records))
}

export async function importBackup(backup: DatabaseBackup): Promise<{
  success: boolean
  tablesRestored: string[]
  tablesWithErrors: string[]
  totalRecords: number
  errors: string[]
}> {
  const tablesRestored: string[] = []
  const tablesWithErrors: string[] = []
  const errors: string[] = []
  let totalRecords = 0

  let portableKey: CryptoKey | null = null
  if (backup.crypto?.key) {
    try {
      portableKey = await importPortableBackupKey(backup.crypto.key)
    } catch {
      portableKey = null
    }
  }

  for (const tableName of IMPORT_ORDER) {
    const rawRecords = backup.tables[tableName]
    if (!rawRecords || rawRecords.length === 0) continue

    // Revive dates deeply and cast
    let records = rawRecords.map((r) => reviveDatesDeep(r)) as Record<string, unknown>[]

    // Decrypt sensitive fields: portable key when present, fingerprint key for legacy backups
    if (SENSITIVE_FIELD_TABLES.has(tableName)) {
      records = portableKey
        ? await decryptSensitiveFields(tableName, records, portableKey)
        : await decryptSensitiveFieldsWithFingerprint(tableName, records)
    }

    let table: Dexie.Table
    try {
      table = db.table(tableName)
    } catch {
      errors.push(`${tableName}: table not found or no put() method`)
      continue
    }

    let restoredCount = 0
    let failedCount = 0

    // Try bulkPut first (fast path)
    try {
      await table.bulkPut(records)
      restoredCount = records.length
    } catch {
      // Fall back to individual puts for maximum recovery
      for (const record of records) {
        try {
          await table.put(record)
          restoredCount++
        } catch (recErr) {
          failedCount++
          errors.push(
            `${tableName}[id=${record.id ?? '?'}]: ${recErr instanceof Error ? recErr.message : String(recErr)}`,
          )
        }
      }
    }

    totalRecords += restoredCount
    if (failedCount > 0) {
      tablesWithErrors.push(`${tableName} (${failedCount} errores de ${records.length})`)
    }
    if (restoredCount > 0) {
      tablesRestored.push(`${tableName} (${restoredCount} registros)`)
    }
  }

  return {
    success: errors.length === 0,
    tablesRestored,
    tablesWithErrors,
    totalRecords,
    errors,
  }
}

export function readBackupFromFile(file: File): Promise<DatabaseBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const backup = JSON.parse(text, (_key, value) => {
          if (isDateObject(value)) {
            const d = new Date(value.__date)
            return isNaN(d.getTime()) ? null : d
          }
          if (DATE_KEYS.has(_key) && isIsoDateString(value)) {
            const d = new Date(value as string)
            return isNaN(d.getTime()) ? null : d
          }
          return value
        }) as DatabaseBackup
        resolve(backup)
      } catch {
        reject(new Error('Archivo de backup inválido'))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsText(file)
  })
}

export function loadBackupFromStorage(): DatabaseBackup | null {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw, (_key, value) => {
      if (isDateObject(value)) {
        const d = new Date(value.__date)
        return isNaN(d.getTime()) ? null : d
      }
      if (DATE_KEYS.has(_key) && isIsoDateString(value)) {
        const d = new Date(value as string)
        return isNaN(d.getTime()) ? null : d
      }
      return value
    }) as DatabaseBackup
  } catch {
    return null
  }
}

// ─── Storage info ────────────────────────────────────────────────────

export function getBackupInfo(): { exists: boolean; size: string; lastBackup: string | null } {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY)
    if (!raw) return { exists: false, size: '0 B', lastBackup: null }
    const backup = JSON.parse(raw) as DatabaseBackup
    const sizeKB = Math.round(new Blob([raw]).size / 1024)
    let lastBackup: string | null = null
    if (backup.exportedAt) {
      const d = new Date(backup.exportedAt)
      lastBackup = isNaN(d.getTime()) ? null : d.toLocaleString('es-ES')
    }
    return {
      exists: true,
      size: sizeKB < 1024 ? `${sizeKB} KB` : `${(sizeKB / 1024).toFixed(1)} MB`,
      lastBackup,
    }
  } catch {
    return { exists: false, size: '0 B', lastBackup: null }
  }
}
