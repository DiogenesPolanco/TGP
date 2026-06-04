import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DashboardAlert {
  type: 'critical' | 'warning' | 'success' | 'info'
  message: string
}

interface AppState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notifications: Notification[]
  alerts: DashboardAlert[]
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  setAlerts: (alerts: DashboardAlert[]) => void
  clearAlerts: () => void
}

interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  duration?: number
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      notifications: [],
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      alerts: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: crypto.randomUUID() },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      setAlerts: (alerts) => set({ alerts }),
      clearAlerts: () => set({ alerts: [] }),
    }),
    {
      name: 'tgp-app-storage',
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen, theme: state.theme }),
    }
  )
)
