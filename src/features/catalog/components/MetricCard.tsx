import type React from 'react'

export function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.FC<{ size?: number }>
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className={`rounded-xl border ${bg} p-4`}>
      <div className={`${color} mb-2`}>
        <Icon size={20} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  )
}
