import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getContent } from '@/services/system/contentService'

const R = 50
const CIRCUMFERENCE = 2 * Math.PI * R
const ARC_LENGTH = CIRCUMFERENCE * 0.86
const DASH_OFFSET = CIRCUMFERENCE - (86 / 100) * ARC_LENGTH

interface HeroContent {
  tagline: string
  title: string[]
  subtitle: string
}

interface StatItem {
  value: string
  label: string
  note: string
}

export function LandingHero() {
  const navigate = useNavigate()
  const [hero, setHero] = useState<HeroContent | null>(null)
  const [stats, setStats] = useState<StatItem[]>([])

  useEffect(() => {
    getContent<HeroContent>('landing.hero').then((c) => {
      if (c) setHero(c)
    })
    getContent<StatItem[]>('landing.stats').then((c) => {
      if (c) setStats(c)
    })
  }, [])

  return (
    <>
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
            {hero ? `✦ ${hero.tagline}` : '✦ Technology Governance Platform'}
          </div>
          <h1
            className="font-mono text-[52px] font-extrabold leading-[1.1] tracking-[-1.5px] mb-5"
            style={{ color: '#e8edf5' }}
          >
            {hero ? (
              <>
                {hero.title[0]}
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {hero.title[1]}
                </span>
                <br />
                sin servidores<span style={{ color: '#ffb900' }}>.</span>
              </>
            ) : (
              <>
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
              </>
            )}
          </h1>
          <p className="text-base leading-relaxed mb-10 max-w-[460px]" style={{ color: '#6b7a99' }}>
            {hero?.subtitle ??
              'TGP es la primera plataforma de governance tecnológico 100% cliente-side. Gestiona aplicaciones, vulnerabilidades, equipos y obsolescencia con privacidad total — tus datos nunca salen de tu dispositivo.'}
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
              86
            </div>
            <div
              className="font-mono text-[11px] uppercase tracking-wider mt-2"
              style={{ color: '#6b7a99' }}
            >
              THI Score
            </div>
            <div className="font-mono text-[11px] mt-3" style={{ color: 'rgba(0,255,136,0.5)' }}>
              ↑ +4.2% este mes
            </div>
          </div>
        </div>
      </section>
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-px mt-10 pt-10"
        style={{ borderTop: '1px solid rgba(0,255,136,0.06)' }}
      >
        {stats.length > 0 ? (
          stats.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center py-5 px-4"
              style={{ borderRight: i < 3 ? '1px solid rgba(0,255,136,0.06)' : 'none' }}
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
          ))
        ) : (
          <>
            <div
              className="text-center py-5 px-4"
              style={{ borderRight: '1px solid rgba(0,255,136,0.06)' }}
            >
              <div className="font-mono text-[28px] font-bold" style={{ color: '#e8edf5' }}>
                100%
              </div>
              <div
                className="font-mono text-[10px] uppercase tracking-wider mt-1.5"
                style={{ color: '#6b7a99' }}
              >
                Privacidad
              </div>
              <div className="font-mono text-[10px] mt-1" style={{ color: '#00ff88' }}>
                ✓ local-first
              </div>
            </div>
            <div
              className="text-center py-5 px-4"
              style={{ borderRight: '1px solid rgba(0,255,136,0.06)' }}
            >
              <div className="font-mono text-[28px] font-bold" style={{ color: '#e8edf5' }}>
                0
              </div>
              <div
                className="font-mono text-[10px] uppercase tracking-wider mt-1.5"
                style={{ color: '#6b7a99' }}
              >
                Servidores
              </div>
              <div className="font-mono text-[10px] mt-1" style={{ color: '#00ff88' }}>
                ✓ sin backend
              </div>
            </div>
            <div
              className="text-center py-5 px-4"
              style={{ borderRight: '1px solid rgba(0,255,136,0.06)' }}
            >
              <div className="font-mono text-[28px] font-bold" style={{ color: '#e8edf5' }}>
                40+
              </div>
              <div
                className="font-mono text-[10px] uppercase tracking-wider mt-1.5"
                style={{ color: '#6b7a99' }}
              >
                Tablas
              </div>
              <div className="font-mono text-[10px] mt-1" style={{ color: '#00ff88' }}>
                ✓ dexie.js
              </div>
            </div>
            <div className="text-center py-5 px-4">
              <div className="font-mono text-[28px] font-bold" style={{ color: '#e8edf5' }}>
                7
              </div>
              <div
                className="font-mono text-[10px] uppercase tracking-wider mt-1.5"
                style={{ color: '#6b7a99' }}
              >
                Dimensiones
              </div>
              <div className="font-mono text-[10px] mt-1" style={{ color: '#00ff88' }}>
                ✓ THI score compuesto
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
