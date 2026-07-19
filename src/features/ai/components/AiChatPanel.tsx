import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Settings, CornerDownLeft, Terminal, Clipboard, Check } from 'lucide-react'
import type { AiProviderConfig, AiChatMessage } from '../types'
import { useAiChat } from '../hooks/useAiChat'

// ─── Copy hook ────────────────────────────────────────────────────

function useCopy(delay = 1800) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const copy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopiedId(null), delay)
  }, [delay])
  return { copiedId, copy }
}

// ─── Keyframes ────────────────────────────────────────────────────

const KF = `
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes loadPulse { 0%,100% { opacity: .3; } 50% { opacity: .8; } }
`

// ─── Render markdown → HTML ───────────────────────────────────────

function renderMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-white">$1</strong>',
    )
    .replace(/\*(.+?)\*/g, '<em class="text-neutral-20">$1</em>')
    .replace(
      /`(.+?)`/g,
      '<code class="bg-neutral-80 px-1.5 py-0.5 rounded text-[11px] font-mono text-neutral-10">$1</code>',
    )
    .replace(
      /^- (.+)$/gm,
      '<span class="block ml-4 text-sm leading-relaxed text-neutral-20">• $1</span>',
    )
    .replace(
      /^(\d+)\. (.+)$/gm,
      '<span class="block ml-4 text-sm leading-relaxed text-neutral-20">$1. $2</span>',
    )
    .replace(/^---$/gm, '<hr class="my-2 border-neutral-70" />')
    .replace(/\n\n/g, '</p><p class="text-sm leading-relaxed text-neutral-20">')
    .replace(/\n/g, '<br />')
}

// ─── Provider label ───────────────────────────────────────────────

function providerLabel(config: AiProviderConfig): string {
  switch (config.provider) {
    case 'ollama': return 'Ollama'
    case 'groq': return 'Groq'
    case 'anthropic': return 'Claude'
    case 'openai': return 'OpenAI'
  }
}

// ─── Quick commands ───────────────────────────────────────────────

interface CmdGroup { group: string; items: { label: string; cmd: string }[] }
const CMD_GROUPS: CmdGroup[] = [
  {
    group: 'Catálogo',
    items: [
      { label: 'Aplicaciones por criticidad', cmd: '¿Cuántas aplicaciones hay por criticidad?' },
      { label: 'Microservicios activos', cmd: 'Mostrame los microservicios activos con sus aplicaciones' },
      { label: 'Tecnologías EOL', cmd: 'Tecnologías con soporte vencido o por vencer' },
      { label: 'Dependencias entre apps', cmd: 'Dependencias entre aplicaciones' },
    ],
  },
  {
    group: 'Seguridad',
    items: [
      { label: 'Vulnerabilidades críticas', cmd: 'Vulnerabilidades críticas abiertas' },
      { label: 'Incidentes activos', cmd: 'Incidentes activos por severidad' },
      { label: 'Vulnerabilidades vencidas', cmd: 'Vulnerabilidades con SLA vencido' },
    ],
  },
  {
    group: 'Ejecución',
    items: [
      { label: 'Compromisos vencidos', cmd: 'Compromisos vencidos' },
      { label: 'Tareas por prioridad', cmd: 'Tareas pendientes por prioridad' },
      { label: 'Planes activos', cmd: 'Planes en progreso con avance' },
      { label: 'Bloqueos críticos', cmd: 'Bloqueos activos por severidad' },
    ],
  },
  {
    group: 'Personas',
    items: [
      { label: 'Miembros por equipo', cmd: '¿Cuántos miembros hay por equipo?' },
      { label: 'Sprints del trimestre', cmd: 'Sprints del trimestre actual' },
      { label: 'One-on-Ones recientes', cmd: 'One-on-Ones de este mes' },
    ],
  },
  {
    group: 'Estrategia',
    items: [
      { label: 'OKRs en riesgo', cmd: 'Objetivos en riesgo o atrasados' },
      { label: 'Health Index', cmd: 'Health Index por unidad de negocio' },
      { label: 'Entregables pendientes', cmd: 'Entregables por vencer este mes' },
    ],
  },
  {
    group: 'Equipamiento',
    items: [
      { label: 'Equipos asignados', cmd: 'Equipos asignados por persona' },
      { label: 'Tickets abiertos', cmd: 'Tickets de equipamiento abiertos' },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────

function MessageBanner({ msg, index }: { msg: AiChatMessage; index: number }) {
  const isUser = msg.role === 'user'
  const isTool = msg.role === 'tool'

  if (isTool) {
    return (
      <div
        className="flex items-center gap-2 py-1 px-1"
        style={{ animation: `fadeIn 250ms ease-out ${index * 20}ms both` }}
      >
        <span className="w-1 h-1 rounded-full bg-neutral-60 shrink-0" />
        <span className="text-[10px] text-neutral-50 font-mono italic tracking-wide uppercase">
          {msg.toolName ?? 'tool'} · {msg.content.slice(0, 60).replace(/\n/g, ' ')}
          {msg.content.length > 60 ? '…' : ''}
        </span>
      </div>
    )
  }

  return (
    <div
      className="group"
      style={{ animation: `fadeIn 250ms ease-out ${index * 30}ms both` }}
    >
      {isUser ? (
        <div className="flex items-start gap-2 pl-1">
          <span className="text-neutral-50 font-mono text-sm leading-relaxed select-none shrink-0 mt-px">
            ❯
          </span>
          <span className="text-sm leading-relaxed text-neutral-20 font-medium">
            {msg.content}
          </span>
        </div>
      ) : (
        <div className="relative pl-5">
          <div
            className="absolute left-0 top-1 bottom-1 w-px bg-neutral-70/60 rounded-full"
          />
          <div
            className="text-sm leading-relaxed text-neutral-20 [&_strong]:text-white [&_code]:text-neutral-10 [&_hr]:border-neutral-70"
            dangerouslySetInnerHTML={{
              __html: renderMd(msg.content),
            }}
          />
          {msg.toolCalls && msg.toolCalls.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {msg.toolCalls.map((tc) => (
                <span
                  key={tc.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-80 border border-neutral-70 text-[10px] text-neutral-40 font-mono"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-50" />
                  {tc.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col min-h-full px-4 py-6 select-none">
      {/* Terminal header */}
      <div className="flex items-center gap-2.5 mb-8 px-1">
        <div className="w-8 h-8 rounded-lg bg-neutral-80 border border-neutral-70 flex items-center justify-center">
          <Terminal size={15} className="text-neutral-30" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-10 tracking-tight">
            Copilot TGP
          </p>
          <p className="text-[10px] text-neutral-40 font-mono">
            Consultá datos de la plataforma en lenguaje natural
          </p>
        </div>
      </div>

      {/* Command palette */}
      <div className="space-y-5 flex-1 overflow-y-auto scrollbar-thin pr-1">
        {CMD_GROUPS.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-semibold text-neutral-60 uppercase tracking-widest mb-2 px-1">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                  <button
                          key={item.cmd}
                          onClick={() => onPick(item.cmd)}
                          className="w-full text-left px-3 py-2 rounded-lg text-[12px] text-neutral-30 hover:text-neutral-10 bg-neutral-85/50 hover:bg-neutral-80 border border-neutral-80 hover:border-neutral-70 transition-all duration-150 active:scale-[0.98]"
                        >
                          <span className="text-neutral-50 font-mono mr-2 text-[10px]">↳</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hint */}
      <p className="text-[10px] text-neutral-50 text-center mt-6 pt-4 border-t border-neutral-80 font-mono">
        Escribí una pregunta o seleccioná un comando  ·  Enter para enviar
      </p>
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 px-5 py-3" style={{ animation: 'fadeIn 200ms ease-out both' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-50 animate-[loadPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-50 animate-[loadPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: '300ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-50 animate-[loadPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: '600ms' }} />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────

interface AiChatPanelProps {
  config: AiProviderConfig
  onClose?: () => void
  isOpen: boolean
}

export function AiChatPanel({ config, onClose, isOpen }: AiChatPanelProps) {
  const navigate = useNavigate()
  const { messages, sendMessage, isLoading, error, clearMessages } = useAiChat({ config })
  const [input, setInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const [animClass, setAnimClass] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { copiedId, copy } = useCopy()

  // Mount / unmount animation
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      requestAnimationFrame(() => setAnimClass('slide-in'))
    } else if (mounted) {
      setAnimClass('slide-out')
      const timer = setTimeout(() => { setMounted(false); setAnimClass('') }, 250)
      return () => clearTimeout(timer)
    }
  }, [isOpen, mounted])

  // Auto-focus
  useEffect(() => {
    if (animClass === 'slide-in') inputRef.current?.focus()
  }, [animClass])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!mounted) return null

  const panelAnim = animClass === 'slide-in'
    ? 'animate-[slideInRight_250ms_cubic-bezier(0.16,1,0.3,1)_both]'
    : animClass === 'slide-out'
    ? 'animate-[slideOutRight_250ms_cubic-bezier(0.16,1,0.3,1)_both]'
    : ''

  return (
    <>
      <style>{KF}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-neutral-95/40"
        style={{ animation: `fadeIn 200ms ease-out both` }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[440px] max-w-[calc(100vw-2rem)] z-50 flex flex-col border-l border-neutral-70/60 ${panelAnim}`}
        style={{
          background: 'rgba(18,18,20,0.96)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: '-8px 0 40px -12px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── Header ── */}
        <div className="relative flex items-center gap-3 px-4 py-3 border-b border-neutral-80 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-neutral-80 border border-neutral-70 flex items-center justify-center">
            <Terminal size={13} className="text-neutral-30" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-20 tracking-tight">
                Copilot TGP
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
            </div>
            <span className="text-[10px] text-neutral-50 font-mono">
              {providerLabel(config)} · {config.model}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigate('/ai/settings')}
              className="p-1.5 rounded-lg text-neutral-50 hover:text-neutral-20 hover:bg-neutral-80 transition-colors"
              title="Configuración"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={clearMessages}
              className="p-1.5 rounded-lg text-neutral-50 hover:text-neutral-20 hover:bg-neutral-80 transition-colors"
              title="Limpiar conversación"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-50 hover:text-neutral-20 hover:bg-neutral-80 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-80 scrollbar-track-transparent">
          {messages.length === 0 && !isLoading ? (
            <EmptyState onPick={(text) => { setInput(text); inputRef.current?.focus() }} />
          ) : (
            <div className="px-4 space-y-2">
              {messages
                .filter((m) => m.role !== 'system')
                .map((msg, i) => (
                  <div key={msg.id} className="relative group/message">
                    <MessageBanner msg={msg} index={i} />
                    {/* Copy button */}
                    {msg.role === 'assistant' && msg.content && (
                      <button
                        onClick={() => copy(msg.content, msg.id)}
                        className="absolute -right-1 -top-1 p-1.5 rounded-lg text-neutral-50 hover:text-neutral-10 bg-neutral-85/80 hover:bg-neutral-80 opacity-0 group-hover/message:opacity-100 transition-all duration-150"
                        title="Copiar respuesta"
                      >
                        {copiedId === msg.id ? <Check size={14} /> : <Clipboard size={14} />}
                      </button>
                    )}
                  </div>
                ))}
              {isLoading && <LoadingDots />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div className="px-3 py-3 border-t border-neutral-80 shrink-0">
          {error && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-danger/10 text-[11px] text-danger leading-relaxed border border-danger/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-neutral-90 rounded-xl border border-neutral-75 has-[:focus]:border-neutral-60 has-[:focus]:ring-1 has-[:focus]:ring-neutral-60/30 transition-all duration-200 px-3 py-2">
            <span className="text-neutral-50 font-mono text-sm select-none shrink-0">
              ❯
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Preguntá algo a la plataforma..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm font-mono text-neutral-20 placeholder-neutral-60 focus:outline-none disabled:opacity-40 py-0.5"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-1 rounded-lg text-neutral-50 hover:text-neutral-20 hover:bg-neutral-80 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              title="Enviar (Enter)"
            >
              {isLoading ? (
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <CornerDownLeft size={15} />
              )}
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-[9px] text-neutral-60 mt-1.5 text-center font-mono">
            Enter para enviar · Alt+A para abrir/cerrar
          </p>
        </div>
      </div>
    </>
  )
}
