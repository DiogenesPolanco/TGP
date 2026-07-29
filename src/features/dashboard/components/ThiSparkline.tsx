import { useMemo } from 'react'

interface ThiSparklineProps {
  data: { date: Date; score: number }[]
  width?: number
  height?: number
  color?: string
}

export function ThiSparkline({
  data,
  width = 120,
  height = 40,
  color = '#36B37E',
}: ThiSparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return null

    const minScore = Math.min(...data.map((d) => d.score))
    const maxScore = Math.max(...data.map((d) => d.score))
    const range = Math.max(maxScore - minScore, 10)
    const padding = 4

    const xStep = (width - padding * 2) / (data.length - 1)
    const yScale = (score: number) =>
      height - padding - ((score - minScore) / range) * (height - padding * 2)

    const points = data.map((d, i) => ({
      x: padding + i * xStep,
      y: yScale(d.score),
    }))

    const linePath = points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(' ')

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

    return { linePath, areaPath, points }
  }, [data, width, height])

  if (!path || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-neutral-50"
        style={{ width, height }}
      >
        Historial no disponible
      </div>
    )
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`sparkline-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d={path.areaPath}
        fill={`url(#sparkline-fill)`}
        className="transition-all duration-500"
      />
      <path
        d={path.linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-500"
      />
      {/* End dot */}
      <circle
        cx={path.points[path.points.length - 1].x}
        cy={path.points[path.points.length - 1].y}
        r="2.5"
        fill={color}
        className="transition-all duration-300"
      />
    </svg>
  )
}
