import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { getMemberKPIs } from '@/services/performance/performanceService'
import type { Team, MemberProfile } from '@/types/domain'
import { MEMBER_ROLE_LABELS } from '@/constants/roleLabels'
import { createShareLink, getPublicMemberData } from '@/services/share/publicShareService'
import { encryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { TermsModal } from '@/components/sharing/TermsModal'
import { isTermsAccepted, acceptTerms } from '@/services/share/termsService'
import { ArrowLeft, Loader2, Share2, Check, Zap, TrendingUp, Smile, Activity, MessageCircle, Award } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { ProfileSection } from '@/features/performance/components/ProfileSection'
import { SkillsSection } from '@/features/performance/components/SkillsSection'
import { SprintsSection } from '@/features/performance/components/SprintsSection'
import { OneOnOneSection } from '@/features/performance/components/OneOnOneSection'
import { AchievementsSection } from '@/features/performance/components/AchievementsSection'
import { TechStackSection } from '@/features/performance/components/TechStackSection'
import { MicroservicesSection } from '@/features/performance/components/MicroservicesSection'
import { Button } from '@/components/ui/Button'

type Tab = 'perfil' | 'skills' | 'tecnologias' | 'microservicios' | 'sprints' | 'oneonone' | 'logros'

export function MemberPerformancePage() {
  const { memberId, id: teamId } = useParams<{ memberId: string; id: string }>()
  const navigate = useNavigate()
  const addNotification = useAppStore((s) => s.addNotification)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [sharePending, setSharePending] = useState<any>(null)

  const doShare = useCallback(async () => {
    if (!memberId) return
    const data = await getPublicMemberData(memberId)
    setSharePending(data)
    setShowPassphrase(true)
  }, [memberId])
  const [team, setTeam] = useState<Team | null>(null)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof getMemberKPIs>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('perfil')

  const member = team?.members?.find((m) => m.id === memberId)

  useEffect(() => {
    if (!teamId || !memberId) return
    Promise.all([
      db.teams.get(teamId),
      db.memberProfiles.get(memberId),
      getMemberKPIs(memberId),
    ]).then(([t, p, k]) => {
      setTeam(t ?? null)
      setProfile(p ?? null)
      setKpis(k)
      setLoading(false)
    })
  }, [teamId, memberId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-6 text-center text-neutral-50">
        <p>Miembro no encontrado</p>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'skills', label: 'Habilidades' },
    { key: 'tecnologias', label: 'Tecnologías' },
    { key: 'microservicios', label: 'Microservicios' },
    { key: 'sprints', label: 'Sprints' },
    { key: 'oneonone', label: 'Uno a Uno' },
    { key: 'logros', label: 'Logros' },
  ]

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate(`/teams/${teamId}/performance`)}
            className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-60" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-neutral-90 dark:text-white">
              {member.displayName}
            </h1>
            <p className="text-sm text-neutral-50">{MEMBER_ROLE_LABELS[member.role as keyof typeof MEMBER_ROLE_LABELS] ?? member.role} · {team?.name}</p>
          </div>
          <Button
            onClick={async () => {
              if (shareUrl) { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); return }
              if (!isTermsAccepted()) {
                setShowTerms(true)
                return
              }
              await doShare()
            }}          
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            title="Compartir perfil"
          >
            {copied ? <Check size={16} className="text-success" /> : <Share2 size={16} />}
            {copied ? 'Copiado' : 'Compartir'}
          </Button>
        </div>

        {shareUrl && (() => { const cleanUrl = shareUrl.split('#')[0]; return (
          <div className="mb-4 bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-3 flex items-center gap-2 text-sm max-w-full overflow-hidden">
            <span className="text-neutral-50 shrink-0">Enlace público:</span>
            <a href={cleanUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-xs bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-lg text-primary hover:text-primary-dark truncate font-mono min-w-0 hover:underline">
            {cleanUrl}
          </a>
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
            title="Proteger enlace"
            buttonLabel="Proteger"
            onSubmit={async (pass, hours) => {
              const payload = pass ? await encryptData(sharePending, pass) : sharePending
              const { url } = await createShareLink(hours ?? 48, 'member', memberId, payload)
              setShareUrl(url); setShowPassphrase(false); setSharePending(null)
              navigator.clipboard.writeText(url)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
              addNotification({ type: 'success', message: 'Enlace de miembro generado' })
            }}
            onSkip={async (hours) => {
              const { url } = await createShareLink(hours ?? 48, 'member', memberId, sharePending)
              setShareUrl(url); setShowPassphrase(false); setSharePending(null)
              navigator.clipboard.writeText(url)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
              addNotification({ type: 'success', message: 'Enlace de miembro generado' })
            }}
            onClose={() => { setShowPassphrase(false); setSharePending(null) }}
          />
        )}
      </div>

      {/* KPI Bar */}
      {kpis && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-8">
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Zap size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-neutral-90 dark:text-white tabular-nums leading-tight">{kpis.totalSP}</p>
              <p className="text-[10px] text-neutral-50 uppercase tracking-wider leading-tight">SP</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
            <div className="p-1.5 rounded-lg bg-success/10 text-success shrink-0">
              <TrendingUp size={15} />
            </div>
            <div className="min-w-0">
              <p className={`text-base font-bold tabular-nums leading-tight ${
                kpis.efficiencyPct >= 75 ? 'text-success' :
                kpis.efficiencyPct >= 50 ? 'text-warning' : 'text-danger'
              }`}>{kpis.efficiencyPct}%</p>
              <p className="text-[10px] text-neutral-50 uppercase tracking-wider leading-tight">Efic.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
            <div className="p-1.5 rounded-lg text-warning bg-warning/10 shrink-0">
              <Smile size={15} />
            </div>
            <div className="min-w-0">
              <p className={`text-base font-bold tabular-nums leading-tight ${
                kpis.avgMood >= 7 ? 'text-success' :
                kpis.avgMood >= 4 ? 'text-warning' : 'text-danger'
              }`}>{kpis.avgMood}/10</p>
              <p className="text-[10px] text-neutral-50 uppercase tracking-wider leading-tight">Ánimo</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
            <div className="p-1.5 rounded-lg bg-info/10 text-info shrink-0">
              <Activity size={15} />
            </div>
            <div className="min-w-0">
              <p className={`text-base font-bold tabular-nums leading-tight ${
                kpis.attentionScore <= 20 ? 'text-success' :
                kpis.attentionScore <= 50 ? 'text-warning' : 'text-danger'
              }`}>{kpis.attentionScore}</p>
              <p className="text-[10px] text-neutral-50 uppercase tracking-wider leading-tight">Aten.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <MessageCircle size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-neutral-90 dark:text-white tabular-nums leading-tight">{kpis.oneOnOneCount}</p>
              <p className="text-[10px] text-neutral-50 uppercase tracking-wider leading-tight">1:1</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
            <div className="p-1.5 rounded-lg bg-success/10 text-success shrink-0">
              <Award size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-neutral-90 dark:text-white tabular-nums leading-tight">{kpis.achievementCount}</p>
              <p className="text-[10px] text-neutral-50 uppercase tracking-wider leading-tight">Logros</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-20 dark:border-neutral-70 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-50 hover:text-neutral-90 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'perfil' && (
          <ProfileSection memberId={member.id} memberDisplayName={member.displayName} profile={profile} />
        )}
        {activeTab === 'skills' && (
          <SkillsSection memberId={member.id} />
        )}
        {activeTab === 'tecnologias' && (
          <TechStackSection memberId={member.id} />
        )}
        {activeTab === 'microservicios' && (
          <MicroservicesSection memberId={member.id} />
        )}
        {activeTab === 'sprints' && (
          <SprintsSection memberId={member.id} teamId={teamId!} />
        )}
        {activeTab === 'oneonone' && (
          <OneOnOneSection memberId={member.id} />
        )}
        {activeTab === 'logros' && (
          <AchievementsSection memberId={member.id} />
        )}
      </div>
    </div>
  )
}
