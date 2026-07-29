/* ──────────────────────────────────────────────
 * Data Layer — tipos base para repositorios
 * ────────────────────────────────────────────── */

/** Operadores de filtro compatibles con múltiples backends */
export type FilterOperator =
  'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith'

export interface Filter<T> {
  field: keyof T & string
  operator: FilterOperator
  value: unknown
}

export interface OrderBy<T> {
  field: keyof T & string
  direction?: 'asc' | 'desc'
}

export interface QueryOptions<T> {
  filters?: Filter<T>[]
  orderBy?: OrderBy<T>
  limit?: number
  offset?: number
}

/** Interfaz genérica de repositorio — TODOS los backends la implementan */
export interface Repository<T extends { id: string }> {
  getAll(options?: QueryOptions<T>): Promise<T[]>
  getById(id: string): Promise<T | undefined>
  create(item: T): Promise<string>
  update(id: string, changes: Partial<T>): Promise<void>
  delete(id: string): Promise<void>
  count(options?: { filters?: Filter<T>[] }): Promise<number>

  /** Utilidades para consultas comunes sin filters tipados */
  getByField(field: keyof T & string, value: unknown): Promise<T[]>
  countByField(field: keyof T & string, value: unknown): Promise<number>
}

/** Interfaz que cada backend debe implementar */
export interface DatabaseBackend {
  readonly name: string
  readonly label: string
  readonly description: string

  /** Inicializa la conexión / WASM / lo que corresponda */
  initialize(): Promise<void>

  /** Crea un repositorio para una tabla */
  getRepository<T extends { id: string }>(tableName: string): Repository<T>

  /** Exporta TODOS los datos del backend (para migración) */
  exportAll(): Promise<Record<string, Record<string, unknown>[]>>

  /** Importa datos en el backend */
  importAll(data: Record<string, Record<string, unknown>[]>): Promise<void>

  /** Health check */
  isHealthy(): Promise<boolean>

  /** Libera recursos */
  destroy(): Promise<void>
}

/** Backends locales */
export type BackendType = 'dexie' | 'pglite' | 'sqljs' | 'remote-pg'

/** Conexión a PostgreSQL externo vía proxy WebSocket */
export interface RemotePgConnection {
  proxyUrl: string // "ws://host:9876" — URL del proxy WebSocket
  host: string // "db.example.com"
  port: number // 5432
  database: string // "tgp"
  user: string // "postgres"
  password: string
  ssl: boolean
}

export interface DataLayerConfig {
  backend: BackendType
  autoInitialize: boolean
  /** Config de conexión remota (solo para 'remote-pg') */
  remotePg?: RemotePgConnection
}

export const DEFAULT_CONFIG: DataLayerConfig = {
  backend: 'dexie',
  autoInitialize: true,
}

export const DEFAULT_REMOTE_PG: RemotePgConnection = {
  proxyUrl: 'ws://localhost:9876',
  host: 'localhost',
  port: 5432,
  database: 'tgp',
  user: 'postgres',
  password: '',
  ssl: false,
}
