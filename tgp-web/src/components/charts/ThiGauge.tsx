interface ThiGaugeProps {
  value: number
  size?: number
  showLabel?: boolean
}

export function ThiGauge({ value, size = 200, showLabel = true }: ThiGaugeProps) {
  const radius = (size - 20) / 2
  const circumference = radius * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (val: number) => {
    if (val >= 90) return '#36B37E'
    if (val >= 70) return '#57D9A3'
    if (val >= 50) return '#FFAB00'
    if (val >= 30) return '#FF8B00'
    return '#FF5630'
  }

  const getLabel = (val: number) => {
    if (val >= 90) return 'Excelente'
    if (val >= 70) return 'Saludable'
    if (val >= 50) return 'Regular'
    if (val >= 30) return 'En Riesgo'
    return 'Crítico'
  }

  const color = getColor(value)

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          <path
            d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
            fill="none"
            stroke="#EBECF0"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-4xl font-bold" style={{ color }}>{Math.round(value)}</span>
          {showLabel && (
            <span className="text-sm font-medium text-neutral-60 dark:text-neutral-40 mt-1">
              {getLabel(value)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
