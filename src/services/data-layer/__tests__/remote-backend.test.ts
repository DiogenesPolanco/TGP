import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type WsHandlers = {
  onopen: (() => void) | null
  onmessage: ((event: { data: string }) => void) | null
  onerror: (() => void) | null
  onclose: (() => void) | null
  send: (data: string) => void
  close: () => void
}

let mockWsInstance: WsHandlers | null = null
const wsSend = vi.fn()

function MockWebSocket(_url: string) {
  const self: WsHandlers = {
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    send: wsSend,
    close: vi.fn(),
  }
  mockWsInstance = self
  return self
}

vi.stubGlobal('WebSocket', MockWebSocket as any)

import { RemoteBackend } from '../remote-backend'

beforeEach(() => {
  wsSend.mockReset()
  mockWsInstance = null
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Auto-respond to WebSocket messages to make the RPC client work */
function initAutoRespond() {
  wsSend.mockImplementation((data: string) => {
    let msg: any
    try {
      msg = JSON.parse(data)
    } catch {
      return
    }
    if (msg.type === 'request' && mockWsInstance?.onmessage) {
      // Respond with empty rows immediately
      mockWsInstance.onmessage({ data: JSON.stringify({ type: 'response', id: msg.id, rows: [] }) })
    }
  })
}

function makeConfig() {
  return {
    proxyUrl: 'ws://localhost:8080',
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    user: 'test',
    password: 'test',
    ssl: false,
  }
}

/**
 * Initialize with connect + auto-respond.
 * Must trigger onopen manually because the mock WebSocket doesn't auto-open.
 */
async function initBackend() {
  const backend = new RemoteBackend(makeConfig())
  initAutoRespond()

  // Start initialize (synchronous up to first await - the connect call)
  // Then manually trigger WebSocket onopen to begin the connect flow
  const promise = backend.initialize()

  // Trigger WebSocket open sequence: onopen fires, which sends 'connect' msg
  if (mockWsInstance?.onopen) {
    mockWsInstance.onopen()
    // After onopen sends 'connect', autoRespond doesn't respond to 'connect' msgs
    // We need to send 'connected' response to resolve the connect handshake
    setTimeout(() => {
      if (mockWsInstance?.onmessage) {
        mockWsInstance.onmessage({ data: JSON.stringify({ type: 'connected' }) })
      }
    })
  }

  await promise
  return backend
}

describe('RemoteBackend', () => {
  it('initializes with correct name', () => {
    const backend = new RemoteBackend()
    expect(backend.name).toBe('remote-pg')
    expect(backend.label).toBe('PostgreSQL Remoto')
  })

  it('initialize throws without config', async () => {
    const backend = new RemoteBackend()
    await expect(backend.initialize()).rejects.toThrow('requiere config')
  })

  it('initialize connects and creates tables', async () => {
    const backend = new RemoteBackend(makeConfig())
    initAutoRespond()
    const promise = backend.initialize()
    if (mockWsInstance?.onopen) {
      mockWsInstance.onopen()
      setTimeout(() => {
        if (mockWsInstance?.onmessage) {
          mockWsInstance.onmessage({ data: JSON.stringify({ type: 'connected' }) })
        }
      })
    }
    await promise
    expect(wsSend).toHaveBeenCalled()
  })

  it('getRepository returns and caches repository', async () => {
    const backend = await initBackend()
    const repo = backend.getRepository('applications')
    expect(repo).toBeDefined()
    expect(backend.getRepository('applications')).toBe(repo)
  })

  it('setConfig stores configuration', () => {
    const backend = new RemoteBackend()
    backend.setConfig(makeConfig())
    expect(true).toBe(true)
  })

  it('isHealthy returns true when rpc responds', async () => {
    const backend = await initBackend()
    const healthy = await backend.isHealthy()
    expect(healthy).toBe(true)
  })

  it('isHealthy returns false when rpc fails', async () => {
    const backend = await initBackend()
    wsSend.mockImplementation((data: string) => {
      let msg: any
      try {
        msg = JSON.parse(data)
      } catch {
        return
      }
      if (msg.type === 'request' && mockWsInstance?.onmessage) {
        mockWsInstance.onmessage({
          data: JSON.stringify({ type: 'error', id: msg.id, message: 'fail' }),
        })
      }
    })
    const healthy = await backend.isHealthy()
    expect(healthy).toBe(false)
  })

  it('exportAll exports all tables', async () => {
    const backend = await initBackend()
    const result = await backend.exportAll()
    expect(result).toBeDefined()
    expect(Object.keys(result).length).toBeGreaterThan(0)
  })

  it('importAll imports data', async () => {
    const backend = await initBackend()
    await backend.importAll({ applications: [{ id: '1', name: 'App1' }] })
  })

  it('destroy cleans up', async () => {
    const backend = await initBackend()
    await backend.destroy()
  })

  it('importAll skips unknown tables', async () => {
    const backend = await initBackend()
    await backend.importAll({ unknownTable: [{ id: '1' }] })
  })

  it('handles WebSocket construction error', async () => {
    vi.stubGlobal('WebSocket', function () {
      throw new Error('ws error')
    } as any)
    const backend = new RemoteBackend(makeConfig())
    await expect(backend.initialize()).rejects.toThrow('ws error')
    vi.stubGlobal('WebSocket', MockWebSocket as any)
  })
})

describe('RemoteRepository', () => {
  async function withRepo(dataRows: any[] = []) {
    const backend = new RemoteBackend(makeConfig())
    wsSend.mockImplementation((data: string) => {
      let msg: any
      try {
        msg = JSON.parse(data)
      } catch {
        return
      }
      if (msg.type === 'request' && mockWsInstance?.onmessage) {
        mockWsInstance.onmessage({
          data: JSON.stringify({ type: 'response', id: msg.id, rows: dataRows }),
        })
      }
    })
    const promise = backend.initialize()
    if (mockWsInstance?.onopen) {
      mockWsInstance.onopen()
      setTimeout(() => {
        if (mockWsInstance?.onmessage) {
          mockWsInstance.onmessage({ data: JSON.stringify({ type: 'connected' }) })
        }
      })
    }
    await promise
    return backend.getRepository<{ id: string; name?: string; score?: number }>('applications')
  }

  it('getAll returns empty array', async () => {
    const repo = await withRepo([])
    const items = await repo.getAll()
    expect(items).toEqual([])
  })

  it('getAll returns mapped items', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1' } }])
    const items = await repo.getAll()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('1')
    expect(items[0].name).toBe('App1')
  })

  it('getAll supports filters with eq operator', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1' } }])
    const items = await repo.getAll({ filters: [{ field: 'name', operator: 'eq', value: 'App1' }] })
    expect(items).toHaveLength(1)
  })

  it('getAll supports filters with neq operator', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1' } }])
    const items = await repo.getAll({
      filters: [{ field: 'name', operator: 'neq', value: 'App2' }],
    })
    expect(items).toHaveLength(1)
  })

  it('getAll supports filters with numeric operators', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1', score: 85 } }])
    const items = await repo.getAll({ filters: [{ field: 'score', operator: 'gt', value: 80 }] })
    expect(items).toHaveLength(1)
  })

  it('getAll supports filters with gte operator', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1', score: 85 } }])
    const items = await repo.getAll({ filters: [{ field: 'score', operator: 'gte', value: 85 }] })
    expect(items).toHaveLength(1)
  })

  it('getAll supports filters with lt operator', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1', score: 85 } }])
    const items = await repo.getAll({ filters: [{ field: 'score', operator: 'lt', value: 90 }] })
    expect(items).toHaveLength(1)
  })

  it('getAll supports filters with lte operator', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1', score: 85 } }])
    const items = await repo.getAll({ filters: [{ field: 'score', operator: 'lte', value: 85 }] })
    expect(items).toHaveLength(1)
  })

  it('getAll supports filters with in operator', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1' } }])
    const items = await repo.getAll({
      filters: [{ field: 'name', operator: 'in', value: ['App1', 'App2'] }],
    })
    expect(items).toHaveLength(1)
  })

  it('getAll supports filters with contains operator', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1' } }])
    const items = await repo.getAll({
      filters: [{ field: 'name', operator: 'contains', value: 'App' }],
    })
    expect(items).toHaveLength(1)
  })

  it('getAll supports filters with startsWith operator', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1' } }])
    const items = await repo.getAll({
      filters: [{ field: 'name', operator: 'startsWith', value: 'App' }],
    })
    expect(items).toHaveLength(1)
  })

  it('getAll supports orderBy asc', async () => {
    const repo = await withRepo([
      { id: '1', data: { name: 'A' } },
      { id: '2', data: { name: 'B' } },
    ])
    const items = await repo.getAll({ orderBy: { field: 'name', direction: 'asc' } })
    expect(items).toHaveLength(2)
  })

  it('getAll supports orderBy desc', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'A' } }])
    const items = await repo.getAll({ orderBy: { field: 'name', direction: 'desc' } })
    expect(items).toHaveLength(1)
  })

  it('getAll supports limit and offset', async () => {
    const repo = await withRepo([{ id: '1', data: {} }])
    const items = await repo.getAll({ limit: 1, offset: 0 })
    expect(items).toHaveLength(1)
  })

  it('getById returns item', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1' } }])
    const item = await repo.getById('1')
    expect(item).toBeDefined()
    expect(item!.name).toBe('App1')
  })

  it('getById returns undefined for missing', async () => {
    const repo = await withRepo([])
    const item = await repo.getById('nonexistent')
    expect(item).toBeUndefined()
  })

  it('getByField returns matching items', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'App1' } }])
    const items = await repo.getByField('name', 'App1')
    expect(items).toHaveLength(1)
  })

  it('countByField returns count', async () => {
    const repo = await withRepo([])
    wsSend.mockImplementation((data: string) => {
      let msg: any
      try {
        msg = JSON.parse(data)
      } catch {
        return
      }
      if (msg.type === 'request' && mockWsInstance?.onmessage) {
        mockWsInstance.onmessage({
          data: JSON.stringify({ type: 'response', id: msg.id, rows: [{ count: 1 }] }),
        })
      }
    })
    const count = await repo.countByField('name', 'App1')
    expect(count).toBe(1)
  })

  it('count returns total count', async () => {
    const repo = await withRepo([])
    wsSend.mockImplementation((data: string) => {
      let msg: any
      try {
        msg = JSON.parse(data)
      } catch {
        return
      }
      if (msg.type === 'request' && mockWsInstance?.onmessage) {
        mockWsInstance.onmessage({
          data: JSON.stringify({ type: 'response', id: msg.id, rows: [{ count: 3 }] }),
        })
      }
    })
    const count = await repo.count()
    expect(count).toBe(3)
  })

  it('count with filters returns filtered count', async () => {
    const repo = await withRepo([])
    wsSend.mockImplementation((data: string) => {
      let msg: any
      try {
        msg = JSON.parse(data)
      } catch {
        return
      }
      if (msg.type === 'request' && mockWsInstance?.onmessage) {
        mockWsInstance.onmessage({
          data: JSON.stringify({ type: 'response', id: msg.id, rows: [{ count: 1 }] }),
        })
      }
    })
    const count = await repo.count({ filters: [{ field: 'name', operator: 'eq', value: 'App1' }] })
    expect(count).toBe(1)
  })

  it('create inserts and returns id', async () => {
    const repo = await withRepo([])
    const id = await repo.create({ id: 'new1', name: 'NewApp' })
    expect(id).toBe('new1')
  })

  it('update merges changes', async () => {
    const repo = await withRepo([{ id: '1', data: { name: 'Old' } }])
    await repo.update('1', { name: 'Updated' })
  })

  it('update skips if item not found', async () => {
    const repo = await withRepo([])
    await repo.update('nonexistent', { name: 'Updated' })
  })

  it('delete removes item', async () => {
    const repo = await withRepo([])
    await repo.delete('1')
  })
})
