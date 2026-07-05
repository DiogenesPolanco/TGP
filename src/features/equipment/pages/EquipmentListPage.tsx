import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { deleteEquipment } from '@/services/equipment/equipmentService'
import { createShareLink } from '@/services/share/publicShareService'
import { encryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { TermsModal } from '@/components/sharing/TermsModal'
import { isTermsAccepted, acceptTerms } from '@/services/share/termsService'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { EquipmentStatusBadge, EquipmentConditionBadge, EQUIPMENT_TYPE_LABELS } from '../components/EquipmentStatusBadge'
import type { EquipmentItem, EquipmentTicket } from '@/types/domain'
import { Plus, Search, Monitor, Pencil, Trash2, Share2, Check, Copy, User, Package, Wrench, Archive, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

export function EquipmentListPage() {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [sharePending, setSharePending] = useState<any>(null)

  const allEquipment = useLiveQuery(() =>
    db.equipment.orderBy('createdAt').reverse().toArray(),
  ) ?? []

  const members = useLiveQuery(() => db.memberProfiles.toArray(), []) ?? []
  const teams = useLiveQuery(() => db.teams.toArray(), []) ?? []

  const memberMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of members) map.set(m.id, `${m.email.split('@')[0]} (${m.role.replace('_', ' ')})`)
    for (const t of teams) {
      for (const m of t.members) {
        if (!map.has(m.id)) map.set(m.id, m.displayName)
      }
    }
    return map
  }, [members, teams])

  const allTickets = useLiveQuery(() =>
    db.equipmentTickets.toArray(),
  ) ?? []

  const ticketMap = useMemo(() => {
    const map = new Map<string, EquipmentTicket[]>()
    for (const t of allTickets) {
      const arr = map.get(t.equipmentId) ?? []
      arr.push(t)
      map.set(t.equipmentId, arr)
    }
    return map
  }, [allTickets])

  const filtered = allEquipment.filter((e) => {
    const q = search.toLowerCase()
    const matchesSearch = !search ||
      e.brand.toLowerCase().includes(q) ||
      e.model.toLowerCase().includes(q) ||
      e.serialNumber.toLowerCase().includes(q)
    const matchesType = typeFilter === 'all' || e.type === typeFilter
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = useMemo(() => ({
    total: allEquipment.length,
    available: allEquipment.filter((e) => e.status === 'available').length,
    assigned: allEquipment.filter((e) => e.status === 'assigned').length,
    maintenance: allEquipment.filter((e) => e.status === 'maintenance').length,
    obsolete: allEquipment.filter((e) => e.status === 'obsolete' || e.status === 'retired').length,
  }), [allEquipment])

  const setFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? 'all' : status)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (await confirm('¿Eliminar este equipo? Se eliminarán también sus asignaciones y tickets.')) {
      await deleteEquipment(id)
      addNotification({ type: 'success', message: 'Equipo eliminado' })
    }
  }

  const doShare = useCallback(async () => {
    const data = { equipment: allEquipment }
    setSharePending(data)
    setShowPassphrase(true)
  }, [allEquipment])

  const typeOptions = [
    { value: 'all', label: 'Todos los tipos' },
    ...Object.entries(EQUIPMENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ]
  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'available', label: 'Disponible' },
    { value: 'assigned', label: 'Asignado' },
    { value: 'maintenance', label: 'En Mantención' },
    { value: 'retired', label: 'Dado de Baja' },
    { value: 'obsolete', label: 'Obsoleto' },
  ]

  const columns: Column<EquipmentItem>[] = [
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      render: (e) => (
        <div className="flex items-center gap-2">
          <Monitor size={16} className="text-neutral-50 shrink-0" />
          <span className="text-sm font-medium text-neutral-90 dark:text-white">{EQUIPMENT_TYPE_LABELS[e.type] ?? e.type}</span>
        </div>
      ),
    },
    {
      key: 'brand',
      label: 'Marca / Modelo',
      sortable: true,
      render: (e) => {
        const etickets = ticketMap.get(e.id) ?? []
        const ticketLabels = etickets.filter((t) => t.jiraTicketId).map((t) => t.jiraTicketId).join(', ')
        return (
          <div>
            <p className="text-sm text-neutral-90 dark:text-white">{e.brand}</p>
            <p className="text-xs text-neutral-50">{e.model}</p>
            {ticketLabels && (
              <p className="text-[10px] text-warning font-mono mt-0.5" title="IDs de tickets asociados">
                {ticketLabels}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'serialNumber',
      label: 'N° Serie',
      sortable: true,
      render: (e) => <span className="text-sm text-secondary font-mono">{e.serialNumber}</span>,
    },
    {
      key: 'assignedTo',
      label: 'Asignado a',
      sortable: true,
      render: (e) => {
        if (!e.assignedTo || e.status === 'available') return <span className="text-sm text-neutral-40">—</span>
        const name = memberMap.get(e.assignedTo)
        return (
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-neutral-50 shrink-0" />
            <span className="text-sm text-neutral-90 dark:text-white truncate max-w-[160px]" title={name ?? e.assignedTo}>
              {name ?? e.assignedTo}
            </span>
          </div>
        )
      },
    },
    {
      key: 'tickets' as any,
      label: 'Tickets',
      render: (e) => {
        const etickets = ticketMap.get(e.id) ?? []
        if (etickets.length === 0) return <span className="text-xs text-neutral-40">—</span>
        return (
          <div className="flex flex-col gap-0.5">
            {etickets.slice(0, 3).map((t) =>
              t.jiraTicketLink ? (
                <a key={t.id} href={t.jiraTicketLink} target="_blank" rel="noopener noreferrer"
                  onClick={(ev) => ev.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline">
                  {t.jiraTicketId || t.id.slice(0, 8)}
                  <ExternalLink size={10} />
                </a>
              ) : (
                <span key={t.id} className="text-xs font-mono text-neutral-50">
                  {t.jiraTicketId || t.id.slice(0, 8)}
                </span>
              ),
            )}
            {etickets.length > 3 && (
              <span className="text-[10px] text-neutral-40">+{etickets.length - 3} más</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (e) => <EquipmentStatusBadge status={e.status} />,
    },
    {
      key: 'condition',
      label: 'Condición',
      sortable: true,
      render: (e) => <EquipmentConditionBadge condition={e.condition} />,
    },
    {
      key: 'warrantyExpiry',
      label: 'Garantía',
      sortable: true,
      render: (e) => (
        <span className={`text-sm ${e.warrantyExpiry && new Date(e.warrantyExpiry) < new Date() ? 'text-danger' : 'text-neutral-60'}`}>
          {e.warrantyExpiry ? new Date(e.warrantyExpiry).toLocaleDateString('es') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
          <Button onClick={(ev) => { ev.stopPropagation(); navigate(`/equipment/${e.id}/edit`) }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors" title="Editar">
            <Pencil size={16} />
          </Button>
          <Button onClick={(ev) => handleDelete(ev, e.id)}
            className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors" title="Eliminar">
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Inventario de Equipos</h2>
        <div className="flex items-center gap-2">
          <Button onClick={async () => {
            if (!isTermsAccepted()) { setShowTerms(true); return }
            await doShare()
          }}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <Share2 size={16} />
            Compartir
          </Button>
          <Button onClick={() => navigate('/equipment/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            <Plus size={18} />
            Nuevo Equipo
          </Button>
        </div>
      </div>

      {shareUrl && (
        <div className="bg-card rounded-xl border border-boundary p-4 flex items-center gap-3 max-w-full overflow-hidden">
          <span className="text-sm text-neutral-50 shrink-0">Enlace público:</span>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-xs bg-primary/5 px-3 py-1.5 rounded-lg text-primary hover:text-primary-dark truncate font-mono min-w-0 hover:underline">
            {shareUrl}
          </a>
          <Button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      )}

      {showTerms && (
        <TermsModal onAccept={() => { acceptTerms(); setShowTerms(false); doShare() }} onClose={() => setShowTerms(false)} />
      )}
      {showPassphrase && (
        <PassphraseModal title="Proteger enlace compartido" buttonLabel="Proteger"
          description="Opcional: agrega una contraseña para cifrar los datos."
          onSubmit={async (pass) => {
            const payload = pass ? await encryptData(sharePending, pass) : sharePending
            const { url } = await createShareLink(48, 'equipment', undefined, payload)
            setShareUrl(url); setShowPassphrase(false); setSharePending(null)
          }}
          onSkip={async () => {
            const { url } = await createShareLink(48, 'equipment', undefined, sharePending)
            setShareUrl(url); setShowPassphrase(false); setSharePending(null)
          }}
          onClose={() => { setShowPassphrase(false); setSharePending(null) }}
        />
      )}

      <div className="grid grid-cols-5 gap-4">
        <StatCard icon={<Monitor size={20} />} label="Total" value={stats.total} color="text-primary"
          active={statusFilter === 'all'} onClick={() => setFilter('all')} />
        <StatCard icon={<Package size={20} />} label="Disponibles" value={stats.available} color="text-success"
          active={statusFilter === 'available'} onClick={() => setFilter('available')} />
        <StatCard icon={<User size={20} />} label="Asignados" value={stats.assigned} color="text-primary"
          active={statusFilter === 'assigned'} onClick={() => setFilter('assigned')} />
        <StatCard icon={<Wrench size={20} />} label="En Mantención" value={stats.maintenance} color="text-warning"
          active={statusFilter === 'maintenance'} onClick={() => setFilter('maintenance')} />
        <StatCard icon={<Archive size={20} />} label="Obsoletos/Retirados" value={stats.obsolete} color="text-danger"
          active={statusFilter === 'obsolete' || statusFilter === 'retired'} onClick={() => {
            if (statusFilter === 'obsolete' || statusFilter === 'retired') setFilter('all')
            else setStatusFilter('obsolete')
          }} />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input type="text" placeholder="Buscar por marca, modelo o serie..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="w-44">
          <Select value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
        </div>
        <div className="w-44">
          <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        </div>
      </div>

      <SortableTable columns={columns} data={filtered}
        onRowClick={(e) => navigate(`/equipment/${e.id}`)}
        pageSize={15} emptyMessage="No se encontraron equipos" />
    </div>
  )
}

function StatCard({ icon, label, value, color, active, onClick }: {
  icon: React.ReactNode; label: string; value: number; color: string; active?: boolean; onClick?: () => void
}) {
  const iconClasses: Record<string, string> = {
    'text-primary': 'bg-primary/10 text-primary',
    'text-success': 'bg-success/10 text-success',
    'text-warning': 'bg-warning/10 text-warning',
    'text-danger': 'bg-danger/10 text-danger',
  }
  return (
    <button
      onClick={onClick}
      className={`bg-card rounded-2xl border p-4 shadow-sm flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all hover:shadow-md ${
        active
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-boundary hover:border-neutral-40 dark:hover:border-neutral-50'
      }`}
    >
      <div className={`p-2 rounded-lg ${iconClasses[color] || 'bg-primary/10 text-primary'}`}>{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </button>
  )
}
