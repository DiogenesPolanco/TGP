import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { HtmlDescription } from '@/components/ui/HtmlDescription'
import { getAssignmentHistory, getEquipmentTickets, deleteEquipment, assignEquipment, returnEquipment } from '@/services/equipment/equipmentService'
import { EquipmentStatusBadge, EquipmentConditionBadge, EQUIPMENT_TYPE_LABELS } from '../components/EquipmentStatusBadge'
import { Monitor, Pencil, Trash2, Package, Wrench, ExternalLink, History, ClipboardList, User, RotateCcw, Calendar, Info, CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { MemberSelector } from '@/components/ui/MemberSelector'
import type { EquipmentCondition } from '@/types/domain'

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excelente' },
  { value: 'good', label: 'Bueno' },
  { value: 'fair', label: 'Regular' },
  { value: 'poor', label: 'Malo' },
]

const statusBg: Record<string, string> = {
  available: 'bg-success/5 border-success/20',
  assigned: 'bg-primary/5 border-primary/20',
  maintenance: 'bg-warning/5 border-warning/20',
  retired: 'bg-neutral-10 dark:bg-neutral-70 border-neutral-20',
  obsolete: 'bg-danger/5 border-danger/20',
}

const statusIconBg: Record<string, string> = {
  available: 'bg-success',
  assigned: 'bg-primary',
  maintenance: 'bg-warning',
  retired: 'bg-neutral-40',
  obsolete: 'bg-danger',
}

const statusIcon: Record<string, React.ReactNode> = {
  available: <CheckCircle size={24} className="text-white" />,
  assigned: <User size={24} className="text-white" />,
  maintenance: <Wrench size={24} className="text-white" />,
  retired: <XCircle size={24} className="text-white" />,
  obsolete: <AlertTriangle size={24} className="text-white" />,
}

type Tab = 'info' | 'tickets' | 'history'

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [assigning, setAssigning] = useState(false)
  const [returning, setReturning] = useState(false)
  const [assignTarget, setAssignTarget] = useState('')
  const [returnCondition, setReturnCondition] = useState<EquipmentCondition>('good')

  const equipment = useLiveQuery(() => id ? db.equipment.get(id) : undefined, [id])
  const assignments = useLiveQuery(() => id ? getAssignmentHistory(id) : [], [id]) ?? []
  const tickets = useLiveQuery(() => id ? getEquipmentTickets(id) : [], [id]) ?? []
  const members = useLiveQuery(() => db.memberProfiles.toArray(), []) ?? []
  const teams = useLiveQuery(() => db.teams.toArray(), []) ?? []

  if (!equipment) {
    return <DetailLayout title="Equipo no encontrado" onBack={() => navigate('/equipment')}>
      <p className="text-neutral-50">El equipo no existe o ha sido eliminado.</p>
    </DetailLayout>
  }

  const activeAssignment = assignments.find((a) => a.returnedAt === null)
  const assignedMember = equipment.assignedTo
    ? members.find((m) => m.id === equipment.assignedTo) ?? teams.flatMap((t) => t.members).find((m) => m.id === equipment.assignedTo)
    : null

  const handleDelete = async () => {
    if (await confirm('¿Eliminar este equipo? También se borrarán asignaciones y tickets.')) {
      await deleteEquipment(equipment.id)
      addNotification({ type: 'success', message: 'Equipo eliminado' })
      navigate('/equipment')
    }
  }

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

  const warrantyDate = equipment.warrantyExpiry ? new Date(equipment.warrantyExpiry) : null
  const warrantyExpired = warrantyDate && warrantyDate < new Date()
  const warrantyLabel = warrantyDate
    ? `${warrantyDate.toLocaleDateString('es')}${warrantyExpired ? ' (Vencida)' : ''}`
    : 'Sin registro'

  const equipmentSubtitle = `${equipment.brand} ${equipment.model} · N/S: ${equipment.serialNumber}`

  const tabs = [
    { id: 'info' as const, label: 'Información', icon: Info },
    { id: 'tickets' as const, label: `Tickets (${tickets.length})`, icon: ClipboardList },
    { id: 'history' as const, label: `Historial (${assignments.length})`, icon: History },
  ]

  return (
    <DetailLayout
      title={`${EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type}`}
      subtitle={equipmentSubtitle}
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
          <Button onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 text-neutral-50 hover:text-danger transition-colors">
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
        <div className="space-y-6">
          {/* Hero banner */}
          <div className={`rounded-xl border p-5 ${statusBg[equipment.status] || 'bg-neutral-10'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${statusIconBg[equipment.status] || 'bg-neutral-40'} flex items-center justify-center shadow-sm`}>
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
              <div className={`px-4 py-2 rounded-lg ${statusIconBg[equipment.status] || 'bg-neutral-40'} text-white text-center shadow-sm`}>
                <Monitor size={24} className="mx-auto mb-0.5" />
                <p className="text-[10px] uppercase tracking-wider font-medium">{EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type}</p>
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
                <MiniField label="Condición" value={<EquipmentConditionBadge condition={equipment.condition} />} />
                <MiniField label="Tipo" value={EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type} />
                <MiniField label="Estado" value={<EquipmentStatusBadge status={equipment.status} />} />
              </div>
            </Section>

            <Section title="Ciclo de Vida" icon={<Calendar size={18} />}>
              <div className="grid grid-cols-2 gap-3">
                <MiniField label="Fecha de Compra" value={equipment.purchaseDate ? new Date(equipment.purchaseDate).toLocaleDateString('es') : 'Sin registro'} />
                <MiniField label="Garantía" value={<span className={warrantyExpired ? 'text-danger' : ''}>{warrantyLabel}</span>} />
                {equipment.costCenter && <MiniField label="Centro de Costo" value={equipment.costCenter} />}
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
                      value={assignedMember && 'displayName' in assignedMember ? assignedMember.displayName : equipment.assignedTo ?? '—'}
                    />
                    <MiniField label="Desde" value={activeAssignment.assignedAt.toLocaleDateString('es')} />
                    <MiniField label="Condición entrega" value={<EquipmentConditionBadge condition={activeAssignment.conditionAtAssignment} />} />
                  </div>

                  <Button onClick={handleReturn} disabled={returning}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-warning text-white rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors disabled:opacity-50">
                    <RotateCcw size={16} />
                    {returning ? 'Procesando...' : 'Registrar Devolución'}
                  </Button>

                  {returning && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted">Condición de devolución</label>
                      <Select value={returnCondition} onChange={(v) => setReturnCondition(v as EquipmentCondition)} options={CONDITION_OPTIONS} />
                    </div>
                  )}
                </div>
              ) : equipment.status !== 'retired' && equipment.status !== 'obsolete' ? (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-50">Equipo disponible para asignar</p>
                  <div className="space-y-2">
                    <MemberSelector
                      value={assignTarget}
                      onChange={setAssignTarget}
                      placeholder="Buscar miembro o escribir nombre..."
                    />
                    <Button onClick={handleAssign} disabled={assigning || !assignTarget.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-dark transition-colors disabled:opacity-50">
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
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-50">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} registrado{tickets.length !== 1 ? 's' : ''}</p>
            <Button onClick={() => navigate(`/equipment/${equipment.id}/tickets/new`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              <Wrench size={16} />
              Nuevo Ticket
            </Button>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-12 text-neutral-50">
              <ClipboardList size={40} className="mx-auto mb-3 text-neutral-30" />
              <p className="text-sm">Sin tickets registrados para este equipo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => {
                const assigneeName = t.assigneeId
                  ? members.find((m) => m.id === t.assigneeId)?.email.split('@')[0]
                    ?? teams.flatMap((tm) => tm.members).find((m) => m.id === t.assigneeId)?.displayName
                    ?? null
                  : null
                return (
                <div key={t.id}
                  className="flex items-center justify-between p-4 bg-neutral-5 dark:bg-neutral-85 rounded-xl hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <TicketTypeBadge type={t.type} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                        {t.description.replace(/<[^>]*>/g, '').slice(0, 80)}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                        {assigneeName && (
                          <span className="text-[11px] text-neutral-50 flex items-center gap-1">
                            <User size={10} />{assigneeName}
                          </span>
                        )}
                        {t.startDate && (
                          <span className="text-[11px] text-neutral-50">
                            {new Date(t.startDate).toLocaleDateString('es')}
                            {t.endDate ? ` → ${new Date(t.endDate).toLocaleDateString('es')}` : ' →'}
                          </span>
                        )}
                        <TicketStatusBadge status={t.status} />
                        {t.priority && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            t.priority === 'critical' ? 'bg-danger/10 text-danger' :
                            t.priority === 'high' ? 'bg-warning/10 text-warning' :
                            t.priority === 'medium' ? 'bg-info/10 text-info' :
                            'bg-neutral-20 text-neutral-60'
                          }`}>
                            {t.priority === 'critical' ? 'Crítica' : t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.jiraTicketId && (
                      <span className="text-[11px] bg-neutral-20 dark:bg-neutral-70 px-2 py-0.5 rounded text-neutral-60 font-mono">{t.jiraTicketId}</span>
                    )}
                    {t.jiraTicketLink && (
                      <a href={t.jiraTicketLink} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-neutral-50 hover:text-primary transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <Button
                      onClick={() => navigate(`/equipment/${equipment.id}/tickets/${t.id}/edit`)}
                      className="p-1.5 text-neutral-50 hover:text-primary transition-colors"
                      title="Editar ticket"
                    >
                      <Pencil size={14} />
                    </Button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-50">{assignments.length} asignacion{assignments.length !== 1 ? 'es' : ''} registrada{assignments.length !== 1 ? 's' : ''}</p>

          {assignments.length === 0 ? (
            <div className="text-center py-12 text-neutral-50">
              <History size={40} className="mx-auto mb-3 text-neutral-30" />
              <p className="text-sm">Sin asignaciones previas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map((a) => {
                const memberProfile = members.find((m) => m.id === a.assignedTo)
                const teamMember = !memberProfile ? teams.flatMap((t) => t.members).find((m) => m.id === a.assignedTo) : null
                const memberName = memberProfile?.email.split('@')[0] ?? teamMember?.displayName ?? a.assignedTo
                const memberTeamId = memberProfile?.teamId ?? teams.find((t) => t.members.some((m) => m.id === a.assignedTo))?.id
                return (
                  <div key={a.id}
                    onClick={() => memberTeamId && navigate(`/teams/${memberTeamId}/performance/${a.assignedTo}`)}
                    className={`flex items-center justify-between p-4 bg-neutral-5 dark:bg-neutral-85 rounded-xl ${
                      memberTeamId ? 'cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors' : ''
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        a.returnedAt ? 'bg-neutral-20 text-neutral-60' : 'bg-primary/10 text-primary'
                      }`}>
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-90 dark:text-white">
                          {memberName}
                        </p>
                        <p className="text-xs text-neutral-50">
                          {a.assignedAt.toLocaleDateString('es')}
                          {a.returnedAt ? ` → ${a.returnedAt.toLocaleDateString('es')}` : ' (Activo)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="text-right">
                        <p className="text-neutral-50">Entrega</p>
                        <EquipmentConditionBadge condition={a.conditionAtAssignment} />
                      </div>
                      {a.conditionAtReturn && (
                        <div className="text-right">
                          <p className="text-neutral-50">Devolución</p>
                          <EquipmentConditionBadge condition={a.conditionAtReturn} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </DetailLayout>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-boundary p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
        {icon && <span className="text-neutral-50">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  )
}

function MiniField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[10px] font-medium text-neutral-40 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-neutral-90 dark:text-white">{typeof value === 'string' ? (value || '—') : value}</dd>
    </div>
  )
}

function TicketTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    repair: { label: 'Reparación', color: 'bg-warning/10 text-warning' },
    replacement: { label: 'Reemplazo', color: 'bg-danger/10 text-danger' },
    new: { label: 'Nuevo', color: 'bg-success/10 text-success' },
  }
  const c = cfg[type] ?? { label: type, color: 'bg-neutral-10 text-neutral-60' }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.color}`}>{c.label}</span>
}

function TicketStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    open: { label: 'Abierto', color: 'bg-danger/10 text-danger' },
    in_progress: { label: 'En Progreso', color: 'bg-warning/10 text-warning' },
    resolved: { label: 'Resuelto', color: 'bg-success/10 text-success' },
    closed: { label: 'Cerrado', color: 'bg-neutral-30 text-neutral-60' },
  }
  const c = cfg[status] ?? { label: status, color: 'bg-neutral-10 text-neutral-60' }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.color}`}>{c.label}</span>
}
