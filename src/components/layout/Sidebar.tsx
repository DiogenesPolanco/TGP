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
  FileText,
  FileSignature,
  Monitor,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

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
      { label: 'Timeline Ejecutivo', path: '/execution/timeline' },
      { label: 'Planes', path: '/execution/plans' },
      { label: 'Compromisos', path: '/execution/commitments' },
      { label: 'Calendario', path: '/calendar' },
      { label: 'Predictibilidad', path: '/execution/predictability' },
    ],
  },
  {
    label: 'Catálogo',
    icon: <FolderKanban size={20} />,
    children: [
      { label: 'Aplicaciones', path: '/catalog/applications' },
      { label: 'Microservicios', path: '/catalog/microservices' },
      { label: 'Entregables', path: '/catalog/deliverables' },
      { label: 'Obsolescencia', path: '/catalog/obsolescence' },
      { label: 'Dependencias', path: '/dependencies' },
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
  {
    label: 'Equipos',
    icon: <Users size={20} />,
    children: [
      { label: 'Rendimiento', path: '/teams' },
      { label: 'Miembros', path: '/teams/members' },
      { label: 'Reclutamiento', path: '/teams/recruitment' },
    ],
  },
  {
    label: 'Equipamiento',
    icon: <Monitor size={20} />,
    children: [
      { label: 'Inventario', path: '/equipment' },
      { label: 'Reportes', path: '/equipment/reports' },
    ],
  },
  { label: 'Reportes', icon: <FileText size={20} />, path: '/reports' },
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
      // If already open, toggle it closed
      if (prev.has(label)) {
        const next = new Set(prev)
        next.delete(label)
        return next
      }
      // Otherwise, close all others and open only this one
      return new Set([label])
    })
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-card border-r border-boundary transition-all duration-300 z-50 flex flex-col',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-boundary">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="TGP" className="w-8 h-8" />
            <span className="font-semibold text-neutral-90 dark:text-neutral-0 text-sm">TGP</span>
          </div>
        )}
        <Button variant="ghost" onClick={toggleSidebar} className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
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
                      : 'text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 hover:text-neutral-90 dark:hover:text-white'
                  )
                }
              >
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ) : (
              <div>
                <Button onClick={() => sidebarOpen && toggleItem(item.label)}
                  className={cn(
                    'flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 hover:text-neutral-90 dark:hover:text-white',
                    item.children?.some((c) =>
                      location.pathname === c.path || location.pathname.startsWith(c.path + '/')
                    ) &&
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
                </Button>
                {sidebarOpen && expandedItems.has(item.label) && item.children && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        end
                        className={({ isActive }) =>
                          cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive
                              ? 'text-primary font-medium'
                              : 'text-muted hover:text-neutral-90 dark:hover:text-white'
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

      {/* Enlace a Términos */}
      <div className="border-t border-boundary px-2 py-3">
        <NavLink
          to="/terms"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : 'text-neutral-40 dark:text-neutral-50 hover:bg-neutral-10 dark:hover:bg-neutral-70 hover:text-neutral-60 dark:hover:text-neutral-40'
            )
          }
        >
          <FileSignature size={16} />
          {sidebarOpen && <span>Términos y Privacidad</span>}
        </NavLink>
      </div>
    </aside>
  )
}
