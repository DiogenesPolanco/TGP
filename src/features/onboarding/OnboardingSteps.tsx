import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { seedDemoData, seedComplianceFindings } from '@/services/demo/seedData'
import { seedTechnologies } from '@/services/demo/seedTechnologies'
import { useUserStore } from '@/stores/userStore'
import { Check, ChevronRight, Building2, Sparkles, Cpu, Shield, LayoutDashboard, User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const STORAGE_KEY = 'tgp-onboarding-done'

export function isOnboardingDone(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
}

export function completeOnboarding() {
  try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* noop */ }
}

/* ─── Slider data ─── */

export interface SlideProps {
  onNext: () => void
  onSkip?: () => void
  onClose?: () => void
}

export const SLIDES: { key: string; component: React.FC<SlideProps> }[] = [
  { key: 'welcome', component: SlideWelcome },
  { key: 'model', component: SlideModel },
  { key: 'security', component: SlideSecurity },
  { key: 'teams', component: SlideTeams },
  { key: 'dashboard', component: SlideDashboard },
  { key: 'demo', component: SlideDemo },
]

/* ─── Shared visual helpers ─── */

function TechGlow({ children }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-white/[0.03] rounded-full blur-2xl" />
      <div className="relative">{children}</div>
    </div>
  )
}

/* ─── Slides ─── */

function SlideWelcome({ onNext }: SlideProps) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <TechGlow color="cyan">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20 flex items-center justify-center backdrop-blur-sm">
          <Sparkles size={40} className="text-cyan-400" />
        </div>
      </TechGlow>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">TGP</h1>
        <p className="text-sm text-cyan-300/80 font-mono tracking-wider uppercase">Technology Governance Platform</p>
        <p className="text-sm text-neutral-400 max-w-xs mx-auto">
          Gobierno tecnológico empresarial 100% cliente-side.
          Privacidad total, cero servidores.
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        LOCAL-FIRST
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:300ms]" />
        OFFLINE-READY
      </div>
      <Button onClick={onNext} variant="primary" size="lg" className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 rounded-xl text-sm font-semibold">
        Comenzar <ChevronRight size={16} />
      </Button>
    </div>
  )
}

function SlideModel({ onNext, onSkip }: SlideProps) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <TechGlow color="blue">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-400/20 flex items-center justify-center backdrop-blur-sm">
          <Building2 size={40} className="text-blue-400" />
        </div>
      </TechGlow>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Modelo de datos</h2>
        <p className="text-sm text-neutral-400">Tres capas, un portafolio completo</p>
      </div>
      <div className="w-full space-y-2 text-xs">
        {[
          { label: 'Unidades de Negocio', sub: 'Organización base', color: 'border-blue-500/40 bg-blue-500/5' },
          { label: 'Aplicaciones', sub: 'El portafolio de TI', color: 'border-cyan-500/40 bg-cyan-500/5' },
          { label: 'Seguridad · Equipos · OKRs', sub: 'Gobierno en capas', color: 'border-violet-500/40 bg-violet-500/5' },
        ].map((layer, i) => (
          <div
            key={layer.label}
            className={`flex items-center gap-3 p-3 rounded-xl border ${layer.color} backdrop-blur-sm transition-all`}
            style={{ marginLeft: `${i * 20}px` }}
          >
            <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[11px] font-bold text-neutral-400 font-mono">{i + 1}</span>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-white">{layer.label}</p>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">{layer.sub}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 w-full">
        <Button onClick={onNext} size="lg" className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 border-0 rounded-xl">
          Siguiente <ArrowRight size={15} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md">Saltar</Button>}
      </div>
    </div>
  )
}

function SlideSecurity({ onNext, onSkip }: SlideProps) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <TechGlow color="rose">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/20 to-orange-600/20 border border-rose-400/20 flex items-center justify-center backdrop-blur-sm">
          <Shield size={40} className="text-rose-400" />
        </div>
      </TechGlow>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Seguridad & Gobierno</h2>
        <p className="text-sm text-neutral-400">De la detección a la remediación</p>
      </div>
      <div className="w-full grid grid-cols-2 gap-2.5">
        {[
          { label: 'Vulnerabilidades', sub: 'CVSS + SLA' },
          { label: 'Incidentes', sub: 'P1–P4 con RCA' },
          { label: 'Riesgos', sub: 'Prob. × Impacto' },
          { label: 'Auditoría', sub: 'Hallazgos + Plan' },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-left">
            <p className="text-sm font-medium text-white">{item.label}</p>
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 w-full">
        <Button onClick={() => { navigate('/security/vulnerabilities'); onNext() }} size="lg" className="flex-1 bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-400 hover:to-orange-500 border-0 rounded-xl">
          Ir a Seguridad <ArrowRight size={15} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md">Saltar</Button>}
      </div>
    </div>
  )
}

function SlideTeams({ onNext, onSkip }: SlideProps) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <TechGlow color="emerald">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-400/20 flex items-center justify-center backdrop-blur-sm">
          <Cpu size={40} className="text-emerald-400" />
        </div>
      </TechGlow>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Equipos & Ejecución</h2>
        <p className="text-sm text-neutral-400">DORA, OKRs y seguimiento en vivo</p>
      </div>
      <div className="w-full space-y-2">
        {[
          { label: 'Métricas DORA', sub: 'Deploy freq, Lead time, CFR, MTTR', icon: '📊' },
          { label: 'OKRs', sub: 'Objetivos con Key Results medibles', icon: '🎯' },
          { label: 'Ejecución', sub: 'Planes, daily, bloqueos, compromisos', icon: '⚡' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
            <span className="text-lg">{item.icon}</span>
            <div className="text-left">
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-[11px] text-neutral-500">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 w-full">
        <Button onClick={onNext} size="lg" className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 border-0 rounded-xl">
          Siguiente <ArrowRight size={15} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md">Saltar</Button>}
      </div>
    </div>
  )
}

function SlideDashboard({ onNext, onSkip }: SlideProps) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <TechGlow color="violet">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-400/20 flex items-center justify-center backdrop-blur-sm">
          <LayoutDashboard size={40} className="text-violet-400" />
        </div>
      </TechGlow>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Dashboard THI</h2>
        <p className="text-sm text-neutral-400">Tus KPIs en tiempo real</p>
      </div>
      <div className="w-full grid grid-cols-2 gap-2.5">
        {[
          { value: 'THI', label: 'Health Index compuesto', color: 'text-cyan-400' },
          { value: '12', label: 'KPI cards', color: 'text-violet-400' },
          { value: '7', label: 'Dimensiones', color: 'text-emerald-400' },
          { value: '∞', label: 'Alertas en vivo', color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <p className={`text-2xl font-bold ${stat.color} font-mono`}>{stat.value}</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 w-full">
        <Button onClick={onNext} size="lg" className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 border-0 rounded-xl">
          Siguiente <ArrowRight size={15} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md">Saltar</Button>}
      </div>
    </div>
  )
}

function SlideDemo({ onNext, onClose }: SlideProps) {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [nameError, setNameError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleLoad = async () => {
    const trimmedName = displayName.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) { setNameError('Ingresa tu nombre'); return }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { setNameError('Ingresa un email válido'); return }
    setNameError('')
    setLoading(true)
    try {
      await seedDemoData(true)
      await seedComplianceFindings()
      await seedTechnologies()
      const adminUser = await db.users.get('user-1')
      if (adminUser) {
        const updated = { ...adminUser, displayName: trimmedName, email: trimmedEmail }
        await db.users.put(updated)
        useUserStore.getState().login(updated)
      }
      setDone(true)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleFinish = () => { completeOnboarding(); onClose?.(); navigate('/dashboard') }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center gap-5 py-4">
        <TechGlow color="emerald">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-400/20 flex items-center justify-center backdrop-blur-sm">
            <Check size={40} className="text-emerald-400" />
          </div>
        </TechGlow>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">¡Listo, {displayName.split(' ')[0]}!</h2>
          <p className="text-sm text-neutral-400">Datos de ejemplo cargados. Tu dashboard te espera.</p>
        </div>
        <Button onClick={handleFinish} size="lg" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 border-0 rounded-xl">
          Ir al Dashboard <ChevronRight size={16} />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <TechGlow color="amber">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-400/20 flex items-center justify-center backdrop-blur-sm">
          <User size={40} className="text-amber-400" />
        </div>
      </TechGlow>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Carga datos demo</h2>
        <p className="text-sm text-neutral-400">Tu perfil + 10 apps + 180+ tecnologías</p>
      </div>
      <div className="w-full space-y-3">
        <input
          type="text"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setNameError('') }}
          placeholder="Tu nombre"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setNameError('') }}
          placeholder="correo@empresa.com"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
        />
        {nameError && <p className="text-xs text-rose-400">{nameError}</p>}
        <p className="text-[11px] text-neutral-500 leading-relaxed">
          Se cargarán apps, microservicios, vulnerabilidades, riesgos, 180+ tecnologías, equipos, OKRs y más.
        </p>
      </div>
      <div className="flex gap-3 w-full">
        <Button onClick={handleLoad} disabled={loading} size="lg" className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-0 rounded-xl">
          {loading ? 'Cargando...' : 'Cargar Demo'}
        </Button>
        <Button onClick={handleFinish} variant="secondary" size="md">Manual</Button>
      </div>
    </div>
  )
}
