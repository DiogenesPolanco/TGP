import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { getEquipmentMetrics } from '@/services/equipment/equipmentService'
import { createShareLink } from '@/services/share/publicShareService'
import { encryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { TermsModal } from '@/components/sharing/TermsModal'
import { isTermsAccepted, acceptTerms } from '@/services/share/termsService'
import { Button } from '@/components/ui/Button'
import { EQUIPMENT_TYPE_LABELS } from '../components/EquipmentStatusBadge'
import {
  Monitor,
  Wrench,
  AlertTriangle,
  Share2,
  Check,
  Copy,
  TrendingDown,
  CheckCircle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react'

export function EquipmentReportsPage() {
  const navigate = useNavigate()
  const metrics = useLiveQuery(() => getEquipmentMetrics(), []) ?? {
    total: 0,
    available: 0,
    assigned: 0,
    maintenance: 0,
    retired: 0,
    obsolete: 0,
    openTickets: 0,
    warrantyExpiring: 0,
    byType: {},
    byCondition: {},
  }

  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [sharePending, setSharePending] = useState<any>(null)

  const equipment = useLiveQuery(() => db.equipment.toArray(), []) ?? []
  const tickets = useLiveQuery(() => db.equipmentTickets.toArray(), []) ?? []

  const ticketMap = useMemo(() => {
    const map = new Map<string, typeof tickets>()
    for (const t of tickets) {
      const arr = map.get(t.equipmentId) ?? []
      arr.push(t)
      map.set(t.equipmentId, arr)
    }
    return map
  }, [tickets])

  const doShare = useCallback(async () => {
    const data = { metrics, equipment, tickets }
    setSharePending(data)
    setShowPassphrase(true)
  }, [metrics, equipment, tickets])

  const obsoleteItems = equipment.filter((e) => e.status === 'obsolete')
  const warrantyExpiring = equipment.filter(
    (e) =>
      e.warrantyExpiry &&
      new Date(e.warrantyExpiry) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) &&
      e.status !== 'retired' &&
      e.status !== 'obsolete',
  )
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress')

  const assignmentRate =
    metrics.total > 0 ? Math.round((metrics.assigned / metrics.total) * 100) : 0
  const healthRate =
    metrics.total > 0
      ? Math.round(((metrics.total - metrics.obsolete - metrics.retired) / metrics.total) * 100)
      : 0

  const typeData = Object.entries(metrics.byType).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">
          Reportes de Equipamiento
        </h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={async () => {
              if (!isTermsAccepted()) {
                setShowTerms(true)
                return
              }
              await doShare()
            }}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Share2 size={16} />
            Compartir
          </Button>
        </div>
      </div>

      {shareUrl && (
        <div className="bg-card rounded-xl border border-boundary p-4 flex items-center gap-3 max-w-full overflow-hidden">
          <span className="text-sm text-neutral-50 shrink-0">Enlace público:</span>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-xs bg-primary/5 px-3 py-1.5 rounded-lg text-primary hover:text-primary-dark truncate font-mono min-w-0 hover:underline"
          >
            {shareUrl}
          </a>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      )}

      {showTerms && (
        <TermsModal
          onAccept={() => {
            acceptTerms()
            setShowTerms(false)
            doShare()
          }}
          onClose={() => setShowTerms(false)}
        />
      )}
      {showPassphrase && (
        <PassphraseModal
          title="Proteger enlace compartido"
          buttonLabel="Proteger"
          description="Opcional: agrega una contraseña para cifrar los datos."
          onSubmit={async (pass) => {
            const payload = pass ? await encryptData(sharePending, pass) : sharePending
            const { url } = await createShareLink(48, 'equipment', undefined, payload)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onSkip={async () => {
            const { url } = await createShareLink(48, 'equipment', undefined, sharePending)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onClose={() => {
            setShowPassphrase(false)
            setSharePending(null)
          }}
        />
      )}

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={<Monitor size={22} />}
          label="Total Equipos"
          value={metrics.total}
          sub={`${assignmentRate}% asignados`}
          color="text-primary"
        />
        <KpiCard
          icon={<CheckCircle size={22} />}
          label="Disponibles"
          value={metrics.available}
          sub="Para asignar"
          color="text-success"
        />
        <KpiCard
          icon={<TrendingDown size={22} />}
          label="Salud del Inventario"
          value={`${healthRate}%`}
          sub={`${metrics.obsolete} obsoletos`}
          color={
            healthRate >= 80 ? 'text-success' : healthRate >= 60 ? 'text-warning' : 'text-danger'
          }
        />
        <KpiCard
          icon={<Wrench size={22} />}
          label="Tickets Abiertos"
          value={metrics.openTickets}
          sub={`${openTickets.filter((t) => t.priority === 'critical' || t.priority === 'high').length} prioritarios`}
          color={metrics.openTickets > 0 ? 'text-warning' : 'text-success'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-boundary p-5 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">
            Distribución por Tipo
          </h3>
          {typeData.length === 0 ? (
            <p className="text-sm text-neutral-50">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {typeData.map(([type, count]) => {
                const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-secondary">{EQUIPMENT_TYPE_LABELS[type] ?? type}</span>
                      <span className="font-semibold text-neutral-90 dark:text-white">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-boundary p-5 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">
            Distribución por Condición
          </h3>
          <div className="space-y-3">
            {(['excellent', 'good', 'fair', 'poor'] as const).map((cond) => {
              const count = metrics.byCondition[cond] ?? 0
              const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0
              const colors: Record<string, string> = {
                excellent: 'bg-success',
                good: 'bg-primary',
                fair: 'bg-warning',
                poor: 'bg-danger',
              }
              return (
                <div key={cond}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-secondary">
                      {cond === 'excellent'
                        ? 'Excelente'
                        : cond === 'good'
                          ? 'Bueno'
                          : cond === 'fair'
                            ? 'Regular'
                            : 'Malo'}
                    </span>
                    <span className="font-semibold text-neutral-90 dark:text-white">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[cond]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {warrantyExpiring.length > 0 && (
        <div className="bg-card rounded-xl border border-warning/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-semibold">
              Garantías Próximas a Vencer ({warrantyExpiring.length})
            </h3>
          </div>
          <div className="space-y-2">
            {warrantyExpiring.slice(0, 10).map((e) => {
              const eqTickets = ticketMap.get(e.id) ?? []
              const ticketLabels = eqTickets
                .filter((t) => t.jiraTicketId)
                .map((t) => t.jiraTicketId)
                .join(', ')
              return (
                <div
                  key={e.id}
                  onClick={() => navigate(`/equipment/${e.id}`)}
                  className="flex items-center justify-between text-sm p-2 rounded-lg cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors"
                >
                  <div>
                    <span className="text-secondary">
                      {EQUIPMENT_TYPE_LABELS[e.type]} - {e.brand} {e.model}
                    </span>
                    {ticketLabels && (
                      <span className="text-[10px] text-warning font-mono ml-2">
                        {ticketLabels}
                      </span>
                    )}
                  </div>
                  <span className="text-neutral-50">
                    {e.warrantyExpiry ? new Date(e.warrantyExpiry).toLocaleDateString('es') : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {obsoleteItems.length > 0 && (
        <div className="bg-card rounded-xl border border-danger/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-danger">
            <TrendingDown size={18} />
            <h3 className="text-sm font-semibold">Equipos Obsoletos ({obsoleteItems.length})</h3>
          </div>
          <div className="space-y-2">
            {obsoleteItems.slice(0, 10).map((e) => {
              const eqTickets = ticketMap.get(e.id) ?? []
              const ticketLabels = eqTickets
                .filter((t) => t.jiraTicketId)
                .map((t) => t.jiraTicketId)
                .join(', ')
              return (
                <div
                  key={e.id}
                  onClick={() => navigate(`/equipment/${e.id}`)}
                  className="flex items-center justify-between text-sm p-2 rounded-lg cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors"
                >
                  <div>
                    <span className="text-secondary">
                      {EQUIPMENT_TYPE_LABELS[e.type]} - {e.brand} {e.model}
                    </span>
                    <span className="text-neutral-50 ml-2 font-mono text-xs">{e.serialNumber}</span>
                    {ticketLabels && (
                      <span className="text-[10px] text-warning font-mono ml-2">
                        {ticketLabels}
                      </span>
                    )}
                  </div>
                  <span className="text-neutral-50">{e.assignedTo ? 'Asignado' : 'En bodega'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {openTickets.length > 0 && (
        <div className="bg-card rounded-xl border border-boundary p-5 space-y-3">
          <div className="flex items-center gap-2 text-neutral-90 dark:text-white">
            <RotateCcw size={18} className="text-primary" />
            <h3 className="text-sm font-semibold">Tickets Abiertos ({openTickets.length})</h3>
          </div>
          <div className="space-y-2">
            {openTickets.slice(0, 10).map((t) => {
              const e = equipment.find((eq) => eq.id === t.equipmentId)
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/equipment/${t.equipmentId}`)}
                  className="flex items-center justify-between text-sm p-2 bg-neutral-5 dark:bg-neutral-85 rounded-lg cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-secondary font-medium">
                        {e ? `${EQUIPMENT_TYPE_LABELS[e.type]} - ${e.brand}` : t.equipmentId}
                      </span>
                      {t.jiraTicketLink ? (
                        <a
                          href={t.jiraTicketLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(ev) => ev.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline"
                        >
                          {t.jiraTicketId || t.id.slice(0, 8)}
                          <ExternalLink size={10} />
                        </a>
                      ) : t.jiraTicketId ? (
                        <span className="text-xs font-mono text-neutral-50">{t.jiraTicketId}</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-neutral-50 mt-0.5">{t.description.slice(0, 80)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        t.priority === 'critical'
                          ? 'bg-danger/10 text-danger'
                          : t.priority === 'high'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-neutral-20 text-neutral-60'
                      }`}
                    >
                      {t.priority === 'critical'
                        ? 'Crítica'
                        : t.priority === 'high'
                          ? 'Alta'
                          : t.priority === 'medium'
                            ? 'Media'
                            : 'Baja'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  color: string
}) {
  return (
    <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-muted mt-0.5">{sub}</p>
      <p className="text-sm font-medium text-neutral-90 dark:text-white mt-1">{label}</p>
    </div>
  )
}
