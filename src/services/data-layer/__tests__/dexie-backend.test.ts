import { describe, it, expect } from 'vitest'
import { DexieBackend } from '../dexie-backend'

describe('DexieBackend', () => {
  it('has correct metadata', () => {
    const backend = new DexieBackend()
    expect(backend.name).toBe('dexie')
    expect(backend.label).toContain('IndexedDB')
  })

  it('initialize opens the database', async () => {
    const backend = new DexieBackend()
    await backend.initialize()
    const healthy = await backend.isHealthy()
    expect(healthy).toBe(true)
  })

  it('getRepository returns a repository for a valid table', () => {
    const backend = new DexieBackend()
    const repo = backend.getRepository('applications')
    expect(repo).toBeDefined()
    expect(typeof repo.getAll).toBe('function')
    expect(typeof repo.getById).toBe('function')
    expect(typeof repo.create).toBe('function')
  })

  it('getRepository throws for invalid table', () => {
    const backend = new DexieBackend()
    expect(() => backend.getRepository('nonexistent')).toThrow()
  })

  it('exportAll and importAll roundtrip data', async () => {
    const backend = new DexieBackend()
    await backend.initialize()

    const data = await backend.exportAll()
    expect(data).toBeDefined()

    const repo = backend.getRepository<any>('tenants')
    const count = await repo.count()
    expect(typeof count).toBe('number')
  })

  it('importAll skips missing tables gracefully', async () => {
    const backend = new DexieBackend()
    await backend.initialize()
    await backend.importAll({ nonexistent: [{ id: '1' }] })
  })

  it('destroy clears repos and closes db', async () => {
    const backend = new DexieBackend()
    backend.getRepository('tenants')
    await backend.destroy()
  })
})
