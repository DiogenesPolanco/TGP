import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  areBrowserNotificationsEnabled,
  setBrowserNotificationsEnabled,
  requestNotificationPermission,
  sendBrowserNotification,
  notifyAlert,
  notifyAlerts,
} from '../browserNotificationService'
import type { DashboardAlert } from '@/stores/appStore'

const STORAGE_KEY = 'tgp-browser-notifications-enabled'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('areBrowserNotificationsEnabled', () => {
  it('returns true when localStorage has "true"', () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    expect(areBrowserNotificationsEnabled()).toBe(true)
  })

  it('returns false when localStorage is "false"', () => {
    localStorage.setItem(STORAGE_KEY, 'false')
    expect(areBrowserNotificationsEnabled()).toBe(false)
  })

  it('returns false when no key in localStorage', () => {
    expect(areBrowserNotificationsEnabled()).toBe(false)
  })

  it('returns false when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage error')
    })
    expect(areBrowserNotificationsEnabled()).toBe(false)
  })
})

describe('setBrowserNotificationsEnabled', () => {
  it('stores "true" in localStorage', () => {
    setBrowserNotificationsEnabled(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
  })

  it('stores "false" in localStorage', () => {
    setBrowserNotificationsEnabled(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false')
  })

  it('handles localStorage error gracefully', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    expect(() => setBrowserNotificationsEnabled(true)).not.toThrow()
  })
})

describe('requestNotificationPermission', () => {
  it('returns false when Notification is not available', async () => {
    const orig = globalThis.Notification
    delete (globalThis as any).Notification
    const result = await requestNotificationPermission()
    expect(result).toBe(false)
    ;(globalThis as any).Notification = orig
  })

  it('returns true when already granted', async () => {
    const mockNotification = { permission: 'granted', requestPermission: vi.fn() }
    ;(globalThis as any).Notification = mockNotification
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
  })

  it('returns false when already denied', async () => {
    const mockNotification = { permission: 'denied', requestPermission: vi.fn() }
    ;(globalThis as any).Notification = mockNotification
    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })

  it('requests permission when default and returns result', async () => {
    const mockNotification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    }
    ;(globalThis as any).Notification = mockNotification
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
    expect(mockNotification.requestPermission).toHaveBeenCalledOnce()
  })

  it('returns false when requestPermission throws', async () => {
    const mockNotification = {
      permission: 'default',
      requestPermission: vi.fn().mockRejectedValue(new Error('denied')),
    }
    ;(globalThis as any).Notification = mockNotification
    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })
})

function makeMockNotification(permission: string) {
  const fn = vi.fn(() => {}) as any
  fn.permission = permission
  return fn
}

describe('sendBrowserNotification', () => {
  beforeEach(() => {
    globalThis.Notification = makeMockNotification('granted') as any
    localStorage.setItem(STORAGE_KEY, 'true')
  })

  it('sends notification when all conditions met', () => {
    sendBrowserNotification('Test', { body: 'Hello' })
    expect(globalThis.Notification).toHaveBeenCalledWith('Test', {
      icon: '/vite.svg',
      body: 'Hello',
    })
  })

  it('does nothing when Notification not available', () => {
    delete (globalThis as any).Notification
    expect(() => sendBrowserNotification('Test')).not.toThrow()
  })

  it('does nothing when permission not granted', () => {
    globalThis.Notification = makeMockNotification('denied') as any
    sendBrowserNotification('Test')
    const spy = globalThis.Notification as any
    expect(spy).not.toHaveBeenCalled()
  })

  it('does nothing when notifications disabled', () => {
    localStorage.setItem(STORAGE_KEY, 'false')
    sendBrowserNotification('Test')
    const spy = globalThis.Notification as any
    expect(spy).not.toHaveBeenCalled()
  })

  it('handles exception gracefully', () => {
    const mockNotification = vi.fn(() => {
      throw new Error('fail')
    })
    ;(mockNotification as any).permission = 'granted'
    globalThis.Notification = mockNotification as any
    expect(() => sendBrowserNotification('Test')).not.toThrow()
  })
})

function enableNotifications() {
  localStorage.setItem(STORAGE_KEY, 'true')
  globalThis.Notification = makeMockNotification('granted') as any
}

describe('notifyAlert', () => {
  it('skips info alerts', () => {
    enableNotifications()
    notifyAlert({ type: 'info', message: 'info msg' })
    const spy = globalThis.Notification as any
    expect(spy).not.toHaveBeenCalled()
  })

  it('skips success alerts', () => {
    enableNotifications()
    notifyAlert({ type: 'success', message: 'success' })
    const spy = globalThis.Notification as any
    expect(spy).not.toHaveBeenCalled()
  })

  it('sends notification for critical alerts', () => {
    enableNotifications()
    notifyAlert({ type: 'critical', message: 'critical error' })
    const spy = globalThis.Notification as any
    expect(spy).toHaveBeenCalled()
  })

  it('sends notification for warning alerts', () => {
    enableNotifications()
    notifyAlert({ type: 'warning', message: 'warning msg' })
    const spy = globalThis.Notification as any
    expect(spy).toHaveBeenCalled()
  })
})

describe('notifyAlerts', () => {
  beforeEach(() => {
    globalThis.Notification = makeMockNotification('granted') as any
    localStorage.setItem(STORAGE_KEY, 'true')
  })

  it('sends nothing for empty array', () => {
    notifyAlerts([])
    const spy = globalThis.Notification as any
    expect(spy).not.toHaveBeenCalled()
  })

  it('sends single critical alert', () => {
    notifyAlerts([{ type: 'critical', message: 'critical msg' }])
    const spy = globalThis.Notification as any
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain('crítica')
  })

  it('sends grouped critical alerts', () => {
    notifyAlerts([
      { type: 'critical', message: 'msg1' },
      { type: 'critical', message: 'msg2' },
    ])
    const spy = globalThis.Notification as any
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain('2 alertas')
  })

  it('sends more than 5 critical alerts with ellipsis', () => {
    const alerts: DashboardAlert[] = Array.from({ length: 7 }, (_, i) => ({
      type: 'critical' as const,
      message: `msg${i + 1}`,
    }))
    notifyAlerts(alerts)
    const spy = globalThis.Notification as any
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][1].body).toContain('y 2 más')
  })

  it('sends warning alerts separately', () => {
    notifyAlerts([{ type: 'warning', message: 'warn msg' }])
    const spy = globalThis.Notification as any
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain('alerta')
  })

  it('sends multiple warning alerts grouped', () => {
    notifyAlerts([
      { type: 'warning', message: 'warn1' },
      { type: 'warning', message: 'warn2' },
    ])
    const spy = globalThis.Notification as any
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][1].body).toContain('• warn1')
  })

  it('sends both critical and warning alerts', () => {
    notifyAlerts([
      { type: 'critical', message: 'critical msg' },
      { type: 'warning', message: 'warn msg' },
    ])
    const spy = globalThis.Notification as any
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('does not send notification when disabled', () => {
    localStorage.setItem(STORAGE_KEY, 'false')
    notifyAlerts([{ type: 'critical', message: 'should not show' }])
    const spy = globalThis.Notification as any
    expect(spy).not.toHaveBeenCalled()
  })
})
