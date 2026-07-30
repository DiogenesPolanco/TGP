import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  isValidShareHash,
  getPublicRecruitmentData,
  type PublicRecruitmentData,
} from '@/services/share/publicShareService'
import { decryptData, type EncryptedPayload } from '@/services/share/encryptionService'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { HtmlDescription } from '@/components/ui/HtmlDescription'
import { PrintButton } from '@/components/ui/PrintButton'
import { useCatalogMap } from '@/hooks/useCatalog'
import { EVALUATION_CATEGORIES } from '@/constants/evaluationCategories'
import { Users, Calendar, UserCheck, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-warning/10 text-warning' },
  interviewed: { label: 'Entrevistado', color: 'bg-info/10 text-info' },
  pre_selected: { label: 'Pre-Seleccionado', color: 'bg-primary/10 text-primary' },
  selected: { label: 'Seleccionado', color: 'bg-success/10 text-success' },
  onboarding: { label: 'En Onboarding', color: 'bg-info/10 text-info' },
  rejected: { label: 'Rechazado', color: 'bg-danger/10 text-danger' },
  no_show: { label: 'No Asistió', color: 'bg-neutral-30 text-neutral-60' },
}

export function PublicRecruitmentPage() {
  const { hash } = useParams<{ hash: string }>()
  const roleLabels = useCatalogMap('member_role')
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicRecruitmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedPayload | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!hash) {
      setValid(false)
      setLoading(false)
      return
    }
    ;(async () => {
      const tryDecryptOrShow = (raw: unknown) => {
        if (raw && typeof raw === 'object' && 'e' in raw && (raw as any).e === true) {
          setPendingEncrypted(raw as EncryptedPayload)
          setValid(true)
          setLoading(false)
        } else {
          setData(raw as PublicRecruitmentData)
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
          if (azureData) {
            tryDecryptOrShow(azureData)
            return
          }
        } catch (err) {
          console.warn('[PublicRecruitment] Azure error:', err)
        }
      }

      try {
        const { downloadShareFromAzure } = await import('@/services/share/azureShareService')
        const viewerData = await downloadShareFromAzure(hash)
        if (viewerData) {
          tryDecryptOrShow(viewerData)
          return
        }
      } catch (err) {
        console.warn('[PublicRecruitment] Viewer Azure error:', err)
      }

      if (isValidShareHash(hash)) {
        const d = await getPublicRecruitmentData()
        setData(d)
        setValid(true)
      } else {
        setValid(false)
      }
      setLoading(false)
    })()
  }, [hash])

  const handleDecrypted = (raw: unknown) => {
    setData(raw as PublicRecruitmentData)
    setPendingEncrypted(null)
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (valid === false) return <InvalidLinkPage />

  if (loading || valid === null) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-neutral-50">Cargando...</p>
      </div>
    )
  }

  if (pendingEncrypted) {
    return (
      <PassphraseModal
        onSubmit={async (pass) => {
          const decrypted = await decryptData(pendingEncrypted, pass)
          handleDecrypted(decrypted)
        }}
        onClose={() => setPendingEncrypted(null)}
      />
    )
  }

  if (!data) return <InvalidLinkPage />

  const { candidates: rawCandidates, technologies, evaluations } = data
  const candidates = [...rawCandidates].sort((a, b) => b.totalScore - a.totalScore)

  const getTechs = (candidateId: string) =>
    technologies.filter((t) => t.candidateId === candidateId)
  const getEvals = (candidateId: string) => evaluations.filter((e) => e.candidateId === candidateId)

  const candidateStats = candidates.map((c) => {
    const techs = getTechs(c.id)
    const evals = getEvals(c.id)
    return {
      ...c,
      techAvg:
        techs.length > 0 ? Math.round(techs.reduce((s, t) => s + t.points, 0) / techs.length) : 0,
      evalAvg:
        evals.length > 0 ? Math.round(evals.reduce((s, e) => s + e.points, 0) / evals.length) : 0,
    }
  })

  const techLeader = [...candidateStats].sort((a, b) => b.techAvg - a.techAvg)[0]
  const evalLeader = [...candidateStats].sort((a, b) => b.evalAvg - a.evalAvg)[0]
  const worstCandidate = [...candidateStats].sort((a, b) => a.totalScore - b.totalScore)[0]
  const selectedCount = candidates.filter((c) => c.status === 'selected').length
  const selectedNames = candidates
    .filter((c) => c.status === 'selected')
    .map((c) => c.name)
    .join(', ')

  const stats = [
    {
      label: 'Seleccionados',
      value: selectedCount,
      sub: selectedNames,
      icon: <Star size={18} />,
      color: 'text-success',
    },
    {
      label: 'Líder Tecnologías',
      value: `${techLeader?.techAvg ?? 0}%`,
      sub: techLeader?.name ?? '',
      icon: <Users size={18} />,
      color: 'text-primary',
    },
    {
      label: 'Líder Evaluación',
      value: `${evalLeader?.evalAvg ?? 0}%`,
      sub: evalLeader?.name ?? '',
      icon: <UserCheck size={18} />,
      color: 'text-info',
    },
    {
      label: 'Menor Score',
      value: `${worstCandidate?.totalScore ?? 0}%`,
      sub: worstCandidate?.name ?? '',
      icon: <Calendar size={18} />,
      color: 'text-danger',
    },
  ]

  return (
    <div id="printable-content" className="min-h-screen bg-canvas">
      <div className="bg-gradient-to-br from-primary via-primary-dark to-[#03245E] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">TGP</p>
              <p className="text-[11px] font-medium opacity-60 tracking-wide">
                Technology Governance Platform
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Proceso de Reclutamiento</h1>
              <p className="text-base opacity-80 mt-1">
                Evaluación de candidatos — {candidates.length} registro
                {candidates.length !== 1 ? 's' : ''}
              </p>
            </div>
            <PrintButton />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <p className="text-2xl font-bold text-neutral-90 dark:text-white">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
              {s.sub && (
                <p className="text-sm font-semibold text-neutral-90 dark:text-white mt-1.5 truncate">
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {candidates.map((c) => {
            const cfg = statusConfig[c.status] ?? {
              label: c.status,
              color: 'bg-neutral-10 text-neutral-60',
            }
            const techs = getTechs(c.id)
            const evals = getEvals(c.id)
            const isOpen = expanded.has(c.id)
            const techAvg =
              techs.length > 0
                ? Math.round(techs.reduce((s, t) => s + t.points, 0) / techs.length)
                : 0
            const evalAvg =
              evals.length > 0
                ? Math.round(evals.reduce((s, e) => s + e.points, 0) / evals.length)
                : 0

            return (
              <div
                key={c.id}
                className="bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden"
              >
                <Button
                  onClick={() => toggleExpand(c.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-neutral-5 dark:hover:bg-neutral-75/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-neutral-90 dark:text-white">
                        {c.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-50">
                      <span>
                        {roleLabels[c.position] ??
                          c.position}
                      </span>
                      {c.interviewDate && (
                        <span>{new Date(c.interviewDate).toLocaleDateString('es')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{c.totalScore}%</p>
                      <p className="text-[10px] text-neutral-50">Score</p>
                    </div>
                    <div className="relative w-10 h-10">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          className="stroke-neutral-20 dark:stroke-neutral-70"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeDasharray={`${c.totalScore} ${100 - c.totalScore}`}
                          className={
                            c.totalScore >= 70
                              ? 'text-success'
                              : c.totalScore >= 40
                                ? 'text-warning'
                                : 'text-danger'
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-neutral-50" />
                    ) : (
                      <ChevronDown size={18} className="text-neutral-50" />
                    )}
                  </div>
                </Button>

                {isOpen && (
                  <div className="border-t border-boundary px-4 py-4 space-y-4 bg-neutral-5/50 dark:bg-neutral-85/50">
                    {techs.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-60 uppercase tracking-wider mb-2">
                          Tecnologías
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {techs.map((t) => (
                            <div key={t.id} className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs text-secondary">{t.name}</span>
                                  <span className="text-xs font-semibold text-primary">
                                    {t.points}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${t.points}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-neutral-50 mt-1">
                          Promedio: <span className="font-semibold text-primary">{techAvg}%</span>
                        </p>
                      </div>
                    )}

                    {evals.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-60 uppercase tracking-wider mb-2">
                          Evaluación
                        </p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          {EVALUATION_CATEGORIES.map((cat) => {
                            const e = evals.find((ev) => ev.category === cat.key)
                            const pts = e?.points ?? 0
                            return (
                              <div key={cat.key} className="flex items-center gap-2">
                                <span className="text-xs text-muted w-28 shrink-0">
                                  {cat.label}
                                </span>
                                <div className="flex-1 h-1.5 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${pts}%`,
                                      backgroundColor:
                                        pts >= 70 ? '#22c55e' : pts >= 40 ? '#eab308' : '#ef4444',
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-xs font-medium w-8 text-right"
                                  style={{
                                    color:
                                      pts >= 70 ? '#22c55e' : pts >= 40 ? '#eab308' : '#ef4444',
                                  }}
                                >
                                  {pts}%
                                </span>
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-xs text-neutral-50 mt-1">
                          Promedio:{' '}
                          <span
                            className="font-semibold"
                            style={{
                              color:
                                evalAvg >= 70 ? '#22c55e' : evalAvg >= 40 ? '#eab308' : '#ef4444',
                            }}
                          >
                            {evalAvg}%
                          </span>
                        </p>
                      </div>
                    )}

                    {c.comments && (
                      <div>
                        <p className="text-xs font-semibold text-neutral-60 uppercase tracking-wider mb-1">
                          Comentarios
                        </p>
                        <HtmlDescription html={c.comments} full className="text-xs" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {candidates.length === 0 && (
            <div className="text-center py-12 text-neutral-50">Sin candidatos registrados</div>
          )}
        </div>

        <p className="text-center text-xs text-neutral-50 pb-6">
          TGP · Datos compartidos de forma segura
        </p>
      </div>
    </div>
  )
}
