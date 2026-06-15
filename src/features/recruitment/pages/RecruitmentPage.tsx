import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { deleteCandidate } from '@/services/recruitment/candidateService'
import { createShareLink, getPublicRecruitmentData } from '@/services/share/publicShareService'
import { encryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { TermsModal } from '@/components/sharing/TermsModal'
import { isTermsAccepted, acceptTerms } from '@/services/share/termsService'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { MEMBER_ROLE_LABELS } from '@/constants/roleLabels'
import type { Candidate } from '@/types/domain'
import { Plus, Search, Users, UserCheck, Calendar, Star, Pencil, Trash2, Share2, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-warning/10 text-warning' },
  interviewed: { label: 'Entrevistado', color: 'bg-info/10 text-info' },
  selected: { label: 'Seleccionado', color: 'bg-success/10 text-success' },
  rejected: { label: 'Rechazado', color: 'bg-danger/10 text-danger' },
}

export function RecruitmentPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [sharePending, setSharePending] = useState<any>(null)

  const doShare = useCallback(async () => {
    const data = await getPublicRecruitmentData()
    setSharePending(data)
    setShowPassphrase(true)
  }, [])
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const candidates = useLiveQuery(() =>
    db.candidates.orderBy('createdAt').reverse().toArray(),
  ) ?? []

  const filtered = candidates.filter((c) => {
    const roleLabel = MEMBER_ROLE_LABELS[c.position as keyof typeof MEMBER_ROLE_LABELS] ?? ''
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      roleLabel.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (await confirm('¿Eliminar este candidato?')) {
      await deleteCandidate(id)
      addNotification({ type: 'success', message: 'Candidato eliminado' })
    }
  }

  const columns: Column<Candidate>[] = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (c) => (
        <div>
          <p className="text-sm font-medium text-neutral-90 dark:text-white">{c.name}</p>
          {c.email && <p className="text-xs text-neutral-50">{c.email}</p>}
        </div>
      ),
    },
    {
      key: 'position',
      label: 'Posición',
      sortable: true,
      render: (c) => (
        <span className="text-sm text-neutral-70 dark:text-neutral-30">
          {MEMBER_ROLE_LABELS[c.position as keyof typeof MEMBER_ROLE_LABELS] ?? c.position}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (c) => {
        const cfg = statusConfig[c.status] ?? { label: c.status, color: 'bg-neutral-10 text-neutral-60' }
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
      },
    },
    {
      key: 'totalScore',
      label: 'Score',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${c.totalScore}%` }} />
          </div>
          <span className="text-sm font-medium text-neutral-70 dark:text-neutral-30">{c.totalScore}%</span>
        </div>
      ),
    },
    {
      key: 'interviewDate',
      label: 'Entrevista',
      sortable: true,
      render: (c) => (
        <span className="text-sm text-neutral-60">
          {c.interviewDate ? new Date(c.interviewDate).toLocaleDateString('es') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            onClick={(e) => { e.stopPropagation(); navigate(`/teams/recruitment/${c.id}/edit`) }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </Button>
          <Button
            onClick={(e) => handleDelete(e, c.id)}
            className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Reclutamiento</h2>
        <div className="flex items-center gap-2">
          {statusFilter && (
            <Button onClick={() => setStatusFilter(null)}
              className="px-3 py-2 text-sm text-neutral-50 hover:text-neutral-90 transition-colors">
              Limpiar filtro
            </Button>
          )}
          <Button
            onClick={async () => {
              if (!isTermsAccepted()) {
                setShowTerms(true)
                return
              }
              await doShare()
            }}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Share2 size={16} />
            Compartir
          </Button>
          <Button
            onClick={() => navigate('/teams/recruitment/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nuevo Candidato
          </Button>
        </div>
      </div>

      {shareUrl && (() => { const cleanUrl = shareUrl.split('#')[0]; return (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 flex items-center gap-3 max-w-full overflow-hidden">
          <span className="text-sm text-neutral-50 shrink-0">Enlace público:</span>
          <a href={cleanUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-xs bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-lg text-primary hover:text-primary-dark truncate font-mono min-w-0 hover:underline">
            {cleanUrl}
          </a>
          <Button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      )})()}

      {showTerms && (
        <TermsModal
          onAccept={() => { acceptTerms(); setShowTerms(false); doShare() }}
          onClose={() => { setShowTerms(false) }}
        />
      )}
      {showPassphrase && (
        <PassphraseModal
          title="Proteger enlace compartido"
          buttonLabel="Proteger"
          description="Opcional: agrega una contraseña para cifrar los datos de los candidatos."
          onSubmit={async (pass) => {
            const data = sharePending
            const payload = pass ? await encryptData(data, pass) : data
            const { url } = await createShareLink(48, 'recruitment', undefined, payload)
            setShareUrl(url); setShowPassphrase(false); setSharePending(null)
          }}
          onSkip={async () => {
            const data = sharePending
            const { url } = await createShareLink(48, 'recruitment', undefined, data)
            setShareUrl(url); setShowPassphrase(false); setSharePending(null)
          }}
          onClose={() => { setShowPassphrase(false); setSharePending(null) }}
        />
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} />} label="Total"
          value={candidates.length} color="text-primary"
          active={!statusFilter}
          onClick={() => setStatusFilter(null)}
        />
        <StatCard
          icon={<Calendar size={20} />} label="Pendientes"
          value={candidates.filter((c) => c.status === 'pending').length} color="text-warning"
          active={statusFilter === 'pending'}
          onClick={() => setStatusFilter('pending')}
        />
        <StatCard
          icon={<UserCheck size={20} />} label="Entrevistados"
          value={candidates.filter((c) => c.status === 'interviewed').length} color="text-info"
          active={statusFilter === 'interviewed'}
          onClick={() => setStatusFilter('interviewed')}
        />
        <StatCard
          icon={<Star size={20} />} label="Seleccionados"
          value={candidates.filter((c) => c.status === 'selected').length} color="text-success"
          active={statusFilter === 'selected'}
          onClick={() => setStatusFilter('selected')}
        />
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
        <input
          type="text"
          placeholder="Buscar candidatos por nombre o posición..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <SortableTable
        columns={columns}
        data={filtered}
        onRowClick={(c) => navigate(`/teams/recruitment/${c.id}`)}
        pageSize={10}
        emptyMessage="No se encontraron candidatos"
      />
    </div>
  )
}

function StatCard({
  icon, label, value, color, active, onClick,
}: {
  icon: React.ReactNode; label: string; value: number; color: string
  active?: boolean; onClick?: () => void
}) {
  return (
    <Button
      onClick={onClick}
      className={`text-left bg-white dark:bg-neutral-80 rounded-xl border p-4 shadow-sm transition-all ${
        active
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-neutral-20 dark:border-neutral-70 hover:shadow-md'
      }`}
    >
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </Button>
  )
}
