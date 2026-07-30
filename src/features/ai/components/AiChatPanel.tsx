import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Settings, CornerDownLeft, Clipboard, Check, Plus, ChevronDown, Sparkles } from 'lucide-react'
import type { AiProviderConfig } from '../types'
import { useAiChat } from '../hooks/useAiChat'
import { useCopy } from '@/hooks/useCopy'
import type { AiChatPanelProps } from './aiChatHelpers'
import { KF, providerLabel } from './aiChatHelpers'
import { MessageBanner, EmptyState, LoadingDots, ConversationList } from './aiChatComponents'







// ─── Main component ───────────────────────────────────────────────

export function AiChatPanel({ config, onClose, isOpen }: AiChatPanelProps) {
  const navigate = useNavigate()
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    conversations,
    activeConversation,
    switchConversation,
    newConversation,
    deleteConv,
  } = useAiChat({ config })
  const [input, setInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const [animClass, setAnimClass] = useState('')
  const [showConvList, setShowConvList] = useState(false)
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
      const timer = setTimeout(() => {
        setMounted(false)
        setAnimClass('')
        setShowConvList(false)
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [isOpen, mounted])

  // Auto-focus
  useEffect(() => {
    if (animClass === 'slide-in') inputRef.current?.focus()
  }, [animClass])

  // Auto-scroll — solo cuando se agregan nuevos mensajes (no en cambio de conversación)
  const prevLenRef = useRef(0)
  useEffect(() => {
    const len = messages.filter((m) => m.role !== 'system').length
    if (len > prevLenRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLenRef.current = len
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    setShowConvList(false)
    await sendMessage(text)
  }, [input, isLoading, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleNewConversation = useCallback(async () => {
    setShowConvList(false)
    await newConversation()
  }, [newConversation])

  const handleSwitchConversation = useCallback(async (id: string) => {
    await switchConversation(id)
  }, [switchConversation])

  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConv(id)
  }, [deleteConv])

  if (!mounted) return null

  const panelAnim =
    animClass === 'slide-in'
      ? 'animate-[slideInRight_250ms_cubic-bezier(0.16,1,0.3,1)_both]'
      : animClass === 'slide-out'
        ? 'animate-[slideOutRight_250ms_cubic-bezier(0.16,1,0.3,1)_both]'
        : ''

  return (
    <>
      <style>{KF}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-canvas/40"
        style={{ animation: `fadeIn 200ms ease-out both` }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[90vw] sm:w-1/2 max-w-[800px] z-50 flex flex-col border-l border-boundary ${panelAnim}`}
        style={{
          background: 'var(--color-card)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: '-8px 0 40px -12px rgba(0,0,0,0.35)',
        }}
      >
        {/* ── Header ── */}
        <div className="relative flex items-center gap-2 px-4 py-3 border-b border-boundary shrink-0">
          <div className="w-7 h-7 rounded-lg bg-subtle border border-boundary flex items-center justify-center shrink-0">
            <Sparkles size={13} className="text-secondary" />
          </div>

          {/* Conversation title + switcher */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setShowConvList((v) => !v)}
              className="flex items-center gap-1.5 w-full hover:bg-subtle rounded-lg px-1.5 py-1 -ml-1.5 transition-colors"
            >
              <span className="text-sm font-semibold text-default tracking-tight truncate">
                {activeConversation?.title ?? 'Copilot TGP'}
              </span>
              <ChevronDown size={12} className="text-muted shrink-0 mt-px" />
            </button>
            <span className="text-[10px] text-muted font-mono block px-1.5">
              {providerLabel(config)} · {config.model}
              {activeConversation && messages.length > 0 && (
                <> · {messages.filter((m) => m.role !== 'system').length} mensajes</>
              )}
            </span>
          </div>

          {/* Conversation list dropdown */}
          {showConvList && (
            <ConversationList
              conversations={conversations}
              activeId={activeConversation?.id}
              onSelect={handleSwitchConversation}
              onNew={handleNewConversation}
              onDelete={handleDeleteConversation}
              onClose={() => setShowConvList(false)}
            />
          )}

          <div className="flex items-center gap-0.5">
            <button
              onClick={handleNewConversation}
              className="p-1.5 rounded-lg text-muted hover:text-default hover:bg-subtle transition-colors"
              title="Nueva conversación"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => navigate('/ai/settings')}
              className="p-1.5 rounded-lg text-muted hover:text-default hover:bg-subtle transition-colors"
              title="Configuración"
            >
              <Settings size={14} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-default hover:bg-subtle transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-neutral-80 scrollbar-track-transparent">
          {messages.length === 0 && !isLoading ? (
            <EmptyState
              onPick={(text) => {
                setInput(text)
                inputRef.current?.focus()
              }}
            />
          ) : (
            <div className="px-4 space-y-3">
              {messages
                .filter((m) => m.role !== 'system')
                .map((msg, i) => (
                  <div key={msg.id} className="relative group/message">
                    <MessageBanner msg={msg} index={i} />
                    {/* Copy button */}
                    {msg.role === 'assistant' && msg.content && (
                      <button
                        onClick={() => copy(msg.content, msg.id)}
                        className="absolute -right-1 -top-1 p-1.5 rounded-lg text-muted hover:text-default bg-card/80 hover:bg-subtle opacity-0 group-hover/message:opacity-100 transition-all duration-150"
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
        <div className="px-3 py-3 border-t border-boundary shrink-0">
          {error && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-danger/10 text-[11px] text-danger leading-relaxed border border-danger/20">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-canvas rounded-xl border border-boundary has-[:focus]:border-primary has-[:focus]:ring-1 has-[:focus]:ring-primary/30 transition-all duration-200 px-3 py-2">
            <span className="text-muted font-mono text-sm select-none shrink-0">❯</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Preguntá algo a la plataforma..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm font-mono text-default placeholder-muted focus:outline-none disabled:opacity-40 py-0.5"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-1 rounded-lg text-muted hover:text-default hover:bg-subtle transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              title="Enviar (Enter)"
            >
              {isLoading ? (
                <svg
                  className="animate-spin"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <CornerDownLeft size={15} />
              )}
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-[9px] text-muted mt-1.5 text-center font-mono">
            Enter para enviar · Alt+A para abrir/cerrar
          </p>
        </div>
      </div>
    </>
  )
}
