import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useNavigate } from 'react-router'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Plus, Pencil, Trash2, Save, X, Upload, Search, Filter } from 'lucide-react'
import type { BusinessUnit, BusinessUnitStatus } from '@/types/domain'
import { Button } from '@/components/ui/Button'

export function BusinessUnitsPage() {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formStatus, setFormStatus] = useState<BusinessUnitStatus>('active')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []

  const filteredBus = businessUnits.filter(
    (bu) =>
      bu.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || bu.status === statusFilter),
  )

  const {
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedItems: paginatedBUs,
  } = usePagination(filteredBus, 10)

  const resetForm = () => {
    setFormName('')
    setFormStatus('active')
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    const name = formName.trim()
    if (!name) {
      addNotification({ type: 'error', message: 'El nombre es requerido' })
      return
    }

    const exists = businessUnits.some(
      (bu) => bu.name.toLowerCase() === name.toLowerCase() && bu.id !== editingId,
    )
    if (exists) {
      addNotification({ type: 'error', message: 'Ya existe una unidad de negocio con ese nombre' })
      return
    }

    if (editingId) {
      await db.businessUnits.update(editingId, { name, status: formStatus })
      addNotification({ type: 'success', message: 'Unidad de negocio actualizada' })
    } else {
      await db.businessUnits.add({
        id: crypto.randomUUID(),
        tenantId: 'default',
        name,
        status: formStatus,
        createdAt: new Date(),
      })
      addNotification({ type: 'success', message: 'Unidad de negocio creada' })
    }
    resetForm()
  }

  const handleEdit = (id: string) => {
    const bu = businessUnits.find((b) => b.id === id)
    if (!bu) return
    setEditingId(id)
    setFormName(bu.name)
    setFormStatus(bu.status)
    setShowForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    const appCount = await db.applications.where('businessUnitId').equals(id).count()
    const teamCount = await db.teams.where('businessUnitId').equals(id).count()

    let message = `Eliminar "${name}"?`
    if (appCount > 0 || teamCount > 0) {
      message = `"${name}" tiene ${appCount} aplicacion(es) y ${teamCount} equipo(s) asociados. Eliminar de todas formas?`
    }

    if (await confirm(message)) {
      await db.businessUnits.delete(id)
      addNotification({ type: 'success', message: 'Unidad de negocio eliminada' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">
            Unidades de Negocio
          </h2>
          <p className="text-sm text-muted mt-1">
            Gestiona las unidades de negocio para organizar aplicaciones y equipos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Upload size={16} />
            Importar
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nueva Unidad
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50"
            />
            <input
              type="text"
              placeholder="Buscar unidades de negocio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || statusFilter !== 'all'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {statusFilter !== 'all' && <span className="w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-boundary">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Estado</label>
              <Select
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Activo' },
                  { value: 'inactive', label: 'Inactivo' },
                ]}
                className="min-w-[120px]"
              />
            </div>
            {statusFilter !== 'all' && (
              <Button
                onClick={() => setStatusFilter('all')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger hover:text-danger-dark transition-colors"
              >
                <X size={14} />
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-boundary p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">
            {editingId ? 'Editar Unidad de Negocio' : 'Nueva Unidad de Negocio'}
          </h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted mb-1">Nombre</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') resetForm()
                }}
                placeholder="Ej: Digital, Core, Legacy..."
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Estado</label>
              <Select
                value={formStatus}
                onChange={(v) => setFormStatus(v as BusinessUnitStatus)}
                options={[
                  { value: 'active', label: 'Activo' },
                  { value: 'inactive', label: 'Inactivo' },
                ]}
              />
            </div>
            <Button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Save size={16} />
              {editingId ? 'Actualizar' : 'Crear'}
            </Button>
            <Button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              <X size={16} />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
        {businessUnits.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-50 dark:text-neutral-40 text-sm">
              No hay unidades de negocio registradas. Crea tu primera unidad para empezar.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-boundary">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Aplicaciones
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Equipos
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
                {paginatedBUs.map((bu) => (
                  <BusinessUnitRow
                    key={bu.id}
                    bu={bu}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filteredBus.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>
    </div>
  )
}

function BusinessUnitRow({
  bu,
  onEdit,
  onDelete,
}: {
  bu: BusinessUnit
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
}) {
  const appCount = useLiveQuery(
    () => db.applications.where('businessUnitId').equals(bu.id).count(),
    [bu.id],
    0,
  )
  const teamCount = useLiveQuery(
    () => db.teams.where('businessUnitId').equals(bu.id).count(),
    [bu.id],
    0,
  )

  return (
    <tr
      onClick={() => onEdit(bu.id)}
      className="hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors cursor-pointer"
    >
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-neutral-90 dark:text-white">{bu.name}</span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            bu.status === 'active'
              ? 'bg-success/10 text-success'
              : 'bg-neutral-10 dark:bg-neutral-70 text-neutral-50 dark:text-neutral-40'
          }`}
        >
          {bu.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted">{appCount}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted">{teamCount}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted">{new Date(bu.createdAt).toLocaleDateString()}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(bu.id)
            }}
            className="p-2 rounded-lg text-neutral-50 hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(bu.id, bu.name)
            }}
            className="p-2 rounded-lg text-danger/60 hover:bg-danger/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </td>
    </tr>
  )
}
