import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import type { SupportStatus, TechCategory } from '@/types/domain'

export function TechnologyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const technology = useLiveQuery(() => (id ? db.technologies.get(id) : undefined), [id])

  const [formData, setFormData] = useState({
    name: '',
    version: '',
    vendor: '',
    category: '',
    supportStatus: 'active' as SupportStatus,
    eolDate: '',
  })

  useEffect(() => {
    if (technology) {
      setFormData({
        name: technology.name ?? '',
        version: technology.version ?? '',
        vendor: technology.vendor ?? '',
        category: technology.category ?? '',
        supportStatus: technology.supportStatus ?? 'active',
        eolDate: technology.eolDate ? new Date(technology.eolDate).toISOString().split('T')[0] : '',
      })
    }
  }, [technology])

  if (id && !technology) return <div className="p-6 text-neutral-50">Cargando...</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...formData, category: formData.category as TechCategory, eolDate: formData.eolDate ? new Date(formData.eolDate) : null, cveList: technology?.cveList ?? [], metadata: technology?.metadata ?? {}, createdAt: technology?.createdAt ?? new Date() }
    if (technology) { await db.technologies.update(technology.id, data); addNotification({ type: 'success', message: 'Tecnología actualizada' }) }
    else { await db.technologies.add({ ...data, id: crypto.randomUUID() }); addNotification({ type: 'success', message: 'Tecnología creada' }) }
    navigate('/catalog/obsolescence')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/catalog/obsolescence')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"><ArrowLeft size={20} className="text-neutral-60" /></button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">{technology ? 'Editar Tecnología' : 'Nueva Tecnología'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Nombre *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Versión *</label><input type="text" required value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Vendor</label><input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Categoría</label><input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="lenguaje, framework, db..." className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Estado Soporte *</label>
            <select required value={formData.supportStatus} onChange={(e) => setFormData({ ...formData, supportStatus: e.target.value as SupportStatus })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="active">Activo</option><option value="extended">Soporte Extendido</option><option value="eol">EOL</option><option value="unknown">Desconocido</option>
            </select></div>
          <div><label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Fecha EOL</label><input type="date" value={formData.eolDate} onChange={(e) => setFormData({ ...formData, eolDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate('/catalog/obsolescence')} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">{technology ? 'Actualizar' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}
