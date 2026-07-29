import { db } from '@/services/db/database'
import type {
  EquipmentItem,
  EquipmentAssignmentLog,
  EquipmentTicket,
  EquipmentType,
  EquipmentCondition,
} from '@/types/domain'

function generateId(): string {
  return crypto.randomUUID()
}

// ─── Equipment CRUD ───

export async function getEquipment(): Promise<EquipmentItem[]> {
  return db.equipment.orderBy('createdAt').reverse().toArray()
}

export async function getEquipmentByType(type: EquipmentType): Promise<EquipmentItem[]> {
  return db.equipment.where('type').equals(type).toArray()
}

export async function getEquipmentByStatus(status: string): Promise<EquipmentItem[]> {
  return db.equipment.where('status').equals(status).toArray()
}

export async function getEquipmentAssignedTo(memberId: string): Promise<EquipmentItem[]> {
  return db.equipment.where('assignedTo').equals(memberId).toArray()
}

export async function getEquipmentItem(id: string): Promise<EquipmentItem | undefined> {
  return db.equipment.get(id)
}

export async function createEquipment(
  data: Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const id = generateId()
  const now = new Date()
  await db.equipment.add({ ...data, id, createdAt: now, updatedAt: now })
  return id
}

export async function updateEquipment(
  id: string,
  data: Partial<Omit<EquipmentItem, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.equipment.update(id, { ...data, updatedAt: new Date() })
}

export async function deleteEquipment(id: string): Promise<void> {
  await db.transaction(
    'rw',
    db.equipment,
    db.equipmentAssignments,
    db.equipmentTickets,
    async () => {
      await db.equipmentAssignments.where('equipmentId').equals(id).delete()
      await db.equipmentTickets.where('equipmentId').equals(id).delete()
      await db.equipment.delete(id)
    },
  )
}

// ─── Assignment ───

export async function assignEquipment(
  equipmentId: string,
  memberId: string,
  condition: EquipmentCondition,
  notes?: string,
): Promise<void> {
  await db.transaction('rw', db.equipment, db.equipmentAssignments, async () => {
    const item = await db.equipment.get(equipmentId)
    if (!item) throw new Error('Equipo no encontrado')
    if (item.status !== 'available') throw new Error('El equipo no está disponible')

    const log: EquipmentAssignmentLog = {
      id: generateId(),
      equipmentId,
      assignedTo: memberId,
      assignedAt: new Date(),
      returnedAt: null,
      conditionAtAssignment: condition,
      conditionAtReturn: null,
      notes: notes ?? '',
    }

    await db.equipmentAssignments.add(log)
    await db.equipment.update(equipmentId, {
      status: 'assigned',
      assignedTo: memberId,
      assignmentType: 'member',
      condition,
      updatedAt: new Date(),
    })
  })
}

export async function returnEquipment(
  equipmentId: string,
  returnCondition: EquipmentCondition,
  notes?: string,
): Promise<void> {
  await db.transaction('rw', db.equipment, db.equipmentAssignments, async () => {
    const active = await db.equipmentAssignments
      .where('equipmentId')
      .equals(equipmentId)
      .filter((a) => a.returnedAt === null)
      .first()

    if (active) {
      await db.equipmentAssignments.update(active.id, {
        returnedAt: new Date(),
        conditionAtReturn: returnCondition,
        notes: notes ?? '',
      })
    }

    await db.equipment.update(equipmentId, {
      status: 'available',
      assignedTo: null,
      assignmentType: null,
      condition: returnCondition,
      updatedAt: new Date(),
    })
  })
}

export async function getAssignmentHistory(equipmentId: string): Promise<EquipmentAssignmentLog[]> {
  return db.equipmentAssignments
    .where('equipmentId')
    .equals(equipmentId)
    .reverse()
    .sortBy('assignedAt')
}

export async function getActiveAssignments(
  memberId: string,
): Promise<(EquipmentAssignmentLog & { equipment: EquipmentItem })[]> {
  const logs = await db.equipmentAssignments
    .where('assignedTo')
    .equals(memberId)
    .filter((a) => a.returnedAt === null)
    .toArray()

  const result: (EquipmentAssignmentLog & { equipment: EquipmentItem })[] = []
  for (const log of logs) {
    const item = await db.equipment.get(log.equipmentId)
    if (item) result.push({ ...log, equipment: item })
  }
  return result
}

// ─── Tickets ───

export async function getEquipmentTickets(equipmentId?: string): Promise<EquipmentTicket[]> {
  if (equipmentId) {
    return db.equipmentTickets
      .where('equipmentId')
      .equals(equipmentId)
      .reverse()
      .sortBy('createdAt')
  }
  return db.equipmentTickets.orderBy('createdAt').reverse().toArray()
}

export async function createTicket(
  data: Omit<EquipmentTicket, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const id = generateId()
  const now = new Date()
  await db.equipmentTickets.add({ ...data, id, createdAt: now, updatedAt: now })
  return id
}

export async function updateTicket(
  id: string,
  data: Partial<Omit<EquipmentTicket, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.equipmentTickets.update(id, { ...data, updatedAt: new Date() })
}

// ─── Dashboard metrics ───

export async function getEquipmentMetrics() {
  const all = await db.equipment.toArray()
  const tickets = await db.equipmentTickets.toArray()
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress')

  const now = new Date()
  const threeMonths = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())

  return {
    total: all.length,
    available: all.filter((e) => e.status === 'available').length,
    assigned: all.filter((e) => e.status === 'assigned').length,
    maintenance: all.filter((e) => e.status === 'maintenance').length,
    retired: all.filter((e) => e.status === 'retired').length,
    obsolete: all.filter((e) => e.status === 'obsolete').length,
    openTickets: openTickets.length,
    warrantyExpiring: all.filter(
      (e) =>
        e.warrantyExpiry &&
        new Date(e.warrantyExpiry) <= threeMonths &&
        e.status !== 'retired' &&
        e.status !== 'obsolete',
    ).length,
    byType: all.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + 1
      return acc
    }, {}),
    byCondition: all.reduce<Record<string, number>>((acc, e) => {
      acc[e.condition] = (acc[e.condition] ?? 0) + 1
      return acc
    }, {}),
  }
}
