import { useState, useEffect } from 'react'
import { getPredictions, type Prediction } from '@/services/predictive/predictiveService'
import { TrendingUp, TrendingDown, Minus, Brain, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getPredictions().then((data) => {
      setPredictions(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">Análisis Predictivo</h1>
        <Button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Recalcular
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-purple-500/10">
            <Brain size={24} className="text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Proyecciones basadas en datos históricos</h2>
            <p className="text-sm text-neutral-50">
              Análisis estadístico con regresión lineal sobre {predictions.length} dimensiones
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-neutral-10 dark:bg-neutral-75 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 size={48} className="mx-auto text-neutral-40 mb-4" />
            <p className="text-neutral-60 dark:text-neutral-40">
              No hay suficientes datos históricos para generar predicciones.
            </p>
            <p className="text-sm text-neutral-50 mt-1">
              Se necesitan al menos 3 registros de THI y datos en vulnerabilidades, riesgos o tecnologías.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((p, i) => (
              <PredictionCard key={i} prediction={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const TrendIcon = prediction.trend === 'up' ? TrendingUp : prediction.trend === 'down' ? TrendingDown : Minus
  const trendColor = prediction.trend === 'up' ? 'text-danger' : prediction.trend === 'down' ? 'text-success' : 'text-neutral-50'

  const confidenceColor = prediction.confidence === 'high' ? 'bg-success/10 text-success'
    : prediction.confidence === 'medium' ? 'bg-warning/10 text-warning'
    : 'bg-neutral-10 dark:bg-neutral-75 text-neutral-50'

  return (
    <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-neutral-90 dark:text-white">{prediction.metric}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${trendColor}`}>
              <TrendIcon size={16} />
              {prediction.trend === 'up' ? 'Al alza' : prediction.trend === 'down' ? 'A la baja' : 'Estable'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${confidenceColor}`}>
              {prediction.confidence === 'high' ? 'Alta confianza'
                : prediction.confidence === 'medium' ? 'Confianza media'
                : 'Baja confianza'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-neutral-50">Actual</p>
              <p className="text-xl font-bold text-neutral-90 dark:text-white">{prediction.current}</p>
            </div>
            <div className="text-neutral-30 dark:text-neutral-60 text-lg font-light">→</div>
            <div>
              <p className="text-xs text-neutral-50">Predicción</p>
              <p className="text-xl font-bold text-primary">{prediction.predicted}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2 text-sm text-neutral-60 dark:text-neutral-40">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <p>{prediction.detail}</p>
      </div>
    </div>
  )
}
