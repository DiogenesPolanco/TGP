import {
  ClipboardList,
  FolderKanban,
  Shield,
  Scale,
  Target,
  Users,
  UserPlus,
  Monitor,
} from 'lucide-react'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import type { AiProviderConfig } from '../types'

const PERMISSION_DEFS: {
  key: keyof AiProviderConfig['dataPermissions']
  icon: React.ReactNode
  label: string
  tooltip: string
}[] = [
  {
    key: 'catalogo',
    icon: <FolderKanban size={18} />,
    label: 'Catálogo',
    tooltip: 'Applications, technologies, microservices, databases y dependencias',
  },
  {
    key: 'seguridad',
    icon: <Shield size={18} />,
    label: 'Seguridad',
    tooltip: 'Vulnerabilidades CVSS con SLA e incidentes P1-P4',
  },
  {
    key: 'gobierno',
    icon: <Scale size={18} />,
    label: 'Gobierno',
    tooltip: 'Matriz de riesgos y hallazgos de auditoría',
  },
  {
    key: 'estrategia',
    icon: <Target size={18} />,
    label: 'Estrategia',
    tooltip: 'OKRs, THI histórico y entregables',
  },
  {
    key: 'ejecucion',
    icon: <ClipboardList size={18} />,
    label: 'Ejecución',
    tooltip: 'Planes, actividades, tareas, compromisos, dependencias y bloqueos',
  },
  {
    key: 'personas',
    icon: <Users size={18} />,
    label: 'Personas',
    tooltip: 'Equipos, perfiles, sprints, métricas DORA, 1:1 y logros',
  },
  {
    key: 'reclutamiento',
    icon: <UserPlus size={18} />,
    label: 'Reclutamiento',
    tooltip: 'Candidatos, tecnologías y evaluaciones',
  },
  {
    key: 'equipamiento',
    icon: <Monitor size={18} />,
    label: 'Equipamiento',
    tooltip: 'Equipos, asignaciones y tickets de soporte',
  },
]

interface Props {
  permissions: AiProviderConfig['dataPermissions']
  userId: string
  onToggle: (key: keyof AiProviderConfig['dataPermissions'], value: boolean) => void
}

export function AiPermissionsPanel({ permissions, userId: _userId, onToggle }: Props) {
  const active = PERMISSION_DEFS.filter((p) => permissions[p.key]).length

  return (
    <div className="bg-card rounded-xl border border-boundary overflow-hidden">
      <div className="px-5 py-3.5 border-b border-boundary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">🛡️</span>
          <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">
            Permisos de datos
          </h2>
        </div>
        <span className="text-xs text-muted tabular-nums">
          {active}/{PERMISSION_DEFS.length}
        </span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-1.5">
          {PERMISSION_DEFS.map((perm) => (
            <label
              key={perm.key}
              title={perm.tooltip}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-all cursor-pointer ${
                permissions[perm.key]
                  ? 'bg-neutral-10 dark:bg-neutral-80'
                  : 'hover:bg-neutral-5 dark:hover:bg-neutral-85'
              }`}
            >
              <span
                className={`shrink-0 ${permissions[perm.key] ? 'text-neutral-90 dark:text-white' : 'text-muted'}`}
              >
                {perm.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm transition-colors ${permissions[perm.key] ? 'text-neutral-90 dark:text-white font-medium' : 'text-muted'}`}
                >
                  {perm.label}
                </p>
              </div>
              <ToggleSwitch
                checked={permissions[perm.key]}
                onChange={() => onToggle(perm.key, !permissions[perm.key])}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
