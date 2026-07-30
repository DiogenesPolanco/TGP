import { useState, useEffect } from 'react'
import { Settings, Save, RotateCcw, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { getAllConfigs, setConfig, deleteConfig } from '@/services/system/systemConfigService'
import { seedSystemData } from '@/services/system/seedSystemData'
import type { SystemConfig } from '@/types/system'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function SystemConfigSection() {
  const { addNotification } = useAppStore()
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const load = async () => {
    setLoading(true)
    const all = await getAllConfigs()
    all.sort((a, b) => a.key.localeCompare(b.key))
    setConfigs(all)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (key: string) => {
    try {
      const parsed = JSON.parse(editValue)
      await setConfig(key, parsed)
      addNotification({ type: 'success', message: `Config "${key}" actualizada` })
      setEditing(null)
      await load()
    } catch {
      addNotification({ type: 'error', message: 'JSON inválido. Revisa el formato.' })
    }
  }

  const handleReset = async () => {
    if (!confirm('¿Restaurar configuraciones por defecto? Los cambios personalizados se perderán.')) return
    await Promise.all(configs.map((c) => deleteConfig(c.key)))
    await seedSystemData(true)
    addNotification({ type: 'success', message: 'Configuraciones restauradas' })
    await load()
  }

  const startEdit = (cfg: SystemConfig) => {
    setEditing(cfg.key)
    setEditValue(JSON.stringify(cfg.value, null, 2))
  }

  return (
    <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-neutral-90 dark:text-white">
            Configuración General del Sistema
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={load} disabled={loading} variant="secondary" size="sm" leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>
            Recargar
          </Button>
          <Button onClick={handleReset} variant="danger" size="sm" leftIcon={<RotateCcw size={14} />}>
            Restaurar Default
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-50 text-center py-8 animate-pulse">Cargando...</div>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {configs.map((cfg) => (
            <div key={cfg.key} className="border border-neutral-20 dark:border-neutral-70 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-10 dark:bg-neutral-80/50">
                <div className="flex-1 min-w-0">
                  <code className="text-xs font-mono font-semibold text-neutral-90 dark:text-white">{cfg.key}</code>
                  {cfg.description && (
                    <p className="text-[10px] text-neutral-50 mt-0.5 truncate">{cfg.description}</p>
                  )}
                </div>
                <button onClick={() => startEdit(cfg)} className="text-[11px] text-primary hover:text-primary-dark font-medium ml-3 shrink-0">
                  {editing === cfg.key ? 'Editando...' : 'Editar'}
                </button>
              </div>
              {editing === cfg.key ? (
                <div className="p-3 bg-white dark:bg-neutral-85">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full h-32 px-3 py-2 text-[11px] font-mono rounded border border-neutral-20 dark:border-neutral-60 bg-neutral-5 dark:bg-neutral-80 text-neutral-90 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                    spellCheck={false}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setEditing(null)} className="text-xs text-neutral-50 px-3 py-1.5 rounded hover:bg-neutral-10 dark:hover:bg-neutral-70">
                      Cancelar
                    </button>
                    <button onClick={() => handleSave(cfg.key)} className="text-xs text-white bg-primary px-3 py-1.5 rounded hover:bg-primary-dark flex items-center gap-1">
                      <Save size={12} /> Guardar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
