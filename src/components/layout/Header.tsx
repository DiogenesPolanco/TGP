import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import { useFilterStore } from '@/stores/filterStore'
import { cn } from '@/lib/utils'
import { Search, Bell, Moon, Sun, Calendar, LogOut, Speaker } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { GlobalSearch } from './GlobalSearch'
import { clearSession } from '@/services/auth/authService'
import {
  areBrowserNotificationsEnabled,
  setBrowserNotificationsEnabled,
  requestNotificationPermission,
} from '@/services/notifications/browserNotificationService'

const periodOptions = [
  { value: '7d' as const, label: '7 días' },
  { value: '30d' as const, label: '30 días' },
  { value: '90d' as const, label: '90 días' },
  { value: 'ytd' as const, label: 'YTD' },
]

export function Header() {
  const location = useLocation()
  const { theme, setTheme } = useAppStore()
  const { selectedPeriod, setPeriod } = useFilterStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [browserNotifs, setBrowserNotifs] = useState(areBrowserNotificationsEnabled())
  const alertsRef = useRef<HTMLDivElement>(null)

  const alerts = useAppStore((s) => s.alerts)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setShowAlerts(false)
      }
    }
    if (showAlerts) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [showAlerts])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleToggleBrowserNotifs = async () => {
    if (!browserNotifs) {
      const granted = await requestNotificationPermission()
      if (!granted) return
    }
    const next = !browserNotifs
    setBrowserNotifs(next)
    setBrowserNotificationsEnabled(next)
  }

  const handleLogout = () => {
    clearSession()
    window.location.reload()
  }

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Dashboard Ejecutivo'
    if (path.startsWith('/catalog/applications')) return 'Catálogo de Aplicaciones'
    if (path.startsWith('/security/vulnerabilities')) return 'Vulnerabilidades'
    if (path.startsWith('/security/incidents')) return 'Incidentes'
    if (path.startsWith('/governance/risks')) return 'Riesgos'
    if (path.startsWith('/governance/audit')) return 'Auditoría'
    if (path.startsWith('/teams')) return 'Equipos'
    if (path.startsWith('/strategy/objectives')) return 'OKRs / KPIs'
    if (path.startsWith('/admin')) return 'Administración'
    return 'TGP'
  }

  return (
    <header className="h-16 bg-white dark:bg-neutral-80 border-b border-neutral-20 dark:border-neutral-70 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-neutral-90 dark:text-white">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          title="Buscar (⌘K)"
        >
          <Search size={18} className="text-neutral-60 dark:text-neutral-40" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Calendar size={16} />
            <span>{periodOptions.find((p) => p.value === selectedPeriod)?.label}</span>
          </button>
          {showPeriodDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-50">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPeriod(option.value)
                    setShowPeriodDropdown(false)
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors',
                    selectedPeriod === option.value
                      ? 'text-primary font-medium'
                      : 'text-neutral-70 dark:text-neutral-30'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors relative"
          >
            <Bell size={18} className="text-neutral-60 dark:text-neutral-40" />
            {alerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full px-1">
                {alerts.length > 99 ? '99+' : alerts.length}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-neutral-20 dark:border-neutral-70 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-90 dark:text-white">
                  Alertas ({alerts.length})
                </h4>
                <button
                  onClick={handleToggleBrowserNotifs}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    browserNotifs
                      ? 'bg-primary/10 text-primary'
                      : 'bg-neutral-10 dark:bg-neutral-75 text-neutral-50'
                  }`}
                  title={browserNotifs ? 'Notificaciones activadas' : 'Activar notificaciones del navegador'}
                >
                  <Speaker size={14} />
                  {browserNotifs ? 'Activadas' : 'Notificar'}
                </button>
              </div>
              {alerts.length > 0 ? (
                <div className="p-2 space-y-1">
                  {alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                        alert.type === 'critical'
                          ? 'bg-danger/10 text-danger'
                          : alert.type === 'warning'
                          ? 'bg-warning/10 text-warning'
                          : alert.type === 'success'
                          ? 'bg-success/10 text-success'
                          : 'bg-info/10 text-info'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                        alert.type === 'critical'
                          ? 'bg-danger'
                          : alert.type === 'warning'
                          ? 'bg-warning'
                          : alert.type === 'success'
                          ? 'bg-success'
                          : 'bg-info'
                      }`} />
                      <span className="text-neutral-80 dark:text-neutral-20">{alert.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-neutral-50">
                  Sin alertas activas
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          {theme === 'light' ? (
            <Moon size={18} className="text-neutral-60" />
          ) : (
            <Sun size={18} className="text-neutral-40" />
          )}
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-neutral-20 dark:border-neutral-70">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">AD</span>
          </div>
          <span className="text-sm font-medium text-neutral-70 dark:text-neutral-30 hidden lg:block">
            Admin
          </span>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors ml-1"
            title="Cerrar sesión"
          >
            <LogOut size={16} className="text-neutral-50" />
          </button>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
