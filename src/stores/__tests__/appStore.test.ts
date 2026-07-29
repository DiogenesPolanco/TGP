import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../appStore'

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState({
    sidebarOpen: true,
    theme: 'light',
    notifications: [],
    alerts: [],
    browserNotificationsEnabled: false,
  })
})

describe('useAppStore', () => {
  it('starts with defaults', () => {
    const state = useAppStore.getState()
    expect(state.sidebarOpen).toBe(true)
    expect(state.theme).toBe('light')
    expect(state.notifications).toEqual([])
  })

  it('toggleSidebar flips sidebarOpen', () => {
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(false)
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(true)
  })

  it('setTheme changes theme', () => {
    useAppStore.getState().setTheme('dark')
    expect(useAppStore.getState().theme).toBe('dark')
  })

  it('addNotification adds notification with id', () => {
    useAppStore.getState().addNotification({ type: 'info', message: 'test' })
    const notifications = useAppStore.getState().notifications
    expect(notifications).toHaveLength(1)
    expect(notifications[0].id).toBeTruthy()
    expect(notifications[0].message).toBe('test')
  })

  it('addNotification caps at 5 notifications', () => {
    for (let i = 0; i < 10; i++) {
      useAppStore.getState().addNotification({ type: 'info', message: `msg${i}` })
    }
    expect(useAppStore.getState().notifications).toHaveLength(5)
  })

  it('removeNotification removes by id', () => {
    useAppStore.getState().addNotification({ type: 'info', message: 'test' })
    const id = useAppStore.getState().notifications[0].id
    useAppStore.getState().removeNotification(id)
    expect(useAppStore.getState().notifications).toHaveLength(0)
  })

  it('setAlerts sets alerts', () => {
    useAppStore.getState().setAlerts([{ type: 'critical', message: 'test alert' }])
    expect(useAppStore.getState().alerts).toHaveLength(1)
  })

  it('clearAlerts clears alerts', () => {
    useAppStore.getState().setAlerts([{ type: 'info', message: 'test' }])
    useAppStore.getState().clearAlerts()
    expect(useAppStore.getState().alerts).toEqual([])
  })

  it('setBrowserNotificationsEnabled', () => {
    useAppStore.getState().setBrowserNotificationsEnabled(true)
    expect(useAppStore.getState().browserNotificationsEnabled).toBe(true)
  })
})
