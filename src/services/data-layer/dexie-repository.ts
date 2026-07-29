import type { Table } from 'dexie'
import type { Repository, Filter, QueryOptions } from './types'

/**
 * Adaptador genérico Repository → Dexie Table.
 * Convierte llamadas del data layer a operaciones Dexie nativas.
 */
export class DexieRepository<T extends { id: string }> implements Repository<T> {
  private table: Table<T, string>
  constructor(table: Table<T, string>) {
    this.table = table
  }

  async getAll(options?: QueryOptions<T>): Promise<T[]> {
    let collection = this.table as any

    if (options) {
      if (options.filters && options.filters.length > 0) {
        let chain = this.table
        for (const f of options.filters) {
          chain = this.applyFilter(chain, f)
        }
        collection = chain
      }
      if (options.orderBy) {
        const dir = options.orderBy.direction === 'desc' ? 'desc' : undefined
        collection = collection.orderBy(options.orderBy.field as string)
        if (dir) collection = collection.reverse()
      }
    }

    const result = await collection.toArray()
    let items = result as T[]

    if (options) {
      if (options.offset) items = items.slice(options.offset)
      if (options.limit) items = items.slice(0, options.limit)
    }

    return items
  }

  async getById(id: string): Promise<T | undefined> {
    return this.table.get(id)
  }

  async create(item: T): Promise<string> {
    await this.table.add(item)
    return item.id
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    await this.table.update(id, changes as any)
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id)
  }

  async count(options?: { filters?: Filter<T>[] }): Promise<number> {
    if (!options?.filters || options.filters.length === 0) {
      return this.table.count()
    }
    let chain = this.table
    for (const f of options.filters) {
      chain = this.applyFilter(chain, f)
    }
    return chain.count()
  }

  async getByField(field: keyof T & string, value: unknown): Promise<T[]> {
    return this.table
      .where(field as string)
      .equals(value as any)
      .toArray()
  }

  async countByField(field: keyof T & string, value: unknown): Promise<number> {
    return this.table
      .where(field as string)
      .equals(value as any)
      .count()
  }

  private applyFilter(collection: any, filter: Filter<T>): any {
    const field = filter.field as string
    switch (filter.operator) {
      case 'eq':
        return collection.where(field).equals(filter.value as any)
      case 'neq': {
        const val = filter.value
        return collection.filter((item: any) => item[field] !== val)
      }
      case 'gt':
        return collection.where(field).above(filter.value as any)
      case 'gte':
        return collection.where(field).aboveOrEqual(filter.value as any)
      case 'lt':
        return collection.where(field).below(filter.value as any)
      case 'lte':
        return collection.where(field).belowOrEqual(filter.value as any)
      case 'in':
        return collection.where(field).anyOf(filter.value as any[])
      case 'contains':
        return collection.filter((item: any) =>
          String(item[field] ?? '').includes(String(filter.value)),
        )
      case 'startsWith':
        return collection.filter((item: any) =>
          String(item[field] ?? '').startsWith(String(filter.value)),
        )
      default:
        return collection
    }
  }
}
