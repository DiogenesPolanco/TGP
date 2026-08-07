import type { ReactNode } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { ChartTooltipSimple } from '@/components/charts/ChartTooltip'
import { ChartGradients } from '@/components/charts/ChartGradients'
import type { DashboardMetrics } from '../services/finOpsService'

const CHART_COLORS = [
  '#0052CC',
  '#36B37E',
  '#FF8B00',
  '#6554C0',
  '#00B8D9',
  '#C85A48',
  '#57D9A3',
  '#FFAB00',
]

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-boundary p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-90 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

export function FinOpsCharts({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Tendencia 12 meses">
        {metrics.trend12m.some((t) => t.total > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={metrics.trend12m}>
              <defs>
                <ChartGradients id="finops-trend" />
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" strokeOpacity={0.6} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: '#6B778C' }}
                axisLine={{ stroke: '#DFE1E6', strokeOpacity: 0.5 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6B778C' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={<ChartTooltipSimple />}
                cursor={{ fill: '#F4F5F7', opacity: 0.5 }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Gasto"
                stroke="url(#finops-trend-primary)"
                fill="url(#finops-trend-primary)"
                strokeWidth={2}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-neutral-50 py-8 text-center">Sin datos de tendencia</p>
        )}
      </ChartCard>

      <ChartCard title="Top aplicaciones">
        {metrics.topApps.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metrics.topApps} layout="vertical">
              <defs>
                <ChartGradients id="finops-top" />
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" strokeOpacity={0.6} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#6B778C' }}
                axisLine={{ stroke: '#DFE1E6', strokeOpacity: 0.5 }}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tick={{ fontSize: 11, fill: '#6B778C' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltipSimple />}
                cursor={{ fill: '#F4F5F7', opacity: 0.5 }}
              />
              <Bar
                dataKey="total"
                name="Costo"
                radius={[0, 6, 6, 0]}
                maxBarSize={20}
                animationDuration={1200}
              >
                {metrics.topApps.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-neutral-50 py-8 text-center">Sin datos de aplicaciones</p>
        )}
      </ChartCard>

      <ChartCard title="Por categoría">
        {metrics.byCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <defs>
                <ChartGradients id="finops-cat" />
              </defs>
              <Pie
                data={metrics.byCategory}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="total"
                nameKey="categoryId"
                stroke="white"
                strokeWidth={2}
                animationDuration={1200}
              >
                {metrics.byCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipSimple />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-neutral-50 py-8 text-center">Sin datos por categoría</p>
        )}
      </ChartCard>
    </div>
  )
}
