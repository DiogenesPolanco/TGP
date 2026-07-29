import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { createEquipment, updateEquipment } from '@/services/equipment/equipmentService'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { Select } from '@/components/ui/Select'
import { MemberSelector } from '@/components/ui/MemberSelector'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Building2, User } from 'lucide-react'
import type {
  EquipmentItem,
  EquipmentType,
  EquipmentCondition,
  EquipmentStatus,
} from '@/types/domain'
import { EQUIPMENT_TYPE_LABELS } from './EquipmentStatusBadge'

const EQUIPMENT_TYPES = Object.keys(EQUIPMENT_TYPE_LABELS) as EquipmentType[]

interface Props {
  initial?: EquipmentItem
  id?: string
}

export function EquipmentForm({ initial, id }: Props) {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const isEdit = !!initial
  const [saving, setSaving] = useState(false)

  const businessUnits = useLiveQuery(() => db.businessUnits.toArray(), []) ?? []

  const [type, setType] = useState<EquipmentType>(initial?.type ?? 'laptop')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [serialNumber, setSerialNumber] = useState(initial?.serialNumber ?? '')
  const [status, setStatus] = useState<EquipmentStatus>(initial?.status ?? 'available')
  const [condition, setCondition] = useState<EquipmentCondition>(initial?.condition ?? 'good')
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? '')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? '')
  const [warrantyExpiry, setWarrantyExpiry] = useState(initial?.warrantyExpiry ?? '')
  const [costCenter, setCostCenter] = useState(initial?.costCenter ?? '')
  const [businessUnitId, setBusinessUnitId] = useState(initial?.businessUnitId ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brand.trim() || !model.trim() || !serialNumber.trim()) return
    if (status === 'assigned' && !assignedTo) {
      addNotification({
        type: 'error',
        message: 'Debes seleccionar un miembro para asignar el equipo',
      })
      return
    }
    setSaving(true)
    try {
      const data = {
        type,
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        status,
        condition,
        assignedTo: status === 'assigned' ? assignedTo : null,
        assignmentType: status === 'assigned' ? ('member' as const) : null,
        purchaseDate: purchaseDate || null,
        warrantyExpiry: warrantyExpiry || null,
        lastMaintenanceDate: initial?.lastMaintenanceDate ?? null,
        costCenter: costCenter.trim() || null,
        businessUnitId: businessUnitId || null,
        notes,
      }
      if (isEdit && id) {
        await updateEquipment(id, data)
        addNotification({ type: 'success', message: 'Equipo actualizado' })
      } else {
        await createEquipment(data as any)
        addNotification({ type: 'success', message: 'Equipo registrado' })
      }
      navigate('/equipment')
    } catch {
      addNotification({ type: 'error', message: 'Error al guardar equipo' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={() => navigate('/equipment')}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-60" />
        </Button>
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">
          {isEdit ? 'Editar Equipo' : 'Nuevo Equipo'}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-xl border border-boundary overflow-hidden"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider">
              Información del Equipo
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary">Tipo *</label>
                <Select
                  value={type}
                  onChange={(v) => setType(v as EquipmentType)}
                  options={EQUIPMENT_TYPES.map((t) => ({
                    value: t,
                    label: EQUIPMENT_TYPE_LABELS[t],
                  }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary">Estado</label>
                <Select
                  value={status}
                  onChange={(v) => {
                    setStatus(v as EquipmentStatus)
                    if (v !== 'assigned') setAssignedTo('')
                  }}
                  options={[
                    { value: 'available', label: 'Disponible' },
                    { value: 'assigned', label: 'Asignado' },
                    { value: 'maintenance', label: 'En Mantención' },
                    { value: 'retired', label: 'Dado de Baja' },
                    { value: 'obsolete', label: 'Obsoleto' },
                  ]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary">Condición</label>
                <Select
                  value={condition}
                  onChange={(v) => setCondition(v as EquipmentCondition)}
                  options={[
                    { value: 'excellent', label: 'Excelente' },
                    { value: 'good', label: 'Bueno' },
                    { value: 'fair', label: 'Regular' },
                    { value: 'poor', label: 'Malo' },
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary">Marca *</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary">Modelo *</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-secondary">N° Serie *</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <hr className="border-neutral-20 dark:border-neutral-70" />

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider">
              Asignación
            </h3>
            {status === 'assigned' ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary flex items-center gap-1.5">
                  <User size={14} />
                  Asignar a
                </label>
                <MemberSelector
                  value={assignedTo}
                  onChange={setAssignedTo}
                  placeholder="Buscar miembro o escribir nombre..."
                />
              </div>
            ) : (
              <p className="text-sm text-neutral-40 italic">
                Cambia el estado a "Asignado" para seleccionar un miembro.
              </p>
            )}
          </div>

          <hr className="border-neutral-20 dark:border-neutral-70" />

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider">
              Organización
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary flex items-center gap-1.5">
                  <Building2 size={14} />
                  Unidad de Negocio
                </label>
                <Select
                  value={businessUnitId}
                  onChange={setBusinessUnitId}
                  options={[
                    { value: '', label: 'Sin unidad' },
                    ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
                  ]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary">Centro de Costo</label>
                <input
                  type="text"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  placeholder="Ej: CC-2024-001"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <hr className="border-neutral-20 dark:border-neutral-70" />

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider">
              Garantía y Compra
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary">Fecha de Compra</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary">Vencimiento Garantía</label>
                <input
                  type="date"
                  value={warrantyExpiry}
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <hr className="border-neutral-20 dark:border-neutral-70" />

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider">
              Notas
            </h3>
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder="Notas sobre el equipo..."
              minHeight="200px"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-5 dark:bg-neutral-85 border-t border-boundary">
          <Button
            type="button"
            onClick={() => navigate('/equipment')}
            className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90 dark:hover:text-white transition-colors"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving || !brand.trim() || !model.trim() || !serialNumber.trim()}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : isEdit ? 'Actualizar Equipo' : 'Registrar Equipo'}
          </Button>
        </div>
      </form>
    </div>
  )
}
