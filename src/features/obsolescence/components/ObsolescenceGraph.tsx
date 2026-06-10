import { useMemo } from 'react'
import type { SupportStatus } from '@/types/domain'

interface GraphNode {
  id: string
  label: string
  status: SupportStatus | 'mixed'
  type: 'app' | 'microservice'
  parentAppId?: string
}

interface GraphEdge {
  source: string
  target: string
}

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  width?: number
  height?: number
  onNodeClick?: (nodeId: string, nodeType: 'app' | 'microservice', parentAppId?: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  eol: '#FF5630',
  extended: '#FF8B00',
  active: '#36B37E',
  unknown: '#6B778C',
  mixed: '#8B5CF6',
}

const STATUS_LABELS: Record<string, string> = {
  eol: 'EOL',
  extended: 'S. Extendido',
  active: 'Activo',
  unknown: 'Sin datos',
  mixed: 'Mixto',
}

const CENTER_X = 500
const CENTER_Y = 350
const REPULSION = 15000
const ATTRACTION = 0.004
const DAMPING = 0.85
const ITERATIONS = 120

function forceLayout(
  nodeList: { id: string; label: string; radius: number }[],
  edgeList: { source: string; target: string }[],
) {
  const nodes = nodeList.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodeList.length
    return {
      ...n,
      x: CENTER_X + Math.cos(angle) * 250,
      y: CENTER_Y + Math.sin(angle) * 250,
      vx: 0,
      vy: 0,
    }
  })

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const cooling = 1 - iter / ITERATIONS

    // Repulsion between all nodes
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

    // Attraction along edges
    for (const edge of edgeList) {
      const si = nodes.findIndex((n) => n.id === edge.source)
      const ti = nodes.findIndex((n) => n.id === edge.target)
      if (si === -1 || ti === -1) continue
      const dx = nodes[ti].x - nodes[si].x
      const dy = nodes[ti].y - nodes[si].y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const idealDist = (nodes[si].radius + nodes[ti].radius) * 2.2
      const force = (dist - idealDist) * ATTRACTION * cooling
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      nodes[si].vx += fx
      nodes[si].vy += fy
      nodes[ti].vx -= fx
      nodes[ti].vy -= fy
    }

    // Apply velocity with damping
    for (const node of nodes) {
      node.vx *= DAMPING
      node.vy *= DAMPING
      node.x += node.vx
      node.y += node.vy

      const margin = 50
      if (node.x < margin) node.x = margin
      if (node.x > 1000 - margin) node.x = 1000 - margin
      if (node.y < margin) node.y = margin
      if (node.y > 700 - margin) node.y = 700 - margin
    }
  }

  return nodes
}

export function ObsolescenceGraph({ nodes: rawNodes, edges: rawEdges, width = 1000, height = 700, onNodeClick }: Props) {
  const prepared = useMemo(() => {
    const radiusMap: Record<string, number> = {
      app: 48,
      microservice: 30,
    }
    const nodeList = rawNodes.map((n) => ({
      id: n.id,
      label: n.label,
      radius: radiusMap[n.type] ?? 36,
    }))
    return { nodeList }
  }, [rawNodes])

  const laidOut = useMemo(
    () => forceLayout(prepared.nodeList, rawEdges),
    [prepared.nodeList, rawEdges],
  )

  const nodeMap = useMemo(() => {
    const map = new Map(rawNodes.map((n) => [n.id, n]))
    return map
  }, [rawNodes])

  if (laidOut.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-50">
        No hay aplicaciones o microservicios para mostrar
      </div>
    )
  }

  const edgePaths = rawEdges.map((edge) => {
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

    return { sx, sy, ax, ay, midX, midY }
  }).filter(Boolean) as { sx: number; sy: number; ax: number; ay: number; midX: number; midY: number }[]

  const formatLabel = (label: string, maxLen: number) =>
    label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label

  return (
    <svg width={width} height={height} className="w-full h-full">
      {/* Edge arrows */}
      <defs>
        <marker
          id="arrow-contains"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="#3a3a4a" />
        </marker>
      </defs>

      {/* Edges */}
      {edgePaths.map((ep, i) => (
        <g key={`edge-${i}`}>
          <line
            x1={ep.sx}
            y1={ep.sy}
            x2={ep.ax}
            y2={ep.ay}
            stroke="#3a3a4a"
            strokeWidth={1}
            strokeDasharray="4,3"
            markerEnd="url(#arrow-contains)"
            className="dark:opacity-50"
          />
        </g>
      ))}

      {/* Nodes */}
      {laidOut.map((node) => {
        const graphNode = nodeMap.get(node.id)
        const color = STATUS_COLORS[graphNode?.status ?? 'unknown'] ?? STATUS_COLORS.unknown
        const isApp = graphNode?.type === 'app'

        return (
          <g
            key={node.id}
            className="cursor-pointer"
            onClick={() => onNodeClick?.(node.id, graphNode?.type ?? 'microservice', graphNode?.parentAppId)}
            role="button"
            tabIndex={0}
          >
            {/* Shadow */}
            <circle
              cx={node.x + 2}
              cy={node.y + 3}
              r={node.radius}
              fill="rgba(0,0,0,0.2)"
              className="dark:fill-black/40"
            />

            {/* Main circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={color}
              fillOpacity={isApp ? 0.15 : 0.1}
              stroke={color}
              strokeWidth={isApp ? 3 : 2}
              className="hover:stroke-[4px] transition-all duration-150"
            />

            {/* Status dot indicator */}
            <circle
              cx={node.x + node.radius - 6}
              cy={node.y - node.radius + 6}
              r={5}
              fill={color}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
            />

            {/* Node label */}
            <text
              x={node.x}
              y={node.y - (isApp ? 2 : 1)}
              textAnchor="middle"
              fontSize={isApp ? 11 : 9}
              fontWeight={isApp ? '700' : '500'}
              fill="#e8e8ed"
              className="pointer-events-none select-none"
            >
              {formatLabel(node.label, isApp ? 12 : 8)}
            </text>

            {/* Status label */}
            <text
              x={node.x}
              y={node.y + (isApp ? 14 : 12)}
              textAnchor="middle"
              fontSize={8}
              fill="#8888a0"
              className="pointer-events-none select-none"
            >
              {graphNode ? STATUS_LABELS[graphNode.status] ?? graphNode.status : ''}
            </text>

            {/* Type badge */}
            <text
              x={node.x}
              y={node.y + (isApp ? 26 : 22)}
              textAnchor="middle"
              fontSize={7}
              fill="#6c6c8a"
              className="pointer-events-none select-none capitalize"
            >
              {isApp ? 'App' : 'MS'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
