import { useState, useEffect } from 'react'
import { getPredictions, type Prediction } from '@/services/predictive/predictiveService'
import { TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react'

export function PredictionsWidget() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPredictions().then((data) => {
      setPredictions(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-neutral-20 dark:bg-neutral-75 rounded" />
          <div className="h-16 bg-neutral-20 dark:bg-neutral-75 rounded" />
        </div>
      </div>
    )
  }

  if (predictions.length === 0) return null

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Brain size={22} className="text-purple-500" />
        <h3 className="text-base font-bold text-neutral-90 dark:text-white">Análisis Predictivo</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {predictions.slice(0, 3).map((p, i) => (
          <PredictionMini key={i} prediction={p} />
        ))}
      </div>
    </div>
  )
}

function PredictionMini({ prediction }: { prediction: Prediction }) {
  const TrendIcon = prediction.trend === 'up' ? TrendingUp : prediction.trend === 'down' ? TrendingDown : Minus
  const trendColor = prediction.trend === 'up' ? 'text-danger' : prediction.trend === 'down' ? 'text-success' : 'text-neutral-50'

  return (
    <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-5 border border-neutral-20 dark:border-neutral-70">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-neutral-80 dark:text-neutral-20">{prediction.metric}</span>
        <TrendIcon size={18} className={trendColor} />
      </div>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-2xl font-bold text-neutral-90 dark:text-white">{prediction.current}</span>
        <span className="text-sm text-neutral-50 font-medium">→</span>
        <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{prediction.predicted}</span>
      </div>
      <p className="text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed">{prediction.detail}</p>
    </div>
  )
}
