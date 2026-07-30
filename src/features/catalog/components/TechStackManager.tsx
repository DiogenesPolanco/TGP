import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { TechSearch } from '@/components/ui/TechSearch'

const supportStatusLabel: Record<string, string> = {
  active: 'Activo',
  extended: 'S. Extendido',
  eol: 'EOL',
  unknown: '?',
}

const supportStatusColor: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown: 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
}

export function TechStackManager({
  applicationId,
  selectedIds,
}: {
  applicationId: string
  selectedIds: string[]
}) {
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const handleChange = async (ids: string[]) => {
    await db.applications.update(applicationId, { technologies: ids })
  }

  const appTechs = useMemo(
    () => allTechnologies.filter((t) => selectedIds.includes(t.id)),
    [allTechnologies, selectedIds],
  )

  const techColumns: Column<(typeof allTechnologies)[number]>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Tecnología',
        sortable: true,
        render: (t) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-90 dark:text-white">{t.name}</span>
            <span className="text-xs text-neutral-50">{t.version}</span>
          </div>
        ),
      },
      {
        key: 'vendor',
        label: 'Vendor',
        sortable: true,
        render: (t) => <span className="text-sm text-secondary">{t.vendor || '—'}</span>,
      },
      {
        key: 'category',
        label: 'Categoría',
        sortable: true,
        render: (t) => <span className="text-sm text-secondary capitalize">{t.category}</span>,
      },
      {
        key: 'supportStatus',
        label: 'Estado',
        sortable: true,
        render: (t) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${supportStatusColor[t.supportStatus]}`}
          >
            {supportStatusLabel[t.supportStatus]}
          </span>
        ),
      },
      {
        key: 'eolDate',
        label: 'Fecha EOL',
        sortable: true,
        render: (t) => (
          <span className="text-sm text-secondary">
            {t.eolDate
              ? new Date(t.eolDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })
              : '—'}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Stack Tecnológico{' '}
          <span className="text-neutral-50 text-base font-normal">({selectedIds.length})</span>
        </h4>
      </div>
      <TechSearch selectedIds={selectedIds} onChange={handleChange} enableDepsSearch={true} />
      {appTechs.length > 0 && (
        <SortableTable
          columns={techColumns}
          data={appTechs}
          pageSize={10}
          emptyMessage="Sin tecnologías asignadas"
        />
      )}
    </div>
  )
}
