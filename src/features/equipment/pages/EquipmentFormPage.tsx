import { useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { EquipmentForm } from '../components/EquipmentForm'

export function EquipmentFormPage() {
  const { id } = useParams<{ id: string }>()
  const equipment = useLiveQuery(() => (id ? db.equipment.get(id) : undefined), [id])

  if (id && !equipment) return <div className="p-6 text-neutral-50">Cargando...</div>

  return <EquipmentForm initial={equipment} id={id} />
}
