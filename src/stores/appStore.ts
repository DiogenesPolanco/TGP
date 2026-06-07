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
  browserNotificationsEnabled: boolean
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  setAlerts: (alerts: DashboardAlert[]) => void
  clearAlerts: () => void
  setBrowserNotificationsEnabled: (enabled: boolean) => void
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
      browserNotificationsEnabled: false,
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications.slice(-4),
            { ...notification, duration: notification.duration ?? 4000, id: crypto.randomUUID() },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      setAlerts: (alerts) => set({ alerts }),
      clearAlerts: () => set({ alerts: [] }),
      setBrowserNotificationsEnabled: (enabled) => set({ browserNotificationsEnabled: enabled }),
    }),
    {
      name: 'tgp-app-storage',
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen, theme: state.theme }),
    }
  )
)
