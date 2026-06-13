import { useState } from 'react'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { seedDemoData } from '@/services/demo/seedData'
import { useNavigate } from 'react-router-dom'
import { Upload, Trash2, FileSpreadsheet, RefreshCw, Shield, Download, Users, BarChart3 } from 'lucide-react'
import { syncTechnologies } from '@/services/sync/endoflifeSyncService'
import { useConfirm } from '@/hooks/useConfirm'
import { getSecret, verifyTotp } from '@/services/auth/authService'
import { encryptField } from '@/services/crypto/fieldCipher'
import type { SyncResult } from '@/services/sync/endoflifeSyncService'
import { AzureBackupConfig } from '@/features/admin/components/AzureBackupConfig'
import { JobSchedulerConfig } from '@/features/admin/components/JobSchedulerConfig'
import { JiraConfigPanel } from '@/components/jira/JiraConfigPanel'
import { FluidAttackImportPanel } from '@/features/admin/components/FluidAttackImportPanel'
import { cn } from '@/lib/utils'

export function AdminPage() {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [showTotpDialog, setShowTotpDialog] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [totpError, setTotpError] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [dbStats, setDbStats] = useState<{ name: string; count: number }[]>([])
  const [loadingStats, setLoadingStats] = useState(false)

  const handleReAuthExport = async () => {
    const secret = await getSecret()
    if (!secret) { addNotification({ type: 'error', message: 'No hay configuración de seguridad.' }); return }
    setTotpCode(''); setTotpError(''); setShowTotpDialog(true)
  }

  const handleConfirmExport = async () => {
    const secret = await getSecret()
    if (!secret) return
    if (!verifyTotp(totpCode, secret)) { setTotpError('Código inválido.'); return }
    setShowTotpDialog(false); setTotpCode(''); setTotpError('')
    await handleExport()
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const [apps, findings] = await Promise.all([
        db.applications.toArray(), db.auditFindings.toArray(),
      ])
      const encApps = await Promise.all(apps.map(async (a) => ({ ...a, name: await encryptField(a.name), description: a.description ? await encryptField(a.description) : '' })))
      const encFindings = await Promise.all(findings.map(async (f) => ({ ...f, title: await encryptField(f.title), description: f.description ? await encryptField(f.description) : '' })))
      const data = {
        tenants: await db.tenants.toArray(), businessUnits: await db.businessUnits.toArray(),
        applications: encApps, technologies: await db.technologies.toArray(),
        vulnerabilities: await db.vulnerabilities.toArray(), incidents: await db.incidents.toArray(),
        risks: await db.risks.toArray(), auditFindings: encFindings,
        teams: await db.teams.toArray(), objectives: await db.objectives.toArray(),
        healthIndexHistory: await db.healthIndexHistory.toArray(), users: await db.users.toArray(),
        exportedAt: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob); const a = document.createElement('a')
      a.href = url; a.download = `tgp-backup-${new Date().toISOString().split('T')[0]}.json`; a.click()
      URL.revokeObjectURL(url)
      addNotification({ type: 'success', message: 'Datos exportados correctamente' })
    } catch { addNotification({ type: 'error', message: 'Error al exportar datos' }) }
    finally { setIsExporting(false) }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setIsImporting(true)
    try {
      const data = JSON.parse(await file.text())
      if (await confirm('Esto sobrescribirá TODOS los datos existentes. ¿Continuar?')) {
        await db.transaction('rw', db.tables, async () => {
          await Promise.all(db.tables.map((t) => t.clear()))
          for (const key of Object.keys(data)) {
            const table = db.tables.find((t) => t.name === key)
            if (table && data[key].length) await table.bulkAdd(data[key])
          }
        })
        addNotification({ type: 'success', message: 'Datos importados correctamente' })
      }
    } catch { addNotification({ type: 'error', message: 'Error al importar datos' }) }
    finally { setIsImporting(false); e.target.value = '' }
  }

  const handleClearData = async () => {
    if (await confirm('¿Eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      await Promise.all(db.tables.map((t) => t.clear()))
      addNotification({ type: 'success', message: 'Todos los datos han sido eliminados' })
    }
  }

  const handleSeedData = async () => {
    const stats = await Promise.all(db.tables.map((t) => t.count()))
    if (stats.some((c) => c > 0) && !(await confirm('Hay datos. ¿Sobrescribir con datos demo?'))) return
    await seedDemoData()
    addNotification({ type: 'success', message: 'Datos de demo cargados' })
  }

  const handleSyncTechnologies = async () => {
    setIsSyncing(true); setSyncResult(null)
    try {
      const result = await syncTechnologies()
      setSyncResult(result)
      addNotification({ type: 'success', message: `Sincronización: ${result.updated} actualizadas, ${result.notFound} sin datos, ${result.errors} errores` })
    } catch { addNotification({ type: 'error', message: 'Error al sincronizar' }) }
    finally { setIsSyncing(false) }
  }

  const handleShowStats = async () => {
    if (showStats) { setShowStats(false); return }
    setLoadingStats(true)
    const stats = await Promise.all(db.tables.map(async (t) => ({ name: t.name, count: await t.count() })))
    setDbStats(stats)
    setShowStats(true)
    setLoadingStats(false)
  }

  return (
    <div className="space-y-6">

      {/* Grid de acciones rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ActionCard icon={<Shield size={20} />} label="Exportar datos" desc="Cifrado + TOTP" color="primary" onClick={handleReAuthExport} disabled={isExporting} />
        <ActionCard icon={<FileSpreadsheet size={20} />} label="Importar Excel" desc="Carga masiva .xlsx" color="primary" onClick={() => navigate('/admin/import')} />
        <ActionCard icon={<Upload size={20} />} label="Importar JSON" desc="Restaurar backup" color="primary" onClick={() => document.getElementById('import-json')?.click()} />
        <ActionCard icon={<Download size={20} />} label="Cargar demo" desc="Datos de ejemplo" color="success" onClick={handleSeedData} />
        <ActionCard icon={<RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />} label="Sincronizar EOL" desc={syncResult ? `${syncResult.updated} actualizadas` : 'endoflife.date'} color="info" onClick={handleSyncTechnologies} disabled={isSyncing} />
        <ActionCard icon={<Users size={20} />} label="Usuarios" desc="Gestionar accesos" color="primary" onClick={() => navigate('/admin/users')} />
        <ActionCard icon={<BarChart3 size={20} />} label="Estadísticas BD" desc="Registros por tabla" color="info" onClick={handleShowStats} />
        <ActionCard icon={<Trash2 size={20} />} label="Limpiar BD" desc="Eliminar todo" color="danger" onClick={handleClearData} />
        <input id="import-json" type="file" accept=".json" onChange={handleImport} disabled={isImporting} className="hidden" />
      </div>

      {loadingStats && (
        <div className="text-sm text-neutral-50 text-center py-3 animate-pulse">Cargando estadísticas...</div>
      )}

      {showStats && !loadingStats && (
        <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white">Base de Datos</h3>
            <span className="text-xs text-neutral-50">{dbStats.reduce((s, t) => s + t.count, 0).toLocaleString()} registros</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-1.5">
            {dbStats.filter((s) => s.count > 0).sort((a, b) => b.count - a.count).map((s) => (
              <div key={s.name} className="flex items-center justify-between py-1.5 border-b border-neutral-10 dark:border-neutral-85">
                <span className="text-xs text-neutral-60 dark:text-neutral-40 truncate mr-2">{s.name.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-xs font-bold text-neutral-90 dark:text-white tabular-nums shrink-0">{s.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuraciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-sm p-5">
          <JobSchedulerConfig />
        </div>
        <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-sm p-5">
          <AzureBackupConfig />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-sm p-5">
        <JiraConfigPanel />
      </div>

      <FluidAttackImportPanel />

      {/* TOTP dialog */}
      {showTotpDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-primary" />
              <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">Verificar identidad</h3>
            </div>
            <p className="text-sm text-neutral-60 dark:text-neutral-40">Ingresa el código de 6 dígitos de tu autenticador.</p>
            <input type="text" inputMode="numeric" autoFocus maxLength={6} value={totpCode}
              onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setTotpError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmExport() }}
              className="w-full px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="000000" />
            {totpError && <p className="text-sm text-danger">{totpError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowTotpDialog(false)} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">Cancelar</button>
              <button onClick={handleConfirmExport} disabled={totpCode.length !== 6} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50">Verificar y Exportar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionCard({ icon, label, desc, color, onClick, disabled }: {
  icon: React.ReactNode; label: string; desc: string; color: string; onClick?: () => void; disabled?: boolean
}) {
  const colors: Record<string, string> = {
    primary: 'border-primary/20 hover:bg-primary/5 hover:border-primary/30 text-primary',
    success: 'border-success/20 hover:bg-success/5 hover:border-success/30 text-success',
    danger: 'border-danger/20 hover:bg-danger/5 hover:border-danger/30 text-danger',
    info: 'border-info/20 hover:bg-info/5 hover:border-info/30 text-info',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-2 p-5 rounded-2xl border bg-white dark:bg-neutral-80 transition-all duration-200 disabled:opacity-50',
        colors[color] ?? colors.primary,
        onClick && !disabled && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
      )}>
      <div className="p-2.5 rounded-xl bg-current/10">{icon}</div>
      <p className="text-sm font-semibold text-center leading-tight">{label}</p>
      <p className="text-[11px] text-center opacity-60 leading-tight">{desc}</p>
    </button>
  )
}
