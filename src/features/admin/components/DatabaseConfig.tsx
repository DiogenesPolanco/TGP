import { useState, useEffect } from 'react'
import {
  Database,
  HardDrive,
  Server,
  Globe,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeftRight,
  Plug,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  useDataLayerStore,
  switchBackend,
  switchWithMigration,
  getActiveBackend,
} from '@/services/data-layer'
import type { BackendType, RemotePgConnection } from '@/services/data-layer'
import { DEFAULT_REMOTE_PG } from '@/services/data-layer/types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const BACKEND_OPTIONS = [
  {
    id: 'dexie' as const,
    label: 'IndexedDB (Local)',
    desc: 'Base de datos local en el navegador. No requiere servidor.',
    icon: HardDrive,
    color: 'text-primary',
    bgColor: 'bg-primary/5 border-primary/20',
  },
  {
    id: 'pglite' as const,
    label: 'PostgreSQL (PGlite)',
    desc: 'PostgreSQL real en WebAssembly dentro del navegador.',
    icon: Server,
    color: 'text-info',
    bgColor: 'bg-info/5 border-info/20',
  },
  {
    id: 'remote-pg' as const,
    label: 'PostgreSQL Remoto',
    desc: 'Conecta a un servidor PostgreSQL externo vía proxy WebSocket.',
    icon: Globe,
    color: 'text-warning',
    bgColor: 'bg-warning/5 border-warning/20',
  },
]

export function DatabaseConfig() {
  const config = useDataLayerStore((s) => s.config)
  const status = useDataLayerStore((s) => s.status)
  const error = useDataLayerStore((s) => s.error)
  const setConfig = useDataLayerStore((s) => s.setConfig)
  const [switching, setSwitching] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [health, setHealth] = useState<'checking' | 'healthy' | 'unhealthy'>('checking')
  const [showPassword, setShowPassword] = useState(false)

  const [remotePg, setRemotePg] = useState<RemotePgConnection>(
    () => config.remotePg ?? DEFAULT_REMOTE_PG,
  )

  useEffect(() => {
    if (config.remotePg) setRemotePg(config.remotePg)
  }, [config.remotePg?.proxyUrl, config.remotePg?.host])

  useEffect(() => {
    const check = async () => {
      setHealth('checking')
      try {
        const backend = getActiveBackend()
        if (backend) {
          const ok = await backend.isHealthy()
          setHealth(ok ? 'healthy' : 'unhealthy')
        } else {
          setHealth('unhealthy')
        }
      } catch {
        setHealth('unhealthy')
      }
    }
    if (status === 'ready') check()
    else setHealth('checking')
  }, [status])

  const handleSwitch = async (type: BackendType) => {
    if (type === config.backend || switching) return
    setSwitching(true)
    try {
      if (type === 'remote-pg') setConfig({ backend: type, remotePg })
      await switchBackend(type)
    } catch (err) {
      console.error('Error switching backend:', err)
    } finally {
      setSwitching(false)
    }
  }

  const handleMigrate = async (type: BackendType) => {
    if (type === config.backend || migrating) return
    setMigrating(true)
    try {
      if (type === 'remote-pg') setConfig({ backend: type, remotePg })
      await switchWithMigration(type)
    } catch (err) {
      console.error('Error migrating:', err)
    } finally {
      setMigrating(false)
    }
  }

  const handleTestConnection = async () => {
    setHealth('checking')
    try {
      const { RemoteBackend } = await import('@/services/data-layer/remote-backend')
      const test = new RemoteBackend(remotePg)
      await test.initialize()
      const ok = await test.isHealthy()
      setHealth(ok ? 'healthy' : 'unhealthy')
      await test.destroy()
    } catch {
      setHealth('unhealthy')
    }
  }

  const handleSaveRemoteConfig = () => {
    setConfig({ remotePg })
  }

  const backendInfo = BACKEND_OPTIONS.find((b) => b.id === config.backend)

  const getTargetBackend = (current: BackendType): BackendType => {
    if (current === 'dexie') return 'pglite'
    if (current === 'remote-pg') return 'dexie'
    return 'dexie'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-neutral-90 dark:text-white">
            Motor de Base de Datos
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {status === 'initializing' && (
            <span className="flex items-center gap-1 text-info">
              <Loader2 size={12} className="animate-spin" /> Inicializando...
            </span>
          )}
          {status === 'ready' && (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 size={12} /> {backendInfo?.label ?? config.backend}
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-danger">
              <AlertCircle size={12} /> Error
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BACKEND_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const isActive = config.backend === opt.id
          const isBusy = switching || migrating

          return (
            <button
              key={opt.id}
              disabled={isBusy}
              onClick={() => handleSwitch(opt.id)}
              className={cn(
                'relative flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-200',
                isActive
                  ? `${opt.bgColor} ring-2 ring-current`
                  : 'border-neutral-20 dark:border-neutral-70 hover:border-neutral-40 dark:hover:border-neutral-50',
                isBusy && 'opacity-50 cursor-not-allowed',
              )}
            >
              <div className="flex items-center gap-2">
                <Icon size={18} className={cn(isActive ? opt.color : 'text-neutral-50')} />
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isActive
                      ? 'text-neutral-90 dark:text-white'
                      : 'text-neutral-60 dark:text-neutral-40',
                  )}
                >
                  {opt.label}
                </span>
              </div>
              <p className="text-xs text-neutral-50 leading-relaxed">{opt.desc}</p>
              {isActive && (
                <span className={cn('text-[11px] font-medium mt-1', opt.color)}>Activo</span>
              )}
            </button>
          )
        })}
      </div>

      {config.backend === 'remote-pg' && (
        <div className="p-4 rounded-xl border border-warning/20 bg-warning/[0.02] space-y-4">
          <div className="flex items-center gap-2 text-warning">
            <Plug size={16} />
            <h4 className="text-sm font-semibold">Conexión al Proxy WebSocket</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-neutral-60 dark:text-neutral-50 mb-1">
                Proxy URL
              </label>
              <input
                type="text"
                value={remotePg.proxyUrl}
                onChange={(e) => setRemotePg({ ...remotePg, proxyUrl: e.target.value })}
                placeholder="ws://localhost:9876"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-80 text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-warning/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-60 dark:text-neutral-50 mb-1">
                Host
              </label>
              <input
                type="text"
                value={remotePg.host}
                onChange={(e) => setRemotePg({ ...remotePg, host: e.target.value })}
                placeholder="db.example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-80 text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-warning/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-60 dark:text-neutral-50 mb-1">
                Puerto
              </label>
              <input
                type="number"
                value={remotePg.port}
                onChange={(e) =>
                  setRemotePg({ ...remotePg, port: parseInt(e.target.value) || 5432 })
                }
                placeholder="5432"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-80 text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-warning/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-60 dark:text-neutral-50 mb-1">
                Base de datos
              </label>
              <input
                type="text"
                value={remotePg.database}
                onChange={(e) => setRemotePg({ ...remotePg, database: e.target.value })}
                placeholder="tgp"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-80 text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-warning/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-60 dark:text-neutral-50 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={remotePg.user}
                onChange={(e) => setRemotePg({ ...remotePg, user: e.target.value })}
                placeholder="postgres"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-80 text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-warning/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-60 dark:text-neutral-50 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={remotePg.password}
                  onChange={(e) => setRemotePg({ ...remotePg, password: e.target.value })}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-80 text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-warning/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-50 hover:text-neutral-70"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="remote-ssl"
                checked={remotePg.ssl}
                onChange={(e) => setRemotePg({ ...remotePg, ssl: e.target.checked })}
                className="rounded border-neutral-30 text-warning focus:ring-warning/40"
              />
              <label
                htmlFor="remote-ssl"
                className="text-xs text-neutral-60 dark:text-neutral-50 cursor-pointer"
              >
                Usar SSL (rejectUnauthorized: false)
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleTestConnection}
              variant="secondary"
              size="sm"
              leftIcon={
                health === 'checking' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plug size={14} />
                )
              }
            >
              {health === 'checking' ? 'Probando...' : 'Probar Conexión'}
            </Button>
            <Button onClick={handleSaveRemoteConfig} variant="primary" size="sm">
              Guardar Configuración
            </Button>
            {health !== 'checking' && (
              <span
                className={cn(
                  'flex items-center gap-1 text-xs',
                  health === 'healthy' ? 'text-success' : 'text-danger',
                )}
              >
                {health === 'healthy' ? (
                  <>
                    <CheckCircle2 size={12} /> Conexión exitosa
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} /> Sin conexión
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={() => handleMigrate(getTargetBackend(config.backend))}
          disabled={switching || migrating}
          variant="secondary"
          size="sm"
          leftIcon={
            migrating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArrowLeftRight size={14} />
            )
          }
        >
          {migrating
            ? 'Migrando datos...'
            : `Migrar datos a ${
                config.backend === 'dexie'
                  ? 'PGlite'
                  : config.backend === 'remote-pg'
                    ? 'IndexedDB'
                    : 'IndexedDB'
              }`}
        </Button>
        <span className="text-[11px] text-neutral-50">
          Exporta datos del backend actual e importa en el nuevo
        </span>
      </div>

      {status === 'error' && error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/5 border border-danger/20 text-xs text-danger">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
