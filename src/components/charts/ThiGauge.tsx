import { useState, useEffect } from 'react'

interface ThiGaugeProps {
  value: number
  size?: number
  showLabel?: boolean
}

function getColor(val: number): string {
  if (val >= 90) return '#36B37E'
  if (val >= 70) return '#57D9A3'
  if (val >= 50) return '#FFAB00'
  if (val >= 30) return '#FF8B00'
  return '#FF5630'
}

function getColorLight(val: number): string {
  if (val >= 90) return '#7EE2B8'
  if (val >= 70) return '#93E6BE'
  if (val >= 50) return '#FFD666'
  if (val >= 30) return '#FFB84D'
  return '#FF8B73'
}

function getLabel(val: number): string {
  if (val >= 90) return 'Excelente'
  if (val >= 70) return 'Saludable'
  if (val >= 50) return 'Regular'
  if (val >= 30) return 'En Riesgo'
  return 'Crítico'
}

export function ThiGauge({ value, size = 240, showLabel = true }: ThiGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = requestAnimationFrame(() => setAnimatedValue(value))
    return () => cancelAnimationFrame(timer)
  }, [value])

  const radius = (size - 20) / 2
  const circumference = radius * Math.PI
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference
  const color = getColor(value)
  const colorLight = getColorLight(value)
  const gradientId = `thi-gauge-gradient-${size}`

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 24 }}>
        <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colorLight} />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
            <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc */}
          <path
            d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
            fill="none"
            stroke="#EBECF0"
            strokeWidth="10"
            strokeLinecap="round"
            className="dark:opacity-30"
          />

          {/* Glow layer behind the active arc */}
          {animatedValue > 0 && (
            <path
              d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              opacity="0.25"
              filter={`url(#${gradientId}-glow)`}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          )}

          {/* Active arc with gradient */}
          <path
            d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />

          {/* End cap dot */}
          {animatedValue > 2 && (
            <circle
              cx={size - 10}
              cy={size / 2 + 10}
              r="5"
              fill={color}
              style={{ transition: 'opacity 0.3s' }}
            />
          )}
        </svg>

        {/* Centered label */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
          <span
            className="text-4xl font-bold tracking-tight tabular-nums"
            style={{ color }}
          >
            {Math.round(animatedValue)}
          </span>
          {showLabel && (
            <span className="text-sm font-medium text-muted mt-1">
              {getLabel(value)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
