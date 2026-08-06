import { Server, AlertTriangle, Shield } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'

interface RiskStats {
  withEol: number
  withVuln: number
  withIncident: number
  withAudit: number
  withRisk: number
}

interface Props {
  total: number
  riskStats: RiskStats
  filterRisk: string | null
  onFilterRisk: (key: string | null) => void
}

const cards = [
  { key: null, label: 'Total Microservicios', icon: <Server size={20} />, color: 'text-primary' },
  { key: 'eol', label: 'Obsolescencia', icon: <AlertTriangle size={20} />, color: 'text-danger' },
  {
    key: 'vuln',
    label: 'Vulnerabilidades',
    icon: <Shield size={20} />,
    color: 'text-severity-high',
  },
  {
    key: 'incident',
    label: 'Incidentes',
    icon: <AlertTriangle size={20} />,
    color: 'text-warning',
  },
  { key: 'audit', label: 'Auditorías', icon: <AlertTriangle size={20} />, color: 'text-info' },
  { key: 'risk', label: 'Riesgos', icon: <AlertTriangle size={20} />, color: 'text-purple-500' },
]

export function MicroserviceStatCards({ total, riskStats, filterRisk, onFilterRisk }: Props) {
  const getValue = (key: string | null) => {
    if (key === null) return total
    return riskStats[`with${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof RiskStats] ?? 0
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => (
        <StatCard
          key={c.key ?? 'total'}
          icon={c.icon}
          label={c.label}
          value={getValue(c.key)}
          color={c.color}
          active={c.key === null ? filterRisk === null : filterRisk === c.key}
          onClick={() => onFilterRisk(filterRisk === c.key ? null : c.key)}
        />
      ))}
    </div>
  )
}
