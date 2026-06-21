import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft, X, Shield, AlertTriangle, Users, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button';

export function ComparePage() {
  const navigate = useNavigate()
  const allApps = useLiveQuery(() => db.applications.toArray()) ?? []
  const allVulns = useLiveQuery(() => db.vulnerabilities.toArray()) ?? []
  const allRisks = useLiveQuery(() => db.risks.toArray()) ?? []
  const allTeams = useLiveQuery(() => db.teams.toArray()) ?? []
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const apps = useMemo(() => allApps.filter((a) => selectedIds.includes(a.id)), [allApps, selectedIds])

  const toggleApp = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    )
  }

  const getAppVulns = (appId: string) => allVulns.filter((v) => v.applicationId === appId)
  const getAppRisks = (appId: string) => allRisks.filter((r) => r.applicationId === appId)
  const getAppTeams = (appId: string) => allTeams.filter((t) => t.businessUnitId === allApps.find((a) => a.id === appId)?.businessUnitId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="p-2">
          <ArrowLeft size={20} className="text-neutral-60" />
        </Button>
        <h1 className="text-lg font-semibold text-neutral-90 dark:text-white">Comparar Aplicaciones</h1>
      </div>

      <div className="bg-card rounded-2xl border border-boundary p-5">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
          Selecciona aplicaciones para comparar ({selectedIds.length}/4)
        </h2>
        <div className="flex flex-wrap gap-2">
          {allApps.map((app) => (
            <Button
              key={app.id}
              onClick={() => toggleApp(app.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                selectedIds.includes(app.id)
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-white dark:bg-neutral-85 border-neutral-30 dark:border-neutral-60 text-secondary hover:border-primary/30'
              )}
            >
              {app.name}
              {selectedIds.includes(app.id) && <X size={14} />}
            </Button>
          ))}
          {allApps.length === 0 && (
            <p className="text-sm text-neutral-50 py-2">No hay aplicaciones registradas</p>
          )}
        </div>
      </div>

      {apps.length >= 2 && (
        <div className="overflow-x-auto">
          <table className="w-full bg-card rounded-2xl border border-boundary shadow-sm">
            <thead>
              <tr className="border-b border-boundary">
                <th className="text-left p-4 text-sm font-semibold text-muted w-48">Métrica</th>
                {apps.map((app) => (
                  <th key={app.id} className="p-4 text-sm font-semibold text-neutral-90 dark:text-white min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-primary" />
                      {app.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-10 dark:divide-neutral-75">
              <CompareRow label="Criticidad" values={apps.map((a) => a.criticality)} />
              <CompareRow label="Estado" values={apps.map((a) => a.status)} />
              <CompareRow label="Arquitectura" values={apps.map((a) => a.architecture)} />
              <CompareRow label="Owner" values={apps.map((a) => a.ownerName || '—')} />
              <CompareRow
                label="Tecnologías"
                values={apps.map((a) => `${a.technologies.length} registradas`)}
              />
              <CompareRow
                label="Vulnerabilidades"
                values={apps.map((a) => {
                  const vulns = getAppVulns(a.id)
                  const critical = vulns.filter((v) => v.severity === 'critical' && v.status !== 'fixed').length
                  return `${vulns.length} total · ${critical} críticas`
                })}
                icon={<Shield size={14} />}
              />
              <CompareRow
                label="Riesgos"
                values={apps.map((a) => {
                  const risks = getAppRisks(a.id)
                  const open = risks.filter((r) => r.status === 'open')
                  return `${risks.length} total · ${open.length} abiertos`
                })}
                icon={<AlertTriangle size={14} />}
              />
              <CompareRow
                label="Equipos vinculados"
                values={apps.map((a) => String(getAppTeams(a.id).length))}
                icon={<Users size={14} />}
              />
            </tbody>
          </table>
        </div>
      )}

      {apps.length < 2 && selectedIds.length > 0 && (
        <div className="text-center py-12 bg-card rounded-2xl border border-boundary">
          <p className="text-neutral-50">Selecciona al menos 2 aplicaciones para ver la comparación</p>
        </div>
      )}
    </div>
  )
}

function CompareRow({ label, values, icon }: { label: string; values: string[]; icon?: React.ReactNode }) {
  const allSame = values.every((v) => v === values[0])
  return (
    <tr className="hover:bg-neutral-5 dark:hover:bg-neutral-75 transition-colors">
      <td className="p-4 text-sm font-medium text-muted flex items-center gap-2">
        {icon}
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className={cn('p-4 text-sm', allSame ? 'text-neutral-90 dark:text-white' : '')}>
          {v}
        </td>
      ))}
    </tr>
  )
}
