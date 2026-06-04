import { db } from '@/services/db/database'

const BACKUP_STORAGE_KEY = 'tgp-db-backup'

export interface DatabaseBackup {
  version: string
  exportedAt: string
  tables: Record<string, Record<string, unknown>[]>
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

async function getTableData(tableName: string): Promise<Record<string, unknown>[]> {
  const dbAny = db as any
  if (typeof dbAny[tableName]?.toArray === 'function') {
    return await dbAny[tableName].toArray()
  }
  return []
}

// ─── Date helpers ─────────────────────────────────────────────────────

/** Keys whose string values are likely ISO date strings stored by Dexie. */
const DATE_KEYS = new Set([
  'date', 'startDate', 'endDate', 'dueDate', 'commitmentDate',
  'eolDate', 'periodStart', 'periodEnd', 'supportEndDate',
  'targetDate', 'slaDeadline',
  'createdAt', 'updatedAt', 'exportedAt',
  'detectedAt', 'respondedAt', 'resolvedAt', 'escalatedAt',
])

/** Rough ISO 8601 check — catches "2026-01-15" and "2026-01-15T00:00:00.000Z". */
function isIsoDateString(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(value)
}

/**
 * Reviver for JSON.stringify that wraps ISO date strings
 * (and actual Date objects) with a `{__date: …}` marker so the
 * import side can revive them back to Date instances.
 */
function dateReviver(_key: string, value: unknown): unknown {
  if (value instanceof Date) return { __date: value.toISOString() }
  if (DATE_KEYS.has(_key) && isIsoDateString(value)) {
    return { __date: value as string }
  }
  return value
}

function isDateObject(value: unknown): value is { __date: string } {
  return typeof value === 'object' && value !== null && '__date' in (value as Record<string, unknown>)
}

// ─── Export ──────────────────────────────────────────────────────────

export async function exportDatabase(): Promise<DatabaseBackup> {
  const tables: Record<string, Record<string, unknown>[]> = {}

  await Promise.all(
    TABLE_NAMES.map(async (name) => {
      tables[name] = await getTableData(name)
    })
  )

  const backup: DatabaseBackup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tables,
  }

  return backup
}

export function downloadBackup(backup: DatabaseBackup, filename?: string) {
  const json = JSON.stringify(backup, dateReviver, 2)

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `tgp-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
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

function reviveDatesDeep(obj: unknown, parentKey?: string): unknown {
  // Backward compat: bare ISO date string on a known date key → revive
  if (parentKey && DATE_KEYS.has(parentKey) && isIsoDateString(obj)) {
    return new Date(obj as string)
  }
  // Date already revived by JSON.parse — return as-is
  if (obj instanceof Date) return obj
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map((item) => reviveDatesDeep(item))

  const asRecord = obj as Record<string, unknown>

  // Detect our serialized date marker
  if ('__date' in asRecord && typeof asRecord.__date === 'string' && Object.keys(asRecord).length === 1) {
    return new Date(asRecord.__date)
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

  for (const tableName of IMPORT_ORDER) {
    const rawRecords = backup.tables[tableName]
    if (!rawRecords || rawRecords.length === 0) continue

    // Revive dates deeply and cast
    const records = rawRecords.map((r) => reviveDatesDeep(r)) as Record<string, unknown>[]
    const dbAny = db as any
    const table = dbAny[tableName]
    if (!table || typeof table.put !== 'function') {
      errors.push(`${tableName}: table not found or no put() method`)
      continue
    }

    let restoredCount = 0
    let failedCount = 0

    // Try bulkPut first (fast path)
    try {
      await table.bulkPut(records)
      restoredCount = records.length
    } catch (_bulkErr) {
      // Fall back to individual puts for maximum recovery
      for (const record of records) {
        try {
          await table.put(record)
          restoredCount++
        } catch (recErr) {
          failedCount++
          errors.push(`${tableName}[id=${record.id ?? '?'}]: ${recErr instanceof Error ? recErr.message : String(recErr)}`)
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

export function loadBackupFromStorage(): DatabaseBackup | null {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw, (_key, value) => {
      if (isDateObject(value)) {
        return new Date(value.__date)
      }
      if (DATE_KEYS.has(_key) && isIsoDateString(value)) {
        return new Date(value)
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
    const sizeKB = Math.round((new Blob([raw]).size) / 1024)
    return {
      exists: true,
      size: sizeKB < 1024 ? `${sizeKB} KB` : `${(sizeKB / 1024).toFixed(1)} MB`,
      lastBackup: backup.exportedAt
        ? new Date(backup.exportedAt).toLocaleString('es-ES')
        : null,
    }
  } catch {
    return { exists: false, size: '0 B', lastBackup: null }
  }
}
