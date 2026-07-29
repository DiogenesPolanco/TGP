import { TGPDatabase, db as dexieDb } from '@/services/db/database'
import type { DatabaseBackend, Repository } from './types'
import { DexieRepository } from './dexie-repository'

export class DexieBackend implements DatabaseBackend {
  readonly name = 'dexie'
  readonly label = 'IndexedDB (Dexie)'
  readonly description = 'Base de datos local en el navegador — no requiere servidor'

  private db: TGPDatabase
  private repos = new Map<string, Repository<any>>()

  constructor() {
    this.db = dexieDb
  }

  async initialize(): Promise<void> {
    this.db.open()
  }

  getRepository<T extends { id: string }>(tableName: string): Repository<T> {
    if (!this.repos.has(tableName)) {
      const table = (this.db as any)[tableName]
      if (!table) {
        throw new Error(`Tabla "${tableName}" no existe en Dexie`)
      }
      this.repos.set(tableName, new DexieRepository<T>(table))
    }
    return this.repos.get(tableName)!
  }

  async exportAll(): Promise<Record<string, Record<string, unknown>[]>> {
    const tables = this.db.tables.map((t) => t.name)
    const result: Record<string, Record<string, unknown>[]> = {}
    for (const name of tables) {
      const repo = this.getRepository(name)
      result[name] = await repo.getAll()
    }
    return result
  }

  async importAll(data: Record<string, Record<string, unknown>[]>): Promise<void> {
    for (const [tableName, rows] of Object.entries(data)) {
      const table = (this.db as any)[tableName]
      if (table) {
        await table.bulkAdd(rows, { allKeys: true })
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.db.table('tenants').count()
      return true
    } catch {
      return false
    }
  }

  async destroy(): Promise<void> {
    this.repos.clear()
    this.db.close()
  }
}
