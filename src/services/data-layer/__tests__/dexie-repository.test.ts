import { describe, it, expect, beforeEach } from 'vitest'
import Dexie, { type Table } from 'dexie'
import { DexieRepository } from '../dexie-repository'

interface TestEntity {
  id: string
  name: string
  age: number
  status: string
}

function createTestDb() {
  const db = new Dexie('TestDb')
  db.version(1).stores({
    testEntities: 'id, name, age, status',
  })
  return db
}

describe('DexieRepository', () => {
  let table: Table<TestEntity, string>
  let repo: DexieRepository<TestEntity>

  beforeEach(async () => {
    const db = createTestDb()
    table = db.table('testEntities')
    repo = new DexieRepository(table)
    await table.clear()
    await table.bulkAdd([
      { id: '1', name: 'Alice', age: 30, status: 'active' },
      { id: '2', name: 'Bob', age: 25, status: 'active' },
      { id: '3', name: 'Charlie', age: 35, status: 'inactive' },
      { id: '4', name: 'Diana', age: 28, status: 'active' },
    ])
  })

  it('getAll returns all items', async () => {
    const items = await repo.getAll()
    expect(items).toHaveLength(4)
  })

  it('getById returns item by id', async () => {
    const item = await repo.getById('1')
    expect(item).toBeDefined()
    expect(item!.name).toBe('Alice')
  })

  it('getById returns undefined for missing id', async () => {
    const item = await repo.getById('nonexistent')
    expect(item).toBeUndefined()
  })

  it('create adds a new item', async () => {
    const newItem: TestEntity = { id: '5', name: 'Eve', age: 32, status: 'active' }
    const id = await repo.create(newItem)
    expect(id).toBe('5')
    const saved = await repo.getById('5')
    expect(saved).toBeDefined()
    expect(saved!.name).toBe('Eve')
  })

  it('update modifies existing item', async () => {
    await repo.update('1', { name: 'Alicia', age: 31 })
    const updated = await repo.getById('1')
    expect(updated!.name).toBe('Alicia')
    expect(updated!.age).toBe(31)
    expect(updated!.status).toBe('active')
  })

  it('delete removes item', async () => {
    await repo.delete('1')
    const item = await repo.getById('1')
    expect(item).toBeUndefined()
    const items = await repo.getAll()
    expect(items).toHaveLength(3)
  })

  it('count returns total count', async () => {
    const count = await repo.count()
    expect(count).toBe(4)
  })

  it('count with filters', async () => {
    const count = await repo.count({
      filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    })
    expect(count).toBe(3)
  })

  it('getByField filters by field', async () => {
    const items = await repo.getByField('name', 'Bob')
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('2')
  })

  it('countByField counts by field', async () => {
    const count = await repo.countByField('status', 'active')
    expect(count).toBe(3)
  })

  it('getAll with eq filter', async () => {
    const items = await repo.getAll({
      filters: [{ field: 'age', operator: 'gte', value: 30 }],
    })
    expect(items).toHaveLength(2)
  })

  it('getAll with in filter', async () => {
    const items = await repo.getAll({
      filters: [{ field: 'name', operator: 'in', value: ['Alice', 'Bob'] }],
    })
    expect(items).toHaveLength(2)
  })

  it('getAll with orderBy', async () => {
    const items = await repo.getAll({
      orderBy: { field: 'age', direction: 'desc' },
    })
    expect(items[0].id).toBe('3')
    expect(items[1].id).toBe('1')
  })

  it('getAll with limit and offset', async () => {
    const items = await repo.getAll({
      orderBy: { field: 'age' },
      limit: 2,
      offset: 1,
    })
    expect(items).toHaveLength(2)
    expect(items[0].name).toBe('Diana')
  })

  it('getAll with lt filter', async () => {
    const items = await repo.getAll({
      filters: [{ field: 'age', operator: 'lt', value: 30 }],
    })
    expect(items).toHaveLength(2)
    expect(items.map((i) => i.name).sort()).toEqual(['Bob', 'Diana'])
  })

  it('getAll with lte filter', async () => {
    const items = await repo.getAll({
      filters: [{ field: 'age', operator: 'lte', value: 30 }],
    })
    expect(items).toHaveLength(3)
  })

  it('getAll with contains filter', async () => {
    const items = await repo.getAll({
      filters: [{ field: 'name', operator: 'contains', value: 'li' }],
    })
    expect(items).toHaveLength(2)
    expect(items.map((i) => i.name).sort()).toEqual(['Alice', 'Charlie'])
  })

  it('getAll with startsWith filter', async () => {
    const items = await repo.getAll({
      filters: [{ field: 'name', operator: 'startsWith', value: 'A' }],
    })
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Alice')
  })

  it('getAll with unknown filter operator returns default', async () => {
    const items = await repo.getAll({
      filters: [{ field: 'age', operator: 'unknown' as any, value: 30 }],
    })
    expect(items).toHaveLength(4)
  })
})
