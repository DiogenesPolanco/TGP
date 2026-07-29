import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import {
  getEquipment,
  getEquipmentByType,
  getEquipmentByStatus,
  getEquipmentItem,
  getEquipmentAssignedTo,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  assignEquipment,
  returnEquipment,
  getAssignmentHistory,
  getActiveAssignments,
  getEquipmentTickets,
  createTicket,
  updateTicket,
  getEquipmentMetrics,
} from '@/services/equipment/equipmentService'

describe('equipmentService', () => {
  beforeEach(async () => {
    // Reset Dexie tables before each test
    await db.equipment.clear()
    await db.equipmentAssignments.clear()
    await db.equipmentTickets.clear()
  })

  it('creates and reads equipment', async () => {
    const id = await createEquipment({
      type: 'laptop',
      brand: 'BrandA',
      model: 'Model1',
      serialNumber: 'SN-001',
      status: 'available',
      condition: 'excellent',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)

    expect(typeof id).toBe('string')

    const item = await getEquipmentItem(id)
    expect(item).toBeTruthy()
    expect(item?.type).toBe('laptop')
  })

  it('filters by type and status', async () => {
    const id1 = await createEquipment({
      type: 'laptop',
      brand: 'A',
      model: 'X',
      serialNumber: 'SN-1',
      status: 'available',
      condition: 'good',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)

    await createEquipment({
      type: 'monitor',
      brand: 'B',
      model: 'Y',
      serialNumber: 'SN-2',
      status: 'assigned',
      condition: 'good',
      assignedTo: 'member1',
      assignmentType: 'member',
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)

    const byType = await getEquipmentByType('laptop')
    expect(byType.length).toBe(1)
    expect(byType[0].id).toBe(id1)

    const byStatus = await getEquipmentByStatus('available')
    expect(byStatus.find((e) => e.id === id1)).toBeTruthy()
  })

  it('assignment flow', async () => {
    const id = await createEquipment({
      type: 'laptop',
      brand: 'A',
      model: 'X',
      serialNumber: 'SN-ASS',
      status: 'available',
      condition: 'excellent',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)

    await assignEquipment(id, 'member-001', 'excellent', 'test assignment')

    const item = await getEquipmentItem(id)
    expect(item?.status).toBe('assigned')
    expect(item?.assignedTo).toBe('member-001')
    expect(item?.assignmentType).toBe('member')
    expect(item?.condition).toBe('excellent')

    const active = await getActiveAssignments('member-001')
    expect(active.length).toBeGreaterThan(0)
    expect(active[0].equipment.id).toBe(id)

    const history = await getAssignmentHistory(id)
    expect(history.length).toBeGreaterThan(0)

    await returnEquipment(id, 'good', 'returned')
    const after = await getEquipmentItem(id)
    expect(after?.status).toBe('available')
    expect(after?.assignedTo).toBeNull()
  })

  it('assignment errors', async () => {
    await expect(assignEquipment('non-existent-id', 'm1', 'good')).rejects.toThrow(
      'Equipo no encontrado',
    )

    const id = await createEquipment({
      type: 'laptop',
      brand: 'A',
      model: 'X',
      serialNumber: 'SN-ERR',
      status: 'maintenance',
      condition: 'good',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)

    await expect(assignEquipment(id, 'm2', 'excellent')).rejects.toThrow(
      'El equipo no está disponible',
    )
  })

  it('tickets CRUD', async () => {
    const id = await createEquipment({
      type: 'laptop',
      brand: 'A',
      model: 'X',
      serialNumber: 'SN-TK',
      status: 'available',
      condition: 'excellent',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)

    const ticketId = await createTicket({
      equipmentId: id,
      requesterId: 'user1',
      assigneeId: null,
      type: 'repair',
      status: 'open',
      jiraTicketId: null,
      jiraTicketLink: null,
      priority: 'low',
      description: 'desc',
      resolution: null,
      startDate: null,
      endDate: null,
    } as any)

    expect(typeof ticketId).toBe('string')

    const list = await getEquipmentTickets(id)
    expect(list.length).toBeGreaterThan(0)

    await updateTicket(ticketId, { status: 'in_progress' })
    const updated = await getEquipmentTickets(id)
    const t = updated.find((tk) => tk.id === ticketId)
    expect(t?.status).toBe('in_progress')
  })

  it('getEquipment returns all items', async () => {
    await createEquipment({
      type: 'laptop',
      brand: 'A',
      model: 'X',
      serialNumber: 'SN-G1',
      status: 'available',
      condition: 'good',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)
    await createEquipment({
      type: 'monitor',
      brand: 'B',
      model: 'Y',
      serialNumber: 'SN-G2',
      status: 'available',
      condition: 'good',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)

    const all = await getEquipment()
    expect(all.length).toBeGreaterThanOrEqual(2)
    const serials = all.map((e) => e.serialNumber)
    expect(serials).toContain('SN-G1')
    expect(serials).toContain('SN-G2')
  })

  it('getEquipmentAssignedTo filters by member', async () => {
    const e1 = await createEquipment({
      type: 'laptop',
      brand: 'A',
      model: 'X',
      serialNumber: 'SN-A1',
      status: 'available',
      condition: 'good',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)
    await assignEquipment(e1, 'member-assigned', 'good')

    const assigned = await getEquipmentAssignedTo('member-assigned')
    expect(assigned.length).toBe(1)
    expect(assigned[0].id).toBe(e1)
  })

  it('updateEquipment modifies fields', async () => {
    const id = await createEquipment({
      type: 'laptop',
      brand: 'A',
      model: 'X',
      serialNumber: 'SN-UP',
      status: 'available',
      condition: 'good',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)
    await updateEquipment(id, { notes: 'updated note' })
    const item = await getEquipmentItem(id)
    expect(item?.notes).toBe('updated note')
  })

  it('deleteEquipment removes item and related records', async () => {
    const id = await createEquipment({
      type: 'laptop',
      brand: 'A',
      model: 'X',
      serialNumber: 'SN-DEL',
      status: 'available',
      condition: 'good',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)
    await createTicket({
      equipmentId: id,
      requesterId: 'u1',
      assigneeId: null,
      type: 'repair',
      status: 'open',
      jiraTicketId: null,
      jiraTicketLink: null,
      priority: 'low',
      description: 'desc',
      resolution: null,
      startDate: null,
      endDate: null,
    } as any)

    await deleteEquipment(id)

    const item = await getEquipmentItem(id)
    expect(item).toBeUndefined()
    const tickets = await getEquipmentTickets(id)
    expect(tickets).toHaveLength(0)
  })

  it('metrics', async () => {
    // three equipments with varying statuses
    const e1 = await createEquipment({
      type: 'laptop',
      brand: 'A',
      model: 'X',
      serialNumber: 'SN-M1',
      status: 'available',
      condition: 'excellent',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)
    await createEquipment({
      type: 'monitor',
      brand: 'B',
      model: 'Y',
      serialNumber: 'SN-M2',
      status: 'assigned',
      condition: 'good',
      assignedTo: 'member1',
      assignmentType: 'member',
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)
    await createEquipment({
      type: 'headphones',
      brand: 'C',
      model: 'Z',
      serialNumber: 'SN-M3',
      status: 'maintenance',
      condition: 'fair',
      assignedTo: null,
      assignmentType: null,
      purchaseDate: null,
      warrantyExpiry: null,
      lastMaintenanceDate: null,
      costCenter: null,
      businessUnitId: null,
      notes: '',
    } as any)

    // one open ticket on e1
    await createTicket({
      equipmentId: e1,
      requesterId: 'u1',
      assigneeId: null,
      type: 'repair',
      status: 'open',
      jiraTicketId: null,
      jiraTicketLink: null,
      priority: 'low',
      description: 'desc',
      resolution: null,
      startDate: null,
      endDate: null,
    } as any)

    const metrics = await getEquipmentMetrics()

    expect(metrics.total).toBe(3)
    expect(metrics.available).toBe(1)
    expect(metrics.assigned).toBe(1)
    expect(metrics.maintenance).toBe(1)
    expect(metrics.openTickets).toBe(1)
    expect(metrics.byType?.laptop).toBe(1)
  })
})
