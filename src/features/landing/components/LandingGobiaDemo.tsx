const MSGS = [
  {
    from: 'user',
    text: '¿Cuál es el THI actual y qué dimensiones están más bajas?',
  },
  {
    from: 'gobia',
    text: [
      'El **THI compuesto** es **86/100** ↑ +4.2% este mes.',
      '',
      'Dimensiones más críticas:',
      '• **Costos** — 55% — por debajo del umbral',
      '• **Riesgo** — 60% — requiere atención',
      '• **Delivery** — 65% — mejora posible',
      '',
      'Todas las 7 dimensiones tienen drill-down en el dashboard con distribución por severidad.',
    ].join('\n'),
  },
  {
    from: 'user',
    text: '¿Qué apps tienen vulnerabilidades críticas?',
  },
  {
    from: 'gobia',
    text: [
      '12 aplicaciones con vulnerabilidades activas. **4 con criticidad alta (P1):**',
      '',
      '• **ERP Financiero** — 3 vulns (CVSS 9.1) — vencidas',
      '• **Portal Clientes** — 2 vulns (CVSS 7.5) — en SLA',
      '• **API Gateway** — 1 vuln (CVSS 9.8) — crítica',
      '• **CRM Interno** — 1 vuln (CVSS 8.2) — sin asignar',
      '',
      '¿Quieres que genere un reporte de estas o las asigne a un equipo?',
    ].join('\n'),
  },
  {
    from: 'user',
    text: 'Crea un OKR para mejorar seguridad en Q3',
  },
  {
    from: 'gobia',
    text: [
      '✅ **OKR creado** — Q3 2026 · on track',
      '',
      '**Objetivo:** Reducir exposición a vulnerabilidades críticas',
      '• KR1: Cerrar 100% de P1 abiertas → 0/3 (0%)',
      '• KR2: Reducir CVSS promedio a < 5.0 → actual: 7.2',
      '• KR3: SLA de remediación < 48h → Pendiente',
      '',
      'Vinculado a 2 equipos DORA. ¿Deseas agregar algún entregable?',
    ].join('\n'),
  },
]

function GobiaMessage({ msg, index }: { msg: (typeof MSGS)[number]; index: number }) {
  if (msg.from === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="font-mono text-xs leading-relaxed rounded-sm"
          style={{
            color: '#e8edf5',
            background: 'rgba(0,255,136,0.06)',
            padding: '10px 14px',
            maxWidth: '80%',
          }}
        >
          {msg.text}
        </div>
      </div>
    )
  }

  return (
    <div key={index} className="gobia-msg" style={{ animationDelay: `${index * 2.2}s` }}>
      <div className="flex items-start gap-3">
        <div
          className="w-5 h-5 shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
          style={{ border: '1px solid rgba(0,255,136,0.15)', borderRadius: 3, color: '#00ff88' }}
        >
          G
        </div>
        <div
          className="font-mono text-xs leading-relaxed rounded-sm"
          style={{
            color: '#b0b8c8',
            background: 'rgba(0,255,136,0.02)',
            padding: '10px 14px',
            maxWidth: '90%',
          }}
        >
          {msg.text.split('\n').map((line, j, arr) => (
            <span key={j}>
              {line.startsWith('• ') ? (
                <span style={{ color: '#6b7a99' }}>{line}</span>
              ) : line.startsWith('✅ ') ? (
                <span style={{ color: '#00ff88' }}>{line}</span>
              ) : (
                <span>{line}</span>
              )}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LandingGobiaDemo() {
  return (
    <>
      <section className="py-16">
        <h2
          className="font-mono text-[13px] uppercase tracking-[3px] mb-10 text-center"
          style={{ color: '#6b7a99' }}
        >
          GobIA — Asistente de Gobierno
        </h2>
        <div
          className="max-w-[640px] mx-auto rounded-sm overflow-hidden"
          style={{ border: '1px solid rgba(0,255,136,0.08)', background: 'rgba(0,0,0,0.3)' }}
        >
          <div
            className="flex items-center gap-3 px-5 py-3"
            style={{
              borderBottom: '1px solid rgba(0,255,136,0.06)',
              background: 'rgba(0,255,136,0.02)',
            }}
          >
            <div
              className="w-6 h-6 flex items-center justify-center text-[11px] font-bold"
              style={{ border: '1px solid rgba(0,255,136,0.2)', borderRadius: 4, color: '#00ff88' }}
            >
              G
            </div>
            <div className="flex-1">
              <div className="font-mono text-[11px] font-semibold" style={{ color: '#e8edf5' }}>
                GobIA
              </div>
              <div
                className="font-mono text-[9px] tracking-wider"
                style={{ color: 'rgba(0,255,136,0.3)' }}
              >
                online · groq/llama-4
              </div>
            </div>
          </div>

          <div className="px-5 py-6 space-y-5">
            {MSGS.map((msg, i) => (
              <GobiaMessage key={i} msg={msg} index={i} />
            ))}

            <div className="gobia-msg" style={{ animationDelay: '8.8s' }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-5 h-5 shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                  style={{
                    border: '1px solid rgba(0,255,136,0.15)',
                    borderRadius: 3,
                    color: '#00ff88',
                  }}
                >
                  G
                </div>
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{
                        background: '#00ff88',
                        animation: `gobia-dot 1.4s ease-in-out infinite ${d * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`.gobia-msg { opacity: 0; animation: gobia-fade-in 0.6s ease-out forwards; } @keyframes gobia-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } } @keyframes gobia-dot { 0%, 60%, 100% { opacity: 0.2; } 30% { opacity: 1; } }`}</style>
    </>
  )
}
