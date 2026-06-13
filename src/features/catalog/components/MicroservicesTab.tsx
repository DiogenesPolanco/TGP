import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { TechSearch } from '@/components/ui/TechSearch'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import {
  Plus, X, Trash2, Server,
  AlertTriangle, Shield, Activity, FileWarning,
  ExternalLink,
} from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'

interface MicroservicesTabProps {
  applicationId: string
}

export function MicroservicesTab({ applicationId }: MicroservicesTabProps) {
  const navigate = useNavigate()
  const microservices = useLiveQuery(
    () => db.microservices.where('applicationId').equals(applicationId).toArray(),
    [applicationId],
  ) ?? []
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const { confirm } = useConfirm()

  const msIds = useMemo(() => microservices.map((m) => m.id), [microservices])

  const vulnJunctions = useLiveQuery(
    () => msIds.length > 0 ? db.vulnerabilityMicroservices.where('microserviceId').anyOf(msIds).toArray() : [],
    [msIds.join(',')],
  ) ?? []
  const incidentJunctions = useLiveQuery(
    () => msIds.length > 0 ? db.incidentMicroservices.where('microserviceId').anyOf(msIds).toArray() : [],
    [msIds.join(',')],
  ) ?? []
  const riskJunctions = useLiveQuery(
    () => msIds.length > 0 ? db.riskMicroservices.where('microserviceId').anyOf(msIds).toArray() : [],
    [msIds.join(',')],
  ) ?? []
  const auditJunctions = useLiveQuery(
    () => msIds.length > 0 ? db.auditFindingMicroservices.where('microserviceId').anyOf(msIds).toArray() : [],
    [msIds.join(',')],
  ) ?? []

  const countsByMsId = useMemo(() => {
    const map: Record<string, { vulns: number; incidents: number; risks: number; audit: number }> = {}
    for (const j of vulnJunctions) { if (!map[j.microserviceId]) map[j.microserviceId] = { vulns: 0, incidents: 0, risks: 0, audit: 0 }; map[j.microserviceId].vulns++ }
    for (const j of incidentJunctions) { if (!map[j.microserviceId]) map[j.microserviceId] = { vulns: 0, incidents: 0, risks: 0, audit: 0 }; map[j.microserviceId].incidents++ }
    for (const j of riskJunctions) { if (!map[j.microserviceId]) map[j.microserviceId] = { vulns: 0, incidents: 0, risks: 0, audit: 0 }; map[j.microserviceId].risks++ }
    for (const j of auditJunctions) { if (!map[j.microserviceId]) map[j.microserviceId] = { vulns: 0, incidents: 0, risks: 0, audit: 0 }; map[j.microserviceId].audit++ }
    return map
  }, [vulnJunctions, incidentJunctions, riskJunctions, auditJunctions])

  const [showForm, setShowForm] = useState(false)

  const handleDelete = async (msId: string) => {
    if (!(await confirm('¿Eliminar este microservicio?'))) return
    await db.microservices.delete(msId)
  }

  function EntityCountCell({ count, icon: Icon, color }: { count: number; icon: React.ComponentType<{ size?: number }>; color: string }) {
    return (
      <div className="flex items-center gap-1">
        <span className={count > 0 ? color : 'text-neutral-50'}>
          <Icon size={12} />
        </span>
        <span className={`text-xs font-medium tabular-nums ${count > 0 ? color : 'text-neutral-50'}`}>{count}</span>
      </div>
    )
  }

  const columns: Column<(typeof microservices)[number]>[] = useMemo(() => [
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
            {ms.description && (
              <p className="text-xs text-neutral-60 dark:text-neutral-40 line-clamp-1">{ms.description}</p>
            )}
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
            <span className="text-sm text-neutral-70 dark:text-neutral-30">{techs.length}</span>
          </div>
        )
      },
    },
    {
      key: 'eol',
      label: 'EOL',
      sortable: true,
      render: (ms) => {
        const eolCount = allTechnologies.filter((t) => ms.technologies.includes(t.id) && t.supportStatus === 'eol').length
        return (
          <span className={`text-xs font-medium tabular-nums ${eolCount > 0 ? 'text-danger' : 'text-neutral-50'}`}>{eolCount}</span>
        )
      },
    },
    {
      key: 'vulns',
      label: 'Vulns',
      sortable: true,
      render: (ms) => {
        const c = countsByMsId[ms.id]
        return <EntityCountCell count={c?.vulns ?? 0} icon={Shield} color={c?.vulns && c.vulns > 0 ? 'text-danger' : 'text-neutral-50'} />
      },
    },
    {
      key: 'incidents',
      label: 'Incidentes',
      sortable: true,
      render: (ms) => {
        const c = countsByMsId[ms.id]
        return <EntityCountCell count={c?.incidents ?? 0} icon={Activity} color={c?.incidents && c.incidents > 0 ? 'text-warning' : 'text-neutral-50'} />
      },
    },
    {
      key: 'risks',
      label: 'Riesgos',
      sortable: true,
      render: (ms) => {
        const c = countsByMsId[ms.id]
        return <EntityCountCell count={c?.risks ?? 0} icon={AlertTriangle} color={c?.risks && c.risks > 0 ? 'text-warning' : 'text-neutral-50'} />
      },
    },
    {
      key: 'audit',
      label: 'Auditoría',
      sortable: true,
      render: (ms) => {
        const c = countsByMsId[ms.id]
        return <EntityCountCell count={c?.audit ?? 0} icon={FileWarning} color={c?.audit && c.audit > 0 ? 'text-info' : 'text-neutral-50'} />
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (ms) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/catalog/microservices/${ms.id}`) }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Gestionar"
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(ms.id) }}
            className="p-1.5 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [allTechnologies, countsByMsId])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Microservicios <span className="text-neutral-50 text-base font-normal">({microservices.length})</span>
        </h4>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Plus size={16} />
          Nuevo Microservicio
        </button>
      </div>

      <SortableTable
        columns={columns}
        data={microservices}
        pageSize={10}
        emptyMessage="No hay microservicios registrados para esta aplicación"
        onRowClick={(ms) => navigate(`/catalog/microservices/${ms.id}`)}
      />

      {showForm && (
        <MicroserviceFormModal
          applicationId={applicationId}
          editingId={null}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}



/* ─── Microservice Form Modal ─── */

function MicroserviceFormModal({
  applicationId,
  editingId,
  onClose,
}: {
  applicationId: string
  editingId: string | null
  onClose: () => void
}) {
  const existing = useLiveQuery(
    () => db.microservices.get(editingId ?? ''),
    [editingId],
  )

  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>(existing?.technologies ?? [])
  const [saving, setSaving] = useState(false)

  if (existing && !name) {
    setName(existing.name)
    setDescription(existing.description)
    setSelectedTechIds(existing.technologies)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const data = {
        applicationId,
        name: name.trim(),
        description: description.trim(),
        technologies: selectedTechIds,
        updatedAt: new Date(),
      }

      if (editingId) {
        await db.microservices.update(editingId, data)
      } else {
        await db.microservices.add({
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date(),
        })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {editingId ? 'Editar Microservicio' : 'Nuevo Microservicio'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            <X size={20} className="text-neutral-50" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Nombre <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. auth-service, api-gateway"
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Descripción
          </label>
          <RichTextEditor
            value={description}
            onChange={(html) => setDescription(html)}
            placeholder="Propósito del microservicio..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Stack Tecnológico
          </label>
          <TechSearch
            selectedIds={selectedTechIds}
            onChange={setSelectedTechIds}
            enableDepsSearch={true}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Crear Microservicio'}
          </button>
        </div>
      </div>
    </div>
  )
}
