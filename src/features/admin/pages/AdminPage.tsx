import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { seedDemoData } from '@/services/demo/seedData'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, Database, Trash2, FileSpreadsheet, Cpu } from 'lucide-react'
import { seedTechnologies } from '@/services/demo/seedTechnologies'
import type { SeedResult } from '@/services/demo/seedTechnologies'

export function AdminPage() {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null)

  const stats = useLiveQuery(async () => ({
    applications: await db.applications.count(),
    vulnerabilities: await db.vulnerabilities.count(),
    incidents: await db.incidents.count(),
    risks: await db.risks.count(),
    findings: await db.auditFindings.count(),
    teams: await db.teams.count(),
    objectives: await db.objectives.count(),
  }))

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = {
        tenants: await db.tenants.toArray(),
        businessUnits: await db.businessUnits.toArray(),
        applications: await db.applications.toArray(),
        technologies: await db.technologies.toArray(),
        vulnerabilities: await db.vulnerabilities.toArray(),
        incidents: await db.incidents.toArray(),
        risks: await db.risks.toArray(),
        auditFindings: await db.auditFindings.toArray(),
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

      if (confirm('Esto sobrescribirá todos los datos existentes. ¿Continuar?')) {
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
    if (confirm('¿Eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      await Promise.all(db.tables.map((table) => table.clear()))
      addNotification({ type: 'success', message: 'Todos los datos han sido eliminados' })
    }
  }

  const handleSeedData = async () => {
    const stats = await Promise.all(db.tables.map((t) => t.count()))
    const hasData = stats.some((c) => c > 0)
    if (hasData && !confirm('Ya hay datos registrados. ¿Cargar datos demo sobrescribirá TODO. Continuar?')) {
      return
    }
    await seedDemoData()
    addNotification({ type: 'success', message: 'Datos de demo cargados' })
  }

  const handleSeedTechnologies = async () => {
    const result = await seedTechnologies()
    setSeedResult(result)
    addNotification({
      type: 'success',
      message: `Tecnologías sembradas: ${result.added} añadidas, ${result.skipped} omitidas`,
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Administración</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aplicaciones" value={stats?.applications ?? 0} />
        <StatCard label="Vulnerabilidades" value={stats?.vulnerabilities ?? 0} />
        <StatCard label="Incidentes" value={stats?.incidents ?? 0} />
        <StatCard label="Riesgos" value={stats?.risks ?? 0} />
        <StatCard label="Hallazgos" value={stats?.findings ?? 0} />
        <StatCard label="Equipos" value={stats?.teams ?? 0} />
        <StatCard label="Objetivos" value={stats?.objectives ?? 0} />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">Gestión de Datos</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-20 dark:border-neutral-70 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Download size={24} className="text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-90 dark:text-white">Exportar Datos</p>
              <p className="text-xs text-neutral-60 dark:text-neutral-40">Descargar backup JSON</p>
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
            onClick={handleSeedTechnologies}
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-20 dark:border-neutral-70 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Cpu size={24} className="text-warning" />
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-90 dark:text-white">Sembrar Catálogo de Tecnologías</p>
              <p className="text-xs text-neutral-60 dark:text-neutral-40">
                {seedResult
                  ? `${seedResult.added} añadidas · ${seedResult.skipped} omitidas`
                  : 'Cargar todas las tecnologías conocidas'}
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
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </div>
  )
}
