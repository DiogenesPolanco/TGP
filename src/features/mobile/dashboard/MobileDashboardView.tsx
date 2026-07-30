import { Moon, Sun } from 'lucide-react'
import type { MobileSnapshot } from '@/services/share/metricsSnapshotService'

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

function renderDimensionBar(label: string, score: number) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted">{label}</span>
        <span className="text-[10px] font-mono text-neutral-50 dark:text-neutral-50">{score}</span>
      </div>
      <div className="w-full h-1 bg-neutral-20 dark:bg-neutral-80 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${score >= 70 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function MetricCard({ label, value, total, color, icon }: {
  label: string; value: number; total: number; color: 'danger' | 'warning' | 'success'; icon: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-neutral-85 rounded-2xl border border-boundary p-4">
      <div className={`flex items-center gap-2 mb-3 p-1.5 rounded-lg w-fit ${color === 'danger' ? 'bg-danger/5 text-danger' : color === 'warning' ? 'bg-warning/5 text-warning' : 'bg-success/5 text-success'}`}>{icon}</div>
      <p className="text-xl font-bold text-default font-mono">{value}<span className="text-sm font-medium text-neutral-50">/{total}</span></p>
      <p className="text-[11px] text-muted font-medium mt-0.5">{label}</p>
    </div>
  )
}

function StatusRow({ label, value, total, color }: {
  label: string; value: number; total: number; color: 'danger' | 'warning' | 'success'
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-neutral-85 rounded-xl border border-boundary px-4 py-3">
      <div className={`w-2 h-2 rounded-full shrink-0 ${color === 'danger' ? 'bg-danger' : color === 'warning' ? 'bg-warning' : 'bg-success'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted font-medium">{label}</span>
          <span className="text-xs font-mono text-default">{value}/{total}</span>
        </div>
        {total > 0 && (
          <div className="w-full h-1 bg-neutral-20 dark:bg-neutral-80 rounded-full overflow-hidden mt-1.5">
            <div className={`h-full rounded-full ${color === 'danger' ? 'bg-danger' : color === 'warning' ? 'bg-warning' : 'bg-success'}`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  data: MobileSnapshot
  showCacheInfo: boolean
  theme: string
  onToggleTheme: () => void
  onToggleCacheInfo: () => void
  onRefresh: () => void
  onLock: () => void
}

export function MobileDashboardView({ data, showCacheInfo, theme, onToggleTheme, onToggleCacheInfo, onRefresh, onLock }: Props) {
  return (
    <div className="min-h-dvh bg-canvas text-default">
      <header className="sticky top-0 z-10 bg-neutral-10/80 dark:bg-neutral-90/80 backdrop-blur-xl border-b border-neutral-30 dark:border-neutral-80">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-85 border border-boundary flex items-center justify-center text-neutral-50 dark:text-neutral-40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight text-default">Command Center</h1>
              <p className="text-[10px] text-muted font-medium">TGP · Vista protegida</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onToggleTheme} className="w-8 h-8 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-85 flex items-center justify-center transition-colors" aria-label="Cambiar tema">
              {theme === 'light' ? <Moon size={16} className="text-neutral-60" /> : <Sun size={16} className="text-neutral-40" />}
            </button>
            <button onClick={onToggleCacheInfo} className="w-8 h-8 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-85 flex items-center justify-center transition-colors text-muted" aria-label="Info del snapshot">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
            </button>
            <button onClick={onLock} className="w-8 h-8 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-85 flex items-center justify-center transition-colors text-muted" aria-label="Bloquear">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </button>
          </div>
        </div>
      </header>

      {showCacheInfo && (
        <div className="mx-4 mt-3 p-3 bg-white dark:bg-neutral-85 rounded-xl border border-boundary text-xs text-muted space-y-1.5">
          <p className="flex items-center gap-2"><span className="text-neutral-70 dark:text-neutral-50 font-medium">Actualizado:</span><span>{formatDate(data.updatedAt)}</span></p>
          <p className="flex items-center gap-2"><span className="text-neutral-70 dark:text-neutral-50 font-medium">Versión snapshot:</span><span>v{data.version}</span></p>
          <button onClick={onRefresh} className="text-primary hover:text-primary-dark dark:hover:text-primary font-medium transition-colors">Refrescar datos</button>
        </div>
      )}

      <div className="px-4 pt-5 pb-8 space-y-5">
        <div className="bg-white dark:bg-neutral-85 rounded-2xl border border-boundary p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-widest">Health Index</span>
            <span className="text-[11px] font-mono text-muted">{data.applications} apps · {data.teams} equipos</span>
          </div>
          <div className="flex items-end gap-4">
            <div className="relative">
              <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-neutral-20 dark:text-neutral-80" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${(data.thi.score / 100) * 326.7} 326.7`} strokeLinecap="round" transform="rotate(-90 60 60)"
                  className={data.thi.score >= 70 ? 'text-success' : data.thi.score >= 50 ? 'text-warning' : 'text-danger'} />
                <text x="60" y="52" textAnchor="middle" className="fill-neutral-90 dark:fill-neutral-10" fontSize="26" fontWeight="700" fontFamily="ui-monospace, monospace">{data.thi.score}</text>
                <text x="60" y="68" textAnchor="middle" className="fill-neutral-50" fontSize="8" fontWeight="500">{data.thi.label}</text>
              </svg>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              {renderDimensionBar('Delivery', data.thi.scoreBreakdown.delivery)}
              {renderDimensionBar('Seguridad', data.thi.scoreBreakdown.security)}
              {renderDimensionBar('Disponibilidad', data.thi.scoreBreakdown.availability)}
              {renderDimensionBar('Obsolescencia', data.thi.scoreBreakdown.obsolescence)}
            </div>
          </div>
        </div>

        {data.alerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Alertas activas</span>
              <span className="text-xs font-mono text-muted bg-neutral-20 dark:bg-neutral-85 px-1.5 py-0.5 rounded-md">{data.alerts.length}</span>
            </div>
            <div className="space-y-1.5">
              {data.alerts.slice(0, 5).map((alert, i) => (
                <div key={i} className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border ${alert.type === 'critical' ? 'bg-danger/5 border-danger/10 text-danger' : alert.type === 'warning' ? 'bg-warning/5 border-warning/10 text-warning' : 'bg-info/5 border-info/10 text-info'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.type === 'critical' ? 'bg-danger' : alert.type === 'warning' ? 'bg-warning' : 'bg-info'}`} />
                  <p className="text-xs font-medium leading-relaxed">{alert.message}</p>
                </div>
              ))}
              {data.alerts.length > 5 && <p className="text-xs text-neutral-50 text-center pt-1">+{data.alerts.length - 5} alertas más</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Incidentes P1" value={data.incidents.p1} total={data.incidents.open} color={data.incidents.p1 > 0 ? 'danger' : 'success'}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>} />
          <MetricCard label="Bloqueos" value={data.blockers.critical} total={data.blockers.open} color={data.blockers.critical > 0 ? 'danger' : data.blockers.open > 0 ? 'warning' : 'success'}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>} />
          <MetricCard label="Vulnerabilidades" value={data.vulnerabilities.critical} total={data.vulnerabilities.high} color={data.vulnerabilities.critical > 0 ? 'danger' : data.vulnerabilities.high > 0 ? 'warning' : 'success'}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>} />
          <MetricCard label="Riesgos" value={data.risks.critical} total={data.risks.high} color={data.risks.critical > 0 ? 'danger' : data.risks.high > 0 ? 'warning' : 'success'}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4m0 4h.01" /></svg>} />
        </div>

        <div className="space-y-2">
          <StatusRow label="Planes en riesgo" value={data.plans.atRisk} total={data.plans.active} color={data.plans.atRisk > 0 ? 'warning' : 'success'} />
          <StatusRow label="Planes vencidos" value={data.plans.overdue} total={data.plans.active} color={data.plans.overdue > 0 ? 'danger' : 'success'} />
          <StatusRow label="Compromisos vencidos" value={data.commitments.overdue} total={data.commitments.total} color={data.commitments.overdue > 0 ? 'danger' : 'success'} />
        </div>

        {data.objectives.items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-50"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">OKRs activos</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[10px] font-mono text-success">{data.objectives.onTrack} On track</span>
                <span className="text-neutral-30 dark:text-neutral-70">·</span>
                <span className="text-[10px] font-mono text-warning">{data.objectives.atRisk} En riesgo</span>
                {data.objectives.behind > 0 && <><span className="text-neutral-30 dark:text-neutral-70">·</span><span className="text-[10px] font-mono text-danger">{data.objectives.behind} Behind</span></>}
              </div>
            </div>
            <div className="space-y-2">
              {data.objectives.items.slice(0, 5).map((okr) => (
                <div key={okr.id} className="bg-white dark:bg-neutral-85 rounded-xl border border-boundary p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-default truncate flex-1 mr-2">{okr.title}</p>
                    <span className={`text-[10px] font-mono ${okr.status === 'on_track' ? 'text-success' : okr.status === 'at_risk' ? 'text-warning' : 'text-danger'}`}>{okr.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-20 dark:bg-neutral-80 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${okr.progress >= 80 ? 'bg-success' : okr.progress >= 50 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${okr.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.blockers.list.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Bloqueos críticos</span>
              <span className="text-xs font-mono text-muted bg-neutral-20 dark:bg-neutral-85 px-1.5 py-0.5 rounded-md">{data.blockers.list.length}</span>
            </div>
            <div className="space-y-1.5">
              {data.blockers.list.map((b) => (
                <div key={b.id} className="flex items-start gap-2.5 px-3.5 py-2.5 bg-danger/5 border border-danger/10 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 shrink-0" />
                  <p className="text-xs font-medium text-danger leading-relaxed">{b.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-[10px] text-neutral-50 pt-4 border-t border-neutral-30 dark:border-neutral-80 space-y-1">
          <p>TGP — Technology Governance Platform</p>
          <p>Datos sincronizados desde escritorio vía Azure Blob Storage</p>
          <p className="text-neutral-60 dark:text-neutral-50">Cifrado AES-GCM 256 · Extremo a extremo</p>
        </div>
      </div>
    </div>
  )
}
