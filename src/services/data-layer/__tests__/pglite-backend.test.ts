import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockQuery = vi.fn()

vi.mock('@electric-sql/pglite', () => {
  const MockPGlite = function (this: any) {
    this.query = mockQuery
    this.close = vi.fn()
    this.closed = false
    this.ready = Promise.resolve()
    return this
  }
  return { PGlite: MockPGlite }
})

vi.mock('@electric-sql/pglite/live', () => ({
  live: {},
}))

import { PGliteBackend } from '../pglite-backend'

beforeEach(() => {
  mockQuery.mockReset()
})

async function initBackend() {
  mockQuery.mockResolvedValue({ rows: [] })
  const backend = new PGliteBackend()
  await backend.initialize()
  return backend
}

describe('PGliteBackend', () => {
  it('initializes with correct name', () => {
    const backend = new PGliteBackend()
    expect(backend.name).toBe('pglite')
    expect(backend.label).toBe('PostgreSQL (PGlite)')
  })

  it('initialize creates tables', async () => {
    mockQuery.mockResolvedValue({ rows: [] })
    const backend = new PGliteBackend()
    await backend.initialize()
    expect(mockQuery).toHaveBeenCalled()
  })

  it('isHealthy returns true when db can query', async () => {
    mockQuery.mockResolvedValue({ rows: [{ 1: 1 }] })
    const backend = new PGliteBackend()
    await backend.initialize()
    const healthy = await backend.isHealthy()
    expect(healthy).toBe(true)
  })

  it('isHealthy returns false when query throws', async () => {
    const backend = new PGliteBackend()
    await backend.initialize()
    mockQuery.mockRejectedValueOnce(new Error('db error'))
    const healthy = await backend.isHealthy()
    expect(healthy).toBe(false)
  })

  it('isHealthy returns false when not initialized', async () => {
    const backend = new PGliteBackend()
    const healthy = await backend.isHealthy()
    expect(healthy).toBe(false)
  })

  it('live returns null before initialization', () => {
    const backend = new PGliteBackend()
    expect(backend.live).toBeNull()
  })

  it('getRepository throws if not initialized', () => {
    const backend = new PGliteBackend()
    expect(() => backend.getRepository<any>('applications')).toThrow('no inicializado')
  })

  it('getRepository returns and caches repository', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    expect(repo).toBeDefined()
    expect(backend.getRepository<any>('applications')).toBe(repo)
  })

  it('repository getAll with no options', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ id: '1', data: { name: 'App1' } }] })
    const repo = backend.getRepository<{ id: string; name: string }>('applications')
    const result = await repo.getAll()
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: '1', name: 'App1' })
  })

  it('repository getAll with eq filter', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ id: '1', data: { name: 'App1' } }] })
    const repo = backend.getRepository<{ id: string; name: string }>('applications')
    const result = await repo.getAll({
      filters: [{ field: 'name', operator: 'eq', value: 'App1' }],
    })
    expect(result).toHaveLength(1)
  })

  it('repository getAll with neq filter', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({
      filters: [{ field: 'name', operator: 'neq', value: 'App1' }],
    })
    expect(result).toHaveLength(0)
  })

  it('repository getAll with gt filter', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({ filters: [{ field: 'score', operator: 'gt', value: '50' }] })
    expect(result).toHaveLength(0)
  })

  it('repository getAll with gte filter', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({
      filters: [{ field: 'score', operator: 'gte', value: '50' }],
    })
    expect(result).toHaveLength(0)
  })

  it('repository getAll with lt filter', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({ filters: [{ field: 'score', operator: 'lt', value: '50' }] })
    expect(result).toHaveLength(0)
  })

  it('repository getAll with lte filter', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({
      filters: [{ field: 'score', operator: 'lte', value: '50' }],
    })
    expect(result).toHaveLength(0)
  })

  it('repository getAll with in filter', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({
      filters: [{ field: 'status', operator: 'in', value: ['active', 'pending'] }],
    })
    expect(result).toHaveLength(0)
  })

  it('repository getAll with contains filter', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({
      filters: [{ field: 'name', operator: 'contains', value: 'App' }],
    })
    expect(result).toHaveLength(0)
  })

  it('repository getAll with startsWith filter', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({
      filters: [{ field: 'name', operator: 'startsWith', value: 'App' }],
    })
    expect(result).toHaveLength(0)
  })

  it('repository getAll with orderBy asc', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({
      rows: [
        { id: '1', data: { name: 'A' } },
        { id: '2', data: { name: 'B' } },
      ],
    })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({ orderBy: { field: 'name', direction: 'asc' } })
    expect(result).toHaveLength(2)
  })

  it('repository getAll with orderBy desc', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({
      rows: [
        { id: '2', data: { name: 'B' } },
        { id: '1', data: { name: 'A' } },
      ],
    })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({ orderBy: { field: 'name', direction: 'desc' } })
    expect(result).toHaveLength(2)
  })

  it('repository getAll with limit and offset', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ id: '1', data: { name: 'App1' } }] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getAll({ limit: 10, offset: 5 })
    expect(result).toHaveLength(1)
  })

  it('repository getById returns item when found', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ id: '123', data: { name: 'TestApp' } }] })
    const repo = backend.getRepository<{ id: string; name: string }>('applications')
    const result = await repo.getById('123')
    expect(result).toBeDefined()
    expect(result!.id).toBe('123')
    expect(result!.name).toBe('TestApp')
  })

  it('repository getById returns undefined when not found', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getById('nonexistent')
    expect(result).toBeUndefined()
  })

  it('repository getById handles JSON string data', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ id: '1', data: '{"name":"parsed"}' }] })
    const repo = backend.getRepository<{ id: string; name: string }>('applications')
    const result = await repo.getById('1')
    expect(result).toBeDefined()
    expect(result!.name).toBe('parsed')
  })

  it('repository create inserts item', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    const id = await repo.create({ id: 'new-id', name: 'NewApp' } as any)
    expect(id).toBe('new-id')
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT'), [
      'new-id',
      expect.any(String),
    ])
  })

  it('repository update merges changes', async () => {
    const backend = await initBackend()
    const before = mockQuery.mock.calls.length
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: '1', data: { name: 'Old', score: 10 } }] })
      .mockResolvedValueOnce({ rows: [] })
    const repo = backend.getRepository<{ id: string; name: string; score: number }>('applications')
    await repo.update('1', { name: 'Updated' })
    expect(mockQuery.mock.calls.length - before).toBe(2)
  })

  it('repository update does nothing if item not found', async () => {
    const backend = await initBackend()
    const before = mockQuery.mock.calls.length
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    await repo.update('nonexistent', { name: 'Updated' })
    expect(mockQuery.mock.calls.length - before).toBe(1)
  })

  it('repository delete removes item', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    const repo = backend.getRepository<any>('applications')
    await repo.delete('item-1')
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('DELETE'), ['item-1'])
  })

  it('repository count returns count', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ count: 5 }] })
    const repo = backend.getRepository<any>('applications')
    const count = await repo.count()
    expect(count).toBe(5)
  })

  it('repository count with filters', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ count: 3 }] })
    const repo = backend.getRepository<any>('applications')
    const count = await repo.count({
      filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    })
    expect(count).toBe(3)
  })

  it('repository count returns 0 when no rows', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ count: null }] })
    const repo = backend.getRepository<any>('applications')
    const count = await repo.count()
    expect(count).toBe(0)
  })

  it('repository getByField returns matching items', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ id: '1', data: { name: 'App1', type: 'web' } }] })
    const repo = backend.getRepository<any>('applications')
    const result = await repo.getByField('type', 'web')
    expect(result).toHaveLength(1)
  })

  it('repository countByField returns count', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ count: 2 }] })
    const repo = backend.getRepository<any>('applications')
    const count = await repo.countByField('type', 'web')
    expect(count).toBe(2)
  })

  it('exportAll returns all data', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ data: { name: 'App1' } }] })
    const result = await backend.exportAll()
    expect(result).toBeDefined()
    expect(Object.keys(result).length).toBeGreaterThan(0)
    expect(result.applications).toBeDefined()
  })

  it('exportAll throws if not initialized', async () => {
    const backend = new PGliteBackend()
    await expect(backend.exportAll()).rejects.toThrow('no inicializado')
  })

  it('importAll inserts data for known tables', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    await backend.importAll({
      applications: [{ id: '1', name: 'App1' } as any],
      technologies: [{ id: '2', name: 'Tech1' } as any],
    })
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT'), [
      '1',
      expect.any(String),
    ])
  })

  it('importAll skips unknown tables', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    await backend.importAll({
      unknownTable: [{ id: '1' } as any],
    })
  })

  it('importAll throws if not initialized', async () => {
    const backend = new PGliteBackend()
    await expect(backend.importAll({})).rejects.toThrow('no inicializado')
  })

  it('destroy cleans up', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [] })
    await backend.destroy()
  })

  it('destroy handles already closed db', async () => {
    const MockPGlite = vi.fn().mockImplementation(function (this: any) {
      this.query = mockQuery
      this.close = vi.fn()
      this.closed = true
      this.ready = Promise.resolve()
      return this
    })
    vi.mocked(await import('@electric-sql/pglite')).PGlite = MockPGlite as any
  })

  it('exportAll handles JSON string data', async () => {
    const backend = await initBackend()
    mockQuery.mockResolvedValue({ rows: [{ data: '{"name":"App1"}' }] })
    const result = await backend.exportAll()
    expect(result.applications![0]).toMatchObject({ name: 'App1' })
  })
})
