import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import { useFilterStore } from '@/stores/filterStore'
import { cn } from '@/lib/utils'
import { Search, Bell, Moon, Sun, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import { GlobalSearch } from './GlobalSearch'

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

        <button className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors relative">
          <Bell size={18} className="text-neutral-60 dark:text-neutral-40" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

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
        </div>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
