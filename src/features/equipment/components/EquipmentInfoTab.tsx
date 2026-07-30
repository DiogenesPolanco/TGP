import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { assignEquipment, returnEquipment } from '@/services/equipment/equipmentService'
import {
  EquipmentStatusBadge,
  EquipmentConditionBadge,
  EQUIPMENT_TYPE_LABELS,
} from '@/features/equipment/components/EquipmentStatusBadge'
import { HtmlDescription } from '@/components/ui/HtmlDescription'
import { Monitor, Calendar, User, Package, RotateCcw, Info, HelpCircle } from 'lucide-react'
import {
  statusBg,
  statusIconBg,
  statusIcon,
  CONDITION_OPTIONS,
  Section,
  MiniField,
} from './equipmentDetailComponents'
import type { EquipmentAssignmentLog, EquipmentItem, MemberProfile, Team } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { MemberSelector } from '@/components/ui/MemberSelector'
import type { EquipmentCondition } from '@/types/domain'

export function EquipmentInfoTab({
  equipment,
  members,
  teams,
  assignments,
}: {
  equipment: EquipmentItem
  members: MemberProfile[]
  teams: Team[]
  assignments: EquipmentAssignmentLog[]
}) {
  const { addNotification } = useAppStore()
  const [assigning, setAssigning] = useState(false)
  const [returning, setReturning] = useState(false)
  const [assignTarget, setAssignTarget] = useState('')
  const [returnCondition, setReturnCondition] = useState<EquipmentCondition>('good')

  const activeAssignment = assignments.find((a) => a.returnedAt === null)
  const assignedMember = equipment.assignedTo
    ? (members.find((m) => m.id === equipment.assignedTo) ??
      teams.flatMap((t) => t.members).find((m) => m.id === equipment.assignedTo))
    : null

  const warrantyDate = equipment.warrantyExpiry ? new Date(equipment.warrantyExpiry) : null
  const warrantyExpired = warrantyDate && warrantyDate < new Date()
  const warrantyLabel = warrantyDate
    ? `${warrantyDate.toLocaleDateString('es')}${warrantyExpired ? ' (Vencida)' : ''}`
    : 'Sin registro'

  const handleAssign = async () => {
    if (!assignTarget.trim()) return
    setAssigning(true)
    try {
      await assignEquipment(equipment.id, assignTarget.trim(), 'good')
      addNotification({ type: 'success', message: 'Equipo asignado correctamente' })
      setAssignTarget('')
    } catch (err: any) {
      addNotification({ type: 'error', message: err.message ?? 'Error al asignar' })
    } finally {
      setAssigning(false)
    }
  }

  const handleReturn = async () => {
    setReturning(true)
    try {
      await returnEquipment(equipment.id, returnCondition)
      addNotification({ type: 'success', message: 'Equipo devuelto correctamente' })
    } catch {
      addNotification({ type: 'error', message: 'Error al devolver equipo' })
    } finally {
      setReturning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className={`rounded-xl border p-5 ${statusBg[equipment.status] || 'bg-neutral-10'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl ${statusIconBg[equipment.status] || 'bg-neutral-40'} flex items-center justify-center shadow-sm`}
            >
              {statusIcon[equipment.status] || <HelpCircle size={24} className="text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <EquipmentStatusBadge status={equipment.status} />
                <EquipmentConditionBadge condition={equipment.condition} />
              </div>
              <p className="text-xl font-bold text-neutral-90 dark:text-white">
                {equipment.brand} {equipment.model}
              </p>
              <p className="text-sm text-muted mt-0.5">
                {EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type} · {equipment.serialNumber}
              </p>
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-lg ${statusIconBg[equipment.status] || 'bg-neutral-40'} text-white text-center shadow-sm`}
          >
            <Monitor size={24} className="mx-auto mb-0.5" />
            <p className="text-[10px] uppercase tracking-wider font-medium">
              {EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type}
            </p>
          </div>
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Detalles del Equipo" icon={<Monitor size={18} />}>
          <div className="grid grid-cols-2 gap-3">
            <MiniField label="Marca" value={equipment.brand} />
            <MiniField label="Modelo" value={equipment.model} />
            <MiniField label="N° Serie" value={equipment.serialNumber} />
            <MiniField
              label="Condición"
              value={<EquipmentConditionBadge condition={equipment.condition} />}
            />
            <MiniField
              label="Tipo"
              value={EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type}
            />
            <MiniField label="Estado" value={<EquipmentStatusBadge status={equipment.status} />} />
          </div>
        </Section>

        <Section title="Ciclo de Vida" icon={<Calendar size={18} />}>
          <div className="grid grid-cols-2 gap-3">
            <MiniField
              label="Fecha de Compra"
              value={
                equipment.purchaseDate
                  ? new Date(equipment.purchaseDate).toLocaleDateString('es')
                  : 'Sin registro'
              }
            />
            <MiniField
              label="Garantía"
              value={<span className={warrantyExpired ? 'text-danger' : ''}>{warrantyLabel}</span>}
            />
            {equipment.costCenter && (
              <MiniField label="Centro de Costo" value={equipment.costCenter} />
            )}
            {equipment.businessUnitId && (
              <MiniField label="Unidad de Negocio" value={equipment.businessUnitId} />
            )}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Asignación Actual" icon={<User size={18} />}>
          {activeAssignment ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MiniField
                  label="Asignado a"
                  value={
                    assignedMember && 'displayName' in assignedMember
                      ? assignedMember.displayName
                      : (equipment.assignedTo ?? '—')
                  }
                />
                <MiniField
                  label="Desde"
                  value={activeAssignment.assignedAt.toLocaleDateString('es')}
                />
                <MiniField
                  label="Condición entrega"
                  value={
                    <EquipmentConditionBadge condition={activeAssignment.conditionAtAssignment} />
                  }
                />
              </div>

              <Button
                onClick={handleReturn}
                disabled={returning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-warning text-white rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={16} />
                {returning ? 'Procesando...' : 'Registrar Devolución'}
              </Button>

              {returning && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted">Condición de devolución</label>
                  <Select
                    value={returnCondition}
                    onChange={(v) => setReturnCondition(v as EquipmentCondition)}
                    options={CONDITION_OPTIONS}
                  />
                </div>
              )}
            </div>
          ) : equipment.status !== 'retired' && equipment.status !== 'obsolete' ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-50">Equipo disponible para asignar</p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary flex items-center gap-1.5">
                  <User size={14} />
                  Asignar a
                </label>
                <MemberSelector
                  value={assignTarget}
                  onChange={setAssignTarget}
                  placeholder="Buscar miembro o escribir nombre..."
                />
                <Button
                  onClick={handleAssign}
                  disabled={assigning || !assignTarget.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-dark transition-colors disabled:opacity-50"
                >
                  <Package size={16} />
                  {assigning ? 'Asignando...' : 'Asignar Equipo'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-50">Equipo no disponible para asignación</p>
          )}
        </Section>

        {equipment.notes && (
          <Section title="Notas" icon={<Info size={18} />}>
            <HtmlDescription html={equipment.notes} full />
          </Section>
        )}
      </div>
    </div>
  )
}
