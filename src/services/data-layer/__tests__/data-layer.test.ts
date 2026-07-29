import { describe, it, expect, beforeEach } from 'vitest'
import { getActiveBackendType, initializeDataLayer } from '../index'
import { useDataLayerStore } from '../store'

describe('DataLayer', () => {
  beforeEach(() => {
    useDataLayerStore.setState({
      config: { backend: 'dexie', autoInitialize: true },
      status: 'uninitialized',
      error: null,
    })
  })

  it('getActiveBackendType returns dexie by default', () => {
    expect(getActiveBackendType()).toBe('dexie')
  })

  it('initializeDataLayer sets status to ready', async () => {
    await initializeDataLayer()
    const state = useDataLayerStore.getState()
    expect(state.status).toBe('ready')
    expect(state.error).toBeNull()
  })

  it('data layer proxy returns repositories', async () => {
    const { dataLayer } = await import('../index')
    expect(dataLayer.applications).toBeDefined()
    expect(typeof dataLayer.applications.getAll).toBe('function')
    expect(typeof dataLayer.applications.getById).toBe('function')
    expect(typeof dataLayer.applications.create).toBe('function')
  })

  it('can read and write through the proxy', async () => {
    await initializeDataLayer()
    const { dataLayer } = await import('../index')

    const item = { id: 'test-1', name: 'Test App', slug: 'test-app' }
    await dataLayer.tenants.create(item as any)
    const loaded = await dataLayer.tenants.getById('test-1')
    expect(loaded).toBeDefined()
    expect(loaded.name).toBe('Test App')
  })
})
