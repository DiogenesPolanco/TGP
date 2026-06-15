import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { isValidShareHash, getPublicPlanData, type PublicPlanData } from '@/services/share/publicShareService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { decryptData, type EncryptedPayload } from '@/services/share/encryptionService'
import { ActivityGantt } from '@/features/execution/components/ActivityGantt'
import { PrintButton } from '@/components/ui/PrintButton'

const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planificado', color: 'text-info' },
  in_progress: { label: 'En Progreso', color: 'text-success' },
  on_hold: { label: 'En Pausa', color: 'text-warning' },
  completed: { label: 'Completado', color: 'text-success' },
  cancelled: { label: 'Cancelado', color: 'text-neutral-50' },
}

const healthConfig: Record<string, { label: string; dot: string }> = {
  green: { label: 'Saludable', dot: 'bg-success' },
  yellow: { label: 'En Riesgo', dot: 'bg-warning' },
  red: { label: 'Crítico', dot: 'bg-danger' },
}

export function PublicPlanPage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicPlanData | null>(null)
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
          setData(raw as PublicPlanData)
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
        const { getShareInfo } = await import('@/services/share/publicShareService')
        const info = getShareInfo(hash)
        if (info?.ref) {
          const d = await getPublicPlanData(info.ref)
          if (d) { setData(d); setValid(true); setLoading(false); return }
        }
      }
      setValid(false)
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
            title="Plan protegido con contraseña"
            description="Este plan fue compartido con cifrado. Ingresa la contraseña para verlo."
            onSubmit={async (pass) => {
              const decrypted = await decryptData(pendingEncrypted, pass)
              if (decrypted) { setData(decrypted as PublicPlanData); setPendingEncrypted(null) }
              else { alert('Contraseña incorrecta') }
            }}
          />
        </div>
      )
    }
    return null
  }

  const { plan, activities, tasks, blockers, teams } = data
  const health = healthConfig[plan.health] ?? healthConfig.green
  const status = statusConfig[plan.status] ?? { label: plan.status, color: 'text-neutral-50' }
  const completedAct = activities.filter((a: any) => a.status === 'completed').length
  const actPct = activities.length > 0 ? Math.round((completedAct / activities.length) * 100) : 0
  const doneTasks = tasks.filter((t: any) => t.status === 'done').length
  const openBlockers = blockers.filter((b: any) => b.status === 'open' || b.status === 'escalated')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(plan.endDate)
  const isOverdue = endDate < today && plan.status === 'in_progress'

  return (
    <div id="printable-content" className="min-h-screen bg-neutral-10 dark:bg-neutral-90">
      <header className="bg-white dark:bg-neutral-80 border-b border-neutral-20 dark:border-neutral-70">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">{plan.title}</h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
            <span className={`flex items-center gap-1.5 text-xs font-medium ${status.color}`}>
              <span className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-danger' : health.dot}`} />
              {isOverdue ? 'Vencido' : status.label}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <p className="text-sm text-neutral-60">{plan.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-4">
            <p className="text-2xl font-bold text-neutral-90 dark:text-white">{activities.length}</p>
            <p className="text-xs text-neutral-60">Actividades</p>
          </div>
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-4">
            <p className="text-2xl font-bold text-success">{actPct}%</p>
            <p className="text-xs text-neutral-60">Completado</p>
          </div>
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-4">
            <p className="text-2xl font-bold text-info">{tasks.length}</p>
            <p className="text-xs text-neutral-60">Tareas ({doneTasks} hechas)</p>
          </div>
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-4">
            <p className={`text-2xl font-bold ${openBlockers.length > 0 ? 'text-danger' : 'text-success'}`}>{openBlockers.length}</p>
            <p className="text-xs text-neutral-60">Bloqueos</p>
          </div>
        </div>

        <ActivityGantt
          planId={plan.id}
          activities={activities}
          tasks={tasks}
          teamMap={new Map(teams.map((t: any) => [t.id, { name: t.name }]))}
          appMap={new Map()}
          onEditActivity={() => {}}
          onDeleteActivity={() => {}}
          onTaskToggle={() => {}}
          onNewActivity={() => {}}
          readOnly
        />

        <div className="text-center text-xs text-neutral-40 py-4 border-t border-neutral-20 dark:border-neutral-70">
          TGP — Technology Governance Platform · Datos compartidos
        </div>
      </main>
    </div>
  )
}
