import { PGlite, type PGliteInterface } from '@electric-sql/pglite'
import { live } from '@electric-sql/pglite/live'
import type { PGliteWithLive } from '@electric-sql/pglite/live'
import type { DatabaseBackend, Repository, Filter, QueryOptions, BackendType } from './types'

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
  'candidates',
  'candidateTechnologies',
  'candidateEvaluations',
  'vulnerabilityMicroservices',
  'incidentMicroservices',
  'auditFindingMicroservices',
  'riskMicroservices',
  'appDatabaseMicroservices',
  'equipment',
  'equipmentAssignments',
  'equipmentTickets',
  'aiConversations',
  'aiMessages',
]

function toSnake(name: string): string {
  return name.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)
}

function escapeIdent(name: string): string {
  return `"${toSnake(name)}"`
}

class PGliteRepository<T extends { id: string }> implements Repository<T> {
  private db: PGliteInterface
  private tbl: string

  constructor(db: PGliteInterface, tableName: string) {
    this.db = db
    this.tbl = tableName
  }

  async getAll(options?: QueryOptions<T>): Promise<T[]> {
    let sql = `SELECT id, data FROM ${escapeIdent(this.tbl)}`
    const params: any[] = []
    const conditions: string[] = []

    if (options?.filters) {
      for (const f of options.filters) {
        const col = f.field
        switch (f.operator) {
          case 'eq':
            conditions.push(`data->>'${col}' = $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'neq':
            conditions.push(`data->>'${col}' != $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'gt':
            conditions.push(`(data->>'${col}')::numeric > $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'gte':
            conditions.push(`(data->>'${col}')::numeric >= $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'lt':
            conditions.push(`(data->>'${col}')::numeric < $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'lte':
            conditions.push(`(data->>'${col}')::numeric <= $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'in': {
            const vals = f.value as any[]
            const placeholders = vals.map((_, i) => `$${params.length + i + 1}`)
            conditions.push(`data->>'${col}' IN (${placeholders.join(',')})`)
            params.push(...vals.map(String))
            break
          }
          case 'contains':
            conditions.push(`data->>'${col}' ILIKE $${params.length + 1}`)
            params.push(`%${f.value}%`)
            break
          case 'startsWith':
            conditions.push(`data->>'${col}' ILIKE $${params.length + 1}`)
            params.push(`${f.value}%`)
            break
        }
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    if (options?.orderBy) {
      const dir = options.orderBy.direction === 'desc' ? 'DESC' : 'ASC'
      sql += ` ORDER BY data->>'${options.orderBy.field}' ${dir}`
    }

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`
    }
    if (options?.offset) {
      sql += ` OFFSET ${options.offset}`
    }

    const result = await this.db.query(sql, params)
    return this.rowsToItems(result.rows as any[])
  }

  async getById(id: string): Promise<T | undefined> {
    const result = await this.db.query(
      `SELECT id, data FROM ${escapeIdent(this.tbl)} WHERE id = $1`,
      [id],
    )
    const rows = result.rows as any[]
    if (rows.length === 0) return undefined
    return this.rowToItem(rows[0]) as T
  }

  async create(item: T): Promise<string> {
    await this.db.query(`INSERT INTO ${escapeIdent(this.tbl)} (id, data) VALUES ($1, $2::jsonb)`, [
      item.id,
      JSON.stringify(item),
    ])
    return item.id
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    const existing = await this.getById(id)
    if (!existing) return
    const merged = { ...existing, ...changes }
    await this.db.query(
      `UPDATE ${escapeIdent(this.tbl)} SET data = $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [id, JSON.stringify(merged)],
    )
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM ${escapeIdent(this.tbl)} WHERE id = $1`, [id])
  }

  async count(options?: { filters?: Filter<T>[] }): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${escapeIdent(this.tbl)}`
    const params: any[] = []

    if (options?.filters) {
      const conditions: string[] = []
      for (const f of options.filters) {
        conditions.push(`data->>'${f.field}' = $${params.length + 1}`)
        params.push(String(f.value))
      }
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    const result = await this.db.query(sql, params)
    return Number((result.rows as any[])[0]?.count ?? 0)
  }

  async getByField(field: keyof T & string, value: unknown): Promise<T[]> {
    const result = await this.db.query(
      `SELECT id, data FROM ${escapeIdent(this.tbl)} WHERE data->>'${field}' = $1`,
      [String(value)],
    )
    return this.rowsToItems(result.rows as any[])
  }

  async countByField(field: keyof T & string, value: unknown): Promise<number> {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM ${escapeIdent(this.tbl)} WHERE data->>'${field}' = $1`,
      [String(value)],
    )
    return Number((result.rows as any[])[0]?.count ?? 0)
  }

  private rowToItem(row: { id: string; data: any }): any {
    if (typeof row.data === 'string') {
      return { id: row.id, ...JSON.parse(row.data) }
    }
    return { id: row.id, ...row.data }
  }

  private rowsToItems(rows: { id: string; data: any }[]): any[] {
    return rows.map((r) => this.rowToItem(r))
  }
}

export class PGliteBackend implements DatabaseBackend {
  readonly name = 'pglite' as BackendType
  readonly label = 'PostgreSQL (PGlite)'
  readonly description = 'PostgreSQL real corriendo en WebAssembly dentro del navegador'

  private db: PGliteWithLive | null = null

  /** Acceso a la API `live.query` para suscripciones en tiempo real */
  get live(): PGliteWithLive['live'] | null {
    return this.db?.live ?? null
  }
  private repos = new Map<string, Repository<any>>()
  private dataDir?: string

  constructor(dataDir?: string) {
    this.dataDir = dataDir
  }

  async initialize(): Promise<void> {
    const opts = this.dataDir
      ? { dataDir: this.dataDir, extensions: { live } }
      : { extensions: { live } }
    this.db = new PGlite(opts) as unknown as PGliteWithLive
    await this.db.ready

    for (const name of TABLE_NAMES) {
      const ident = escapeIdent(name)
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ${ident} (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_${toSnake(name)}_updated_at
        ON ${ident} (updated_at)
      `)
    }
  }

  getRepository<T extends { id: string }>(tableName: string): Repository<T> {
    if (!this.db) throw new Error('PGliteBackend no inicializado — llama initialize() primero')
    if (!this.repos.has(tableName)) {
      this.repos.set(tableName, new PGliteRepository<T>(this.db, tableName))
    }
    return this.repos.get(tableName)!
  }

  async exportAll(): Promise<Record<string, Record<string, unknown>[]>> {
    if (!this.db) throw new Error('PGliteBackend no inicializado')
    const result: Record<string, Record<string, unknown>[]> = {}
    for (const name of TABLE_NAMES) {
      const r = await this.db.query(`SELECT data FROM ${escapeIdent(name)} ORDER BY updated_at`)
      result[name] = (r.rows as any[]).map((row: any) => {
        const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
        return data as Record<string, unknown>
      })
    }
    return result
  }

  async importAll(data: Record<string, Record<string, unknown>[]>): Promise<void> {
    if (!this.db) throw new Error('PGliteBackend no inicializado')
    for (const [name, rows] of Object.entries(data)) {
      if (!TABLE_NAMES.includes(name)) continue
      const ident = escapeIdent(name)
      for (const row of rows) {
        await this.db.query(
          `INSERT INTO ${ident} (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
          [String(row.id), JSON.stringify(row)],
        )
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.db) return false
    try {
      await this.db.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }

  async destroy(): Promise<void> {
    this.repos.clear()
    if (this.db && !this.db.closed) {
      await this.db.close()
    }
    this.db = null
  }
}
