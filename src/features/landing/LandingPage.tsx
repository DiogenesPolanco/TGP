import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession } from '@/services/auth/authService'
import { LandingHero } from './components/LandingHero'
import { LandingDashboardPreview } from './components/LandingDashboardPreview'
import { LandingGobiaDemo } from './components/LandingGobiaDemo'
import { LandingRoadmap } from './components/LandingRoadmap'

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
                    if (link.external) window.open(link.to, '_blank', 'noopener,noreferrer')
                    else if (link.scroll)
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                    else navigate(link.to)
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

        <LandingHero />
        <LandingDashboardPreview />
        <LandingGobiaDemo />
        <LandingRoadmap />
      </div>
    </div>
  )
}
