import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { Monitor, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EQUIPMENT_TYPE_LABELS } from '@/features/equipment/components/EquipmentStatusBadge'

export function EquipmentSection({ memberId }: { memberId: string }) {
  const navigate = useNavigate()
  const assignedEquipment =
    useLiveQuery(() => db.equipment.where('assignedTo').equals(memberId).toArray(), [memberId]) ??
    []

  if (assignedEquipment.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-boundary p-6 text-center">
        <Package size={32} className="mx-auto mb-3 text-neutral-40" />
        <p className="text-sm text-neutral-50">Sin equipos asignados</p>
        <Button
          onClick={() => navigate('/equipment')}
          className="mt-3 flex mx-auto items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <Monitor size={16} />
          Ir a Inventario
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-boundary p-5 space-y-4">
      <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">
        Equipos Asignados ({assignedEquipment.length})
      </h3>

      <div className="space-y-2">
        {assignedEquipment.map((eq) => (
          <div
            key={eq.id}
            onClick={() => navigate(`/equipment/${eq.id}`)}
            className="flex items-center justify-between p-3 bg-neutral-5 dark:bg-neutral-85 rounded-lg cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Monitor size={16} className="text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-90 dark:text-white">
                  {EQUIPMENT_TYPE_LABELS[eq.type] ?? eq.type} - {eq.brand} {eq.model}
                </p>
                <p className="text-xs text-neutral-50 font-mono">{eq.serialNumber}</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                eq.condition === 'excellent'
                  ? 'bg-success/10 text-success'
                  : eq.condition === 'good'
                    ? 'bg-primary/10 text-primary'
                    : eq.condition === 'fair'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-danger/10 text-danger'
              }`}
            >
              {eq.condition === 'excellent'
                ? 'Excelente'
                : eq.condition === 'good'
                  ? 'Bueno'
                  : eq.condition === 'fair'
                    ? 'Regular'
                    : 'Malo'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
