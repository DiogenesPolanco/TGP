import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BackendType, DataLayerConfig } from './types'

interface DataLayerState {
  config: DataLayerConfig
  status: 'uninitialized' | 'initializing' | 'ready' | 'error'
  error: string | null
  setBackend: (backend: BackendType) => void
  setConfig: (config: Partial<DataLayerConfig>) => void
  setStatus: (status: DataLayerState['status']) => void
  setError: (error: string | null) => void
}

export const useDataLayerStore = create<DataLayerState>()(
  persist(
    (set) => ({
      config: { backend: 'dexie', autoInitialize: true },
      status: 'uninitialized',
      error: null,
      setBackend: (backend) =>
        set((s) => ({ config: { ...s.config, backend }, status: 'uninitialized' })),
      setConfig: (partial) =>
        set((s) => ({ config: { ...s.config, ...partial }, status: 'uninitialized' })),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error, status: error ? 'error' : 'ready' }),
    }),
    {
      name: 'tgp-data-layer-config',
      partialize: (state) => ({ config: state.config }),
    },
  ),
)
