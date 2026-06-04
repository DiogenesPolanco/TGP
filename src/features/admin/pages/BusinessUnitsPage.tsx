import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export function BusinessUnitsPage() {
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')

  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []

  const { page, setPage, totalPages, paginatedItems: paginatedBUs } = usePagination(businessUnits, 10)

  const resetForm = () => {
    setFormName('')
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
      (bu) => bu.name.toLowerCase() === name.toLowerCase() && bu.id !== editingId
    )
    if (exists) {
      addNotification({ type: 'error', message: 'Ya existe una unidad de negocio con ese nombre' })
      return
    }

    if (editingId) {
      await db.businessUnits.update(editingId, { name })
      addNotification({ type: 'success', message: 'Unidad de negocio actualizada' })
    } else {
      await db.businessUnits.add({
        id: crypto.randomUUID(),
        tenantId: 'default',
        name,
        createdAt: new Date(),
      })
      addNotification({ type: 'success', message: 'Unidad de negocio creada' })
    }
    resetForm()
  }

  const handleEdit = (id: string, name: string) => {
    setEditingId(id)
    setFormName(name)
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
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Unidades de Negocio</h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">
            Gestiona las unidades de negocio para organizar aplicaciones y equipos
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nueva Unidad
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">
            {editingId ? 'Editar Unidad de Negocio' : 'Nueva Unidad de Negocio'}
          </h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-60 dark:text-neutral-40 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') resetForm() }}
                placeholder="Ej: Digital, Core, Legacy..."
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Save size={16} />
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
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
                <tr className="border-b border-neutral-20 dark:border-neutral-70">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">
                    Aplicaciones
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">
                    Equipos
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">
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
              totalItems={businessUnits.length}
              pageSize={10}
              onPageChange={setPage}
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
  bu: { id: string; name: string; createdAt: Date }
  onEdit: (id: string, name: string) => void
  onDelete: (id: string, name: string) => void
}) {
  const appCount = useLiveQuery(
    () => db.applications.where('businessUnitId').equals(bu.id).count(),
    [bu.id],
    0
  )
  const teamCount = useLiveQuery(
    () => db.teams.where('businessUnitId').equals(bu.id).count(),
    [bu.id],
    0
  )

  return (
    <tr className="hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors">
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-neutral-90 dark:text-white">{bu.name}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-60 dark:text-neutral-40">{appCount}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-60 dark:text-neutral-40">{teamCount}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-60 dark:text-neutral-40">
          {bu.createdAt.toLocaleDateString()}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(bu.id, bu.name)}
            className="p-2 rounded-lg text-neutral-50 hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
            title="Editar"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(bu.id, bu.name)}
            className="p-2 rounded-lg text-danger/60 hover:bg-danger/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}
