import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types/domain'

interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  hasRole: (role: UserRole) => boolean
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      login: (user) => set({ currentUser: user, isAuthenticated: true }),
      logout: () => set({ currentUser: null, isAuthenticated: false }),
      hasRole: (role) => {
        const user = get().currentUser
        if (!user) return false
        if (user.role === 'admin') return true
        return user.role === role
      },
    }),
    {
      name: 'tgp-user-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
