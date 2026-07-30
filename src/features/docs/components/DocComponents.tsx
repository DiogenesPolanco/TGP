import { CircleHelp } from 'lucide-react'

/* ─── Tipografía ─── */

export function PageH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-mono text-2xl font-bold mb-1" style={{ color: '#e8edf5' }}>
      {children}
    </h1>
  )
}

export function Divider() {
  return <div className="w-12 h-px mb-8" style={{ background: '#00ff88' }} />
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-mono text-sm font-semibold mb-3 mt-8 first:mt-0"
      style={{ color: '#e8edf5' }}
    >
      {children}
    </h3>
  )
}

export function SubSection({ children }: { children: React.ReactNode }) {
  return (
    <h4
      className="font-mono text-[11px] font-semibold uppercase tracking-wider mb-2 mt-6"
      style={{ color: '#6b7a99' }}
    >
      {children}
    </h4>
  )
}

export function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed mb-4" style={{ color: '#8899bb' }}>
      {children}
    </p>
  )
}

export function Green({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#00ff88' }}>{children}</span>
}

/* ─── Código ─── */

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="font-mono text-xs px-1.5 py-0.5 rounded-sm"
      style={{
        background: 'rgba(0,255,136,0.06)',
        color: '#00ff88',
        border: '1px solid rgba(0,255,136,0.08)',
      }}
    >
      {children}
    </code>
  )
}

export function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="font-mono text-xs leading-relaxed p-4 rounded-sm mb-6 overflow-x-auto"
      style={{
        background: 'rgba(0,0,0,0.4)',
        color: '#b0b8c8',
        border: '1px solid rgba(0,255,136,0.06)',
      }}
    >
      <code>{children}</code>
    </pre>
  )
}

/* ─── Listas ─── */

export function BulletList({ children }: { children: React.ReactNode }) {
  return (
    <ul
      className="text-sm leading-relaxed mb-6 pl-5 space-y-1.5"
      style={{ color: '#8899bb', listStyle: 'disc' }}
    >
      {children}
    </ul>
  )
}

export function BulletListInline({ items }: { items: string[] }) {
  return (
    <ul className="font-mono text-xs leading-relaxed space-y-1 ml-0" style={{ color: '#8899bb' }}>
      {items.map((item, i) => (
        <li key={i} className="flex items-baseline gap-2">
          <span className="shrink-0" style={{ color: 'rgba(0,255,136,0.3)' }}>
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function StepList({ items }: { items: string[] }) {
  return (
    <ol
      className="font-mono text-xs leading-relaxed space-y-1.5 mb-0 ml-0"
      style={{ color: '#8899bb' }}
    >
      {items.map((item, i) => (
        <li key={i} className="flex items-baseline gap-2">
          <span
            className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
            style={{ background: 'rgba(0,255,136,0.08)', color: '#00ff88' }}
          >
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

/* ─── Tablas ─── */

export function Table({ rows }: { rows: string[][] }) {
  const cols = rows[0]?.length ?? 0
  return (
    <div className="overflow-x-auto mb-6" style={{ border: '1px solid rgba(0,255,136,0.06)' }}>
      <table className="w-full font-mono text-[11px] border-collapse">
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                borderBottom: ri < rows.length - 1 ? '1px solid rgba(0,255,136,0.04)' : 'none',
              }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-4 py-2.5"
                  style={{
                    color: ci === 0 ? '#6b7a99' : ri === 0 ? '#e8edf5' : '#8899bb',
                    borderRight: ci < cols - 1 ? '1px solid rgba(0,255,136,0.04)' : 'none',
                    fontWeight: ri === 0 ? 600 : ci === 0 ? 500 : 400,
                    background: ri === 0 ? 'rgba(0,255,136,0.02)' : 'transparent',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Troubleshooting ─── */

export function TroubleBlock({
  q,
  children,
  last,
}: {
  q: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className="pb-6 mb-6"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(0,255,136,0.06)' }}
    >
      <div className="flex items-start gap-3">
        <CircleHelp
          size={14}
          className="shrink-0 mt-0.5"
          style={{ color: 'rgba(0,255,136,0.3)' }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-mono text-sm font-semibold mb-3" style={{ color: '#e8edf5' }}>
            {q}
          </h4>
          {children}
        </div>
      </div>
    </div>
  )
}

export function TroubleSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div
        className="font-mono text-[10px] uppercase tracking-widest mb-1.5 inline-block px-1.5 py-0.5 rounded-sm"
        style={{ background: 'rgba(0,255,136,0.06)', color: '#00ff88' }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

export function DebugCode({ code }: { code: string }) {
  return (
    <pre
      className="font-mono text-[11px] leading-relaxed p-2.5 rounded-sm overflow-x-auto mt-1"
      style={{
        background: 'rgba(0,0,0,0.3)',
        color: '#b0b8c8',
        border: '1px solid rgba(0,255,136,0.04)',
      }}
    >
      <code>{code}</code>
    </pre>
  )
}
