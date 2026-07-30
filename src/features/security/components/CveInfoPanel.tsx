import { useState, useEffect } from 'react'
import { ExternalLink, Shield, Calendar, Building2, FileText, RefreshCw, AlertCircle } from 'lucide-react'
import { lookupCve, type CveData } from '@/services/security/cveService'

interface CveInfoPanelProps {
  cveId: string
}

export function CveInfoPanel({ cveId }: CveInfoPanelProps) {
  const [data, setData] = useState<CveData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    lookupCve(cveId).then((result) => {
      if (cancelled) return
      setData(result.data)
      setError(result.error)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [cveId])

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-boundary p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-default">
          <Shield size={16} className="text-primary" />
          <span>{cveId}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <RefreshCw size={12} className="animate-spin" />
          Consultando MITRE CVE API...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-boundary p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-default">
          <Shield size={16} className="text-muted" />
          <span>{cveId}</span>
        </div>
        <div className="flex items-start gap-1.5 text-xs text-muted">
          <AlertCircle size={12} className="shrink-0 mt-0.5 text-warning" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-card rounded-xl border border-boundary p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-default">
          <Shield size={16} className="text-primary" />
          <span>{data.cveId}</span>
        </div>
        <a
          href={`https://nvd.nist.gov/vuln/detail/${data.cveId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark transition-colors"
        >
          <ExternalLink size={12} />
          NVD
        </a>
      </div>

      <div className="space-y-2">
        {data.datePublic && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar size={12} className="shrink-0 text-muted" />
            <span className="text-muted font-medium">Publicado:</span>
            <span className="text-default">
              {new Date(data.datePublic).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}

        {data.assignerShortName && (
          <div className="flex items-center gap-2 text-xs">
            <Building2 size={12} className="shrink-0 text-muted" />
            <span className="text-muted font-medium">Asignador:</span>
            <span className="text-default">{data.assignerShortName}</span>
          </div>
        )}

        {data.description && (
          <div className="flex items-start gap-2 text-xs">
            <FileText size={12} className="shrink-0 text-muted mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-muted font-medium">Descripción:</span>
              <p className="text-default mt-0.5 leading-relaxed">{data.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
