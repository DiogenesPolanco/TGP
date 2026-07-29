import type { DashboardAlert } from '@/stores/appStore'

const NOTIFICATION_ICON = '/vite.svg'
const STORAGE_KEY = 'tgp-browser-notifications-enabled'

export function areBrowserNotificationsEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setBrowserNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    /* noop */
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch {
    return false
  }
}

export function sendBrowserNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (!areBrowserNotificationsEnabled()) return

  try {
    new Notification(title, {
      icon: NOTIFICATION_ICON,
      ...options,
    })
  } catch {
    /* noop */
  }
}

export function notifyAlert(alert: DashboardAlert): void {
  if (alert.type === 'info' || alert.type === 'success') return

  const title = alert.type === 'critical' ? '🔴 Alerta Crítica - TGP' : '🟡 Alerta - TGP'

  sendBrowserNotification(title, { body: alert.message })
}

export function notifyAlerts(alerts: DashboardAlert[]): void {
  const criticalAlerts = alerts.filter((a) => a.type === 'critical')
  const warningAlerts = alerts.filter((a) => a.type === 'warning')

  if (criticalAlerts.length > 0) {
    const body =
      criticalAlerts.length === 1
        ? criticalAlerts[0].message
        : criticalAlerts
            .slice(0, 5)
            .map((a) => `• ${a.message}`)
            .join('\n') +
          (criticalAlerts.length > 5 ? `\n... y ${criticalAlerts.length - 5} más` : '')

    sendBrowserNotification(
      `🔴 ${criticalAlerts.length} alerta${criticalAlerts.length > 1 ? 's' : ''} crítica${criticalAlerts.length > 1 ? 's' : ''} - TGP`,
      { body },
    )
  }

  if (warningAlerts.length > 0) {
    const body =
      warningAlerts.length === 1
        ? warningAlerts[0].message
        : warningAlerts
            .slice(0, 3)
            .map((a) => `• ${a.message}`)
            .join('\n') +
          (warningAlerts.length > 3 ? `\n... y ${warningAlerts.length - 3} más` : '')

    sendBrowserNotification(
      `🟡 ${warningAlerts.length} alerta${warningAlerts.length > 1 ? 's' : ''} - TGP`,
      { body },
    )
  }
}
