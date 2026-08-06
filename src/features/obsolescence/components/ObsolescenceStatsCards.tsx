import { Button } from '@/components/ui/Button'
import { Layers, CheckCircle, Clock, XCircle, AlertTriangle, Shield } from 'lucide-react'

interface Stats {
  total: number
  eol: number
  extended: number
  active: number
  criticalAppsWithEol: number
  nearEol: number
}

interface Props {
  stats: Stats
  onFilterStatus: (status: string) => void
  onReset: () => void
}

export function ObsolescenceStatsCards({ stats, onFilterStatus, onReset }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <StatButton
        icon={Layers}
        color="bg-primary/10 text-primary"
        value={stats.total}
        label="Total Tecnologías"
        onClick={() => onFilterStatus('all')}
      />
      <StatButton
        icon={CheckCircle}
        color="bg-success/10 text-success"
        value={stats.active}
        label="Activas"
        valueColor="text-success"
        onClick={() => onFilterStatus('active')}
      />
      <StatButton
        icon={Clock}
        color="bg-warning/10 text-warning"
        value={stats.extended}
        label="Soporte Extendido"
        valueColor="text-warning"
        extra={stats.nearEol > 0 ? `${stats.nearEol} próx. a EOL` : undefined}
        onClick={() => onFilterStatus('extended')}
      />
      <StatButton
        icon={XCircle}
        color="bg-danger/10 text-danger"
        value={stats.eol}
        label="EOL"
        valueColor="text-danger"
        onClick={() => onFilterStatus('eol')}
      />
      <StatButton
        icon={AlertTriangle}
        color="bg-danger/10 text-danger"
        value={stats.criticalAppsWithEol}
        label="Apps Críticas Afectadas"
        valueColor="text-danger"
        onClick={onReset}
      />
      <StatButton
        icon={Shield}
        color="bg-info/10 text-info"
        value={stats.total - stats.eol - stats.extended}
        label="Sin EOL / Seguras"
        valueColor="text-info"
        onClick={() => onFilterStatus('all')}
      />
    </div>
  )
}

function StatButton({
  icon: Icon,
  color,
  value,
  label,
  valueColor,
  extra,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>
  color: string
  value: number | string
  label: string
  valueColor?: string
  extra?: string
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="md"
      onClick={onClick}
      className="w-full justify-start p-4 rounded-2xl border border-boundary bg-card shadow-sm hover:shadow-md text-left flex-col items-start gap-0 h-auto"
    >
      <div className={`p-2 rounded-lg mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <p className={`text-2xl font-bold ${valueColor ?? 'text-neutral-90 dark:text-white'}`}>
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
      {extra && <p className="text-xs text-severity-high mt-1">{extra}</p>}
    </Button>
  )
}
