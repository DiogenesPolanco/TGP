import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import {
  Plus,
  Trash2,
  Server,
  AlertTriangle,
  Shield,
  Activity,
  FileWarning,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HtmlDescription } from '@/components/ui/HtmlDescription'

interface MicroservicesTabProps {
  applicationId: string
}

export function MicroservicesTab({ applicationId }: MicroservicesTabProps) {
  const navigate = useNavigate()
  const microservices =
    useLiveQuery(
      () => db.microservices.where('applicationId').equals(applicationId).toArray(),
      [applicationId],
    ) ?? []
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const { confirm } = useConfirm()

  const msIds = useMemo(() => microservices.map((m) => m.id), [microservices])

  const vulnJunctions =
    useLiveQuery(
      () =>
        msIds.length > 0
          ? db.vulnerabilityMicroservices.where('microserviceId').anyOf(msIds).toArray()
          : [],
      [msIds.join(',')],
    ) ?? []
  const incidentJunctions =
    useLiveQuery(
      () =>
        msIds.length > 0
          ? db.incidentMicroservices.where('microserviceId').anyOf(msIds).toArray()
          : [],
      [msIds.join(',')],
    ) ?? []
  const riskJunctions =
    useLiveQuery(
      () =>
        msIds.length > 0 ? db.riskMicroservices.where('microserviceId').anyOf(msIds).toArray() : [],
      [msIds.join(',')],
    ) ?? []
  const auditJunctions =
    useLiveQuery(
      () =>
        msIds.length > 0
          ? db.auditFindingMicroservices.where('microserviceId').anyOf(msIds).toArray()
          : [],
      [msIds.join(',')],
    ) ?? []

  const countsByMsId = useMemo(() => {
    const map: Record<string, { vulns: number; incidents: number; risks: number; audit: number }> =
      {}
    for (const j of vulnJunctions) {
      if (!map[j.microserviceId])
        map[j.microserviceId] = { vulns: 0, incidents: 0, risks: 0, audit: 0 }
      map[j.microserviceId].vulns++
    }
    for (const j of incidentJunctions) {
      if (!map[j.microserviceId])
        map[j.microserviceId] = { vulns: 0, incidents: 0, risks: 0, audit: 0 }
      map[j.microserviceId].incidents++
    }
    for (const j of riskJunctions) {
      if (!map[j.microserviceId])
        map[j.microserviceId] = { vulns: 0, incidents: 0, risks: 0, audit: 0 }
      map[j.microserviceId].risks++
    }
    for (const j of auditJunctions) {
      if (!map[j.microserviceId])
        map[j.microserviceId] = { vulns: 0, incidents: 0, risks: 0, audit: 0 }
      map[j.microserviceId].audit++
    }
    return map
  }, [vulnJunctions, incidentJunctions, riskJunctions, auditJunctions])

  const handleDelete = async (msId: string) => {
    if (!(await confirm('¿Eliminar este microservicio?'))) return
    await db.microservices.delete(msId)
  }

  function EntityCountCell({
    count,
    icon: Icon,
    color,
  }: {
    count: number
    icon: React.ComponentType<{ size?: number }>
    color: string
  }) {
    return (
      <div className="flex items-center gap-1">
        <span className={count > 0 ? color : 'text-neutral-50'}>
          <Icon size={12} />
        </span>
        <span
          className={`text-xs font-medium tabular-nums ${count > 0 ? color : 'text-neutral-50'}`}
        >
          {count}
        </span>
      </div>
    )
  }

  const columns: Column<(typeof microservices)[number]>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Nombre',
        sortable: true,
        render: (ms) => (
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Server size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-90 dark:text-white">{ms.name}</p>
              {ms.description && <HtmlDescription html={ms.description} lines={1} />}
            </div>
          </div>
        ),
      },
      {
        key: 'technologies',
        label: 'Tecnologías',
        sortable: true,
        render: (ms) => {
          const techs = allTechnologies.filter((t) => ms.technologies.includes(t.id))
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-secondary">{techs.length}</span>
            </div>
          )
        },
      },
      {
        key: 'eol',
        label: 'EOL',
        sortable: true,
        render: (ms) => {
          const eolCount = allTechnologies.filter(
            (t) => ms.technologies.includes(t.id) && t.supportStatus === 'eol',
          ).length
          return (
            <span
              className={`text-xs font-medium tabular-nums ${eolCount > 0 ? 'text-danger' : 'text-neutral-50'}`}
            >
              {eolCount}
            </span>
          )
        },
      },
      {
        key: 'vulns',
        label: 'Vulns',
        sortable: true,
        render: (ms) => {
          const c = countsByMsId[ms.id]
          return (
            <EntityCountCell
              count={c?.vulns ?? 0}
              icon={Shield}
              color={c?.vulns && c.vulns > 0 ? 'text-danger' : 'text-neutral-50'}
            />
          )
        },
      },
      {
        key: 'incidents',
        label: 'Incidentes',
        sortable: true,
        render: (ms) => {
          const c = countsByMsId[ms.id]
          return (
            <EntityCountCell
              count={c?.incidents ?? 0}
              icon={Activity}
              color={c?.incidents && c.incidents > 0 ? 'text-warning' : 'text-neutral-50'}
            />
          )
        },
      },
      {
        key: 'risks',
        label: 'Riesgos',
        sortable: true,
        render: (ms) => {
          const c = countsByMsId[ms.id]
          return (
            <EntityCountCell
              count={c?.risks ?? 0}
              icon={AlertTriangle}
              color={c?.risks && c.risks > 0 ? 'text-warning' : 'text-neutral-50'}
            />
          )
        },
      },
      {
        key: 'audit',
        label: 'Auditoría',
        sortable: true,
        render: (ms) => {
          const c = countsByMsId[ms.id]
          return (
            <EntityCountCell
              count={c?.audit ?? 0}
              icon={FileWarning}
              color={c?.audit && c.audit > 0 ? 'text-info' : 'text-neutral-50'}
            />
          )
        },
      },
      {
        key: 'actions',
        label: '',
        className: 'text-right',
        headerClassName: 'text-right',
        render: (ms) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/catalog/microservices/${ms.id}`)
              }}
            >
              <ExternalLink size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(ms.id)
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ),
      },
    ],
    [allTechnologies, countsByMsId],
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Microservicios{' '}
          <span className="text-neutral-50 text-base font-normal">({microservices.length})</span>
        </h4>
        <Button
          variant="ghost"
          onClick={() => navigate(`/catalog/microservices/new?appId=${applicationId}`)}
        >
          <Plus size={16} />
          Nuevo Microservicio
        </Button>
      </div>

      <SortableTable
        columns={columns}
        data={microservices}
        pageSize={10}
        emptyMessage="No hay microservicios registrados para esta aplicación"
        onRowClick={(ms) => navigate(`/catalog/microservices/${ms.id}`)}
      />
    </div>
  )
}
