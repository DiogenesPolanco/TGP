import { useState, useCallback } from 'react'
import { Clock, Database, Settings, Share2, Check, Copy } from 'lucide-react'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'
import { DashboardHero } from '../components/DashboardHero'
import { MetricsGrid } from '../components/MetricsGrid'
import { DashboardCharts } from '../components/DashboardCharts'
import { PredictionsWidget } from '../components/PredictionsWidget'
import { DashboardConfigModal } from '../components/DashboardConfigModal'
import { useDashboardConfigStore } from '@/stores/dashboardConfigStore'
import { createShareLink, getSharedLinksList } from '@/services/share/publicShareService'

export function DashboardPage() {
  const metrics = useDashboardMetrics()
  const { enabledWidgets } = useDashboardConfigStore()
  const e = enabledWidgets
  const [showConfig, setShowConfig] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(() => {
    const existing = getSharedLinksList()
    if (existing.length > 0) {
      setShareUrl(existing[0].url)
      return
    }
    const { url } = createShareLink(48)
    setShareUrl(url)
  }, [])

  const handleCopy = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareUrl])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-60 dark:text-neutral-40 hover:text-neutral-90 dark:hover:text-white bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors"
        >
          <Share2 size={16} />
          Compartir
        </button>
        <button
          onClick={() => setShowConfig(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-60 dark:text-neutral-40 hover:text-neutral-90 dark:hover:text-white bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors"
        >
          <Settings size={16} />
          Personalizar
        </button>
      </div>

      {shareUrl && (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 flex items-center gap-3">
          <span className="text-sm text-neutral-50 shrink-0">Enlace compartido:</span>
          <code className="flex-1 text-sm bg-neutral-5 dark:bg-neutral-85 px-3 py-1.5 rounded-lg text-neutral-70 dark:text-neutral-30 truncate font-mono">
            {shareUrl}
          </code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-primary/10 text-primary hover:bg-primary/20"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}

      {e['thi-gauge'] || e['kpi-critical-vulns'] || e['kpi-p1-incidents'] || e['kpi-thi-score'] || e['kpi-eol-techs'] ? (
        <DashboardHero metrics={metrics} enabledWidgets={e} />
      ) : null}

      {e['kpi-risk-exposure'] || e['kpi-compliance'] || e['kpi-elite-teams'] || e['kpi-total-apps'] ||
       e['kpi-active-plans'] || e['kpi-blockers'] || e['kpi-overdue-commitments'] || e['kpi-activities-today'] ? (
        <MetricsGrid metrics={metrics} enabledWidgets={e} />
      ) : null}

      {e['chart-thi-by-bu'] || e['chart-tech-status'] || e['chart-alerts'] ? (
        <DashboardCharts metrics={metrics} enabledWidgets={e} />
      ) : null}

      {e['widget-predictions'] !== false && <PredictionsWidget />}

      {!metrics.loading && (
        <div className="border-t border-neutral-30 dark:border-neutral-70 pt-4 pb-2">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-neutral-70 dark:text-neutral-30 font-medium">
              <Clock size={12} className="text-neutral-50 dark:text-neutral-40" />
              <span>
                {metrics.lastUpdated.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="text-neutral-40 dark:text-neutral-60">·</span>
              <span className="text-neutral-50 dark:text-neutral-50">hoy</span>
            </div>

            {metrics.businessUnits.length > 0 && (
              <>
                <div className="hidden sm:block w-px h-4 bg-neutral-40 dark:bg-neutral-60" />

                <div className="flex items-center gap-3 text-xs text-neutral-70 dark:text-neutral-30 font-medium">
                  <Database size={12} className="text-neutral-50 dark:text-neutral-40" />
                  <span className="tabular-nums">{metrics.applications.length}</span>
                  <span className="text-neutral-50 dark:text-neutral-50">aplicaciones</span>
                  <span className="text-neutral-40 dark:text-neutral-60">·</span>
                  <span className="tabular-nums">{metrics.technologies.length}</span>
                  <span className="text-neutral-50 dark:text-neutral-50">tecnologías</span>
                  <span className="text-neutral-40 dark:text-neutral-60">·</span>
                  <span className="tabular-nums">{metrics.teams.length}</span>
                  <span className="text-neutral-50 dark:text-neutral-50">equipos</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showConfig && <DashboardConfigModal onClose={() => setShowConfig(false)} />}
    </div>
  )
}
