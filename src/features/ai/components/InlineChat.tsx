import { useState, useRef, useEffect, memo } from 'react'
import { Send, X, Loader2, Terminal, User, Copy, Sparkles } from 'lucide-react'
import type { AiProviderConfig, AiChatMessage } from '../types'
import { useAiChat } from '../hooks/useAiChat'
import { useCopy } from '@/hooks/useCopy'
import { Markdown } from '@/lib/markdown'

// ─── Inline Chat Preview ─────────────────────────────────────────

export function InlineChat({ config }: { config: AiProviderConfig }) {
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
        <div className="flex items-center gap-2 bg-neutral-5 dark:bg-neutral-85 rounded-xl border border-boundary has-[:focus]:border-neutral-40 dark:has-[:focus]:border-neutral-50 transition-all duration-200 px-3 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Escribí una consulta de prueba..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-neutral-90 dark:text-white placeholder-neutral-40 dark:placeholder-neutral-60 focus:outline-none disabled:opacity-50 py-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-1.5 rounded-lg text-neutral-40 hover:text-neutral-90 dark:hover:text-white hover:bg-neutral-15 dark:hover:bg-neutral-75 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
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

// ─── Chat Bubble ──────────────────────────────────────────────────

const ChatBubble = memo(function ChatBubble({ msg, index }: { msg: AiChatMessage; index: number }) {
  const isUser = msg.role === 'user'
  const isTool = msg.role === 'tool'
  const { copiedId, copy } = useCopy()
  const copied = copiedId === msg.id

  if (isTool) {
    return (
      <div
        className="flex items-center justify-center gap-1.5 py-0.5"
        style={{ animation: `fadeSlideIn 300ms ease-out ${index * 30}ms forwards`, opacity: 0 }}
      >
        <div className="w-1 h-1 rounded-full bg-neutral-30 dark:bg-neutral-60 shrink-0" />
        <span className="text-[10px] text-neutral-50 dark:text-neutral-50 font-mono truncate max-w-[180px]">
          {msg.toolName ?? 'consulta'}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-start gap-2 group ${isUser ? 'flex-row-reverse' : ''}`}
      style={{ animation: `fadeSlideIn 300ms ease-out ${index * 30}ms forwards`, opacity: 0 }}
    >
      <div
        className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-neutral-30 dark:bg-neutral-60'
            : 'bg-gradient-to-br from-neutral-50 to-neutral-70 dark:from-neutral-40 dark:to-neutral-20'
        }`}
      >
        {isUser ? (
          <User size={11} className="text-white" />
        ) : (
          <Sparkles size={10} className="text-white" />
        )}
      </div>
      <div className={isUser ? 'max-w-[80%]' : 'flex-1 min-w-0'}>
        {isUser ? (
          <div className="bg-neutral-20 dark:bg-neutral-70 text-neutral-90 dark:text-white rounded-xl rounded-tr-sm px-3 py-2 text-xs leading-relaxed shadow-sm">
            {msg.content}
          </div>
        ) : (
          <div className="pl-3 border-l-2 border-primary/20 dark:border-primary/30 space-y-0.5">
            <Markdown text={msg.content} />
          </div>
        )}
        <button
          onClick={() => copy(msg.content, msg.id)}
          className={`mt-0.5 flex items-center gap-1 text-[10px] transition-all ${
            copied
              ? 'text-success'
              : 'text-neutral-40 dark:text-neutral-50 opacity-0 group-hover:opacity-100'
          } hover:text-neutral-60 dark:hover:text-neutral-30`}
        >
          <Copy size={11} />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
})
