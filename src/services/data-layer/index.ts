import type { BackendType, DatabaseBackend, Repository } from './types'
import { DexieBackend } from './dexie-backend'
import { PGliteBackend } from './pglite-backend'
import { RemoteBackend } from './remote-backend'
import { useDataLayerStore } from './store'
export { useDataLayerStore } from './store'
export type {
  BackendType,
  DataLayerConfig,
  RemotePgConnection,
  Repository,
  DatabaseBackend,
  Filter,
  QueryOptions,
} from './types'

const BACKEND_REGISTRY: Record<BackendType, () => DatabaseBackend> = {
  dexie: () => new DexieBackend(),
  pglite: () => new PGliteBackend(),
  sqljs: () => {
    throw new Error('sql.js backend aún no implementado — instala sql.js primero')
  },
  'remote-pg': () => {
    const store = useDataLayerStore.getState()
    const cfg = store.config.remotePg
    if (!cfg) throw new Error('remote-pg requiere config.remotePg en el store')
    return new RemoteBackend(cfg)
  },
}

let _backend: DatabaseBackend | null = null
let _initializing: Promise<void> | null = null
const _repoCache = new Map<string, Repository<any>>()

function getBackend(): DatabaseBackend {
  if (!_backend) {
    const config = useDataLayerStore.getState().config
    const factory = BACKEND_REGISTRY[config.backend]
    if (!factory) {
      throw new Error(`Backend desconocido: ${config.backend}`)
    }
    _backend = factory()
  }
  return _backend
}

export async function initializeDataLayer(): Promise<void> {
  if (_initializing) return _initializing
  const store = useDataLayerStore.getState()
  if (store.status === 'ready') return

  store.setStatus('initializing')
  _initializing = (async () => {
    try {
      const backend = getBackend()
      await backend.initialize()
      _repoCache.clear()
      useDataLayerStore.getState().setStatus('ready')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      useDataLayerStore.getState().setError(msg)
      throw err
    } finally {
      _initializing = null
    }
  })()

  return _initializing
}

export async function switchBackend(type: BackendType): Promise<void> {
  const oldBackend = _backend
  const oldType = useDataLayerStore.getState().config.backend

  _backend = null
  _repoCache.clear()
  useDataLayerStore.getState().setBackend(type)

  try {
    await initializeDataLayer()
  } catch (err) {
    if (oldBackend) {
      _backend = oldBackend
      _repoCache.clear()
      useDataLayerStore.getState().setBackend(oldType)
      useDataLayerStore.getState().setStatus('ready')
    }
    throw err
  }

  if (oldBackend) {
    await oldBackend.destroy().catch(() => {})
  }
}

export async function switchWithMigration(type: BackendType): Promise<void> {
  const oldBackend = _backend
  const oldType = useDataLayerStore.getState().config.backend
  const oldData = oldBackend ? await oldBackend.exportAll().catch(() => null) : null

  _backend = null
  _repoCache.clear()
  useDataLayerStore.getState().setBackend(type)

  try {
    await initializeDataLayer()
  } catch (err) {
    if (oldBackend) {
      _backend = oldBackend
      _repoCache.clear()
      useDataLayerStore.getState().setBackend(oldType)
      useDataLayerStore.getState().setStatus('ready')
    }
    throw err
  }

  if (oldBackend) {
    await oldBackend.destroy().catch(() => {})
  }

  if (oldData) {
    const backend = getActiveBackend()
    if (backend) await backend.importAll(oldData)
  }
}

export function getActiveBackendType(): BackendType {
  return useDataLayerStore.getState().config.backend
}

export function getActiveBackend(): DatabaseBackend | null {
  return _backend
}

const dataLayer = new Proxy({} as Record<string, Repository<any>>, {
  get(_target, prop: string | symbol) {
    if (typeof prop === 'symbol') return undefined
    if (prop === 'then') return undefined

    if (!_repoCache.has(prop)) {
      const backend = getBackend()
      const repo = backend.getRepository(prop)
      _repoCache.set(prop, repo)
    }
    return _repoCache.get(prop)!
  },
})

export { dataLayer }
export default dataLayer
