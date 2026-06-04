import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { getMemberKPIs } from '@/services/performance/performanceService'
import type { Team, MemberProfile } from '@/types/domain'
import { MEMBER_ROLE_LABELS } from '@/constants/roleLabels'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ProfileSection } from '@/features/performance/components/ProfileSection'
import { SkillsSection } from '@/features/performance/components/SkillsSection'
import { SprintsSection } from '@/features/performance/components/SprintsSection'
import { OneOnOneSection } from '@/features/performance/components/OneOnOneSection'
import { AchievementsSection } from '@/features/performance/components/AchievementsSection'
import { TechStackSection } from '@/features/performance/components/TechStackSection'
import { MicroservicesSection } from '@/features/performance/components/MicroservicesSection'

type Tab = 'perfil' | 'skills' | 'tecnologias' | 'microservicios' | 'sprints' | 'oneonone' | 'logros'

export function MemberPerformancePage() {
  const { memberId, id: teamId } = useParams<{ memberId: string; id: string }>()
  const navigate = useNavigate()
  const [team, setTeam] = useState<Team | null>(null)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof getMemberKPIs>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('perfil')

  const member = team?.members?.find((m) => m.id === memberId)

  useEffect(() => {
    if (!teamId || !memberId) return
    setLoading(true)
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
          <button
            onClick={() => navigate(`/teams/${teamId}/performance`)}
            className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-60" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
              {member.displayName}
            </h1>
            <p className="text-sm text-neutral-50">{MEMBER_ROLE_LABELS[member.role as keyof typeof MEMBER_ROLE_LABELS] ?? member.role} · {team?.name}</p>
          </div>
        </div>

        {/* Mini KPIs */}
        {kpis && (
          <div className="flex gap-3 text-sm">
            <div className="text-center px-3 py-2 bg-white dark:bg-neutral-80 rounded-lg border border-neutral-20 dark:border-neutral-70">
              <p className="text-lg font-bold text-primary">{kpis.totalSP}</p>
              <p className="text-xs text-neutral-50">SP Total</p>
            </div>
            <div className="text-center px-3 py-2 bg-white dark:bg-neutral-80 rounded-lg border border-neutral-20 dark:border-neutral-70">
              <p className="text-lg font-bold text-green-600">{kpis.efficiencyPct}%</p>
              <p className="text-xs text-neutral-50">Eficiencia</p>
            </div>
            <div className="text-center px-3 py-2 bg-white dark:bg-neutral-80 rounded-lg border border-neutral-20 dark:border-neutral-70">
              <p className="text-lg font-bold text-amber-600">{kpis.avgMood}/10</p>
              <p className="text-xs text-neutral-50">Ánimo</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-20 dark:border-neutral-70 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-50 hover:text-neutral-90 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
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
