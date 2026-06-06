import { useState, useEffect, useCallback, startTransition } from 'react'
import { generateReport, type ReportSection } from '@/services/reports/pdfService'
import { generateExcel } from '@/services/reports/excelService'
import * as reportData from '@/services/reports/reportDataService'
import { Loader2, FileText, Download, AlertTriangle, TrendingUp, Bug, ShieldHalf, GitBranch, Goal, ClipboardCheck, Package, FileSpreadsheet } from 'lucide-react'

interface TabDef {
  id: string
  label: string
  icon: React.ReactNode
  fetcher: () => Promise<{
    title: string
    filename: string
    summary: { label: string; value: string; color: string }[]
    sections: ReportSection[]
  }>
}

const tabs: TabDef[] = [
  { id: 'obsolescencia', label: 'Obsolescencia', icon: <Package className="w-4 h-4" />, fetcher: reportData.getObsolescenceReport },
  { id: 'rendimiento', label: 'Rendimiento', icon: <TrendingUp className="w-4 h-4" />, fetcher: reportData.getPerformanceReport },
  { id: 'incidentes', label: 'Incidentes', icon: <Bug className="w-4 h-4" />, fetcher: reportData.getIncidentsReport },
  { id: 'vulnerabilidades', label: 'Vulnerabilidades', icon: <ShieldHalf className="w-4 h-4" />, fetcher: reportData.getVulnerabilitiesReport },
  { id: 'predictibilidad', label: 'Predictibilidad', icon: <GitBranch className="w-4 h-4" />, fetcher: reportData.getSprintPredictabilityReport },
  { id: 'riesgos', label: 'Riesgos', icon: <AlertTriangle className="w-4 h-4" />, fetcher: reportData.getRisksReport },
  { id: 'auditoria', label: 'Auditoría', icon: <ClipboardCheck className="w-4 h-4" />, fetcher: reportData.getAuditReport },
  { id: 'entregables', label: 'Entregables', icon: <Goal className="w-4 h-4" />, fetcher: reportData.getDeliverablesReport },
]

const colorMap: Record<string, string> = {
  '#2563eb': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  '#6366f1': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  '#16a34a': 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  '#ca8a04': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  '#dc2626': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  '#ea580c': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  '#94a3b8': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Awaited<ReturnType<typeof reportData.getObsolescenceReport>> | null>(null)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  const activeTabDef = tabs.find((t) => t.id === activeTab)!

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await activeTabDef.fetcher()
      setData(result)
    } catch (err) {
      console.error('Error loading report data:', err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [activeTabDef])

  useEffect(() => {
    startTransition(() => { loadData() })
  }, [loadData])

  const handleExportPDF = () => {
    if (!data) return
    setExportingPDF(true)
    try {
      const pdf = generateReport(data.filename, data.title, data.sections, data.summary)
      pdf.save()
    } catch (err) {
      console.error('Error generating PDF:', err)
    } finally {
      setExportingPDF(false)
    }
  }

  const handleExportExcel = () => {
    if (!data) return
    setExportingExcel(true)
    try {
      const xlsxName = data.filename.replace(/\.pdf$/, '.xlsx')
      generateExcel(xlsxName, data.title, data.sections, data.summary)
    } catch (err) {
      console.error('Error generating Excel:', err)
    } finally {
      setExportingExcel(false)
    }
  }

  const severityBadge = (value: string) => {
    const lower = value.toLowerCase()
    if (lower === 'eol' || lower === 'critical') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    if (lower === 'extended' || lower === 'high') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    if (lower === 'medium') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (lower === 'low' || lower === 'active') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (lower === 'info') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-20 dark:border-neutral-70">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-neutral-90 dark:text-neutral-10">Reportes</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={!data || exportingExcel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exportingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {exportingExcel ? 'Generando...' : 'Exportar Excel'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!data || exportingPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exportingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exportingPDF ? 'Generando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-85 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-60 dark:text-neutral-30 hover:text-neutral-90 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-48 text-neutral-50 dark:text-neutral-40">
            No se pudieron cargar los datos.
          </div>
        ) : (
          <div className="space-y-6">
            {data.summary && data.summary.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.summary.map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-4 ${colorMap[item.color || '#2563eb'] || colorMap['#2563eb']}`}
                  >
                    <div className="text-xs font-medium opacity-70 dark:text-white/70 mb-1">{item.label}</div>
                    <div className="text-2xl font-bold dark:text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {data.sections.map((section, si) => (
              <div key={si} className="bg-white dark:bg-neutral-80 rounded-lg border border-neutral-20 dark:border-neutral-70">
                  <div className="px-5 py-3 border-b border-neutral-20 dark:border-neutral-70">
                    <h3 className="text-sm font-semibold text-neutral-80 dark:text-white">{section.title}</h3>
                  <p className="text-xs text-neutral-50 dark:text-neutral-40 mt-0.5">{section.rows.length} registros</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-85">
                        {section.columns.map((col, ci) => (
                          <th
                            key={ci}
                            className={`px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-30 uppercase tracking-wider ${
                              col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                            }`}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
                      {section.rows.length === 0 ? (
                        <tr>
                          <td colSpan={section.columns.length} className="px-4 py-8 text-center text-neutral-40 dark:text-neutral-30">
                            No hay datos disponibles.
                          </td>
                        </tr>
                      ) : (
                        section.rows.map((row, ri) => (
                          <tr key={ri} className="hover:bg-neutral-10 dark:hover:bg-neutral-85 transition-colors">
                            {section.columns.map((col, ci) => {
                              const val = row[col.dataKey]
                              const display = val != null ? String(val) : '-'
                              const isSeverityCol = col.dataKey === 'severidad' || col.dataKey === 'estado' || col.dataKey === 'cvss'
                              return (
                                <td
                                  key={ci}
                                  className={`px-4 py-2.5 text-sm text-neutral-70 dark:text-white ${
                                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                  }`}
                                >
                                  {isSeverityCol ? (
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${severityBadge(display)}`}>
                                      {display}
                                    </span>
                                  ) : (
                                    display
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
