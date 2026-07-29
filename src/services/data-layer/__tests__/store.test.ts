import { describe, it, expect, beforeEach } from 'vitest'
import { useDataLayerStore } from '../store'

describe('DataLayer store', () => {
  beforeEach(() => {
    useDataLayerStore.setState({
      config: { backend: 'dexie', autoInitialize: true },
      status: 'uninitialized',
      error: null,
    })
  })

  it('defaults to dexie backend', () => {
    const state = useDataLayerStore.getState()
    expect(state.config.backend).toBe('dexie')
    expect(state.status).toBe('uninitialized')
  })

  it('setBackend changes backend', () => {
    useDataLayerStore.getState().setBackend('pglite')
    expect(useDataLayerStore.getState().config.backend).toBe('pglite')
    expect(useDataLayerStore.getState().status).toBe('uninitialized')
  })

  it('setConfig merges partial config', () => {
    useDataLayerStore.getState().setConfig({ autoInitialize: false })
    const state = useDataLayerStore.getState()
    expect(state.config.backend).toBe('dexie')
    expect(state.config.autoInitialize).toBe(false)
  })

  it('setStatus updates status', () => {
    useDataLayerStore.getState().setStatus('ready')
    expect(useDataLayerStore.getState().status).toBe('ready')
  })

  it('setError sets error and status error', () => {
    useDataLayerStore.getState().setError('Connection failed')
    const state = useDataLayerStore.getState()
    expect(state.error).toBe('Connection failed')
    expect(state.status).toBe('error')
  })
})
