interface ChartTooltipPayload {
  name?: string
  value?: number
  color?: string
  unit?: string
}

interface TooltipPayloadEntry {
  name?: string
  value?: number | string
  color?: string
  fill?: string
  dataKey?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  formatter?: (value: number) => string
  items?: ChartTooltipPayload[]
}

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white/90 dark:bg-neutral-80/90 backdrop-blur-md border border-neutral-20/80 dark:border-neutral-70/80 rounded-xl shadow-xl p-4 text-sm min-w-[160px]">
      {label && (
        <p className="font-semibold text-neutral-90 dark:text-white mb-2 pb-2 border-b border-boundary">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color ?? entry.fill }}
              />
              <span className="text-muted text-xs">{entry.name ?? entry.dataKey}</span>
            </div>
            <span className="font-semibold text-neutral-90 dark:text-white">
              {formatter ? formatter(entry.value as number) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartTooltipSimple({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/90 dark:bg-neutral-80/90 backdrop-blur-md border border-neutral-20/80 dark:border-neutral-70/80 rounded-xl shadow-xl p-4 text-sm min-w-[160px]">
      <p className="font-semibold text-neutral-90 dark:text-white mb-2 pb-2 border-b border-boundary">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, idx) => {
          if (entry.name === 'color' || entry.dataKey === 'color') return null
          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-muted text-xs capitalize">{entry.name ?? entry.dataKey}</span>
              <span className="font-semibold text-neutral-90 dark:text-white">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
