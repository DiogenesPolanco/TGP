import { useState } from 'react'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { seedDemoData } from '@/services/demo/seedData'
import { useNavigate } from 'react-router-dom'
import { Upload, Database, Trash2, FileSpreadsheet, RefreshCw, Shield } from 'lucide-react'
import { syncTechnologies } from '@/services/sync/endoflifeSyncService'
import { useConfirm } from '@/hooks/useConfirm'
import { getSecret, verifyTotp } from '@/services/auth/authService'
import { encryptField } from '@/services/crypto/fieldCipher'
import type { SyncResult } from '@/services/sync/endoflifeSyncService'
import { AzureBackupConfig } from '@/features/admin/components/AzureBackupConfig'
import { JobSchedulerConfig } from '@/features/admin/components/JobSchedulerConfig'

export function AdminPage() {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  // TOTP re-auth for export
  const [showTotpDialog, setShowTotpDialog] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [totpError, setTotpError] = useState('')

  const handleReAuthExport = async () => {
    const secret = await getSecret()
    if (!secret) {
      addNotification({ type: 'error', message: 'No hay configuración de seguridad. Regístrate primero.' })
      return
    }
    setTotpCode('')
    setTotpError('')
    setShowTotpDialog(true)
  }

  const handleConfirmExport = async () => {
    const secret = await getSecret()
    if (!secret) return

    if (!verifyTotp(totpCode, secret)) {
      setTotpError('Código inválido. Intenta de nuevo.')
      return
    }

    setShowTotpDialog(false)
    setTotpCode('')
    setTotpError('')
    await handleExport()
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const [applications, auditFindings] = await Promise.all([
        db.applications.toArray(),
        db.auditFindings.toArray(),
      ])

      // Encrypt sensitive business fields before export
      const encryptedApplications = await Promise.all(
        applications.map(async (app) => ({
          ...app,
          name: await encryptField(app.name),
          description: app.description ? await encryptField(app.description) : '',
        }))
      )
      const encryptedFindings = await Promise.all(
        auditFindings.map(async (f) => ({
          ...f,
          title: await encryptField(f.title),
          description: f.description ? await encryptField(f.description) : '',
        }))
      )

      const data = {
        tenants: await db.tenants.toArray(),
        businessUnits: await db.businessUnits.toArray(),
        applications: encryptedApplications,
        technologies: await db.technologies.toArray(),
        vulnerabilities: await db.vulnerabilities.toArray(),
        incidents: await db.incidents.toArray(),
        risks: await db.risks.toArray(),
        auditFindings: encryptedFindings,
        teams: await db.teams.toArray(),
        objectives: await db.objectives.toArray(),
        healthIndexHistory: await db.healthIndexHistory.toArray(),
        users: await db.users.toArray(),
        exportedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tgp-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      addNotification({ type: 'success', message: 'Datos exportados correctamente' })
    } catch {
      addNotification({ type: 'error', message: 'Error al exportar datos' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (await confirm('Esto sobrescribirá todos los datos existentes. ¿Continuar?')) {
        await db.transaction('rw', db.tables, async () => {
          await Promise.all(db.tables.map((table) => table.clear()))
          if (data.tenants) await db.tenants.bulkAdd(data.tenants)
          if (data.businessUnits) await db.businessUnits.bulkAdd(data.businessUnits)
          if (data.applications) await db.applications.bulkAdd(data.applications)
          if (data.technologies) await db.technologies.bulkAdd(data.technologies)
          if (data.vulnerabilities) await db.vulnerabilities.bulkAdd(data.vulnerabilities)
          if (data.incidents) await db.incidents.bulkAdd(data.incidents)
          if (data.risks) await db.risks.bulkAdd(data.risks)
          if (data.auditFindings) await db.auditFindings.bulkAdd(data.auditFindings)
          if (data.teams) await db.teams.bulkAdd(data.teams)
          if (data.objectives) await db.objectives.bulkAdd(data.objectives)
          if (data.healthIndexHistory) await db.healthIndexHistory.bulkAdd(data.healthIndexHistory)
          if (data.users) await db.users.bulkAdd(data.users)
        })
        addNotification({ type: 'success', message: 'Datos importados correctamente' })
      }
    } catch {
      addNotification({ type: 'error', message: 'Error al importar datos' })
    } finally {
      setIsImporting(false)
      e.target.value = ''
    }
  }

  const handleClearData = async () => {
    if (await confirm('¿Eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      await Promise.all(db.tables.map((table) => table.clear()))
      addNotification({ type: 'success', message: 'Todos los datos han sido eliminados' })
    }
  }

  const handleSeedData = async () => {
    const stats = await Promise.all(db.tables.map((t) => t.count()))
    const hasData = stats.some((c) => c > 0)
    if (hasData && !(await confirm('Ya hay datos registrados. ¿Cargar datos demo sobrescribirá TODO. Continuar?'))) {
      return
    }
    await seedDemoData()
    addNotification({ type: 'success', message: 'Datos de demo cargados' })
  }

  const handleSyncTechnologies = async () => {
    setIsSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncTechnologies()
      setSyncResult(result)
      addNotification({
        type: 'success',
        message: `Sincronización completada: ${result.updated} actualizadas, ${result.notFound} sin datos, ${result.errors} errores (${result.duration}ms)`,
      })
    } catch (err) {
      console.error('[AdminPage] Sync failed:', err)
      addNotification({ type: 'error', message: 'Error al sincronizar con endoflife.date' })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Administración</h2>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">Gestión de Datos</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleReAuthExport}
            disabled={isExporting}
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-20 dark:border-neutral-70 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Shield size={24} className="text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-90 dark:text-white">Exportar Datos</p>
              <p className="text-xs text-warning">Requiere autenticación · Datos cifrados</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-20 dark:border-neutral-70 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <FileSpreadsheet size={24} className="text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-90 dark:text-white">Importar desde Excel</p>
              <p className="text-xs text-neutral-60 dark:text-neutral-40">Cargar datos masivos (.xlsx)</p>
            </div>
          </button>

          <label className="flex items-center gap-3 p-4 rounded-lg border border-neutral-20 dark:border-neutral-70 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors cursor-pointer">
            <Upload size={24} className="text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-90 dark:text-white">Importar Datos</p>
              <p className="text-xs text-neutral-60 dark:text-neutral-40">Cargar backup JSON</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
          </label>

          <button
            onClick={handleSeedData}
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-20 dark:border-neutral-70 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Database size={24} className="text-success" />
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-90 dark:text-white">Cargar Datos Demo</p>
              <p className="text-xs text-warning">Sobrescribe TODOS los datos existentes</p>
            </div>
          </button>

          <button
            onClick={handleSyncTechnologies}
            disabled={isSyncing}
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-20 dark:border-neutral-70 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={24} className={`text-info ${isSyncing ? 'animate-spin' : ''}`} />
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-90 dark:text-white">
                {isSyncing ? 'Sincronizando...' : 'Sincronizar con endoflife.date'}
              </p>
              <p className="text-xs text-neutral-60 dark:text-neutral-40">
                {syncResult
                  ? `${syncResult.updated} actualizadas · ${syncResult.notFound} sin datos · ${syncResult.errors} errores (${syncResult.duration}ms)`
                  : 'Actualizar EOL y soporte desde API pública'}
              </p>
            </div>
          </button>

          <button
            onClick={handleClearData}
            className="flex items-center gap-3 p-4 rounded-lg border border-danger/20 hover:bg-danger/5 transition-colors"
          >
            <Trash2 size={24} className="text-danger" />
            <div className="text-left">
              <p className="text-sm font-medium text-danger">Eliminar Todos los Datos</p>
              <p className="text-xs text-neutral-60 dark:text-neutral-40">Limpiar base de datos</p>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
        <JobSchedulerConfig />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
        <AzureBackupConfig />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Información del Sistema</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-neutral-20 dark:border-neutral-70">
            <span className="text-neutral-60 dark:text-neutral-40">Versión</span>
            <span className="text-neutral-90 dark:text-white font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-20 dark:border-neutral-70">
            <span className="text-neutral-60 dark:text-neutral-40">Base de Datos</span>
            <span className="text-neutral-90 dark:text-white font-medium">IndexedDB (Dexie.js)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-20 dark:border-neutral-70">
            <span className="text-neutral-60 dark:text-neutral-40">Frontend</span>
            <span className="text-neutral-90 dark:text-white font-medium">React 19 + TypeScript + Vite</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-60 dark:text-neutral-40">Persistencia</span>
            <span className="text-neutral-90 dark:text-white font-medium">Local (Navegador)</span>
          </div>
        </div>
      </div>
      {/* TOTP Re-auth dialog */}
      {showTotpDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-primary" />
              <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">Verificar identidad</h3>
            </div>
            <p className="text-sm text-neutral-60 dark:text-neutral-40">
              Ingresa el código de 6 dígitos de tu autenticador para exportar los datos.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={totpCode}
              onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setTotpError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmExport() }}
              className="w-full px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="000000"
            />
            {totpError && (
              <p className="text-sm text-danger">{totpError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTotpDialog(false)}
                className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmExport}
                disabled={totpCode.length !== 6}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                Verificar y Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


