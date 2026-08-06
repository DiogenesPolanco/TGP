import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { DetailLayout } from '@/components/ui/DetailLayout'
import {
  deleteEquipment,
  getAssignmentHistory,
  getEquipmentTickets,
} from '@/services/equipment/equipmentService'
import { EQUIPMENT_TYPE_LABELS } from '../components/EquipmentStatusBadge'
import { Pencil, Trash2, Info, ClipboardList, History } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EquipmentInfoTab } from '@/features/equipment/components/EquipmentInfoTab'
import { EquipmentTicketsTab } from '@/features/equipment/components/EquipmentTicketsTab'
import { EquipmentHistoryTab } from '@/features/equipment/components/EquipmentHistoryTab'

type Tab = 'info' | 'tickets' | 'history'

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const equipment = useLiveQuery(() => (id ? db.equipment.get(id) : undefined), [id])
  const assignments = useLiveQuery(() => (id ? getAssignmentHistory(id) : []), [id]) ?? []
  const tickets = useLiveQuery(() => (id ? getEquipmentTickets(id) : []), [id]) ?? []
  const members = useLiveQuery(() => db.memberProfiles.toArray(), []) ?? []
  const teams = useLiveQuery(() => db.teams.toArray(), []) ?? []

  if (!equipment) {
    return (
      <DetailLayout title="Equipo no encontrado" onBack={() => navigate('/equipment')}>
        <p className="text-neutral-50">El equipo no existe o ha sido eliminado.</p>
      </DetailLayout>
    )
  }

  const handleDelete = async () => {
    if (await confirm('¿Eliminar este equipo? También se borrarán asignaciones y tickets.')) {
      await deleteEquipment(equipment.id)
      addNotification({ type: 'success', message: 'Equipo eliminado' })
      navigate('/equipment')
    }
  }

  const tabs = [
    { id: 'info' as const, label: 'Información', icon: Info },
    { id: 'tickets' as const, label: `Tickets (${tickets.length})`, icon: ClipboardList },
    { id: 'history' as const, label: `Historial (${assignments.length})`, icon: History },
  ]

  return (
    <DetailLayout
      title={`${EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type}`}
      subtitle={`${equipment.brand} ${equipment.model} · N/S: ${equipment.serialNumber}`}
      onBack={() => navigate('/equipment')}
      backLabel="Equipamiento"
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/equipment/${equipment.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            <Pencil size={16} />
            Editar
          </Button>
          <Button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 text-neutral-50 hover:text-danger transition-colors"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 border-b border-boundary -mx-6 px-6 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant="ghost"
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-neutral-90 dark:hover:text-white'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {activeTab === 'info' && (
        <EquipmentInfoTab
          equipment={equipment}
          members={members}
          teams={teams}
          assignments={assignments}
        />
      )}
      {activeTab === 'tickets' && (
        <EquipmentTicketsTab
          tickets={tickets}
          members={members}
          teams={teams}
          equipmentId={equipment.id}
        />
      )}
      {activeTab === 'history' && (
        <EquipmentHistoryTab assignments={assignments} members={members} teams={teams} />
      )}
    </DetailLayout>
  )
}
