import { useParams } from 'react-router-dom'
import { usePublicShare } from '@/hooks/usePublicShare'
import { getPublicObjectivesData } from '@/services/share/publicShareService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { Target, TrendingUp } from 'lucide-react'

const statusColors: Record<string, string> = {
  on_track: 'text-success bg-success/10 border-success/30',
  at_risk: 'text-warning bg-warning/10 border-warning/30',
  behind: 'text-danger bg-danger/10 border-danger/30',
  achieved: 'text-info bg-info/10 border-info/30',
  cancelled: 'text-neutral-50 bg-neutral-10 dark:bg-neutral-70 border-neutral-30',
}

type ObjRow = Record<string, unknown> & {
  id: string
  title: string
  status: string
  progress: number
  teamId?: string
  businessUnitId?: string
  description?: string
  periodStart: string
  periodEnd: string
  keyResults?: Array<Record<string, unknown>>
}

export function PublicObjectivesPage() {
  const { hash } = useParams<{ hash: string }>()
  const { loading, valid, data, pendingEncrypted, handleDecrypt } = usePublicShare(hash, () =>
    getPublicObjectivesData(),
  )

  const teamMap = new Map(
    (data?.teams as Array<Record<string, unknown>>)?.map((t) => [
      t.id as string,
      t.name as string,
    ]) ?? [],
  )
  const buMap = new Map(
    (data?.businessUnits as Array<Record<string, unknown>>)?.map((b) => [
      b.id as string,
      b.name as string,
    ]) ?? [],
  )

  if (loading)
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  if (!valid) return <InvalidLinkPage />
  if (!data) {
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <PassphraseModal
            title="OKRs protegidos"
            description="Esta vista fue compartida con cifrado. Ingresa la contraseña para verla."
            onSubmit={async (pass) => {
              const ok = await handleDecrypt(pass)
              if (!ok) alert('Contraseña incorrecta')
            }}
          />
        </div>
      )
    }
    return null
  }

  const objectives = data.objectives as ObjRow[]

  return (
    <div id="printable-content" className="min-h-screen bg-canvas">
      <header className="bg-card border-b border-boundary">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">OKRs / KPIs</h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-screen-2xl mx-auto space-y-4">
        {objectives.length === 0 ? (
          <div className="text-center py-16 text-neutral-50">No hay objetivos compartidos.</div>
        ) : (
          objectives.map((obj) => {
            const owner = obj.teamId
              ? teamMap.get(obj.teamId)
              : obj.businessUnitId
                ? buMap.get(obj.businessUnitId)
                : null
            return (
              <div
                key={obj.id}
                className="bg-card rounded-2xl border border-boundary p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Target size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-neutral-90 dark:text-white truncate">
                        {obj.title}
                      </h3>
                      {obj.description && (
                        <p className="text-xs text-neutral-50 mt-0.5 line-clamp-2">
                          {obj.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[obj.status] ?? 'text-neutral-50 bg-neutral-10'}`}
                  >
                    {obj.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted">Progreso</span>
                    <span className="font-semibold text-neutral-90 dark:text-white">
                      {Math.round(obj.progress)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-10 dark:bg-neutral-70 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, obj.progress))}%`,
                        backgroundColor:
                          obj.progress >= 80
                            ? '#36B37E'
                            : obj.progress >= 50
                              ? '#FF8B00'
                              : '#FF5630',
                      }}
                    />
                  </div>
                </div>

                {obj.keyResults && obj.keyResults.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-boundary">
                    <p className="text-xs font-medium text-muted flex items-center gap-1">
                      <TrendingUp size={12} />
                      Key Results
                    </p>
                    {obj.keyResults.map((kr: Record<string, unknown>) => {
                      const baseline = Number(kr.baseline ?? 0)
                      const target = Number(kr.target ?? 1)
                      const current = Number(kr.current ?? 0)
                      const pct =
                        target > baseline
                          ? Math.round(((current - baseline) / (target - baseline)) * 100)
                          : 0
                      return (
                        <div
                          key={kr.id as string}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <span className="text-secondary truncate flex-1">
                            {kr.title as string}
                          </span>
                          <span
                            className={`ml-3 shrink-0 font-medium ${kr.status === 'achieved' ? 'text-success' : kr.status === 'at_risk' ? 'text-warning' : kr.status === 'behind' ? 'text-danger' : 'text-neutral-60'}`}
                          >
                            {current}/{target} ({Math.max(0, Math.min(100, pct))}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-boundary text-xs text-neutral-50">
                  {owner && <span>Dueño: {owner}</span>}
                  <span>
                    {new Date(obj.periodStart).toLocaleDateString()} —{' '}
                    {new Date(obj.periodEnd).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )
          })
        )}

        <div className="text-center text-xs text-neutral-40 py-4 border-t border-boundary mt-6">
          TGP — Technology Governance Platform · Datos compartidos
        </div>
      </main>
    </div>
  )
}
