import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { Plus, Search, Shield, AlertTriangle, Clock } from 'lucide-react'
import { VulnerabilityForm } from '../components/VulnerabilityForm'
import type { Vulnerability } from '@/types/domain'

export function VulnerabilitiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingVuln, setEditingVuln] = useState<Vulnerability | null>(null)
  const { addNotification } = useAppStore()

  const vulnerabilities = useLiveQuery(() => db.vulnerabilities.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const filteredVulns = vulnerabilities.filter((v) =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar vulnerabilidad?')) {
      await db.vulnerabilities.delete(id)
      addNotification({ type: 'success', message: 'Vulnerabilidad eliminada' })
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-danger/10 text-danger',
      high: 'bg-warning/10 text-warning',
      medium: 'bg-info/10 text-info',
      low: 'bg-success/10 text-success',
      info: 'bg-neutral-10 text-neutral-60',
    }
    return colors[severity] || 'bg-neutral-10 text-neutral-60'
  }

  const getSlaStatus = (slaDeadline: Date) => {
    const days = Math.ceil((new Date(slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { label: 'Vencido', color: 'text-danger' }
    if (days <= 7) return { label: `${days}d`, color: 'text-warning' }
    return { label: `${days}d`, color: 'text-success' }
  }

  const stats = {
    total: vulnerabilities.length,
    critical: vulnerabilities.filter((v) => v.severity === 'critical' && v.status !== 'fixed').length,
    high: vulnerabilities.filter((v) => v.severity === 'high' && v.status !== 'fixed').length,
    slaBreached: vulnerabilities.filter((v) => v.status !== 'fixed' && new Date(v.slaDeadline) < new Date()).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Vulnerabilidades</h2>
        <button
          onClick={() => { setEditingVuln(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nueva Vulnerabilidad
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Shield size={20} />} label="Total" value={stats.total} color="text-primary" />
        <StatCard icon={<AlertTriangle size={20} />} label="Críticas" value={stats.critical} color="text-danger" />
        <StatCard icon={<AlertTriangle size={20} />} label="Altas" value={stats.high} color="text-warning" />
        <StatCard icon={<Clock size={20} />} label="SLA Vencido" value={stats.slaBreached} color="text-danger" />
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder="Buscar vulnerabilidades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-80">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Título</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">App</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">CVSS</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Severidad</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">SLA</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {filteredVulns.map((vuln) => {
              const sla = getSlaStatus(vuln.slaDeadline)
              const app = applications.find((a) => a.id === vuln.applicationId)
              return (
                <tr key={vuln.id} className="hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-neutral-90 dark:text-white">{vuln.title}</p>
                    <p className="text-xs text-neutral-50 dark:text-neutral-50">{vuln.externalId}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{app?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-90 dark:text-white">{vuln.cvssScore}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(vuln.severity)}`}>
                      {vuln.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      vuln.status === 'fixed' ? 'bg-success/10 text-success' :
                      vuln.status === 'in_progress' ? 'bg-info/10 text-info' :
                      vuln.status === 'accepted' ? 'bg-neutral-10 text-neutral-60' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {vuln.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${sla.color}`}>{sla.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingVuln(vuln); setShowForm(true) }}
                        className="text-sm text-primary hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(vuln.id)}
                        className="text-sm text-danger hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredVulns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-50 dark:text-neutral-50">No se encontraron vulnerabilidades</p>
          </div>
        )}
      </div>

      {showForm && (
        <VulnerabilityForm
          vulnerability={editingVuln}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false)
            setEditingVuln(null)
            addNotification({ type: 'success', message: editingVuln ? 'Vulnerabilidad actualizada' : 'Vulnerabilidad creada' })
          }}
        />
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </div>
  )
}
