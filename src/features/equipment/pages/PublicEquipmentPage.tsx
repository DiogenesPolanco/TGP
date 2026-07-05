import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { fetchAzureShareData, isValidShareHash } from '@/services/share/publicShareService'
import { decryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { getShareInfo } from '@/services/share/publicShareService'
import { PrintButton } from '@/components/ui/PrintButton'
import { db } from '@/services/db/database'
import { getEquipmentMetrics } from '@/services/equipment/equipmentService'
import { Package, Monitor, Wrench, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import type { EquipmentItem, EquipmentTicket } from '@/types/domain'

interface EquipmentShareData {
  metrics: { total: number; available: number; assigned: number; maintenance: number; retired: number; obsolete: number; openTickets: number; warrantyExpiring: number; byType: Record<string, number>; byCondition: Record<string, number> }
  equipment: EquipmentItem[]
  tickets: EquipmentTicket[]
}

const CONDITION_LABELS: Record<string, string> = { excellent: 'Excelente', good: 'Bueno', fair: 'Regular', poor: 'Malo' }
const TYPE_LABELS: Record<string, string> = { laptop: 'Laptop', monitor: 'Monitor', phone: 'Teléfono', mouse: 'Mouse', headphones: 'Audífonos', chair: 'Silla', keyboard: 'Teclado', desk_stand: 'Soporte Monitor', other: 'Otro' }

export function PublicEquipmentPage() {
  const { hash } = useParams<{ hash: string }>()
  const [data, setData] = useState<EquipmentShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [pendingData, setPendingData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!hash) return
    setLoading(true)
    try {
      const shareInfo = getShareInfo(hash)
      if (shareInfo) {
        setPendingData(shareInfo)
        setShowPassphrase(false)
        const azureData = await fetchAzureShareData<EquipmentShareData>(hash)
        if (azureData) {
          setData(azureData)
          setLoading(false)
          return
        }
      }
      const raw = await fetchAzureShareData<any>(hash)
      if (raw) {
        if (raw.metrics && raw.equipment) {
          setData(raw as EquipmentShareData)
        } else {
          setPendingData(raw)
          setShowPassphrase(true)
        }
        return
      }

      if (isValidShareHash(hash)) {
        const [equipment, tickets, metrics] = await Promise.all([
          db.equipment.toArray(),
          db.equipmentTickets.toArray(),
          getEquipmentMetrics(),
        ])
        setData({ metrics, equipment, tickets })
      } else {
        setError('No se pudieron cargar los datos compartidos')
      }
    } catch {
      setError('Error al cargar datos compartidos')
    } finally {
      setLoading(false)
    }
  }, [hash])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <div className="p-8 text-center text-muted">Cargando reporte de equipamiento...</div>
  if (error) return <div className="p-8 text-center text-danger">{error}</div>

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package size={28} className="text-primary" />
            <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">Reporte de Equipamiento</h1>
          </div>
          <PrintButton />
        </div>

        <div id="printable-content" className="space-y-6">

        {data && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <PublicKpi icon={<Monitor size={20} />} label="Total Equipos" value={String(data.metrics.total)} color="text-primary" />
              <PublicKpi icon={<CheckCircle size={20} />} label="Disponibles" value={String(data.metrics.available)} color="text-success" />
              <PublicKpi icon={<AlertTriangle size={20} />} label="En Mantención" value={String(data.metrics.maintenance)} color="text-warning" />
              <PublicKpi icon={<Wrench size={20} />} label="Tickets Abiertos" value={String(data.metrics.openTickets)} color="text-danger" />
            </div>

            <div className="bg-card rounded-xl border border-boundary p-5 space-y-4">
              <h3 className="font-semibold text-neutral-90 dark:text-white">Distribución por Tipo</h3>
              <div className="space-y-3">
                {Object.entries(data.metrics.byType).map(([type, count]) => {
                  const pct = data.metrics.total > 0 ? Math.round((count / data.metrics.total) * 100) : 0
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-secondary">{TYPE_LABELS[type] ?? type}</span>
                        <span className="font-semibold text-neutral-90 dark:text-white">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-boundary p-5 space-y-4">
              <h3 className="font-semibold text-neutral-90 dark:text-white">Distribución por Condición</h3>
              <div className="space-y-3">
                {(['excellent', 'good', 'fair', 'poor'] as const).map((cond) => {
                  const count = data.metrics.byCondition[cond] ?? 0
                  const pct = data.metrics.total > 0 ? Math.round((count / data.metrics.total) * 100) : 0
                  return (
                    <div key={cond}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-secondary">{CONDITION_LABELS[cond]}</span>
                        <span className="font-semibold text-neutral-90 dark:text-white">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cond === 'excellent' ? 'bg-success' : cond === 'good' ? 'bg-primary' : cond === 'fair' ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-boundary p-5 space-y-4">
              <h3 className="font-semibold text-neutral-90 dark:text-white">Inventario ({data.equipment.length})</h3>
              <div className="space-y-2">
                {(() => {
                  const ticketMap = new Map<string, typeof data.tickets>()
                  for (const t of data.tickets) {
                    const arr = ticketMap.get(t.equipmentId) ?? []
                    arr.push(t)
                    ticketMap.set(t.equipmentId, arr)
                  }
                  return data.equipment.slice(0, 50).map((eq) => {
                    const eqTickets = ticketMap.get(eq.id) ?? []
                    const ticketLabels = eqTickets.filter((t) => t.jiraTicketId).map((t) => t.jiraTicketId).join(', ')
                    return (
                      <div key={eq.id} className="flex items-center justify-between p-3 bg-neutral-5 dark:bg-neutral-85 rounded-lg text-sm">
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-secondary">{TYPE_LABELS[eq.type] ?? eq.type}</span>
                          <span className="text-neutral-50 ml-2">{eq.brand} {eq.model}</span>
                          {ticketLabels && (
                            <p className="text-[10px] text-warning font-mono mt-0.5" title="IDs de tickets asociados">{ticketLabels}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-neutral-50">{CONDITION_LABELS[eq.condition]}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            eq.status === 'available' ? 'bg-success/10 text-success' :
                            eq.status === 'assigned' ? 'bg-primary/10 text-primary' :
                            eq.status === 'maintenance' ? 'bg-warning/10 text-warning' :
                            'bg-neutral-30 text-neutral-60'
                          }`}>
                            {eq.status === 'available' ? 'Disponible' : eq.status === 'assigned' ? 'Asignado' : eq.status === 'maintenance' ? 'Mantención' : eq.status === 'retired' ? 'Baja' : 'Obsoleto'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            {data.tickets.length > 0 && (
              <div className="bg-card rounded-xl border border-boundary p-5 space-y-4">
                <h3 className="font-semibold text-neutral-90 dark:text-white">Tickets ({data.tickets.length})</h3>
                <div className="space-y-2">
                  {data.tickets.slice(0, 30).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-neutral-5 dark:bg-neutral-85 rounded-lg text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {t.jiraTicketLink ? (
                            <a href={t.jiraTicketLink} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-mono text-primary hover:underline">
                              {t.jiraTicketId || t.id.slice(0, 8)}
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-sm font-mono text-secondary">
                              {t.jiraTicketId || t.id.slice(0, 8)}
                            </span>
                          )}
                          <span className="text-xs text-neutral-50">{t.description.slice(0, 60)}</span>
                        </div>
                        <p className="text-xs text-neutral-40 mt-0.5">{new Date(t.createdAt).toLocaleDateString('es')}</p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.status === 'open' ? 'bg-danger/10 text-danger' :
                        t.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                        t.status === 'resolved' ? 'bg-success/10 text-success' :
                        'bg-neutral-30 text-neutral-60'
                      }`}>
                        {t.status === 'open' ? 'Abierto' : t.status === 'in_progress' ? 'En Progreso' : t.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        </div>

        <p className="text-center text-xs text-neutral-40 mt-8">
          Reporte generado por TGP — los datos pueden no estar actualizados
        </p>
      </div>

      {showPassphrase && (
        <PassphraseModal title="Desbloquear reporte" buttonLabel="Desbloquear"
          description="Este reporte está cifrado. Ingresa la contraseña para verlo."
          onSubmit={async (pass) => {
            try {
              const decrypted = (await decryptData(pendingData, pass)) as EquipmentShareData | null
              if (decrypted?.metrics && decrypted?.equipment) {
                setData(decrypted)
              }
              setShowPassphrase(false)
            } catch { /* empty */ }
          }}
          onClose={() => setShowPassphrase(false)}
        />
      )}
    </div>
  )
}

function PublicKpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-boundary p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
    </div>
  )
}
