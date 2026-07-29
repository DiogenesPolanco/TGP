import type {
  DatabaseBackend,
  Repository,
  Filter,
  QueryOptions,
  BackendType,
  RemotePgConnection,
} from './types'

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

/* ───────────── Cliente WebSocket request/response ───────────── */
interface PendingRequest {
  resolve: (data: any) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

class WsRpcClient {
  private ws: WebSocket | null = null
  private pending = new Map<string, PendingRequest>()
  private reqCounter = 0
  private connected = false
  private connectPromise: Promise<void> | null = null
  private _onDisconnect: (() => void) | null = null

  set onDisconnect(cb: (() => void) | null) {
    this._onDisconnect = cb
  }

  async connect(url: string, config: RemotePgConnection, timeoutMs = 10000): Promise<void> {
    if (this.connectPromise) return this.connectPromise

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.cleanup()
        reject(new Error(`Timeout conectando a ${url}`))
      }, timeoutMs)

      try {
        this.ws = new WebSocket(url)
      } catch (err) {
        clearTimeout(timer)
        this.connectPromise = null
        reject(err)
        return
      }

      this.ws.onopen = () => {
        const connectMsg = {
          type: 'connect',
          config: {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl,
          },
        }
        this.ws!.send(JSON.stringify(connectMsg))
      }

      this.ws.onmessage = (event) => {
        let data: any
        try {
          data = JSON.parse(event.data as string)
        } catch {
          return
        }

        if (data.type === 'connected') {
          clearTimeout(timer)
          this.connected = true
          resolve()
        } else if (data.type === 'error' && data.id === undefined) {
          clearTimeout(timer)
          this.cleanup()
          reject(new Error(data.message || 'Error de conexión'))
        } else if (data.type === 'response' && data.id) {
          const pending = this.pending.get(data.id)
          if (pending) {
            clearTimeout(pending.timer)
            this.pending.delete(data.id)
            pending.resolve(data)
          }
        } else if (data.type === 'error' && data.id) {
          const pending = this.pending.get(data.id)
          if (pending) {
            clearTimeout(pending.timer)
            this.pending.delete(data.id)
            pending.reject(new Error(data.message || 'Error del proxy'))
          }
        }
      }

      this.ws.onerror = () => {
        clearTimeout(timer)
        this.cleanup()
        reject(new Error(`Error de WebSocket al conectar a ${url}`))
      }

      this.ws.onclose = () => {
        this.connected = false
        this.ws = null
        this.connectPromise = null
        // Rechazar todas las pendientes
        for (const [, p] of this.pending) {
          clearTimeout(p.timer)
          p.reject(new Error('Conexión cerrada'))
        }
        this.pending.clear()
        if (this._onDisconnect) this._onDisconnect()
      }
    })

    return this.connectPromise
  }

  async request(sql: string, params: any[] = []): Promise<any> {
    if (!this.ws || !this.connected) {
      throw new Error('No conectado al proxy')
    }

    const id = `r${++this.reqCounter}_${Date.now()}`
    return new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error('Timeout en query'))
      }, 30000)

      this.pending.set(id, { resolve, reject, timer })
      this.ws!.send(JSON.stringify({ type: 'request', id, sql, params }))
    })
  }

  close() {
    this.cleanup()
  }

  private cleanup() {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer)
      p.reject(new Error('Cliente cerrado'))
    }
    this.pending.clear()
    this.connected = false
    this.connectPromise = null
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }
}

/* ───────────── RemoteRepository ───────────── */
class RemoteRepository<T extends { id: string }> implements Repository<T> {
  private rpc: WsRpcClient
  private tbl: string

  constructor(rpc: WsRpcClient, tableName: string) {
    this.rpc = rpc
    this.tbl = tableName
  }

  async getAll(options?: QueryOptions<T>): Promise<T[]> {
    let sql = `SELECT id, data FROM ${escapeIdent(this.tbl)}`
    const params: any[] = []
    const conditions: string[] = []

    if (options?.filters) {
      for (const f of options.filters) {
        switch (f.operator) {
          case 'eq':
            conditions.push(`data->>'${f.field}' = $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'neq':
            conditions.push(`data->>'${f.field}' != $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'gt':
            conditions.push(`(data->>'${f.field}')::numeric > $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'gte':
            conditions.push(`(data->>'${f.field}')::numeric >= $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'lt':
            conditions.push(`(data->>'${f.field}')::numeric < $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'lte':
            conditions.push(`(data->>'${f.field}')::numeric <= $${params.length + 1}`)
            params.push(String(f.value))
            break
          case 'in': {
            const vals = f.value as any[]
            const ph = vals.map((_, i) => `$${params.length + i + 1}`)
            conditions.push(`data->>'${f.field}' IN (${ph.join(',')})`)
            params.push(...vals.map(String))
            break
          }
          case 'contains':
            conditions.push(`data->>'${f.field}' ILIKE $${params.length + 1}`)
            params.push(`%${f.value}%`)
            break
          case 'startsWith':
            conditions.push(`data->>'${f.field}' ILIKE $${params.length + 1}`)
            params.push(`${f.value}%`)
            break
        }
      }
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
    if (options?.orderBy) {
      const dir = options.orderBy.direction === 'desc' ? 'DESC' : 'ASC'
      sql += ` ORDER BY data->>'${options.orderBy.field}' ${dir}`
    }
    if (options?.limit) sql += ` LIMIT ${options.limit}`
    if (options?.offset) sql += ` OFFSET ${options.offset}`

    const res = await this.rpc.request(sql, params)
    return (res.rows || []).map((r: any) => {
      const item = typeof r.data === 'string' ? JSON.parse(r.data) : r.data
      return { id: r.id, ...item } as T
    })
  }

  async getById(id: string): Promise<T | undefined> {
    const res = await this.rpc.request(
      `SELECT id, data FROM ${escapeIdent(this.tbl)} WHERE id = $1`,
      [id],
    )
    if (!res.rows || res.rows.length === 0) return undefined
    const r = res.rows[0]
    const item = typeof r.data === 'string' ? JSON.parse(r.data) : r.data
    return { id: r.id, ...item } as T
  }

  async create(item: T): Promise<string> {
    await this.rpc.request(
      `INSERT INTO ${escapeIdent(this.tbl)} (id, data) VALUES ($1, $2::jsonb)`,
      [item.id, JSON.stringify(item)],
    )
    return item.id
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    const existing = await this.getById(id)
    if (!existing) return
    const merged = { ...existing, ...changes }
    await this.rpc.request(
      `UPDATE ${escapeIdent(this.tbl)} SET data = $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [id, JSON.stringify(merged)],
    )
  }

  async delete(id: string): Promise<void> {
    await this.rpc.request(`DELETE FROM ${escapeIdent(this.tbl)} WHERE id = $1`, [id])
  }

  async count(options?: { filters?: Filter<T>[] }): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${escapeIdent(this.tbl)}`
    const params: any[] = []
    if (options?.filters) {
      const conds = options.filters.map((f, i) => `data->>'${f.field}' = $${i + 1}`)
      params.push(...options.filters.map((f) => String(f.value)))
      sql += ' WHERE ' + conds.join(' AND ')
    }
    const res = await this.rpc.request(sql, params)
    return Number(res.rows?.[0]?.count ?? 0)
  }

  async getByField(field: keyof T & string, value: unknown): Promise<T[]> {
    const res = await this.rpc.request(
      `SELECT id, data FROM ${escapeIdent(this.tbl)} WHERE data->>'${field}' = $1`,
      [String(value)],
    )
    return (res.rows || []).map((r: any) => {
      const item = typeof r.data === 'string' ? JSON.parse(r.data) : r.data
      return { id: r.id, ...item } as T
    })
  }

  async countByField(field: keyof T & string, value: unknown): Promise<number> {
    const res = await this.rpc.request(
      `SELECT COUNT(*) as count FROM ${escapeIdent(this.tbl)} WHERE data->>'${field}' = $1`,
      [String(value)],
    )
    return Number(res.rows?.[0]?.count ?? 0)
  }
}

/* ───────────── RemoteBackend ───────────── */
export class RemoteBackend implements DatabaseBackend {
  readonly name = 'remote-pg' as BackendType
  readonly label = 'PostgreSQL Remoto'
  readonly description = 'Conecta a un servidor PostgreSQL externo vía proxy WebSocket'

  private rpc = new WsRpcClient()
  private repos = new Map<string, Repository<any>>()
  private config: RemotePgConnection | null = null

  constructor(config?: RemotePgConnection) {
    if (config) this.config = config
  }

  setConfig(config: RemotePgConnection) {
    this.config = config
  }

  async initialize(): Promise<void> {
    const cfg = this.config
    if (!cfg) throw new Error('RemoteBackend requiere config.host, database, user')

    await this.rpc.connect(cfg.proxyUrl, cfg)
    this.rpc.onDisconnect = () => {
      this.repos.clear()
    }

    // Crear tablas si no existen (mismo esquema JSONB que PGliteBackend)
    for (const name of TABLE_NAMES) {
      const ident = escapeIdent(name)
      await this.rpc.request(`
        CREATE TABLE IF NOT EXISTS ${ident} (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
    }
  }

  getRepository<T extends { id: string }>(tableName: string): Repository<T> {
    if (!this.repos.has(tableName)) {
      this.repos.set(tableName, new RemoteRepository<T>(this.rpc, tableName))
    }
    return this.repos.get(tableName)!
  }

  async exportAll(): Promise<Record<string, Record<string, unknown>[]>> {
    const result: Record<string, Record<string, unknown>[]> = {}
    for (const name of TABLE_NAMES) {
      const res = await this.rpc.request(
        `SELECT data FROM ${escapeIdent(name)} ORDER BY updated_at`,
      )
      result[name] = (res.rows || []).map((r: any) => {
        const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data
        return data as Record<string, unknown>
      })
    }
    return result
  }

  async importAll(data: Record<string, Record<string, unknown>[]>): Promise<void> {
    for (const [name, rows] of Object.entries(data)) {
      if (!TABLE_NAMES.includes(name)) continue
      const ident = escapeIdent(name)
      for (const row of rows) {
        await this.rpc.request(
          `INSERT INTO ${ident} (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
          [String(row.id), JSON.stringify(row)],
        )
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.rpc.request('SELECT 1')
      return true
    } catch {
      return false
    }
  }

  async destroy(): Promise<void> {
    this.repos.clear()
    this.rpc.close()
  }
}
