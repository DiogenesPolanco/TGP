import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import {
  getJiraConfig,
  saveJiraConfig,
  isJiraConfigured,
  type JiraConfig,
} from '@/services/jira/jiraConfigService'
import { getBoards } from '@/services/jira/jiraService'
import { Check, RefreshCw, Globe, Key, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function JiraConfigPanel() {
  const { addNotification } = useAppStore()
  const [config, setConfig] = useState<JiraConfig>(getJiraConfig())
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [boards, setBoards] = useState<{ id: number; name: string; projectKey: string }[]>([])

  useEffect(() => {
    setSaved(false)
    setBoards([])
  }, [config.baseUrl, config.email, config.apiToken])

  const handleSave = () => {
    if (!config.baseUrl || !config.email || !config.apiToken) {
      addNotification({ type: 'error', message: 'Completa URL, email y API token' })
      return
    }
    saveJiraConfig(config)
    setSaved(true)
    addNotification({ type: 'success', message: 'Configuración de Jira guardada' })
  }

  const handleTestAndFetch = async () => {
    if (!config.baseUrl || !config.email || !config.apiToken) {
      addNotification({ type: 'error', message: 'Completa los campos primero' })
      return
    }
    saveJiraConfig(config)
    setTesting(true)
    try {
      const result = await getBoards()
      const mapped = result
        .filter((b) => b.location?.projectKey)
        .map((b) => ({
          id: b.id,
          name: b.name,
          projectKey: b.location!.projectKey!,
        }))
      setBoards(mapped)
      addNotification({
        type: 'success',
        message: `Conexión exitosa — ${mapped.length} boards encontrados`,
      })
    } catch {
      addNotification({
        type: 'error',
        message: 'Error al conectar con Jira. Verifica URL, email y token.',
      })
    } finally {
      setTesting(false)
    }
  }

  const isConfigured = isJiraConfigured()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-neutral-90 dark:text-white">Integración Jira</h3>
          {isConfigured && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-success/10 text-success">
              <Check size={12} /> Conectado
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 flex items-center gap-1">
            <Globe size={12} /> URL de Jira
          </label>
          <input
            type="url"
            value={config.baseUrl}
            onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            placeholder="https://tu-dominio.atlassian.net"
            className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 flex items-center gap-1">
            <Mail size={12} /> Email
          </label>
          <input
            type="email"
            value={config.email}
            onChange={(e) => setConfig({ ...config, email: e.target.value })}
            placeholder="usuario@correo.com"
            className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 flex items-center gap-1">
            <Key size={12} /> API Token
          </label>
          <input
            type="password"
            value={config.apiToken}
            onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
            placeholder="Token de Jira"
            className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            saved ? 'bg-success/10 text-success' : 'bg-primary text-white hover:bg-primary-dark',
          )}
        >
          {saved ? (
            <span className="flex items-center gap-1">
              <Check size={14} /> Guardado
            </span>
          ) : (
            'Guardar'
          )}
        </Button>
        <Button
          onClick={handleTestAndFetch}
          disabled={testing || !config.baseUrl}
          className="flex items-center gap-1.5 px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors disabled:opacity-50"
        >
          {testing ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
          {testing ? 'Conectando...' : 'Probar Conexión'}
        </Button>
      </div>

      {boards.length > 0 && (
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-2 block">
            Boards disponibles
          </label>
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {boards.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-10 dark:bg-neutral-70 text-sm"
              >
                <span className="font-medium text-neutral-90 dark:text-white">{b.name}</span>
                <span className="text-xs text-neutral-50 font-mono">{b.projectKey}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
