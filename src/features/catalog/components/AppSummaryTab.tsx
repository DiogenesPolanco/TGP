import {
  Shield,
  AlertTriangle,
  Activity,
  FileWarning,
  Server,
  Database,
  Package,
  Building2,
} from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { QuickLinkCard } from '../components/QuickLinkCard'
import {
  criticalityLabel,
  criticalityColor,
  appStatusLabel,
  statusColor,
} from '../constants/applicationConstants'
import type { Application, Technology } from '@/types/domain'

interface AppSummaryTabProps {
  application: Application
  buName?: string
  appTechnologies: Technology[]
  activeVulnCount: number
  risksCount: number
  incidentsCount: number
  findingsCount: number
  microservicesCount: number
  databasesCount: number
  deliverablesCount: number
  onNavigateTab: (tab: string) => void
}

export function AppSummaryTab({
  application,
  buName,
  appTechnologies,
  activeVulnCount,
  risksCount,
  incidentsCount,
  findingsCount,
  microservicesCount,
  databasesCount,
  deliverablesCount,
  onNavigateTab,
}: AppSummaryTabProps) {
  return (
    <div className="space-y-8">
      {/* ── Información General ── */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white mb-6">Resumen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(
            [
              ['Nombre', application.name, 'text-primary'],
              ['Owner', application.ownerName, 'text-neutral-90 dark:text-white'],
              ['Business Unit', buName || '-', 'text-neutral-90 dark:text-white'],
              ['Arquitectura', application.architecture, 'text-neutral-90 dark:text-white'],
              [
                'Estado',
                appStatusLabel[application.status],
                `inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[application.status]}`,
              ],
              [
                'Criticidad',
                criticalityLabel[application.criticality],
                `inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${criticalityColor[application.criticality]}`,
              ],
              ...(application.supportEndDate
                ? [
                    [
                      'Fin de Soporte',
                      new Date(application.supportEndDate).toLocaleDateString('es-ES'),
                      'text-neutral-90 dark:text-white',
                    ],
                  ]
                : []),
            ] as [string, string, string][]
          ).map(([label, value, className]) => (
            <div
              key={label}
              className="bg-neutral-10 dark:bg-neutral-70/40 rounded-lg border border-boundary p-4"
            >
              <dt className="text-[11px] font-medium text-neutral-50 uppercase tracking-wider mb-1.5">
                {label}
              </dt>
              <dd className={`text-sm font-semibold ${className}`}>{value}</dd>
            </div>
          ))}
        </div>
      </div>

      {/* ── Métricas ── */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider mb-4">
          Métricas de Seguridad y Riesgo
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Shield}
            label="Vulnerabilidades"
            value={activeVulnCount}
            color="text-danger"
            bg="bg-danger/5 border-danger/20"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Riesgos"
            value={risksCount}
            color="text-warning"
            bg="bg-warning/5 border-warning/20"
          />
          <MetricCard
            icon={Activity}
            label="Incidentes"
            value={incidentsCount}
            color="text-info"
            bg="bg-info/5 border-info/20"
          />
          <MetricCard
            icon={FileWarning}
            label="Hallazgos"
            value={findingsCount}
            color="text-neutral-60"
            bg="bg-neutral-10 dark:bg-neutral-70/40 border-boundary"
          />
        </div>
      </div>

      {/* ── Tech Stack Preview ── */}
      {appTechnologies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider">
              Stack Tecnológico
            </h3>
            <button
              onClick={() => onNavigateTab('tech')}
              className="text-xs text-primary hover:text-primary-dark transition-colors font-medium"
            >
              Gestionar →
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {appTechnologies.slice(0, 10).map((tech) => (
              <span
                key={tech.id}
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border ${
                  tech.supportStatus === 'eol'
                    ? 'bg-danger/5 text-danger border-danger/20'
                    : tech.supportStatus === 'extended'
                      ? 'bg-warning/5 text-warning border-warning/20'
                      : 'bg-success/5 text-success border-success/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    tech.supportStatus === 'eol'
                      ? 'bg-danger'
                      : tech.supportStatus === 'extended'
                        ? 'bg-warning'
                        : 'bg-success'
                  }`}
                />
                {tech.name}
                <span className="opacity-50 text-xs">{tech.version}</span>
              </span>
            ))}
            {appTechnologies.length > 10 && (
              <span className="text-sm text-neutral-50 self-center ml-1">
                +{appTechnologies.length - 10} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Acceso Rápido ── */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider mb-4">
          Explorar
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickLinkCard
            icon={Server}
            label="Microservicios"
            value={microservicesCount}
            onClick={() => onNavigateTab('microservices')}
          />
          <QuickLinkCard
            icon={Database}
            label="Bases de Datos"
            value={databasesCount}
            onClick={() => onNavigateTab('databases')}
          />
          <QuickLinkCard
            icon={Package}
            label="Entregables"
            value={deliverablesCount}
            onClick={() => onNavigateTab('deliverables')}
          />
          <QuickLinkCard
            icon={Building2}
            label="Arquitectura"
            value={`${microservicesCount} cont.`}
            onClick={() => onNavigateTab('architecture')}
          />
        </div>
      </div>
    </div>
  )
}
