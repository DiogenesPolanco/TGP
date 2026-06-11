import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { isValidShareHash, getPublicDailyData, type PublicDailyData } from '@/services/share/publicShareService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { decryptData, type EncryptedPayload } from '@/services/share/encryptionService'
import { AlertTriangle, Calendar, Clock, CheckCircle2, Ban, ArrowRight } from 'lucide-react'
import { PrintButton } from '@/components/ui/PrintButton'

export function PublicDailyPage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicDailyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedPayload | null>(null)

  useEffect(() => {
    if (!hash) { setValid(false); setLoading(false); return }
    ;(async () => {
      const tryLoad = (raw: unknown) => {
        if (raw && typeof raw === 'object' && 'e' in raw && (raw as any).e === true) {
          setPendingEncrypted(raw as EncryptedPayload)
          setValid(true)
          setLoading(false)
        } else {
          setData(raw as PublicDailyData)
          setValid(true)
          setLoading(false)
        }
      }

      const rawHash = window.location.hash.replace(/^#/, '')
      if (rawHash) {
        try {
          const fragment = decodeURIComponent(rawHash)
          const { downloadUsingManifest } = await import('@/services/share/azureShareService')
          const azureData = await downloadUsingManifest(fragment)
          if (azureData) { tryLoad(azureData); return }
        } catch {}
      }
      try {
        const { downloadShareFromAzure } = await import('@/services/share/azureShareService')
        const viewerData = await downloadShareFromAzure(hash)
        if (viewerData) { tryLoad(viewerData); return }
      } catch {}
      if (isValidShareHash(hash)) {
        const d = await getPublicDailyData()
        setData(d); setValid(true)
      } else {
        setValid(false)
      }
      setLoading(false)
    })()
  }, [hash])

  if (loading) return <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center"><div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" /></div>
  if (!valid) return <InvalidLinkPage />
  if (!data) {
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center">
          <PassphraseModal
            title="Seguimiento Diario protegido"
            description="Este seguimiento fue compartido con cifrado. Ingresa la contraseña para verlo."
            onSubmit={async (pass) => {
              const decrypted = await decryptData(pendingEncrypted, pass)
              if (decrypted) { setData(decrypted as PublicDailyData); setPendingEncrypted(null) }
              else { alert('Contraseña incorrecta') }
            }}
          />
        </div>
      )
    }
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const activities = data.activities ?? []
  const tasks = data.tasks ?? []
  const blockers = data.blockers ?? []
  const plans = data.plans ?? []

  const dueToday = activities.filter((a) => {
    if (!a.dueDate) return false
    const d = new Date(a.dueDate); d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })
  const overdue = activities.filter((a) => {
    if (!a.dueDate || a.status === 'completed' || a.status === 'cancelled') return false
    const d = new Date(a.dueDate); d.setHours(0, 0, 0, 0)
    return d.getTime() < today.getTime()
  })
  const activeBlockers = blockers.filter((b) => b.status === 'open' || b.status === 'escalated')
  const activePlans = plans.filter((p) => p.status === 'in_progress')
  const tasksDue = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'done') return false
    const d = new Date(t.dueDate); d.setHours(0, 0, 0, 0)
    return d.getTime() <= today.getTime()
  })
  const completedToday = activities.filter((a) => {
    if (!a.completedAt) return false
    const d = new Date(a.completedAt); d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })

  return (
    <div id="printable-content" className="min-h-screen bg-neutral-10 dark:bg-neutral-90">
      <header className="bg-white dark:bg-neutral-80 border-b border-neutral-20 dark:border-neutral-70">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Seguimiento Diario</h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
            <div className="flex items-center gap-2 text-xs text-neutral-50">
              <Clock size={14} />
              <span>{today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
            <p className="text-2xl font-bold text-neutral-90 dark:text-white">{activePlans.length}</p>
            <p className="text-xs text-neutral-60">Planes Activos</p>
          </div>
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
            <p className="text-2xl font-bold text-warning">{dueToday.length}</p>
            <p className="text-xs text-neutral-60">Vence Hoy</p>
          </div>
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
            <p className="text-2xl font-bold text-danger">{overdue.length}</p>
            <p className="text-xs text-neutral-60">Vencidas</p>
          </div>
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
            <p className="text-2xl font-bold text-success">{completedToday.length}</p>
            <p className="text-xs text-neutral-60">Completadas Hoy</p>
          </div>
        </div>

        {activeBlockers.length > 0 && (
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-danger/30 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-danger/5 border-b border-danger/20">
              <Ban size={16} className="text-danger" />
              <h3 className="text-sm font-semibold text-danger">Bloqueos Activos ({activeBlockers.length})</h3>
            </div>
            <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
              {activeBlockers.slice(0, 5).map((b) => (
                <div key={b.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      b.severity === 'critical' ? 'bg-danger/10 text-danger' :
                      b.severity === 'high' ? 'bg-warning/10 text-warning' :
                      'bg-neutral-10 text-neutral-60'
                    }`}>{b.severity === 'critical' ? 'Crítica' : b.severity === 'high' ? 'Alta' : 'Media'}</span>
                    <span className="text-sm font-medium text-neutral-90 dark:text-white">{b.title}</span>
                  </div>
                  {b.description && <p className="text-xs text-neutral-60 mt-1">{b.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-20 dark:border-neutral-70">
            <Calendar size={16} className="text-warning" />
            <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Vence Hoy</h3>
          </div>
          <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {dueToday.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-50">
                <CheckCircle2 size={24} className="mx-auto text-success mb-2" />
                <p>Sin vencimientos para hoy</p>
              </div>
            ) : dueToday.map((act) => {
              const plan = plans.find((p) => p.id === act.planId)
              return (
                <div key={act.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-90 dark:text-white">{act.title}</p>
                    <p className="text-xs text-neutral-50">{plan?.title}{act.assigneeId && <span> · {act.assigneeId}</span>}</p>
                  </div>
                  <ArrowRight size={16} className="text-neutral-40" />
                </div>
              )
            })}
          </div>
        </div>

        {tasksDue.length > 0 && (
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-20 dark:border-neutral-70">
              <AlertTriangle size={16} className="text-info" />
              <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Tareas Pendientes ({tasksDue.length})</h3>
            </div>
            <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
              {tasksDue.slice(0, 8).map((t) => (
                <div key={t.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    t.priority === 'critical' ? 'bg-danger' :
                    t.priority === 'high' ? 'bg-warning' : 'bg-neutral-40'
                  }`} />
                  <span className="text-sm text-neutral-90 dark:text-white">{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-neutral-40 py-4 border-t border-neutral-20 dark:border-neutral-70">
          TGP — Technology Governance Platform · Datos compartidos
        </div>
      </main>
    </div>
  )
}
