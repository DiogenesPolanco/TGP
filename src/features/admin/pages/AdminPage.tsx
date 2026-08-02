import { useState, useEffect } from 'react'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { seedDemoData } from '@/services/demo/seedData'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  Shield,
  Download,
  Users,
  BarChart3,
} from 'lucide-react'
import { syncTechnologies } from '@/services/sync/endoflifeSyncService'
import { useConfirm } from '@/hooks/useConfirm'
import { getSecret, verifyTotp } from '@/services/auth/authService'
import type { SyncResult } from '@/services/sync/endoflifeSyncService'
import { AzureCloudConfig } from '@/features/admin/components/AzureCloudConfig'
import { AiAdminConfig } from '@/features/admin/components/AiAdminConfig'
import { JobSchedulerConfig } from '@/features/admin/components/JobSchedulerConfig'
import { MobileSnapshotConfig } from '@/features/admin/components/MobileSnapshotConfig'
import { JiraConfigPanel } from '@/components/jira/JiraConfigPanel'
import { DatabaseConfig } from '@/features/admin/components/DatabaseConfig'
import { SystemConfigSection } from '@/features/admin/components/config/SystemConfigSection'
import { CatalogsSection } from '@/features/admin/components/config/CatalogsSection'
import {
  exportDatabase,
  dateReviver,
  importBackup,
  isValidBackup,
  isDateObject,
  DATE_KEYS,
  isIsoDateString,
} from '@/services/export/exportService'
import type { DatabaseBackup } from '@/services/export/exportService'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

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

  // Seed system data on first admin visit
  useEffect(() => {
    import('@/services/system/seedSystemData').then(({ seedSystemData }) => {
      seedSystemData()
    })
  }, [])

  const handleReAuthExport = async () => {
    const secret = await getSecret()
    if (!secret) {
      addNotification({ type: 'error', message: 'No hay configuración de seguridad.' })
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
      setTotpError('Código inválido.')
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
      const backup = await exportDatabase({ encrypt: true })
      const blob = new Blob([JSON.stringify(backup, dateReviver, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tgp-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      if (backup.exportWarnings?.length) {
        addNotification({
          type: 'warning',
          message: `Datos exportados con ${backup.exportWarnings.length} advertencia(s)`,
        })
      } else {
        addNotification({ type: 'success', message: 'Datos exportados correctamente' })
      }
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
      const parsed = JSON.parse(text, (_key, value) => {
        if (isDateObject(value)) {
          const d = new Date(value.__date)
          return isNaN(d.getTime()) ? null : d
        }
        if (DATE_KEYS.has(_key) && isIsoDateString(value)) {
          const d = new Date(value as string)
          return isNaN(d.getTime()) ? null : d
        }
        return value
      })

      let backup: DatabaseBackup

      if (parsed && parsed.version && parsed.tables) {
        // DatabaseBackup format from exportService / Azure
        backup = parsed as DatabaseBackup
      } else {
        // Flat format: keys are table names, values are record arrays
        const tables: Record<string, Record<string, unknown>[]> = {}
        for (const [key, value] of Object.entries(parsed)) {
          if (key === 'exportedAt') continue
          if (Array.isArray(value) && value.length > 0) {
            tables[key] = value as Record<string, unknown>[]
          }
        }
        backup = {
          version: '1.0',
          exportedAt:
            typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
          tables,
        }
      }

      // Validate BEFORE wiping any existing data
      if (!isValidBackup(backup)) {
        addNotification({
          type: 'error',
          message: 'Archivo de backup inválido: no se importaron datos',
        })
        return
      }

      if (await confirm('Esto sobrescribirá TODOS los datos existentes. ¿Continuar?')) {
        await Promise.all(db.tables.map((t) => t.clear()))
        const result = await importBackup(backup)
        if (result.success) {
          addNotification({
            type: 'success',
            message: `Importación completada: ${result.totalRecords} registros en ${result.tablesRestored.length} tablas`,
          })
        } else {
          addNotification({
            type: 'warning',
            message: `Importación con ${result.errors.length} error(es). ${result.totalRecords} registros restaurados.`,
          })
        }
        if (result.errors.length > 0) {
          console.warn('[ImportJSON] Errores:', result.errors)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      addNotification({ type: 'error', message: `Error al importar: ${msg}` })
    } finally {
      setIsImporting(false)
      e.target.value = ''
    }
  }

  const handleClearData = async () => {
    if (await confirm('¿Eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      await Promise.all(db.tables.map((t) => t.clear()))
      addNotification({ type: 'success', message: 'Todos los datos han sido eliminados' })
    }
  }

  const handleSeedData = async () => {
    const stats = await Promise.all(db.tables.map((t) => t.count()))
    if (stats.some((c) => c > 0) && !(await confirm('Hay datos. ¿Sobrescribir con datos demo?')))
      return
    await seedDemoData(true)
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
        message: `Sincronización: ${result.updated} actualizadas, ${result.notFound} sin datos, ${result.errors} errores`,
      })
    } catch {
      addNotification({ type: 'error', message: 'Error al sincronizar' })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleShowStats = async () => {
    if (showStats) {
      setShowStats(false)
      return
    }
    setLoadingStats(true)
    const stats = await Promise.all(
      db.tables.map(async (t) => ({ name: t.name, count: await t.count() })),
    )
    setDbStats(stats)
    setShowStats(true)
    setLoadingStats(false)
  }

  return (
    <div className="space-y-6">
      {/* Asistente AI - siempre visible */}
      <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
        <AiAdminConfig />
      </div>

      {/* Grid de acciones rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ActionCard
          icon={<Shield size={20} />}
          label="Exportar datos"
          desc="Cifrado + TOTP"
          color="primary"
          onClick={handleReAuthExport}
          disabled={isExporting}
        />
        <ActionCard
          icon={<FileSpreadsheet size={20} />}
          label="Importar Excel"
          desc="Carga masiva .xlsx"
          color="primary"
          onClick={() => navigate('/admin/import')}
        />
        <ActionCard
          icon={<Upload size={20} />}
          label="Importar JSON"
          desc="Restaurar backup"
          color="primary"
          onClick={() => document.getElementById('import-json')?.click()}
        />
        <ActionCard
          icon={<Download size={20} />}
          label="Cargar demo"
          desc="Datos de ejemplo"
          color="success"
          onClick={handleSeedData}
        />
        <ActionCard
          icon={<RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />}
          label="Sincronizar EOL"
          desc={syncResult ? `${syncResult.updated} actualizadas` : 'endoflife.date'}
          color="info"
          onClick={handleSyncTechnologies}
          disabled={isSyncing}
        />
        <ActionCard
          icon={<Users size={20} />}
          label="Usuarios"
          desc="Gestionar accesos"
          color="primary"
          onClick={() => navigate('/admin/users')}
        />
        <ActionCard
          icon={<BarChart3 size={20} />}
          label="Estadísticas BD"
          desc="Registros por tabla"
          color="info"
          onClick={handleShowStats}
        />
        <ActionCard
          icon={<Trash2 size={20} />}
          label="Limpiar BD"
          desc="Eliminar todo"
          color="danger"
          onClick={handleClearData}
        />
        <input
          id="import-json"
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={isImporting}
          className="hidden"
        />
      </div>

      {loadingStats && (
        <div className="text-sm text-neutral-50 text-center py-3 animate-pulse">
          Cargando estadísticas...
        </div>
      )}

      {showStats && !loadingStats && (
        <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white">Base de Datos</h3>
            <span className="text-xs text-neutral-50">
              {dbStats.reduce((s, t) => s + t.count, 0).toLocaleString()} registros
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-1.5">
            {dbStats
              .filter((s) => s.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between py-1.5 border-b border-neutral-10 dark:border-neutral-85"
                >
                  <span className="text-xs text-muted truncate mr-2">
                    {s.name.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-xs font-bold text-neutral-90 dark:text-white tabular-nums shrink-0">
                    {s.count.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Configuración de Base de Datos */}
      <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
        <DatabaseConfig />
      </div>

      {/* Configuraciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
          <JobSchedulerConfig />
        </div>
        <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
          <AzureCloudConfig />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
        <MobileSnapshotConfig />
      </div>

      <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
        <JiraConfigPanel />
      </div>

      {/* Configuración dinámica del sistema */}
      <div className="space-y-6">
        <SystemConfigSection />
        <CatalogsSection />
      </div>

      {/* TOTP dialog */}
      {showTotpDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl border border-boundary shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-primary" />
              <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
                Verificar identidad
              </h3>
            </div>
            <p className="text-sm text-muted">Ingresa el código de 6 dígitos de tu autenticador.</p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={totpCode}
              onChange={(e) => {
                setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                setTotpError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmExport()
              }}
              className="w-full px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="000000"
            />
            {totpError && <p className="text-sm text-danger">{totpError}</p>}
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowTotpDialog(false)}
                className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmExport}
                disabled={totpCode.length !== 6}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                Verificar y Exportar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionCard({
  icon,
  label,
  desc,
  color,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  color: string
  onClick?: () => void
  disabled?: boolean
}) {
  const colors: Record<string, string> = {
    primary: 'border-primary/20 hover:bg-primary/5 hover:border-primary/30 text-primary',
    success: 'border-success/20 hover:bg-success/5 hover:border-success/30 text-success',
    danger: 'border-danger/20 hover:bg-danger/5 hover:border-danger/30 text-danger',
    info: 'border-info/20 hover:bg-info/5 hover:border-info/30 text-info',
  }
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-2 p-5 rounded-2xl border bg-card transition-all duration-200 disabled:opacity-50',
        colors[color] ?? colors.primary,
        onClick && !disabled && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      <div className="p-2.5 rounded-xl bg-current/10">{icon}</div>
      <p className="text-sm font-semibold text-center leading-tight">{label}</p>
      <p className="text-[11px] text-center opacity-60 leading-tight">{desc}</p>
    </Button>
  )
}
