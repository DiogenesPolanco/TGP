interface PeriodSelectorProps {
  value: string
  onChange: (period: string) => void
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <input
      type="month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-boundary bg-background px-3 py-1.5 text-sm"
      aria-label="Periodo"
    />
  )
}
