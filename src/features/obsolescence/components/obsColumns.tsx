import { Calendar, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { type Column } from '@/components/ui/SortableTable'
import { LifecycleBar } from './LifecycleBar'
import {
  getStatusLabel,
  getStatusStyle,
  getEolUrgency,
  getLifecyclePct,
  categoryLabels,
} from '../utils/obsolescenceHelpers'
import { formatDuration } from '@/utils/technologyUtils'
import type { Technology } from '@/types/domain'

interface ObsColumnsProps {
  technologies: Technology[]
  applications: { id: string; name: string; criticality: string; technologies: string[] }[]
  microservices: { id: string; applicationId: string; technologies: string[] }[]
  appTechMap: Map<string, string[]>
  onNavigate: (path: string) => void
  onDelete: (id: string) => void
}

export function useObsColumns({ applications, appTechMap, onNavigate, onDelete }: ObsColumnsProps) {
  const columns: Column<Technology>[] = [
    {
      key: 'name',
      label: 'Tecnología',
      sortable: true,
      render: (tech) => (
        <span className="text-sm font-medium text-neutral-90 dark:text-white">{tech.name}</span>
      ),
    },
    {
      key: 'version',
      label: 'Versión',
      sortable: true,
      render: (tech) => <span className="text-sm text-secondary">{tech.version}</span>,
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      render: (tech) => (
        <span className="text-xs px-2 py-1 rounded-full bg-neutral-10 dark:bg-neutral-70 text-muted">
          {categoryLabels[tech.category] || tech.category}
        </span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
      render: (tech) => <span className="text-sm text-secondary">{tech.vendor}</span>,
    },
    {
      key: 'supportStatus',
      label: 'Ciclo de Vida',
      sortable: true,
      render: (tech) => {
        const urgency = getEolUrgency(tech)
        return (
          <div className="flex items-center gap-3 min-w-[140px]">
            <LifecycleBar status={tech.supportStatus} />
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusStyle(tech.supportStatus)}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
                {getStatusLabel(tech.supportStatus)}
              </span>
              {tech.eolDate && tech.supportStatus !== 'active' && (
                <p className={`text-[10px] mt-0.5 ${urgency.color}`}>{urgency.label}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'eolDate',
      label: 'EOL Date',
      sortable: true,
      render: (tech) => {
        const urgency = getEolUrgency(tech)
        const eol = tech.eolDate ? new Date(tech.eolDate) : null
        const now = new Date()
        const remainingDays = eol
          ? Math.ceil((eol.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null
        const expired = remainingDays !== null && remainingDays < 0
        const pct = eol ? getLifecyclePct(eol) : 0
        return (
          <div className="min-w-[130px]">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={12} className="text-neutral-50 shrink-0" />
              <span className={`text-sm ${urgency.color}`}>
                {eol
                  ? eol.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
            {eol && (
              <div className="space-y-0.5">
                <div className="h-1.5 bg-neutral-10 dark:bg-neutral-85 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${expired ? 'bg-danger' : remainingDays! < 180 ? 'bg-warning' : remainingDays! < 365 ? 'bg-severity-high' : 'bg-success'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <p className={`text-[10px] leading-tight ${urgency.color}`}>
                  {expired
                    ? `Vencido hace ${formatDuration(remainingDays!)}`
                    : `${formatDuration(remainingDays!)} restantes`}
                </p>
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'apps',
      label: 'Apps',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (tech) => {
        const appCount = applications.filter((app) => {
          const techIds = appTechMap.get(app.id) ?? app.technologies
          return techIds.includes(tech.id)
        }).length
        return (
          <span
            className={`text-sm font-medium ${appCount > 0 ? 'text-neutral-90 dark:text-white' : 'text-neutral-50'}`}
          >
            {appCount}
          </span>
        )
      },
    },
    {
      key: 'cveList',
      label: 'CVEs',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (tech) => (
        <span
          className={`text-sm font-medium ${tech.cveList.length > 0 ? 'text-danger' : 'text-neutral-50'}`}
        >
          {tech.cveList.length || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (tech) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(`${tech.id}/edit`)
            }}
            variant="ghost"
            size="sm"
            className="p-1.5"
            title="Editar"
          >
            <Pencil size={16} />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(tech.id)
            }}
            variant="ghost"
            size="sm"
            className="p-1.5 hover:text-danger"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  return columns
}
