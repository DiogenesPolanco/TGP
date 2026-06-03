import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { Plus, Search, FileWarning, CheckCircle, Clock } from 'lucide-react'
import { AuditForm } from '../components/AuditForm'
import type { AuditFinding } from '@/types/domain'

export function AuditPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingFinding, setEditingFinding] = useState<AuditFinding | null>(null)
  const { addNotification } = useAppStore()

  const findings = useLiveQuery(() => db.auditFindings.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const filteredFindings = findings.filter((f) =>
    f.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar hallazgo?')) {
      await db.auditFindings.delete(id)
      addNotification({ type: 'success', message: 'Hallazgo eliminado' })
    }
  }

  const stats = {
    total: findings.length,
    open: findings.filter((f) => f.status === 'open' || f.status === 'in_progress').length,
    overdue: findings.filter((f) => f.status === 'overdue').length,
    closed: findings.filter((f) => f.status === 'closed' || f.status === 'resolved').length,
  }

  const getSlaStatus = (dueDate: Date) => {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { label: 'Vencido', color: 'text-danger' }
    if (days <= 7) return { label: `${days}d`, color: 'text-warning' }
    return { label: `${days}d`, color: 'text-success' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Auditoría</h2>
        <button
          onClick={() => { setEditingFinding(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nuevo Hallazgo
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<FileWarning size={20} />} label="Total" value={stats.total} color="text-primary" />
        <StatCard icon={<Clock size={20} />} label="Abiertos" value={stats.open} color="text-warning" />
        <StatCard icon={<FileWarning size={20} />} label="Vencidos" value={stats.overdue} color="text-danger" />
        <StatCard icon={<CheckCircle size={20} />} label="Cerrados" value={stats.closed} color="text-success" />
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder="Buscar hallazgos..."
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
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Referencia</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Título</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">App</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Severidad</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Vencimiento</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {filteredFindings.map((finding) => {
              const sla = getSlaStatus(finding.dueDate)
              const app = applications.find((a) => a.id === finding.applicationId)
              return (
                <tr key={finding.id} className="hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-90 dark:text-white">{finding.auditReference}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-neutral-90 dark:text-white">{finding.title}</p>
                    <p className="text-xs text-neutral-50 dark:text-neutral-50">{finding.category}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{app?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      finding.severity === 'critical' ? 'bg-danger/10 text-danger' :
                      finding.severity === 'high' ? 'bg-warning/10 text-warning' :
                      finding.severity === 'medium' ? 'bg-info/10 text-info' :
                      'bg-success/10 text-success'
                    }`}>
                      {finding.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      finding.status === 'open' ? 'bg-danger/10 text-danger' :
                      finding.status === 'in_progress' ? 'bg-info/10 text-info' :
                      finding.status === 'overdue' ? 'bg-danger/10 text-danger' :
                      'bg-success/10 text-success'
                    }`}>
                      {finding.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${sla.color}`}>{sla.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingFinding(finding); setShowForm(true) }}
                        className="text-sm text-primary hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(finding.id)}
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
        {filteredFindings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-50 dark:text-neutral-50">No se encontraron hallazgos</p>
          </div>
        )}
      </div>

      {showForm && (
        <AuditForm
          finding={editingFinding}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false)
            setEditingFinding(null)
            addNotification({ type: 'success', message: editingFinding ? 'Hallazgo actualizado' : 'Hallazgo creado' })
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
