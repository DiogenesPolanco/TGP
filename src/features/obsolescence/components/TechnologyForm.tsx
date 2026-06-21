import { useState } from 'react'
import { X } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { db } from '@/services/db/database'
import type { Technology, TechCategory, SupportStatus } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

const categoryOptions: { value: TechCategory; label: string }[] = [
  { value: 'framework', label: 'Framework' },
  { value: 'language', label: 'Lenguaje' },
  { value: 'database', label: 'Base de Datos' },
  { value: 'runtime', label: 'Runtime' },
  { value: 'os', label: 'Sistema Operativo' },
  { value: 'library', label: 'Librería' },
  { value: 'cache', label: 'Cache' },
  { value: 'message_broker', label: 'Cola/Mensajería' },
  { value: 'web_server', label: 'Servidor Web' },
  { value: 'cloud_service', label: 'Servicio Cloud' },
  { value: 'tool', label: 'Herramienta' },
  { value: 'other', label: 'Otro' },
]

const statusOptions: { value: SupportStatus; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'extended', label: 'Soporte Extendido' },
  { value: 'eol', label: 'EOL - Fin de Vida' },
  { value: 'unknown', label: 'Desconocido' },
]

interface TechnologyFormProps {
  technology: Technology | null
  onClose: () => void
  onSave: () => void
}

export function TechnologyForm({ technology, onClose, onSave }: TechnologyFormProps) {
  const [formData, setFormData] = useState({
    name: technology?.name ?? '',
    version: technology?.version ?? '',
    category: technology?.category ?? 'framework' as TechCategory,
    vendor: technology?.vendor ?? '',
    eolDate: technology?.eolDate ? new Date(technology.eolDate).toISOString().split('T')[0] : '',
    supportStatus: technology?.supportStatus ?? 'active' as SupportStatus,
    cveList: technology?.cveList?.join(', ') ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name: formData.name,
      version: formData.version,
      category: formData.category,
      vendor: formData.vendor,
      eolDate: formData.eolDate ? parseLocalDate(formData.eolDate) : null,
      supportStatus: formData.supportStatus,
      cveList: formData.cveList
        ? formData.cveList.split(',').map((c) => c.trim()).filter(Boolean)
        : [],
      metadata: technology?.metadata ?? {},
      createdAt: technology?.createdAt ?? new Date(),
    }

    if (technology) {
      await db.technologies.update(technology.id, data)
    } else {
      await db.technologies.add({ ...data, id: crypto.randomUUID() })
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl border border-boundary shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-boundary">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {technology ? 'Editar Tecnología' : 'Nueva Tecnología'}
          </h3>
          <Button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Versión *</label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Categoría *" required value={formData.category} onChange={(v) => setFormData({ ...formData, category: v as TechCategory })} options={categoryOptions.map((opt) => ({ value: opt.value, label: opt.label }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Vendor *</label>
              <input
                type="text"
                required
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Estado de Soporte *" required value={formData.supportStatus} onChange={(v) => setFormData({ ...formData, supportStatus: v as SupportStatus })} options={statusOptions.map((opt) => ({ value: opt.value, label: opt.label }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Fecha EOL</label>
              <DatePicker
                value={formData.eolDate}
                onChange={(v) => setFormData({ ...formData, eolDate: v })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">CVE(s) conocidos</label>
            <input
              type="text"
              value={formData.cveList}
              onChange={(e) => setFormData({ ...formData, cveList: e.target.value })}
              placeholder="CVE-2024-1234, CVE-2024-5678"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-neutral-50 mt-1">Separados por coma</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button"
              onClick={onClose} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
              Cancelar
            </Button>
            <Button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
              {technology ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
