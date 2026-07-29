import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession } from '@/services/auth/authService'
import {
  LayoutDashboard,
  Layers,
  Shield,
  Users,
  Crosshair,
  Kanban,
  CalendarClock,
  Bot,
} from 'lucide-react'

const THI_SCORE = 86
const TREND = '+4.2%'
const STARS = [
  { value: '100%', label: 'Privacidad', note: 'local-first' },
  { value: '0', label: 'Servidores', note: 'sin backend' },
  { value: '25+', label: 'Tablas', note: 'dexie.js' },
  { value: '7', label: 'Dimensiones', note: 'THI score compuesto' },
]
const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard THI',
    desc: '"Está todo bien" no es un reporte. El THI sí.',
    highlights: [
      'THI compuesto en 7 dimensiones',
      'KPIs ejecutivos con drill-down',
      'Tendencias y distribución por severidad',
    ],
  },
  {
    icon: Layers,
    title: 'Catálogo',
    desc: 'Esa app que nadie recuerda — existe y ya está documentada.',
    highlights: [
      'CRUD completo con búsqueda avanzada',
      'Filtros por criticidad, estado y BU',
      'Vulnerabilidades y riesgos heredados',
    ],
  },
  {
    icon: Shield,
    title: 'Seguridad',
    desc: 'Vulnerabilidades que no se arreglan solas. Pero al menos sabes cuáles son.',
    highlights: [
      'CVSS scoring y SLA tracking',
      'Incidentes P1–P4 con tiempos de respuesta',
      'Matriz de riesgos y hallazgos de auditoría',
    ],
  },
  {
    icon: Users,
    title: 'Equipos DORA',
    desc: 'Benchmarking real. Porque "hacemos deploy rápido" no es una métrica.',
    highlights: [
      'Deploy frequency, Lead time, CFR, MTTR',
      'Benchmarking Elite / Alto / Medio / Bajo',
      'Vinculación con OKRs y entregables',
    ],
  },
  {
    icon: Crosshair,
    title: 'OKRs',
    desc: 'Objetivos que no se pierden en el Slack del Q3.',
    highlights: [
      'Key Results con progreso automático',
      'Estados: on track, at risk, behind, achieved',
      'Vinculación con planes y ejecución',
    ],
  },
  {
    icon: Kanban,
    title: 'Ejecución',
    desc: 'Planes, blockers y compromisos. Todo lo que un líder necesita seguir.',
    highlights: [
      'Diagramas de Gantt y timeline diaria',
      'Bloqueos con escalamiento automático',
      'Mapa de dependencias y compromisos',
    ],
  },
  {
    icon: CalendarClock,
    title: 'Obsolescencia',
    desc: '"Esa versión salió hace 3 años" — sí, y ya deberías haber migrado.',
    highlights: [
      'Sincronización con endoflife.date',
      'Alertas de vencimiento y mapa global',
      'Impacto sobre aplicaciones y tecnologías',
    ],
  },
  {
    icon: Bot,
    title: 'GobIA',
    desc: 'Un asistente que responde. No que "procesa tu solicitud".',
    highlights: [
      'Consultas en lenguaje natural sobre tus datos',
      'Proveedores: OpenAI, Groq, Anthropic, Ollama',
      'Tool calls: auditoría, consultas, análisis',
    ],
  },
]

const R = 50
const CIRCUMFERENCE = 2 * Math.PI * R
const ARC_LENGTH = CIRCUMFERENCE * 0.86
const DASH_OFFSET = CIRCUMFERENCE - (THI_SCORE / 100) * ARC_LENGTH

export default function LandingPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (session) {
      navigate('/dashboard', { replace: true })
      return
    }
    setReady(true)
  }, [navigate])

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00ff88]/50 border-t-[#00ff88] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen font-sans overflow-x-hidden relative"
      style={{ background: '#080c14', color: '#c8d0e0' }}
    >
      {/* Background grid + glows + scanlines */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="fixed top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="fixed bottom-[-300px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(255,185,0,0.04) 0%, transparent 70%)' }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-[100]"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.015) 2px, rgba(0,255,136,0.015) 4px)',
        }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6">
        {/* NAV */}
        <nav
          style={{ borderBottom: '1px solid rgba(0,255,136,0.1)' }}
          className="flex items-center justify-between py-6"
        >
          <button
            onClick={() => navigate('/')}
            className="font-mono font-extrabold text-xl tracking-tight"
            style={{ color: '#00ff88' }}
          >
            TGP<span style={{ color: '#ffb900' }}>_</span>
          </button>
          <ul
            className="hidden md:flex gap-8 list-none text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#6b7a99' }}
          >
            {[
              { label: 'Dashboard', to: '/dashboard', external: false },
              { label: 'Funcionalidades', to: '#features', external: false, scroll: true },
              { label: 'GitHub', to: 'https://github.com/DiogenesPolanco/TGP', external: true },
              { label: 'Docs', to: '/docs', external: false },
            ].map((link) => (
              <li key={link.label}>
                <button
                  onClick={() => {
                    if (link.external) {
                      window.open(link.to, '_blank', 'noopener,noreferrer')
                    } else if (link.scroll) {
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                    } else {
                      navigate(link.to)
                    }
                  }}
                  className="bg-transparent border-none cursor-pointer transition-colors text-inherit text-xs font-semibold uppercase tracking-wider hover:text-[#00ff88]"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/dashboard')}
            className="font-mono text-[11px] font-semibold uppercase tracking-wider cursor-pointer transition-all"
            style={{
              background: 'transparent',
              border: '1px solid #00ff88',
              color: '#00ff88',
              padding: '10px 24px',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,255,136,0.1)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,136,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Acceder
          </button>
        </nav>

        {/* HERO */}
        <section className="py-[100px] grid md:grid-cols-2 gap-20 items-center">
          <div>
            <div
              className="inline-block font-mono text-[11px] font-medium uppercase tracking-wider mb-6 px-3.5 py-1.5"
              style={{
                color: '#00ff88',
                border: '1px solid rgba(0,255,136,0.2)',
                borderRadius: 2,
                background: 'rgba(0,255,136,0.04)',
              }}
            >
              ✦ Technology Governance Platform
            </div>
            <h1
              className="font-mono text-[52px] font-extrabold leading-[1.1] tracking-[-1.5px] mb-5"
              style={{ color: '#e8edf5' }}
            >
              Gobierno de TI
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                en tiempo real
              </span>
              <br />
              sin servidores<span style={{ color: '#ffb900' }}>.</span>
            </h1>
            <p
              className="text-base leading-relaxed mb-10 max-w-[460px]"
              style={{ color: '#6b7a99' }}
            >
              TGP es la primera plataforma de governance tecnológico 100% cliente-side. Gestiona
              aplicaciones, vulnerabilidades, equipos y obsolescencia con privacidad total — tus
              datos nunca salen de tu dispositivo.
            </p>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="font-mono text-[13px] font-bold uppercase tracking-wider cursor-pointer border-none transition-all"
                style={{
                  background: '#00ff88',
                  color: '#080c14',
                  padding: '14px 32px',
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,136,0.3)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                Comenzar →
              </button>
              <button
                onClick={() =>
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="font-mono text-[13px] font-semibold uppercase tracking-wider cursor-pointer transition-all"
                style={{
                  background: 'transparent',
                  color: '#6b7a99',
                  border: '1px solid rgba(107,122,153,0.3)',
                  padding: '14px 32px',
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#c8d0e0'
                  e.currentTarget.style.borderColor = '#6b7a99'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7a99'
                  e.currentTarget.style.borderColor = 'rgba(107,122,153,0.3)'
                }}
              >
                Explorar
              </button>
            </div>
          </div>

          {/* THI Gauge */}
          <div className="relative w-[280px] h-[280px] mx-auto">
            <svg
              viewBox="0 0 120 120"
              className="w-full h-full"
              style={{ transform: 'rotate(-90deg)' }}
            >
              <defs>
                <linearGradient id="gg" x1="0%" x2="100%">
                  <stop offset="0%" stopColor="#ffb900" />
                  <stop offset="50%" stopColor="#00ff88" />
                  <stop offset="100%" stopColor="#00ff88" />
                </linearGradient>
              </defs>
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="rgba(0,255,136,0.08)"
                strokeWidth="12"
              />
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="url(#gg)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE - ARC_LENGTH}`}
                strokeDashoffset={DASH_OFFSET}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <div
                className="font-mono text-[56px] font-extrabold leading-none"
                style={{ color: '#00ff88' }}
              >
                {THI_SCORE}
              </div>
              <div
                className="font-mono text-[11px] uppercase tracking-wider mt-2"
                style={{ color: '#6b7a99' }}
              >
                THI Score
              </div>
              <div className="font-mono text-[11px] mt-3" style={{ color: 'rgba(0,255,136,0.5)' }}>
                ↑ {TREND} este mes
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-px mt-10 pt-10"
          style={{ borderTop: '1px solid rgba(0,255,136,0.06)' }}
        >
          {STARS.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center py-5 px-4"
              style={{
                borderRight: i < STARS.length - 1 ? '1px solid rgba(0,255,136,0.06)' : 'none',
              }}
            >
              <div className="font-mono text-[28px] font-bold" style={{ color: '#e8edf5' }}>
                {stat.value}
              </div>
              <div
                className="font-mono text-[10px] uppercase tracking-wider mt-1.5"
                style={{ color: '#6b7a99' }}
              >
                {stat.label}
              </div>
              <div className="font-mono text-[10px] mt-1" style={{ color: '#00ff88' }}>
                ✓ {stat.note}
              </div>
            </div>
          ))}
        </div>

        {/* DASHBOARD MOCKUP */}
        <section className="pt-16 pb-8">
          <h2
            className="font-mono text-[13px] uppercase tracking-[3px] mb-10 text-center"
            style={{ color: '#6b7a99' }}
          >
            Vista previa del dashboard
          </h2>
          <div
            className="max-w-[780px] mx-auto rounded-sm overflow-hidden"
            style={{
              border: '1px solid rgba(0,255,136,0.08)',
              background: 'rgba(10,14,23,0.7)',
              backdropFilter: 'blur(2px)',
            }}
          >
            {/* Window title bar */}
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{
                borderBottom: '1px solid rgba(0,255,136,0.06)',
                background: 'rgba(0,255,136,0.02)',
              }}
            >
              <div className="flex gap-1.5">
                <span
                  className="w-[8px] h-[8px] rounded-full block"
                  style={{ background: 'rgba(255,107,107,0.5)' }}
                />
                <span
                  className="w-[8px] h-[8px] rounded-full block"
                  style={{ background: 'rgba(255,217,61,0.5)' }}
                />
                <span
                  className="w-[8px] h-[8px] rounded-full block"
                  style={{ background: 'rgba(0,255,136,0.5)' }}
                />
              </div>
              <span
                className="font-mono text-[10px] tracking-wider ml-2"
                style={{ color: '#4a5568' }}
              >
                dashboard / thi
              </span>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-8">
              {/* KPI cards row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { val: '86', label: 'THI Score', sub: '↑ +4.2%' },
                  { val: '25', label: 'Aplicaciones', sub: '12 críticas' },
                  { val: '12', label: 'Vulnerabilidades', sub: '3 P1 abiertas' },
                  { val: 'Elite', label: 'DORA Benchmark', sub: 'Deploy freq' },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="text-center py-5 px-3"
                    style={{
                      border: '1px solid rgba(0,255,136,0.06)',
                      background: 'rgba(0,255,136,0.01)',
                    }}
                  >
                    <div className="font-mono text-xl font-bold" style={{ color: '#e8edf5' }}>
                      {kpi.val}
                    </div>
                    <div
                      className="font-mono text-[9px] uppercase tracking-widest mt-2"
                      style={{ color: '#6b7a99' }}
                    >
                      {kpi.label}
                    </div>
                    <div
                      className="font-mono text-[10px] mt-2"
                      style={{ color: 'rgba(0,255,136,0.4)' }}
                    >
                      {kpi.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dimension bars */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: '#6b7a99' }}
                  >
                    Dimensiones THI
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: 'rgba(0,255,136,0.3)' }}>
                    score compuesto
                  </span>
                </div>
                {[
                  { label: 'Seguridad', pct: 78 },
                  { label: 'Delivery', pct: 65 },
                  { label: 'Obsolescencia', pct: 82 },
                  { label: 'Riesgo', pct: 60 },
                  { label: 'Arquitectura', pct: 71 },
                  { label: 'Cumplimiento', pct: 88 },
                  { label: 'Costos', pct: 55 },
                ].map((d) => (
                  <div key={d.label} className="flex items-center gap-4">
                    <span
                      className="font-mono text-[10px] w-[110px] text-right shrink-0"
                      style={{ color: '#6b7a99' }}
                    >
                      {d.label}
                    </span>
                    <div className="flex-1 h-[6px]" style={{ background: 'rgba(0,255,136,0.04)' }}>
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${d.pct}%`,
                          background:
                            d.pct >= 80
                              ? 'rgba(0,255,136,0.5)'
                              : d.pct >= 65
                                ? 'rgba(255,217,61,0.4)'
                                : 'rgba(255,107,107,0.4)',
                        }}
                      />
                    </div>
                    <span
                      className="font-mono text-[10px] w-8 shrink-0"
                      style={{ color: 'rgba(0,255,136,0.3)' }}
                    >
                      {d.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="text-center py-16">
          <h2
            className="font-mono text-[13px] uppercase tracking-[3px] mb-12"
            style={{ color: '#6b7a99' }}
          >
            Plataforma de Gobierno
          </h2>
          <div className="max-w-[800px] mx-auto space-y-px">
            {FEATURES.map((f, i) => (
              <button
                key={f.title}
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-start gap-5 px-6 py-5 text-left cursor-pointer transition-all bg-transparent border-none group"
                style={{
                  borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(0,255,136,0.06)' : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,255,136,0.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div
                  className="w-[52px] h-[52px] shrink-0 flex items-center justify-center transition-all mt-0.5 group-hover:border-[#00ff88]"
                  style={{
                    border: '1px solid rgba(0,255,136,0.12)',
                    borderRadius: 4,
                    color: '#00ff88',
                  }}
                >
                  <f.icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className="font-mono text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#e8edf5' }}
                  >
                    {f.title}
                  </span>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6b7a99' }}>
                    {f.desc}
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                    {f.highlights.map((h, j) => (
                      <span
                        key={j}
                        className="font-mono text-[10px] tracking-wide"
                        style={{ color: 'rgba(0,255,136,0.35)' }}
                      >
                        ◆ {h}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className="font-mono text-sm transition-all shrink-0 mt-0.5"
                  style={{ color: 'rgba(0,255,136,0.3)' }}
                >
                  →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* GOBIA DEMO */}
        <section className="py-16">
          <h2
            className="font-mono text-[13px] uppercase tracking-[3px] mb-10 text-center"
            style={{ color: '#6b7a99' }}
          >
            GobIA — Asistente de Gobierno
          </h2>
          <div
            className="max-w-[640px] mx-auto rounded-sm overflow-hidden"
            style={{
              border: '1px solid rgba(0,255,136,0.08)',
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{
                borderBottom: '1px solid rgba(0,255,136,0.06)',
                background: 'rgba(0,255,136,0.02)',
              }}
            >
              <div
                className="w-6 h-6 flex items-center justify-center text-[11px] font-bold"
                style={{
                  border: '1px solid rgba(0,255,136,0.2)',
                  borderRadius: 4,
                  color: '#00ff88',
                }}
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

            {/* Messages */}
            <div className="px-5 py-6 space-y-5">
              {[
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
              ].map((msg, i) => (
                <div key={i} className="gobia-msg" style={{ animationDelay: `${i * 2.2}s` }}>
                  {msg.from === 'gobia' && (
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
                      <div
                        className="font-mono text-xs leading-relaxed rounded-sm"
                        style={{
                          color: '#b0b8c8',
                          background: 'rgba(0,255,136,0.02)',
                          padding: '10px 14px',
                          maxWidth: '90%',
                        }}
                      >
                        {msg.text.split('\n').map((line, j) => (
                          <span key={j}>
                            {line.startsWith('• ') ? (
                              <span style={{ color: '#6b7a99' }}>{line}</span>
                            ) : line.startsWith('✅ ') ? (
                              <span style={{ color: '#00ff88' }}>{line}</span>
                            ) : (
                              <span>{line}</span>
                            )}
                            {j < msg.text.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {msg.from === 'user' && (
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
                  )}
                </div>
              ))}

              {/* Typing indicator */}
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
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{
                        background: '#00ff88',
                        animation: 'gobia-dot 1.4s ease-in-out infinite',
                      }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{
                        background: '#00ff88',
                        animation: 'gobia-dot 1.4s ease-in-out infinite 0.2s',
                      }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{
                        background: '#00ff88',
                        animation: 'gobia-dot 1.4s ease-in-out infinite 0.4s',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROADMAP */}
        <section className="text-center py-16">
          <h2
            className="font-mono text-[13px] uppercase tracking-[3px] mb-12"
            style={{ color: '#6b7a99' }}
          >
            Próximos hitos
          </h2>
          <div className="max-w-[560px] mx-auto text-left">
            {[
              {
                q: 'Q3 2026',
                active: true,
                items: [
                  'Integración Jira · GitHub · GitLab',
                  'Módulo FinOps — costo por aplicación',
                  'Alertas vía Slack / Teams / Email',
                ],
              },
              {
                q: 'Q4 2026',
                active: false,
                items: [
                  'Reportes PDF ejecutivos automatizados',
                  'API pública REST para terceros',
                  'Portal de proveedores con auto-evaluación',
                ],
              },
              {
                q: '2027',
                active: false,
                items: [
                  'Benchmarking THI entre industrias',
                  'On-premise deployment con Docker',
                  'Marketplace de plugins y extensiones',
                ],
              },
            ].map((phase, i) => (
              <div key={phase.q} className="flex gap-6 mb-8 last:mb-0">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-px flex-1"
                    style={{ background: i < 2 ? 'rgba(0,255,136,0.08)' : 'transparent' }}
                  />
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: phase.active ? '#00ff88' : 'rgba(0,255,136,0.15)' }}
                  />
                  <div
                    className="w-px flex-1"
                    style={{ background: i > 0 ? 'rgba(0,255,136,0.08)' : 'transparent' }}
                  />
                </div>
                <div className="pb-6">
                  <div
                    className="font-mono text-xs font-bold mb-2"
                    style={{ color: phase.active ? '#00ff88' : '#6b7a99' }}
                  >
                    {phase.q}
                    {phase.active && (
                      <span
                        className="ml-2 text-[9px] uppercase tracking-widest"
                        style={{ color: 'rgba(0,255,136,0.4)' }}
                      >
                        · En desarrollo
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {phase.items.map((item) => (
                      <li key={item} className="font-mono text-[11px]" style={{ color: '#4a5568' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer
          className="flex items-center justify-between py-6 text-[10px] font-mono uppercase tracking-wider"
          style={{ borderTop: '1px solid rgba(0,255,136,0.06)', color: 'rgba(107,122,153,0.5)' }}
        >
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} TGP — Governance Intelligence</span>
            <span className="w-px h-3" style={{ background: 'rgba(0,255,136,0.1)' }} />
            <button
              onClick={() => navigate('/docs')}
              className="bg-transparent border-none cursor-pointer font-mono text-[10px] uppercase tracking-wider transition-colors"
              style={{ color: 'rgba(107,122,153,0.5)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#00ff88'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(107,122,153,0.5)'
              }}
            >
              Documentación
            </button>
          </div>
          <span>v2.0</span>
        </footer>
      </div>

      <style>{`.gobia-msg { opacity: 0; animation: gobia-fade-in 0.6s ease-out forwards; } @keyframes gobia-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } } @keyframes gobia-dot { 0%, 60%, 100% { opacity: 0.2; } 30% { opacity: 1; } }`}</style>
    </div>
  )
}
