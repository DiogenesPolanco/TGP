import { create } from 'zustand'

interface ConfirmState {
  message: string
  resolve: ((value: boolean) => void) | null
  show: (message: string) => Promise<boolean>
  dismiss: (result: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  message: '',
  resolve: null,

  show: (message: string) => {
    return new Promise<boolean>((resolve) => {
      set({ message, resolve })
    })
  },

  dismiss: (result: boolean) => {
    set((state) => {
      state.resolve?.(result)
      return { message: '', resolve: null }
    })
  },
}))
