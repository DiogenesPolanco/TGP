import { useMemo } from 'react'

interface Props {
  nodes: { id: string; label: string; criticality: string }[]
  edges: { source: string; target: string; type: string; criticality: string }[]
  width?: number
  height?: number
  onNodeClick?: (nodeId: string) => void
}

const CRITICALITY_COLORS: Record<string, string> = {
  critical: '#FF5630',
  high: '#FF8B00',
  medium: '#FFAB00',
  low: '#36B37E',
  info: '#2684FF',
}

const EDGE_COLORS: Record<string, string> = {
  api: '#2684FF',
  database: '#6554C0',
  library: '#36B37E',
  infrastructure: '#FF8B00',
  message: '#FFAB00',
  external: '#FF5630',
}

const CENTER_X = 500
const CENTER_Y = 350
const REPULSION = 12000
const ATTRACTION = 0.003
const DAMPING = 0.85
const ITERATIONS = 120

function forceLayout(
  nodeList: { id: string; label: string; criticality?: string }[],
  edgeList: { source: string; target: string }[],
) {
  const nodes = nodeList.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodeList.length
    return {
      ...n,
      x: CENTER_X + Math.cos(angle) * 200,
      y: CENTER_Y + Math.sin(angle) * 200,
      vx: 0,
      vy: 0,
      radius: 40,
    }
  })

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const cooling = 1 - iter / ITERATIONS

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
        const force = REPULSION / (dist * dist)
        const fx = (dx / dist) * force * cooling
        const fy = (dy / dist) * force * cooling
        nodes[i].vx -= fx
        nodes[i].vy -= fy
        nodes[j].vx += fx
        nodes[j].vy += fy
      }
    }

    const edgeMap = new Map<string, number>()
    for (const edge of edgeList) {
      const key = [edge.source, edge.target].sort().join('-')
      edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1)
    }

    for (const edge of edgeList) {
      const si = nodes.findIndex((n) => n.id === edge.source)
      const ti = nodes.findIndex((n) => n.id === edge.target)
      if (si === -1 || ti === -1) continue
      const dx = nodes[ti].x - nodes[si].x
      const dy = nodes[ti].y - nodes[si].y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const force = (dist - 120) * ATTRACTION * cooling
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      nodes[si].vx += fx
      nodes[si].vy += fy
      nodes[ti].vx -= fx
      nodes[ti].vy -= fy
    }

    for (const node of nodes) {
      node.vx *= DAMPING
      node.vy *= DAMPING
      node.x += node.vx
      node.y += node.vy

      const margin = 50
      if (node.x < margin) node.x = margin
      if (node.x > 800 - margin) node.x = 800 - margin
      if (node.y < margin) node.y = margin
      if (node.y > 600 - margin) node.y = 600 - margin
    }
  }

  return nodes
}

export function DependencyGraph({
  nodes: rawNodes,
  edges: rawEdges,
  width = 1000,
  height = 700,
  onNodeClick,
}: Props) {
  const laidOut = useMemo(() => forceLayout(rawNodes, rawEdges), [rawNodes, rawEdges])

  if (laidOut.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-50">
        No hay dependencias para mostrar
      </div>
    )
  }

  const edgePaths = rawEdges
    .map((edge) => {
      const source = laidOut.find((n) => n.id === edge.source)
      const target = laidOut.find((n) => n.id === edge.target)
      if (!source || !target) return null

      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const nx = -dy / dist
      const ny = dx / dist

      const sx = source.x + nx * source.radius
      const sy = source.y + ny * source.radius
      const tx = target.x + nx * target.radius
      const ty = target.y + ny * target.radius

      const midX = (sx + tx) / 2
      const midY = (sy + ty) / 2

      const angle = Math.atan2(ty - sy, tx - sx)
      const ax = tx - Math.cos(angle) * (target.radius + 4)
      const ay = ty - Math.sin(angle) * (target.radius + 4)

      return { sx, sy, ax, ay, midX, midY, edge }
    })
    .filter(Boolean)

  return (
    <svg width={width} height={height} className="w-full h-full">
      <defs>
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <marker
            key={type}
            id={`arrow-${type}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill={color} />
          </marker>
        ))}
      </defs>

      {edgePaths.map((ep, i) =>
        ep ? (
          <g key={i}>
            <line
              x1={ep.sx}
              y1={ep.sy}
              x2={ep.ax}
              y2={ep.ay}
              stroke={EDGE_COLORS[ep.edge.type] ?? '#DFE1E6'}
              strokeWidth={ep.edge.criticality === 'critical' ? 2.5 : 1.5}
              strokeDasharray={ep.edge.type === 'external' ? '6,3' : undefined}
              markerEnd={`url(#arrow-${ep.edge.type})`}
              className="dark:opacity-60"
            />
            <rect
              x={ep.midX - 18}
              y={ep.midY - 10}
              width={36}
              height={16}
              rx={4}
              fill="white"
              className="dark:fill-neutral-80"
              opacity={0.85}
            />
            <text
              x={ep.midX}
              y={ep.midY + 2}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#505F79"
              className="dark:fill-neutral-40 capitalize"
            >
              {ep.edge.type}
            </text>
          </g>
        ) : null,
      )}

      {laidOut.map((node) => (
        <g
          key={node.id}
          className="cursor-pointer"
          onClick={() => onNodeClick?.(node.id)}
          role="button"
          tabIndex={0}
        >
          <circle
            cx={node.x}
            cy={node.y}
            r={node.radius}
            fill={CRITICALITY_COLORS[node.criticality ?? 'info'] ?? '#2684FF'}
            fillOpacity={0.12}
            stroke={CRITICALITY_COLORS[node.criticality ?? 'info'] ?? '#2684FF'}
            strokeWidth={2.5}
            className="hover:stroke-[4px] transition-all"
          />
          <text
            x={node.x}
            y={node.y - 8}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="#172B4D"
            className="dark:fill-neutral-10 pointer-events-none"
          >
            {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
          </text>
          <text
            x={node.x}
            y={node.y + 10}
            textAnchor="middle"
            fontSize="10"
            fill="#6B778C"
            className="dark:fill-neutral-50 pointer-events-none capitalize"
          >
            {node.criticality}
          </text>
        </g>
      ))}
    </svg>
  )
}
