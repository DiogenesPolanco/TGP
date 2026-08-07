import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getContent } from '@/services/system/contentService'
import { version } from '../../../../package.json'

interface PhaseItem {
  q: string
  active: boolean
  items: string[]
}

export function LandingRoadmap() {
  const navigate = useNavigate()
  const [phases, setPhases] = useState<PhaseItem[]>([])

  useEffect(() => {
    getContent<PhaseItem[]>('landing.roadmap').then((c) => {
      if (c) setPhases(c)
    })
  }, [])

  const items =
    phases.length > 0
      ? phases
      : [
          {
            q: 'Q3 2026',
            active: true,
            items: ['Integración Jira · GitHub · GitLab', 'Alertas vía Slack / Teams / Email'],
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
        ]

  return (
    <>
      <section className="text-center py-16">
        <h2
          className="font-mono text-[13px] uppercase tracking-[3px] mb-12"
          style={{ color: '#6b7a99' }}
        >
          Próximos hitos
        </h2>
        <div className="max-w-[560px] mx-auto text-left">
          {items.map((phase, i) => (
            <div key={phase.q} className="flex gap-6 mb-8 last:mb-0">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-px flex-1"
                  style={{
                    background: i < items.length - 1 ? 'rgba(0,255,136,0.08)' : 'transparent',
                  }}
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
          <span>&copy; {new Date().getFullYear()} TGP — Governance Intelligence</span>
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
        <span>v{version}</span>
      </footer>
    </>
  )
}
