import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronDown } from 'lucide-react'
import { PrimerosPasosSection } from '../sections/PrimerosPasosSection'
import { FuncionalidadesSection } from '../sections/FuncionalidadesSection'
import { IntegracionesSection } from '../sections/IntegracionesSection'
import { TecnicoSection } from '../sections/TecnicoSection'
import { TroubleshootingSection } from '../sections/TroubleshootingSection'

const SECTIONS = [
  { id: 'primeros-pasos', label: 'Primeros Pasos' },
  { id: 'funcionalidades', label: 'Funcionalidades' },
  { id: 'integraciones', label: 'Integraciones' },
  { id: 'tecnico', label: 'Consideraciones Técnicas' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
] as const

export default function DocsPage() {
  const navigate = useNavigate()
  const [mobileTocOpen, setMobileTocOpen] = useState(false)
  const tocRef = useRef<HTMLDivElement>(null)

  const scrollTo = (id: string) => {
    setMobileTocOpen(false)
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    scrollTo(id)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0e17' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-40 border-b backdrop-blur-sm"
        style={{ background: 'rgba(10,14,23,0.9)', borderColor: 'rgba(0,255,136,0.06)' }}
      >
        <div className="max-w-[1120px] mx-auto flex items-center justify-between px-6 h-14">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-mono text-xs tracking-wider bg-transparent border-none cursor-pointer transition-colors"
            style={{ color: '#6b7a99' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#00ff88'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b7a99'
            }}
          >
            ← Volver al inicio
          </button>
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-wider"
              style={{ color: '#e8edf5' }}
            >
              TGP
            </span>
            <span className="font-mono text-[10px]" style={{ color: '#4a5568' }}>
              /
            </span>
            <span className="font-mono text-[10px] tracking-wider" style={{ color: '#6b7a99' }}>
              Documentación
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1120px] mx-auto px-6 py-10 flex gap-10">
        {/* TOC desktop */}
        <aside ref={tocRef} className="hidden md:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <div
              className="font-mono text-[10px] uppercase tracking-widest mb-4"
              style={{ color: '#4a5568' }}
            >
              En esta página
            </div>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => handleTocClick(e, s.id)}
                className="block font-mono text-xs py-1.5 transition-colors no-underline"
                style={{ color: '#6b7a99' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00ff88'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7a99'
                }}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Mobile TOC toggle */}
        <div className="md:hidden mb-6 w-full">
          <button
            onClick={() => setMobileTocOpen(!mobileTocOpen)}
            className="flex items-center justify-between w-full font-mono text-xs px-4 py-3 rounded-sm bg-transparent border cursor-pointer"
            style={{ borderColor: 'rgba(0,255,136,0.1)', color: '#6b7a99' }}
          >
            <span>En esta página</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${mobileTocOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {mobileTocOpen && (
            <div
              className="mt-1 rounded-sm overflow-hidden border"
              style={{ borderColor: 'rgba(0,255,136,0.06)' }}
            >
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => handleTocClick(e, s.id)}
                  className="block font-mono text-xs px-4 py-2.5 no-underline transition-colors"
                  style={{ color: '#6b7a99', borderBottom: '1px solid rgba(0,255,136,0.04)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#00ff88'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7a99'
                  }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ===== CONTENIDO PRINCIPAL ===== */}
        <main className="flex-1 min-w-0 max-w-[720px]">
          <PrimerosPasosSection />
          <FuncionalidadesSection />
          <IntegracionesSection />
          <TecnicoSection />
          <TroubleshootingSection />

          {/* Footer */}
          <footer
            className="flex items-center justify-between py-6 text-[10px] font-mono uppercase tracking-wider mt-12"
            style={{ borderTop: '1px solid rgba(0,255,136,0.06)', color: 'rgba(107,122,153,0.5)' }}
          >
            <span>© {new Date().getFullYear()} TGP — Governance Intelligence</span>
            <span>v2.0</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
