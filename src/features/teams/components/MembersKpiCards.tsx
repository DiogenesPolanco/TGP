import { TrendingUp, TrendingDown, Star, AlertTriangle } from 'lucide-react'
import type { TeamMember } from '@/types/domain'
import { KpiCard } from '@/components/data-display/KpiCard'

interface MemberDisplay {
  member: TeamMember
  team: { id: string; name: string }
  kpis: {
    totalSP: number
    efficiencyPct: number
    attentionScore: number
    avgMood: number
    openOpportunitiesCount: number
    oneOnOneCount: number
    achievementCount: number
  }
}

function attentionInfo(kpis: MemberDisplay['kpis']) {
  const eff = Math.round(((100 - kpis.efficiencyPct) / 100) * 35)
  const opps = kpis.openOpportunitiesCount
  const oppScore = Math.round((Math.min(opps, 5) / 5) * 35)
  const moodScore = kpis.oneOnOneCount > 0 ? Math.round(((5 - kpis.avgMood) / 4) * 20) : 0
  const achScore = kpis.achievementCount === 0 ? 10 : 0
  return (
    <div className="space-y-2">
      <p className="font-semibold text-xs mb-1">Composición del puntaje (0–100):</p>
      <div><span className="text-neutral-30">Eficiencia baja</span><span className="float-right font-mono">{eff}/35</span></div>
      <div><span className="text-neutral-30">Oportunidades de mejora ({opps})</span><span className="float-right font-mono">{oppScore}/35</span></div>
      <div><span className="text-neutral-30">Ánimo bajo</span><span className="float-right font-mono">{moodScore}/20</span></div>
      <div><span className="text-neutral-30">Sin logros</span><span className="float-right font-mono">{achScore}/10</span></div>
    </div>
  )
}

interface Props {
  filteredKpis: {
    bestPerformer: MemberDisplay | null
    worstPerformer: MemberDisplay | null
    topSP: MemberDisplay | null
    needsAttention: MemberDisplay | null
  } | null
  onEditMember: (id: string, name: string, teamId: string) => void
}

export function MembersKpiCards({ filteredKpis, onEditMember }: Props) {
  const clickHandler = (m: MemberDisplay | null) =>
    m ? () => onEditMember(m.member.id, m.member.displayName, m.team.id) : undefined

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={<TrendingUp size={22} />}
        title="Mejor Rendimiento"
        value={filteredKpis?.bestPerformer ? `${filteredKpis.bestPerformer.kpis.efficiencyPct}%` : '—'}
        subtitle={filteredKpis?.bestPerformer?.member.displayName}
        color="success"
        onClick={clickHandler(filteredKpis?.bestPerformer)}
      />
      <KpiCard
        icon={<TrendingDown size={22} />}
        title="Menor Rendimiento"
        value={filteredKpis?.worstPerformer ? `${filteredKpis.worstPerformer.kpis.efficiencyPct}%` : '—'}
        subtitle={filteredKpis?.worstPerformer?.member.displayName}
        color="danger"
        onClick={clickHandler(filteredKpis?.worstPerformer)}
      />
      <KpiCard
        icon={<Star size={22} />}
        title="Más Story Points"
        value={filteredKpis?.topSP ? `${filteredKpis.topSP.kpis.totalSP}` : '—'}
        subtitle={filteredKpis?.topSP?.member.displayName}
        color="warning"
        onClick={clickHandler(filteredKpis?.topSP)}
      />
      <KpiCard
        icon={<AlertTriangle size={22} />}
        title="Requiere Atención"
        value={filteredKpis?.needsAttention ? `${filteredKpis.needsAttention.kpis.attentionScore}` : '—'}
        subtitle={filteredKpis?.needsAttention?.member.displayName}
        color="danger"
        onClick={clickHandler(filteredKpis?.needsAttention)}
        info={filteredKpis?.needsAttention ? attentionInfo(filteredKpis.needsAttention.kpis) : undefined}
      />
    </div>
  )
}
