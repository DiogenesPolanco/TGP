import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import {
  LayoutDashboard,
  FolderKanban,
  Shield,
  Scale,
  Target,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  icon: React.ReactNode
  path?: string
  children?: { label: string; path: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  {
    label: 'Ejecucion',
    icon: <ClipboardList size={20} />,
    children: [
      { label: 'Seguimiento Diario', path: '/execution/daily' },
      { label: 'Planes', path: '/execution/plans' },
      { label: 'Compromisos', path: '/execution/commitments' },
      { label: 'Predictibilidad', path: '/execution/predictability' },
    ],
  },
  {
    label: 'Catálogo',
    icon: <FolderKanban size={20} />,
    children: [
      { label: 'Aplicaciones', path: '/catalog/applications' },
      { label: 'Entregables', path: '/catalog/deliverables' },
      { label: 'Obsolescencia', path: '/catalog/obsolescence' },
    ],
  },
  {
    label: 'Seguridad',
    icon: <Shield size={20} />,
    children: [
      { label: 'Vulnerabilidades', path: '/security/vulnerabilities' },
      { label: 'Incidentes', path: '/security/incidents' },
    ],
  },
  {
    label: 'Gobierno',
    icon: <Scale size={20} />,
    children: [
      { label: 'Riesgos', path: '/governance/risks' },
      { label: 'Auditoría', path: '/governance/audit' },
    ],
  },
  {
    label: 'Estrategia',
    icon: <Target size={20} />,
    children: [
      { label: 'OKRs / KPIs', path: '/strategy/objectives' },
    ],
  },
  { label: 'Equipos', icon: <Users size={20} />, path: '/teams' },
  {
    label: 'Equipos',
    icon: <Users size={20} />,
    children: [
      { label: 'Miembros', path: '/teams' },
      { label: 'Rendimiento', path: '/teams/performance' },
    ],
  },
  {
    label: 'Administración',
    icon: <Settings size={20} />,
    children: [
      { label: 'Unidades de Negocio', path: '/admin/business-units' },
      { label: 'General', path: '/admin' },
    ],
  },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleItem = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white dark:bg-neutral-80 border-r border-neutral-20 dark:border-neutral-70 transition-all duration-300 z-50 flex flex-col',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-20 dark:border-neutral-70">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="TGP" className="w-8 h-8" />
            <span className="font-semibold text-neutral-90 dark:text-neutral-0 text-sm">TGP</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.path && !item.children ? (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 hover:text-neutral-90 dark:hover:text-white'
                  )
                }
              >
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ) : (
              <div>
                <button
                  onClick={() => sidebarOpen && toggleItem(item.label)}
                  className={cn(
                    'flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 hover:text-neutral-90 dark:hover:text-white',
                    item.children?.some((c) => location.pathname.startsWith(c.path)) &&
                      'bg-primary/10 text-primary dark:bg-primary/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {sidebarOpen && <span>{item.label}</span>}
                  </div>
                  {sidebarOpen &&
                    (expandedItems.has(item.label) ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    ))}
                </button>
                {sidebarOpen && expandedItems.has(item.label) && item.children && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive
                              ? 'text-primary font-medium'
                              : 'text-neutral-60 dark:text-neutral-40 hover:text-neutral-90 dark:hover:text-white'
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
