import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  LayoutDashboard,
  Layers,
  Shield,
  Users,
  Crosshair,
  Kanban,
  CalendarClock,
  Bot,
  Wallet,
} from 'lucide-react'
import { getContent } from '@/services/system/contentService'

const ICONS: Record<string, React.FC<{ size?: number }>> = {
  LayoutDashboard,
  Layers,
  Shield,
  Users,
  Crosshair,
  Kanban,
  CalendarClock,
  Bot,
  Wallet,
}

interface FeatureItem {
  icon: string
  title: string
  desc: string
  highlights: string[]
}

/* Fallback embebido: garantiza que la sección siempre muestre las funcionalidades,
   incluso si el content block `landing.features` no existe en IndexedDB. */
const DEFAULT_FEATURES: FeatureItem[] = [
  {
    icon: 'LayoutDashboard',
    title: 'Dashboard THI',
    desc: '"Está todo bien" no es un reporte. El THI sí.',
    highlights: [
      'THI compuesto en 7 dimensiones',
      'KPIs ejecutivos con drill-down',
      'Tendencias y distribución por severidad',
    ],
  },
  {
    icon: 'Layers',
    title: 'Catálogo',
    desc: 'Esa app que nadie recuerda — existe y ya está documentada.',
    highlights: [
      'CRUD completo con búsqueda avanzada',
      'Filtros por criticidad, estado y BU',
      'Vulnerabilidades y riesgos heredados',
    ],
  },
  {
    icon: 'Shield',
    title: 'Seguridad',
    desc: 'Vulnerabilidades que no se arreglan solas. Pero al menos sabes cuáles son.',
    highlights: [
      'CVSS scoring y SLA tracking',
      'Incidentes P1–P4 con tiempos de respuesta',
      'Consulta CVE/NVD integrada con lookups automáticos',
      'Matriz de riesgos y hallazgos de auditoría',
    ],
  },
  {
    icon: 'Users',
    title: 'Equipos DORA',
    desc: 'Benchmarking real. Porque "hacemos deploy rápido" no es una métrica.',
    highlights: [
      'Deploy frequency, Lead time, CFR, MTTR',
      'Benchmarking Elite / Alto / Medio / Bajo',
      'Vinculación con OKRs y entregables',
    ],
  },
  {
    icon: 'Crosshair',
    title: 'OKRs',
    desc: 'Objetivos que no se pierden en el Slack del Q3.',
    highlights: [
      'Key Results con progreso automático',
      'Estados: on track, at risk, behind, achieved',
      'Vinculación con planes y ejecución',
    ],
  },
  {
    icon: 'Kanban',
    title: 'Ejecución',
    desc: 'Planes, blockers y compromisos. Todo lo que un líder necesita seguir.',
    highlights: [
      'Diagramas de Gantt y timeline diaria',
      'Bloqueos con escalamiento automático',
      'Mapa de dependencias y compromisos',
    ],
  },
  {
    icon: 'Wallet',
    title: 'FinOps',
    desc: 'El costo que nadie sabe dónde se va. Hasta ahora.',
    highlights: [
      'Costo por aplicación, categoría y microservicio',
      'Presupuestos por periodo con alertas de sobreuso',
      'Asignación de costos compartidos e importación CSV',
    ],
  },
  {
    icon: 'CalendarClock',
    title: 'Obsolescencia',
    desc: '"Esa versión salió hace 3 años" — sí, y ya deberías haber migrado.',
    highlights: [
      'Sincronización con endoflife.date',
      'Alertas de vencimiento y mapa global',
      'Impacto sobre aplicaciones y tecnologías',
    ],
  },
  {
    icon: 'Bot',
    title: 'GobIA',
    desc: 'Un asistente que responde. No que "procesa tu solicitud".',
    highlights: [
      'Consultas en lenguaje natural sobre tus datos',
      'Proveedores: OpenAI, Groq, Anthropic, Ollama',
      'Tool calls: auditoría, consultas, análisis',
    ],
  },
]

export function LandingDashboardPreview() {
  const navigate = useNavigate()
  const [features, setFeatures] = useState<FeatureItem[]>(DEFAULT_FEATURES)

  useEffect(() => {
    getContent<FeatureItem[]>('landing.features').then((c) => {
      if (c) setFeatures(c)
    })
  }, [])

  return (
    <>
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
          <div className="p-6 md:p-8 space-y-8">
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

      <section id="features" className="py-20">
        <div className="text-center mb-14">
          <div
            className="inline-block font-mono text-[11px] font-medium uppercase tracking-wider mb-4 px-3.5 py-1.5"
            style={{
              color: '#00ff88',
              border: '1px solid rgba(0,255,136,0.2)',
              borderRadius: 2,
              background: 'rgba(0,255,136,0.04)',
            }}
          >
            ✦ Todo en una sola plataforma
          </div>
          <h2
            className="font-mono text-[30px] md:text-[36px] font-extrabold tracking-[-1px] mb-4"
            style={{ color: '#e8edf5' }}
          >
            Plataforma de Gobierno
          </h2>
          <p className="text-sm max-w-[520px] mx-auto leading-relaxed" style={{ color: '#6b7a99' }}>
            Nueve módulos integrados que reemplazan al conjunto de herramientas dispersas de tu
            oficina tecnológica — con una sola fuente de verdad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {features.map((f) => {
            const Icon = ICONS[f.icon as keyof typeof ICONS]
            return (
              <button
                key={f.title}
                onClick={() => navigate('/dashboard')}
                className="group text-left cursor-pointer bg-transparent border-none flex flex-col transition-all duration-300 hover:-translate-y-[3px]"
                style={{
                  border: '1px solid rgba(0,255,136,0.08)',
                  borderRadius: 6,
                  background: 'rgba(10,14,23,0.6)',
                  padding: '22px 22px 18px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,255,136,0.35)'
                  e.currentTarget.style.background = 'rgba(0,255,136,0.03)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.35)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,255,136,0.08)'
                  e.currentTarget.style.background = 'rgba(10,14,23,0.6)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-[48px] h-[48px] flex items-center justify-center transition-all duration-300 group-hover:border-[#00ff88]"
                    style={{
                      border: '1px solid rgba(0,255,136,0.12)',
                      borderRadius: 6,
                      color: '#00ff88',
                      background: 'rgba(0,255,136,0.03)',
                    }}
                  >
                    {Icon && <Icon size={22} />}
                  </div>
                  <span
                    className="font-mono text-sm transition-all duration-300 group-hover:translate-x-[2px]"
                    style={{ color: 'rgba(0,255,136,0.3)' }}
                  >
                    →
                  </span>
                </div>
                <span
                  className="font-mono text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: '#e8edf5' }}
                >
                  {f.title}
                </span>
                <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: '#6b7a99' }}>
                  {f.desc}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {f.highlights.map((h, j) => (
                    <span
                      key={j}
                      className="font-mono text-[9.5px] tracking-wide px-2 py-[3px] rounded-sm"
                      style={{
                        color: 'rgba(0,255,136,0.6)',
                        border: '1px solid rgba(0,255,136,0.1)',
                        background: 'rgba(0,255,136,0.02)',
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
