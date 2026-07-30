import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Layers, Shield, Users, Crosshair, Kanban, CalendarClock, Bot } from 'lucide-react'
import { getContent } from '@/services/system/contentService'

const ICONS: Record<string, React.FC<{ size?: number }>> = {
  LayoutDashboard, Layers, Shield, Users, Crosshair, Kanban, CalendarClock, Bot,
}

interface FeatureItem {
  icon: string
  title: string
  desc: string
  highlights: string[]
}

export function LandingDashboardPreview() {
  const navigate = useNavigate()
  const [features, setFeatures] = useState<FeatureItem[]>([])

  useEffect(() => {
    getContent<FeatureItem[]>('landing.features').then((c) => { if (c) setFeatures(c) })
  }, [])

  return (
    <>
      <section className="pt-16 pb-8">
        <h2 className="font-mono text-[13px] uppercase tracking-[3px] mb-10 text-center" style={{ color: '#6b7a99' }}>
          Vista previa del dashboard
        </h2>
        <div className="max-w-[780px] mx-auto rounded-sm overflow-hidden" style={{ border: '1px solid rgba(0,255,136,0.08)', background: 'rgba(10,14,23,0.7)', backdropFilter: 'blur(2px)' }}>
          <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid rgba(0,255,136,0.06)', background: 'rgba(0,255,136,0.02)' }}>
            <div className="flex gap-1.5">
              <span className="w-[8px] h-[8px] rounded-full block" style={{ background: 'rgba(255,107,107,0.5)' }} />
              <span className="w-[8px] h-[8px] rounded-full block" style={{ background: 'rgba(255,217,61,0.5)' }} />
              <span className="w-[8px] h-[8px] rounded-full block" style={{ background: 'rgba(0,255,136,0.5)' }} />
            </div>
            <span className="font-mono text-[10px] tracking-wider ml-2" style={{ color: '#4a5568' }}>dashboard / thi</span>
          </div>
          <div className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { val: '86', label: 'THI Score', sub: '↑ +4.2%' },
                { val: '25', label: 'Aplicaciones', sub: '12 críticas' },
                { val: '12', label: 'Vulnerabilidades', sub: '3 P1 abiertas' },
                { val: 'Elite', label: 'DORA Benchmark', sub: 'Deploy freq' },
              ].map((kpi) => (
                <div key={kpi.label} className="text-center py-5 px-3" style={{ border: '1px solid rgba(0,255,136,0.06)', background: 'rgba(0,255,136,0.01)' }}>
                  <div className="font-mono text-xl font-bold" style={{ color: '#e8edf5' }}>{kpi.val}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest mt-2" style={{ color: '#6b7a99' }}>{kpi.label}</div>
                  <div className="font-mono text-[10px] mt-2" style={{ color: 'rgba(0,255,136,0.4)' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#6b7a99' }}>Dimensiones THI</span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(0,255,136,0.3)' }}>score compuesto</span>
              </div>
              {[
                { label: 'Seguridad', pct: 78 }, { label: 'Delivery', pct: 65 }, { label: 'Obsolescencia', pct: 82 },
                { label: 'Riesgo', pct: 60 }, { label: 'Arquitectura', pct: 71 }, { label: 'Cumplimiento', pct: 88 }, { label: 'Costos', pct: 55 },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-4">
                  <span className="font-mono text-[10px] w-[110px] text-right shrink-0" style={{ color: '#6b7a99' }}>{d.label}</span>
                  <div className="flex-1 h-[6px]" style={{ background: 'rgba(0,255,136,0.04)' }}>
                    <div className="h-full transition-all" style={{ width: `${d.pct}%`, background: d.pct >= 80 ? 'rgba(0,255,136,0.5)' : d.pct >= 65 ? 'rgba(255,217,61,0.4)' : 'rgba(255,107,107,0.4)' }} />
                  </div>
                  <span className="font-mono text-[10px] w-8 shrink-0" style={{ color: 'rgba(0,255,136,0.3)' }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="text-center py-16">
        <h2 className="font-mono text-[13px] uppercase tracking-[3px] mb-12" style={{ color: '#6b7a99' }}>
          Plataforma de Gobierno
        </h2>
        <div className="max-w-[800px] mx-auto space-y-px">
          {features.map((f, i) => {
            const Icon = ICONS[f.icon as keyof typeof ICONS]
            return (
              <button key={f.title} onClick={() => navigate('/dashboard')} className="w-full flex items-start gap-5 px-6 py-5 text-left cursor-pointer transition-all bg-transparent border-none group" style={{ borderBottom: i < features.length - 1 ? '1px solid rgba(0,255,136,0.06)' : 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,136,0.02)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                <div className="w-[52px] h-[52px] shrink-0 flex items-center justify-center transition-all mt-0.5 group-hover:border-[#00ff88]" style={{ border: '1px solid rgba(0,255,136,0.12)', borderRadius: 4, color: '#00ff88' }}>
                  {Icon && <Icon size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider" style={{ color: '#e8edf5' }}>{f.title}</span>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6b7a99' }}>{f.desc}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                    {f.highlights.map((h, j) => (
                      <span key={j} className="font-mono text-[10px] tracking-wide" style={{ color: 'rgba(0,255,136,0.35)' }}>◆ {h}</span>
                    ))}
                  </div>
                </div>
                <span className="font-mono text-sm transition-all shrink-0 mt-0.5" style={{ color: 'rgba(0,255,136,0.3)' }}>→</span>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
