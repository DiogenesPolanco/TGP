import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FilterState {
  selectedBusinessUnitId: string | null
  selectedPeriod: '7d' | '30d' | '90d' | 'ytd' | 'custom'
  customDateRange: { start: Date | null; end: Date | null }
  setBusinessUnit: (id: string | null) => void
  setPeriod: (period: '7d' | '30d' | '90d' | 'ytd' | 'custom') => void
  setCustomDateRange: (start: Date | null, end: Date | null) => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      selectedBusinessUnitId: null,
      selectedPeriod: '30d',
      customDateRange: { start: null, end: null },
      setBusinessUnit: (id) => set({ selectedBusinessUnitId: id }),
      setPeriod: (period) => set({ selectedPeriod: period }),
      setCustomDateRange: (start, end) => set({ customDateRange: { start, end } }),
    }),
    {
      name: 'tgp-filter-storage',
    }
  )
)
