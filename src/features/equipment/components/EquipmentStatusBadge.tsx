import type { EquipmentStatus } from '@/types/domain'

const badgeConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'bg-success/10 text-success' },
  assigned: { label: 'Asignado', color: 'bg-primary/10 text-primary' },
  maintenance: { label: 'En Mantención', color: 'bg-warning/10 text-warning' },
  retired: { label: 'Dado de Baja', color: 'bg-danger/10 text-danger' },
  obsolete: { label: 'Obsoleto', color: 'bg-neutral-30 text-neutral-60' },
}

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  const cfg = badgeConfig[status] ?? { label: status, color: 'bg-neutral-10 text-neutral-60' }
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
}

const conditionConfig: Record<string, { label: string; color: string }> = {
  excellent: { label: 'Excelente', color: 'text-success' },
  good: { label: 'Bueno', color: 'text-primary' },
  fair: { label: 'Regular', color: 'text-warning' },
  poor: { label: 'Malo', color: 'text-danger' },
}

export function EquipmentConditionBadge({ condition }: { condition: string }) {
  const cfg = conditionConfig[condition] ?? { label: condition, color: 'text-neutral-50' }
  return <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
}

export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  laptop: 'Laptop',
  monitor: 'Monitor',
  phone: 'Teléfono',
  mouse: 'Mouse',
  headphones: 'Audífonos',
  chair: 'Silla',
  keyboard: 'Teclado',
  desk_stand: 'Soporte Monitor',
  other: 'Otro',
}
