import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, ArrowLeft, Bot, Trash2, Check, X, Save, Wifi, WifiOff, Loader2,
  ClipboardList, FolderKanban, Shield, Scale, Target, Users, UserPlus, Monitor,
  Send, Terminal, Eye, EyeOff, Pencil, User, Copy, RefreshCw, Cloud,
} from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useAiConfigStore } from '../store/aiConfigStore'
import { useAiChat } from '../hooks/useAiChat'
import { createProvider } from '../services/AiProvider'
import type { AiProviderType, AiProviderConfig, AiChatMessage } from '../types'
import { AI_PROVIDER_DEFAULTS } from '../types'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'

// ─── Provider definitions ─────────────────────────────────────────

interface ProviderOption {
  type: AiProviderType
  icon: string
  name: string
  desc: string
  tooltip: string
  badge: string
  disabled?: boolean
}

const PROVIDERS: ProviderOption[] = [
  {
    type: 'ollama', icon: '🦙', name: 'Ollama (local)',
    desc: 'Local · 100% gratis, sin límites',
    tooltip: 'Ejecutás el modelo en tu máquina. Sin costos, sin límites de uso, 100% offline.',
    badge: 'Gratis',
  },
  {
    type: 'groq', icon: '⚡', name: 'Groq',
    desc: 'Cloud gratuito · 30 req/min',
    tooltip: 'Cloud gratuito con inferencia ultrarrápida. Limitado a 30 requests por minuto en el plan free.',
    badge: 'Gratis',
  },
  {
    type: 'openai', icon: '🔵', name: 'OpenAI',
    desc: 'Pago por uso · requiere API key',
    tooltip: 'Modelos GPT de pago. Necesitás una API key de OpenAI con crédito disponible.',
    badge: 'API key',
  },
  {
    type: 'anthropic', icon: '🟠', name: 'Anthropic (Claude)',
    desc: 'Próximamente — análisis avanzado',
    tooltip: 'Claude de Anthropic. Pendiente de integración — estará disponible pronto.',
    badge: 'Pronto', disabled: true,
  },
]

function providerLabel(p: AiProviderType): string {
  return PROVIDERS.find((x) => x.type === p)?.name ?? p
}

const PERMISSION_DEFS: {
  key: keyof AiProviderConfig['dataPermissions']
  icon: ReactNode
  label: string
  tables: string
  tooltip: string
}[] = [
  { key: 'catalogo', icon: <FolderKanban size={18} />, label: 'Catálogo', tables: '10 tablas', tooltip: 'Applications, technologies, microservices, databases y dependencias' },
  { key: 'seguridad', icon: <Shield size={18} />, label: 'Seguridad', tables: '2 tablas', tooltip: 'Vulnerabilidades CVSS con SLA e incidentes P1-P4' },
  { key: 'gobierno', icon: <Scale size={18} />, label: 'Gobierno', tables: '2 tablas', tooltip: 'Matriz de riesgos y hallazgos de auditoría' },
  { key: 'estrategia', icon: <Target size={18} />, label: 'Estrategia', tables: '3 tablas', tooltip: 'OKRs, THI histórico y entregables' },
  { key: 'ejecucion', icon: <ClipboardList size={18} />, label: 'Ejecución', tables: '6 tablas', tooltip: 'Planes, actividades, tareas, compromisos, dependencias y bloqueos' },
  { key: 'personas', icon: <Users size={18} />, label: 'Personas', tables: '7 tablas', tooltip: 'Equipos, perfiles, sprints, métricas DORA, 1:1 y logros' },
  { key: 'reclutamiento', icon: <UserPlus size={18} />, label: 'Reclutamiento', tables: '3 tablas', tooltip: 'Candidatos, tecnologías y evaluaciones' },
  { key: 'equipamiento', icon: <Monitor size={18} />, label: 'Equipamiento', tables: '3 tablas', tooltip: 'Equipos, asignaciones y tickets de soporte' },
]

// ─── Inline Chat Preview ─────────────────────────────────────────

function InlineChat({ config }: { config: AiProviderConfig }) {
  const { messages, sendMessage, isLoading, error, clearMessages } = useAiChat({ config })
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage(text)
  }

  const displayMessages = messages.filter((m) => m.role !== 'system')

  return (
    <div className="flex flex-col">
      <div className="min-h-[200px] max-h-[320px] overflow-y-auto space-y-2 px-1 scrollbar-thin">
        {displayMessages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center select-none">
            <div className="w-12 h-12 mb-4 rounded-xl bg-neutral-10 dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 flex items-center justify-center">
              <Terminal size={18} className="text-neutral-50 dark:text-neutral-40" />
            </div>
            <p className="text-sm font-medium text-neutral-80 dark:text-neutral-20 mb-1">
              Probá el asistente
            </p>
            <p className="text-xs text-neutral-50 max-w-[220px] leading-relaxed">
              Hacé una consulta para ver cómo responde con tu configuración actual.
            </p>
          </div>
        ) : (
          <>
            {displayMessages.map((msg, i) => (
              <ChatBubble key={msg.id} msg={msg} index={i} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-neutral-15 dark:border-neutral-80">
        {error && (
          <div className="flex items-center gap-1.5 mb-2 px-3 py-1.5 rounded-lg bg-danger/5 text-xs text-danger leading-relaxed">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        <div className="flex items-center gap-2 bg-neutral-5 dark:bg-neutral-85 rounded-xl border border-boundary has-[:focus]:border-neutral-40 dark:has-[:focus]:border-neutral-50 transition-all duration-200 px-3 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Escribí una consulta de prueba..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-neutral-90 dark:text-white placeholder-neutral-40 dark:placeholder-neutral-60 focus:outline-none disabled:opacity-50 py-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-1.5 rounded-lg text-neutral-40 hover:text-neutral-90 dark:hover:text-white hover:bg-neutral-15 dark:hover:bg-neutral-75 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
          {displayMessages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1.5 rounded-lg text-neutral-30 hover:text-neutral-50 hover:bg-neutral-15 dark:hover:bg-neutral-75 transition-all"
              title="Limpiar chat"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Renderiza markdown simple: **bold**, listas, separadores, saltos de línea. */
function renderMarkdown(text: string): ReactNode[] {
  if (!text) return []

  // Dividir en líneas y procesar cada una
  const lines = text.split('\n')
  const elements: ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Separador ---
    if (/^---+\s*$/.test(trimmed)) {
      elements.push(<div key={key++} className="my-2 border-t border-neutral-20 dark:border-neutral-70" />)
      continue
    }

    // Línea en blanco
    if (!trimmed) {
      elements.push(<div key={key++} className="h-1.5" />)
      continue
    }

    // Título: **texto** al inicio de la línea (formato usado por el modelo)
    if (/^\*\*.+\*\*$/.test(trimmed)) {
      const title = trimmed.replace(/\*\*(.+)\*\*/g, '$1')
      elements.push(
        <p key={key++} className="text-sm font-semibold text-neutral-90 dark:text-white mt-2 first:mt-0 leading-relaxed">
          {title}
        </p>
      )
      continue
    }

    // Item de lista: - texto
    if (trimmed.startsWith('- ')) {
      const item = trimmed.slice(2)
      elements.push(
        <div key={key++} className="flex items-start gap-2 text-xs leading-relaxed text-neutral-80 dark:text-neutral-20 ml-1">
          <span className="w-1 h-1 rounded-full bg-neutral-40 mt-1.5 shrink-0" />
          <span className="flex-1">
            {renderInline(item)}
          </span>
        </div>
      )
      continue
    }

    // Línea normal con soporte para bold inline
    elements.push(
      <p key={key++} className="text-xs leading-relaxed text-neutral-80 dark:text-neutral-20">
        {renderInline(trimmed)}
      </p>
    )
  }

  return elements
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let key = 0
  // Parsear **bold** inline
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>)
    }
    parts.push(<strong key={key++} className="font-semibold text-neutral-90 dark:text-white">{match[1]}</strong>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : [<span key={key}>{text}</span>]
}

function ChatBubble({ msg, index }: { msg: AiChatMessage; index: number }) {
  const isUser = msg.role === 'user'
  const isTool = msg.role === 'tool'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (isTool) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-0.5" style={{ animation: `fadeSlideIn 300ms ease-out ${index * 30}ms forwards`, opacity: 0 }}>
        <div className="w-1 h-1 rounded-full bg-neutral-30 dark:bg-neutral-60 shrink-0" />
        <span className="text-[10px] text-neutral-50 dark:text-neutral-50 font-mono truncate max-w-[180px]">
          {msg.toolName ?? 'consulta'}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-2 group ${isUser ? 'flex-row-reverse' : ''}`}
      style={{ animation: `fadeSlideIn 300ms ease-out ${index * 30}ms forwards`, opacity: 0 }}>
      <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
        isUser
          ? 'bg-neutral-30 dark:bg-neutral-60'
          : 'bg-gradient-to-br from-neutral-50 to-neutral-70 dark:from-neutral-40 dark:to-neutral-20'
      }`}>
        {isUser ? <User size={11} className="text-white" /> : <Sparkles size={10} className="text-white" />}
      </div>
      <div className={isUser ? 'max-w-[80%]' : 'flex-1 min-w-0'}>
        {isUser ? (
          <div className="bg-neutral-20 dark:bg-neutral-70 text-neutral-90 dark:text-white rounded-xl rounded-tr-sm px-3 py-2 text-xs leading-relaxed shadow-sm">
            {msg.content}
          </div>
        ) : (
          <div className="pl-3 border-l-2 border-primary/20 dark:border-primary/30 space-y-0.5">
            <div className="text-xs leading-relaxed">
              {renderMarkdown(msg.content)}
            </div>
          </div>
        )}
        <button
          onClick={handleCopy}
          className={`mt-0.5 flex items-center gap-1 text-[10px] transition-all ${
            copied ? 'text-success' : 'text-neutral-40 dark:text-neutral-50 opacity-0 group-hover:opacity-100'
          } hover:text-neutral-60 dark:hover:text-neutral-30`}
        >
          <Copy size={11} />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────

type EditState = {
  provider: AiProviderType
  baseUrl: string
  apiKey: string
  model: string
}

export function AiSettingsPage() {
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.currentUser)
  const { getConfig, saveConfig, removeConfig, updatePermission } = useAiConfigStore()
  const config = currentUser ? getConfig(currentUser.id) : null

  const [editing, setEditing] = useState(false)
  const [dirty, setDirty] = useState<EditState | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  if (!config) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <div className="w-16 h-16 rounded-2xl bg-neutral-10 dark:bg-neutral-75 flex items-center justify-center mx-auto">
          <Bot size={32} className="text-neutral-50" />
        </div>
        <h1 className="text-xl font-bold text-neutral-90 dark:text-white">Sin asistente configurado</h1>
        <p className="text-sm text-neutral-50 max-w-sm mx-auto">
          Configurá tu asistente de IA para consultar datos de gestión en lenguaje natural.
        </p>
        <button
          onClick={() => navigate('/ai/setup')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-90 dark:bg-white text-white dark:text-neutral-90 hover:opacity-90 transition-colors text-sm font-medium"
        >
          <Sparkles size={16} />
          Configurar asistente
        </button>
        <p className="text-xs text-neutral-40">
          O andá a <button onClick={() => navigate('/ai/setup')} className="underline underline-offset-2 hover:text-neutral-60">/ai/setup</button> para empezar desde cero.
        </p>
      </div>
    )
  }

  const startEditing = () => {
    setDirty({
      provider: config.provider,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
    })
    setAvailableModels([config.model])
    setEditing(true)
    setTestResult('idle')
    setTestError(null)
  }

  const cancelEditing = () => {
    setEditing(false)
    setDirty(null)
    setTestResult('idle')
    setTestError(null)
  }

  const saveEditing = () => {
    if (!currentUser || !dirty) return
    saveConfig(currentUser.id, { ...dirty, enabled: true })
    setEditing(false)
    setDirty(null)
    setTestResult('idle')
    setTestError(null)
  }

  const handleTestConnection = async () => {
    if (!dirty) return
    setTestResult('testing')
    setTestError(null)
    try {
      const testConfig: AiProviderConfig = {
        id: 'test',
        userId: currentUser?.id ?? 'test',
        provider: dirty.provider,
        baseUrl: dirty.baseUrl,
        apiKey: dirty.apiKey,
        model: dirty.model,
        enabled: true,
        dataPermissions: config.dataPermissions,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const provider = createProvider(testConfig)
      const ok = await provider.testConnection()
      if (ok) {
        const models = await provider.getModels()
        setAvailableModels(models)
        setDirty({ ...dirty, model: models.length > 0 ? models[0] : dirty.model })
        setTestResult('success')
      } else {
        setTestResult('error')
        setTestError('No se pudo conectar. Verificá la URL y las credenciales.')
      }
    } catch (err) {
      setTestResult('error')
      setTestError(err instanceof Error ? err.message : 'Error de conexión')
    }
  }

  const handleRemove = () => {
    if (currentUser && confirm('¿Desconectar el asistente? Se borrará toda la configuración.')) {
      removeConfig(currentUser.id)
    }
  }

  const activePerms = PERMISSION_DEFS.filter((p) => config.dataPermissions[p.key]).length
  const totalPerms = PERMISSION_DEFS.length

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">GobIA</h1>
          <p className="text-sm text-muted mt-1">
            Configuración del asistente de IA — proveedor, permisos y pruebas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-neutral-90 dark:hover:text-white bg-card border border-boundary hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors"
            >
              <Pencil size={14} />
              Editar
            </button>
          )}
        </div>
      </div>

      {!editing ? (
        /* ── View mode ── */
        <>
          <div className="bg-card rounded-xl border border-boundary overflow-hidden">
            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-neutral-10 dark:bg-neutral-75 flex items-center justify-center text-xl shrink-0">
                    {PROVIDERS.find((p) => p.type === config.provider)?.icon ?? '🤖'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-neutral-90 dark:text-white">
                        {providerLabel(config.provider)}
                      </span>
                      <Badge color={config.enabled ? 'success' : 'neutral'} size="sm">
                        {config.enabled ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-0.5 font-mono">{config.model}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
                <span className="font-mono truncate max-w-[400px]">{config.baseUrl}</span>
                {config.apiKey && (
                  <span>API Key ••••••••{config.apiKey.slice(-4)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-card rounded-xl border border-boundary overflow-hidden">
                <div className="px-5 py-3.5 border-b border-boundary flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">🛡️</span>
                    <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Permisos de datos</h2>
                  </div>
                  <span className="text-xs text-muted tabular-nums">{activePerms}/{totalPerms}</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-1.5">
                    {PERMISSION_DEFS.map((perm) => (
                      <label
                        key={perm.key}
                        title={perm.tooltip}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-all cursor-pointer ${
                          config.dataPermissions[perm.key]
                            ? 'bg-neutral-10 dark:bg-neutral-80'
                            : 'hover:bg-neutral-5 dark:hover:bg-neutral-85'
                        }`}
                      >
                        <span className={`shrink-0 ${config.dataPermissions[perm.key] ? 'text-neutral-90 dark:text-white' : 'text-muted'}`}>
                          {perm.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm transition-colors ${
                            config.dataPermissions[perm.key]
                              ? 'text-neutral-90 dark:text-white font-medium'
                              : 'text-muted'
                          }`}>{perm.label}</p>
                        </div>
                        <ToggleSwitch
                          checked={config.dataPermissions[perm.key]}
                          onChange={() => updatePermission(currentUser!.id, perm.key, !config.dataPermissions[perm.key])}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-boundary overflow-hidden h-full flex flex-col">
                <div className="px-5 py-3.5 border-b border-boundary flex items-center gap-2">
                  <span className="text-base leading-none">💬</span>
                  <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Probar asistente</h2>
                  <span className="text-xs text-muted ml-auto font-mono truncate max-w-[120px]">
                    {config.provider}·{config.model}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <InlineChat config={config} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-boundary overflow-hidden">
            <div className="px-5 py-3.5 border-b border-boundary flex items-center gap-2">
              <span className="text-base leading-none">ℹ️</span>
              <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Información</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoItem icon={<Bot size={15} />} title="Datos locales" desc="Con Ollama los datos nunca salen de tu navegador." />
                <InfoItem icon={<Shield size={15} />} title="API Key cifrada" desc="Se guarda cifrada en localStorage de tu navegador." />
                <InfoItem icon={<RefreshCw size={15} />} title="Sin pérdida de permisos" desc="Cambiá de proveedor sin perder la configuración de permisos." />
                <InfoItem icon={<Cloud size={15} />} title="Proveedores cloud" desc="Los datos se envían al API pero no se almacenan." />
              </div>
              <div className="mt-4 pt-4 border-t border-boundary">
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted hover:text-danger hover:bg-danger/5 transition-colors"
                >
                  <Trash2 size={14} />
                  Desconectar asistente
                </button>
              </div>
            </div>
          </div>
        </>
      ) : dirty ? (
        /* ── Edit mode ── */
        <>
          <div className="bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-boundary flex items-center gap-2">
              <span className="text-base leading-none">✏️</span>
              <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Editar configuración</h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-60 mb-3">Proveedor de IA</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.type}
                      disabled={p.disabled}
                      title={p.tooltip}
                      onClick={() => {
                        if (p.disabled) return
                        const defaults = AI_PROVIDER_DEFAULTS[p.type]
                        setDirty({ ...dirty, provider: p.type, baseUrl: defaults.baseUrl, model: defaults.model, apiKey: '' })
                        setAvailableModels([])
                        setTestResult('idle')
                        setTestError(null)
                      }}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition-all duration-300 ${
                        p.disabled
                          ? 'border-dashed border-neutral-30 dark:border-neutral-60 bg-neutral-5 dark:bg-neutral-85 opacity-50 cursor-not-allowed'
                          : dirty.provider === p.type
                            ? 'border-boundary bg-card shadow-md ring-2 ring-neutral-90 dark:ring-white'
                            : 'border-boundary bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:shadow-sm cursor-pointer'
                      }`}
                    >
                      {!p.disabled && dirty.provider === p.type && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-neutral-90 dark:bg-white flex items-center justify-center ring-1 ring-neutral-90/20 dark:ring-white/20">
                          <Check size={12} className="text-white dark:text-neutral-90" strokeWidth={3} />
                        </div>
                      )}
                      <div className={`p-3 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        p.disabled ? 'bg-neutral-10 dark:bg-neutral-75' :
                        dirty.provider === p.type
                          ? 'bg-neutral-5 dark:bg-neutral-75 ring-1 ring-neutral-90/10 dark:ring-white/10'
                          : 'bg-neutral-5 dark:bg-neutral-75'
                      }`}>
                        {p.icon}
                      </div>
                      <span className={`text-xs font-semibold leading-tight ${
                        p.disabled ? 'text-neutral-50' : 'text-neutral-90 dark:text-white'
                      }`}>{p.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        p.badge === 'Gratis' ? 'bg-success/10 text-success' :
                        p.badge === 'Pronto' ? 'bg-warning/10 text-warning' :
                        'bg-neutral-10 dark:bg-neutral-75 text-muted'
                      }`}>{p.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-5 border-t border-boundary">
                <div className={`p-2.5 rounded-xl text-lg ${
                  dirty.provider === 'ollama' ? 'bg-neutral-5 dark:bg-neutral-75' :
                  dirty.provider === 'groq' ? 'bg-neutral-5 dark:bg-neutral-75' :
                  dirty.provider === 'openai' ? 'bg-neutral-5 dark:bg-neutral-75' :
                  'bg-neutral-5 dark:bg-neutral-75'
                }`}>
                  {PROVIDERS.find(p => p.type === dirty.provider)?.icon}
                </div>
                <div>
                  <span className="block text-sm font-semibold text-neutral-90 dark:text-white">
                    Configuración de {PROVIDERS.find(p => p.type === dirty.provider)?.name}
                  </span>
                  <span className="text-xs text-muted">{PROVIDERS.find(p => p.type === dirty.provider)?.desc}</span>
                </div>
              </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-60 mb-1.5">URL del servidor</label>
                  <input
                    type="text"
                    value={dirty.baseUrl}
                    onChange={(e) => setDirty({ ...dirty, baseUrl: e.target.value })}
                    className="w-full bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-lg px-3 py-2 text-sm text-neutral-90 dark:text-white placeholder-neutral-40 focus:outline-none focus:ring-1 focus:ring-neutral-50 font-mono transition-all"
                  />
                </div>

                {dirty.provider !== 'ollama' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-60 mb-1.5">API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={dirty.apiKey}
                        onChange={(e) => setDirty({ ...dirty, apiKey: e.target.value })}
                        className="w-full bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-lg pl-3 pr-9 py-2 text-sm text-neutral-90 dark:text-white placeholder-neutral-40 focus:outline-none focus:ring-1 focus:ring-neutral-50 font-mono transition-all"
                        placeholder={dirty.provider === 'groq' ? 'gsk_...' : 'sk-...'}
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-neutral-90 dark:hover:text-white transition-colors"
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-muted mt-1">Se guarda cifrada en localStorage de tu navegador.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-60 mb-1.5">Modelo</label>
                  {availableModels.length > 0 ? (
                    <Select
                      value={dirty.model}
                      onChange={(v) => setDirty({ ...dirty, model: v })}
                      options={availableModels}
                      searchable
                      placeholder="Buscá o seleccioná un modelo..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={dirty.model}
                      onChange={(e) => setDirty({ ...dirty, model: e.target.value })}
                      className="w-full bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-lg px-3 py-2 text-sm text-neutral-90 dark:text-white placeholder-neutral-40 focus:outline-none focus:ring-1 focus:ring-neutral-50 transition-all"
                      placeholder={AI_PROVIDER_DEFAULTS[dirty.provider]?.model ?? ''}
                    />
                  )}
                </div>

                <div className="bg-neutral-5 dark:bg-neutral-85 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Wifi size={14} className="text-muted" />
                    <span className="text-sm font-medium text-muted">Prueba de conexión</span>
                    <span className="text-xs text-muted ml-auto">Requerido para guardar</span>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testResult === 'testing'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-90 dark:bg-white text-white dark:text-neutral-90 hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50"
                  >
                    {testResult === 'testing' ? (
                      <><Loader2 size={14} className="animate-spin" /> Probando conexión...</>
                    ) : (
                      <><Wifi size={14} /> Probar conexión</>
                    )}
                  </button>
                  {testResult === 'success' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 text-sm text-success font-medium">
                      <Check size={14} />
                      Conexión exitosa
                      {availableModels.length > 0 && ` · ${availableModels.length} modelo(s) disponible(s)`}
                    </div>
                  )}
                  {testResult === 'error' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 text-sm text-danger font-medium">
                      <WifiOff size={14} />
                      {testError}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-boundary">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-neutral-90 dark:hover:text-white hover:bg-neutral-10 dark:hover:bg-neutral-80 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEditing}
                    disabled={testResult !== 'success'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-90 dark:bg-white text-white dark:text-neutral-90 hover:opacity-90 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save size={14} />
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-card rounded-xl border border-boundary overflow-hidden">
                <div className="px-5 py-3.5 border-b border-boundary flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">🛡️</span>
                    <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Permisos de datos</h2>
                  </div>
                  <span className="text-xs text-muted tabular-nums">{activePerms}/{totalPerms}</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-1.5">
                    {PERMISSION_DEFS.map((perm) => (
                      <label
                        key={perm.key}
                        title={perm.tooltip}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-all cursor-pointer ${
                          config.dataPermissions[perm.key]
                            ? 'bg-neutral-10 dark:bg-neutral-80'
                            : 'hover:bg-neutral-5 dark:hover:bg-neutral-85'
                        }`}
                      >
                        <span className={`shrink-0 ${config.dataPermissions[perm.key] ? 'text-neutral-90 dark:text-white' : 'text-muted'}`}>
                          {perm.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm transition-colors ${
                            config.dataPermissions[perm.key]
                              ? 'text-neutral-90 dark:text-white font-medium'
                              : 'text-muted'
                          }`}>{perm.label}</p>
                        </div>
                        <ToggleSwitch
                          checked={config.dataPermissions[perm.key]}
                          onChange={() => updatePermission(currentUser!.id, perm.key, !config.dataPermissions[perm.key])}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-boundary overflow-hidden h-full flex flex-col">
                <div className="px-5 py-3.5 border-b border-boundary flex items-center gap-2">
                  <span className="text-base leading-none">💬</span>
                  <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Probar asistente</h2>
                  <span className="text-xs text-muted ml-auto font-mono truncate max-w-[120px]">
                    {config.provider}·{config.model}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <InlineChat config={config} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-boundary overflow-hidden">
            <div className="px-5 py-3.5 border-b border-boundary flex items-center gap-2">
              <span className="text-base leading-none">ℹ️</span>
              <h2 className="text-sm font-semibold text-neutral-90 dark:text-white">Información</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoItem icon={<Bot size={15} />} title="Datos locales" desc="Con Ollama los datos nunca salen de tu navegador." />
                <InfoItem icon={<Shield size={15} />} title="API Key cifrada" desc="Se guarda cifrada en localStorage de tu navegador." />
                <InfoItem icon={<RefreshCw size={15} />} title="Sin pérdida de permisos" desc="Cambiá de proveedor sin perder la configuración de permisos." />
                <InfoItem icon={<Cloud size={15} />} title="Proveedores cloud" desc="Los datos se envían al API pero no se almacenan." />
              </div>
              <div className="mt-4 pt-4 border-t border-boundary">
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted hover:text-danger hover:bg-danger/5 transition-colors"
                >
                  <Trash2 size={14} />
                  Desconectar asistente
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function InfoItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-5 dark:bg-neutral-85">
      <div className="w-8 h-8 rounded-lg bg-card border border-boundary flex items-center justify-center shrink-0 text-muted">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-90 dark:text-white">{title}</p>
        <p className="text-sm text-muted mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange() }}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked
          ? 'bg-neutral-60 dark:bg-neutral-40'
          : 'bg-neutral-20 dark:bg-neutral-70'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
