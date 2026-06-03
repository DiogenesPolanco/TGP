import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Download, Upload, Trash2, Edit, Eye } from 'lucide-react'
import { ApplicationForm } from '../components/ApplicationForm'
import type { Application } from '@/types/domain'

export function ApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const { addNotification } = useAppStore()

  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []

  const filteredApps = applications.filter((app) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta aplicación?')) {
      await db.applications.delete(id)
      addNotification({ type: 'success', message: 'Aplicación eliminada correctamente' })
    }
  }

  const getCriticalityColor = (criticality: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-danger/10 text-danger',
      high: 'bg-warning/10 text-warning',
      medium: 'bg-info/10 text-info',
      low: 'bg-success/10 text-success',
    }
    return colors[criticality] || 'bg-neutral-10 text-neutral-60'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-success/10 text-success',
      deprecated: 'bg-warning/10 text-warning',
      retired: 'bg-neutral-10 text-neutral-60',
      planned: 'bg-info/10 text-info',
    }
    return colors[status] || 'bg-neutral-10 text-neutral-60'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Catálogo de Aplicaciones</h2>
        <button
          onClick={() => { setEditingApp(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nueva Aplicación
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder="Buscar aplicaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <Filter size={16} />
          Filtros
        </button>
        <button className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <Upload size={16} />
          Importar
        </button>
        <button className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <Download size={16} />
          Exportar
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-80">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Owner</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">BU</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Criticidad</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Arquitectura</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {filteredApps.map((app) => (
              <tr key={app.id} className="hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors">
                <td className="px-6 py-4">
                  <Link to={`/catalog/applications/${app.id}`} className="text-sm font-medium text-primary hover:underline">
                    {app.name}
                  </Link>
                  <p className="text-xs text-neutral-50 dark:text-neutral-50 mt-0.5">{app.description}</p>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{app.ownerName}</td>
                <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">
                  {businessUnits.find((bu) => bu.id === app.businessUnitId)?.name || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCriticalityColor(app.criticality)}`}>
                    {app.criticality}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{app.architecture}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/catalog/applications/${app.id}`} className="p-1.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
                      <Eye size={16} className="text-neutral-60 dark:text-neutral-40" />
                    </Link>
                    <button
                      onClick={() => { setEditingApp(app); setShowForm(true) }}
                      className="p-1.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
                    >
                      <Edit size={16} className="text-neutral-60 dark:text-neutral-40" />
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-1.5 rounded-md hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={16} className="text-danger" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-50 dark:text-neutral-50">No se encontraron aplicaciones</p>
          </div>
        )}
      </div>

      {showForm && (
        <ApplicationForm
          application={editingApp}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false)
            setEditingApp(null)
            addNotification({ type: 'success', message: editingApp ? 'Aplicación actualizada' : 'Aplicación creada' })
          }}
        />
      )}
    </div>
  )
}
