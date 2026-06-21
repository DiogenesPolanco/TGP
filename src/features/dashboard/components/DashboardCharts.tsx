import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { ChartTooltipSimple } from '@/components/charts/ChartTooltip'
import { ChartGradients } from '@/components/charts/ChartGradients'
import { AlertTriangle, CheckCircle2, Info, AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react'
import type { DashboardMetrics } from '../hooks/useDashboardMetrics'
import { Button } from '@/components/ui/Button'

const BU_COLORS = ['#0052CC', '#36B37E', '#FF8B00', '#6554C0', '#00B8D9', '#C85A48', '#57D9A3', '#FFAB00']

interface DashboardChartsProps {
  metrics: DashboardMetrics
  enabledWidgets?: Record<string, boolean>
}

export function DashboardCharts({ metrics, enabledWidgets = {} }: DashboardChartsProps) {
  const { buData, techStatusData, alerts } = metrics
  const e = enabledWidgets

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {e['chart-thi-by-bu'] !== false && (
        <ChartContainer title="THI por Unidad de Negocio">
          {buData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={buData} layout="vertical">
                <defs>
                  <ChartGradients id="bu-chart" />
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" strokeOpacity={0.6} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B778C' }} axisLine={{ stroke: '#DFE1E6', strokeOpacity: 0.5 }} tickLine={false} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#6B778C' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltipSimple />} cursor={{ fill: '#F4F5F7', opacity: 0.5 }} />
                <Bar dataKey="thi" radius={[0, 6, 6, 0]} maxBarSize={24} animationBegin={0} animationDuration={1200} animationEasing="ease-out">
                  {buData.map((_, i) => (
                    <Cell key={i} fill={BU_COLORS[i % BU_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-neutral-50 py-8 text-center">No hay datos de aplicaciones para calcular THI por unidad de negocio</p>
          )}
        </ChartContainer>
      )}

      {e['chart-tech-status'] !== false && (
        <ChartContainer title="Estado de Tecnologías">
          {techStatusData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <defs><ChartGradients id="pie-chart" /></defs>
                  <Pie data={techStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" isAnimationActive={true} animationBegin={200} animationDuration={1000} animationEasing="ease-out" stroke="white" strokeWidth={2}>
                    {techStatusData.map((entry) => (<Cell key={entry.name} fill={entry.color} stroke="white" strokeWidth={2} />))}
                  </Pie>
                  <Tooltip content={<ChartTooltipSimple />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {techStatusData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs text-muted">{entry.name}</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-90 dark:text-white">{entry.value}</span>
                  </div>
                ))}
                <div className="border-t border-boundary pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">Total</span>
                    <span className="text-sm font-bold text-neutral-90 dark:text-white">{techStatusData.reduce((s, d) => s + d.value, 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-50">Sin datos de tecnologías</p>
          )}
        </ChartContainer>
      )}

      {e['chart-alerts'] !== false && (
        <ChartContainer title={`Alertas (${alerts.length})`}>
          <AlertsList alerts={alerts} />
        </ChartContainer>
      )}
    </div>
  )
}

function ChartContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-boundary p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-90 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

const MAX_VISIBLE_ALERTS = 4

function AlertsList({ alerts }: { alerts: { type: string; message: string }[] }) {
  const [expanded, setExpanded] = useState(false)

  if (alerts.length === 0) {
    return <p className="text-sm text-neutral-50 py-6 text-center">Sin alertas activas</p>
  }

  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, success: 2, info: 3 }
    return (order[a.type as keyof typeof order] ?? 3) - (order[b.type as keyof typeof order] ?? 3)
  })

  const visible = expanded ? sorted : sorted.slice(0, MAX_VISIBLE_ALERTS)
  const hiddenCount = sorted.length - MAX_VISIBLE_ALERTS

  return (
    <div className="space-y-2">
      {visible.map((alert, i) => (
        <AlertItem key={i} type={alert.type} message={alert.message} />
      ))}
      {hiddenCount > 0 && (
        <Button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-75"
        >
          {expanded ? (
            <>Mostrar menos <ChevronUp size={14} /></>
          ) : (
            <>Ver {hiddenCount} alerta{hiddenCount > 1 ? 's' : ''} más <ChevronDown size={14} /></>
          )}
        </Button>
      )}
    </div>
  )
}

const alertConfig = {
  critical: {
    border: 'border-l-danger',
    icon: AlertTriangle,
    iconColor: 'text-danger',
    label: 'Crítica',
  },
  warning: {
    border: 'border-l-warning',
    icon: AlertOctagon,
    iconColor: 'text-warning',
    label: 'Advertencia',
  },
  success: {
    border: 'border-l-success',
    icon: CheckCircle2,
    iconColor: 'text-success',
    label: 'OK',
  },
  info: {
    border: 'border-l-info',
    icon: Info,
    iconColor: 'text-info',
    label: 'Info',
  },
}

function AlertItem({ type, message }: { type: string; message: string }) {
  const config = alertConfig[type as keyof typeof alertConfig] ?? alertConfig.info
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-boundary border-l-4 bg-card hover:bg-neutral-5 dark:hover:bg-neutral-75 transition-colors">
      <Icon size={16} className={`${config.iconColor} mt-0.5 shrink-0`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-neutral-80 dark:text-neutral-20 leading-relaxed">{message}</p>
      </div>
    </div>
  )
}
