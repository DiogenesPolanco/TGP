import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'

interface ChartItem {
  name: string
  completados: number
  noCompletados: number
  eficiencia: number
}

export function SprintChartSection({ data }: { data: ChartItem[] }) {
  if (data.length === 0) {
    return (
      <p className="text-center py-6 text-neutral-40 text-sm">
        No hay datos para mostrar en el gráfico
      </p>
    )
  }

  return (
    <div className="mb-6 p-4 bg-neutral-10 dark:bg-neutral-70 rounded-xl">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(156,163,175,0.2)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgb(156,163,175,0.6)" />
          <YAxis tick={{ fontSize: 11 }} stroke="rgb(156,163,175,0.6)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(30,30,30)',
              border: '1px solid rgb(60,60,60)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value) => [value, 'SP']}
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-neutral-60">
                {value === 'completados' ? 'Completados' : 'No completados'}
              </span>
            )}
          />
          <Bar dataKey="completados" fill="#22c55e" radius={[4, 4, 0, 0]} name="completados" />
          <Bar dataKey="noCompletados" fill="#ef4444" radius={[4, 4, 0, 0]} name="noCompletados" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
