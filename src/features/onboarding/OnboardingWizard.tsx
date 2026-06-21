import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { seedDemoData, seedComplianceFindings } from '@/services/demo/seedData'
import { seedTechnologies } from '@/services/demo/seedTechnologies'
import { useUserStore } from '@/stores/userStore'

import { Check, ChevronRight, ChevronLeft, Building2, Bell, Sparkles, AppWindow, Cpu, Users, Shield, Target, LayoutDashboard, User } from 'lucide-react'
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'tgp-onboarding-done'

export function isOnboardingDone(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === 'true' }
  catch { return false }
}

function completeOnboarding() {
  try { localStorage.setItem(STORAGE_KEY, 'true') }
  catch { /* noop */ }
}

export function useFirstTimeuser() {
  const [checking, setChecking] = useState(true)
  const [isFirstTime, setIsFirstTime] = useState(false)

  useEffect(() => {
    if (isOnboardingDone()) { setChecking(false); return }
    const check = async () => {
      const bus = await db.businessUnits.count()
      const apps = await db.applications.count()
      setIsFirstTime(bus === 0 && apps === 0)
      setChecking(false)
    }
    check()
  }, [])

  return { checking, isFirstTime }
}

interface StepProps {
  onNext: () => void
  onBack?: () => void
  onSkip?: () => void
  onClose?: () => void
  isFirst?: boolean
}

// ── Shared card layout ──
// ── Step 1: Welcome + Architecture overview ──
function StepWelcome({ onNext }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <Sparkles size={36} className="text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-neutral-90 dark:text-white">Bienvenido a TGP</h2>
        <p className="text-sm text-muted leading-relaxed">
          Plataforma de Gobierno Tecnológico Empresarial. Unifica la gestión de aplicaciones,
          tecnologías, seguridad, equipos, OKRs y ejecución en un solo lugar.
        </p>
      </div>

      <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-neutral-50 uppercase tracking-wider">Arquitectura de datos</p>
        <div className="space-y-2 text-sm text-secondary">
          <div className="flex items-center gap-3">
            <span className="text-primary font-bold text-base">1</span>
            <span><strong>Unidades de Negocio</strong> — Organización base</span>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span className="text-primary font-bold text-base">2</span>
            <span><strong>Aplicaciones + Microservicios</strong> — El portafolio</span>
          </div>
          <div className="flex items-center gap-3 ml-8">
            <span className="text-primary font-bold text-base">3</span>
            <span><strong>Seguridad + Gobierno</strong> — Vulnerabilidades, riesgos, auditoría</span>
          </div>
          <div className="flex items-center gap-3 ml-12">
            <span className="text-primary font-bold text-base">4</span>
            <span><strong>Herencia Microservicio→App</strong> — Entidades M:N que se heredan al padre</span>
          </div>
          <div className="flex items-center gap-3 ml-16">
            <span className="text-primary font-bold text-base">5</span>
            <span><strong>Equipos + Ejecución</strong> — Personas, planes, daily, OKRs</span>
          </div>
          <div className="flex items-center gap-3 ml-20">
            <span className="text-primary font-bold text-base">6</span>
            <span><strong>Dashboard</strong> — THI, KPIs, alertas en tiempo real</span>
          </div>
        </div>
      </div>

      <Button onClick={onNext} variant="primary" className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
        Entendido, comenzar <ChevronRight size={16} />
      </Button>
    </div>
  )
}

// ── Step 2: Business Units ──
function StepBusinessUnit({ onNext, onSkip }: StepProps) {
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <Building2 size={36} className="text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-neutral-90 dark:text-white">1. Unidades de Negocio</h2>
        <p className="text-sm text-muted leading-relaxed">
          Las <strong>Unidades de Negocio (BU)</strong> son la base del modelo. Cada aplicación,
          equipo y objetivo pertenece a una BU. Sin BUs no puedes registrar aplicaciones.
        </p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 border border-blue-200 dark:border-blue-500/20">
        <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-medium mb-2">
          <span>📋</span>
          <span className="text-xs font-semibold">Jerarquía del modelo</span>
        </div>
        <div className="flex flex-col gap-1 text-xs text-blue-600/80 dark:text-blue-300/80 font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 font-bold text-[11px]">BU</span>
            <span className="text-[11px]">→</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-[11px]">Aplicaciones</span>
            <span className="text-[11px]">→</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-[11px]">Vulnerabilidades · Riesgos · Equipos</span>
          </div>
        </div>
        <p className="text-[11px] text-blue-600/70 dark:text-blue-300/70 mt-1.5 leading-tight">
          Sin BU no puedes registrar aplicaciones. Crea al menos una para empezar.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => { navigate('/admin/business-units'); onNext() }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
          Ir a crear BU <ChevronRight size={16} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md" className="px-5">Ya tengo BUs</Button>}
      </div>
    </div>
  )
}

// ── Step 3: Applications ──
function StepApplications({ onNext, onSkip }: StepProps) {
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <AppWindow size={36} className="text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-neutral-90 dark:text-white">2. Aplicaciones</h2>
        <p className="text-sm text-muted leading-relaxed">
          Cada <strong>aplicación</strong> se asigna a una BU, tiene una criticidad (baja→crítica),
          una arquitectura (monolito, microservicios, etc.) y un owner responsable.
        </p>
      </div>
      <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-4 space-y-2 text-sm text-secondary">
        <p className="font-medium text-neutral-90 dark:text-white">Campos clave:</p>
        <ul className="space-y-1 list-disc list-inside text-xs">
          <li>Nombre, descripción y <strong>BU propietaria</strong> (requiere BU creada previamente)</li>
          <li>Criticidad (define prioridad en dashboard)</li>
          <li>Tech stack (tecnologías que usa)</li>
          <li>Microservicios y bases de datos asociadas</li>
          <li>Vulnerabilidades, incidentes, riesgos y hallazgos se heredan de los microservicios</li>
        </ul>
      </div>
      <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 border border-amber-200 dark:border-amber-500/20">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Si no creaste una BU en el paso anterior, la lista de unidades estará vacía y no podrás asignar la aplicación.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => { navigate('/catalog/applications'); onNext() }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
          Ir a Aplicaciones <ChevronRight size={16} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md" className="px-5">Ya tengo apps</Button>}
      </div>
    </div>
  )
}

// ── Step 4: Technologies ──
function StepTechnologies({ onNext, onSkip }: StepProps) {
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
        <Cpu size={36} className="text-amber-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-neutral-90 dark:text-white">3. Tecnologías</h2>
        <p className="text-sm text-muted leading-relaxed">
          Registra las <strong>tecnologías</strong> de tu portafolio: lenguajes, frameworks,
          bases de datos, OS, runtimes. El sistema sincroniza automáticamente fechas EOL
          desde endoflife.date para alertar sobre obsolescencia.
        </p>
      </div>
      <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border border-amber-200 dark:border-amber-500/20">
        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
          ⚡ Sugerencia: Usa el botón <strong>"Sincronizar EOL"</strong> en la sección Obsolescencia
          para cargar automáticamente 180+ tecnologías del catálogo técnico.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => { navigate('/catalog/obsolescence'); onNext() }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
          Ir a Tecnologías <ChevronRight size={16} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md" className="px-5">Más tarde</Button>}
      </div>
    </div>
  )
}

// ── Step 5: Teams ──
function StepTeams({ onNext, onSkip }: StepProps) {
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
        <Users size={36} className="text-emerald-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-neutral-90 dark:text-white">4. Equipos y Personas</h2>
        <p className="text-sm text-muted leading-relaxed">
          Crea <strong>equipos</strong> con miembros, roles y asignación porcentual.
          El sistema calcula métricas DORA automáticamente para clasificar el rendimiento
          (Elite, Alto, Medio, Bajo).
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-neutral-5 dark:bg-neutral-85 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-neutral-90 dark:text-white">Elite</p>
          <p className="text-xs text-neutral-50">Deploy &gt;1/día</p>
        </div>
        <div className="bg-neutral-5 dark:bg-neutral-85 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-neutral-90 dark:text-white">Alto</p>
          <p className="text-xs text-neutral-50">Deploy diario/semanal</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => { navigate('/teams'); onNext() }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
          Ir a Equipos <ChevronRight size={16} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md" className="px-5">Más tarde</Button>}
      </div>
    </div>
  )
}

// ── Step 6: Security + Governance ──
function StepSecurity({ onNext, onSkip }: StepProps) {
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
        <Shield size={36} className="text-red-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-neutral-90 dark:text-white">5. Seguridad y Gobierno</h2>
        <p className="text-sm text-muted leading-relaxed">
          Gestiona <strong>vulnerabilidades</strong> (CVSS, SLA tracking), <strong>incidentes</strong> de seguridad
          (P1-P4 con RCA), <strong>riesgos</strong> (matriz probabilidad×impacto) y
          <strong> auditoría</strong> (hallazgos con plan de acción).
        </p>
        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 border border-amber-200 dark:border-amber-500/20">
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            💡 Las entidades se pueden asociar tanto a la aplicación directamente como a cada <strong>microservicio</strong>
            individualmente. Cuando ves una aplicación, las tabs muestran la unión de ambas fuentes.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => navigate('/security/vulnerabilities')} className="text-left bg-neutral-5 dark:bg-neutral-85 rounded-lg p-3 hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors">
          <p className="text-sm font-semibold text-neutral-90 dark:text-white">Vulnerabilidades</p>
          <p className="text-xs text-neutral-50">CVSS + SLA</p>
        </Button>
        <Button onClick={() => navigate('/governance/risks')} className="text-left bg-neutral-5 dark:bg-neutral-85 rounded-lg p-3 hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors">
          <p className="text-sm font-semibold text-neutral-90 dark:text-white">Riesgos</p>
          <p className="text-xs text-neutral-50">Probabilidad × Impacto</p>
        </Button>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={onNext} variant="primary" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
          Entendido <ChevronRight size={16} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md" className="px-5">Saltar</Button>}
      </div>
    </div>
  )
}

// ── Step 7: Execution + OKRs ──
function StepExecution({ onNext, onSkip }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto">
        <Target size={36} className="text-purple-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-neutral-90 dark:text-white">6. Ejecución y Estrategia</h2>
        <p className="text-sm text-muted leading-relaxed">
          El módulo de <strong>Ejecución</strong> integra Planes, Daily, Compromisos,
          Actividades y Bloqueos. Los <strong>OKRs</strong> permiten definir objetivos
          con Key Results medibles y vinculados a equipos.
        </p>
      </div>
      <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-secondary"><strong>Planes</strong> con health status y fechas</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-secondary"><strong>Daily</strong> con actividades y bloqueos del día</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-secondary"><strong>OKRs</strong> con Key Results y progreso</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={onNext} variant="primary" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
          Entendido <ChevronRight size={16} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md" className="px-5">Saltar</Button>}
      </div>
    </div>
  )
}

// ── Step 8: Dashboard + Notifications ──
function StepDashboard({ onNext, onSkip }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <LayoutDashboard size={36} className="text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-neutral-90 dark:text-white">7. Dashboard y Visibilidad</h2>
        <p className="text-sm text-muted leading-relaxed">
          El <strong>Dashboard Ejecutivo</strong> consolida todo en una vista con el
          <strong> THI (Technology Health Index)</strong>, 12 KPI cards y alertas en tiempo real.
          Puedes personalizar los widgets y compartir la vista con stakeholders.
        </p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 border border-blue-200 dark:border-blue-500/20 space-y-2 text-sm">
        <div className="flex items-center gap-3">
          <Bell size={16} className="text-blue-500" />
          <span className="text-blue-700 dark:text-blue-300">Activa notificaciones para recibir alertas de vencimientos</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={onNext} variant="primary" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
          Ver Dashboard <ChevronRight size={16} />
        </Button>
        {onSkip && <Button onClick={onSkip} variant="ghost" size="md" className="px-5">Saltar</Button>}
      </div>
    </div>
  )
}

// ── Step 9: Demo Data ──
function StepDemoData({ onNext, onSkip }: StepProps) {
  void onSkip;
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

  if (done) {
    return (
      <div className="text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
          <Check size={36} className="text-success" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-neutral-90 dark:text-white">¡Bienvenido, {displayName.split(' ')[0]}!</h2>
          <p className="text-sm text-muted">Datos de ejemplo cargados con tu perfil.</p>
        </div>
        <Button onClick={onNext} variant="primary" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
          Finalizar <ChevronRight size={16} />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
        <User size={36} className="text-success" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-neutral-90 dark:text-white">Tu perfil</h2>
        <p className="text-sm text-muted leading-relaxed">
          Antes de cargar los datos demo, ingresa tu nombre y correo para personalizar tu usuario administrador.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Nombre completo</label>
          <input type="text" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setNameError('') }}
            placeholder="Ej: Juan Pérez"
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-neutral-40 dark:placeholder:text-neutral-50" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Correo electrónico</label>
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setNameError('') }}
            placeholder="Ej: juan@empresa.com"
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-neutral-40 dark:placeholder:text-neutral-50" />
        </div>
        {nameError && <p className="text-xs text-danger text-center">{nameError}</p>}
      </div>
      <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-3 space-y-1">
        <p className="text-xs text-muted">
          Se cargarán automáticamente: <strong>10 apps</strong>, microservicios con vulnerabilidades, incidentes, riesgos y hallazgos,
          180+ tecnologías, equipos, OKRs y más.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={handleLoad} disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-success text-white rounded-xl font-medium text-sm hover:bg-success-dark transition-colors disabled:opacity-50">
          {loading ? 'Cargando...' : 'Cargar datos demo'}
        </Button>
        <Button onClick={onNext} variant="ghost" size="md" className="px-5">
          Lo haré manualmente
        </Button>
      </div>
    </div>
  )
}

// ── Step 10: Done ──
function StepDone({ onClose }: StepProps) {
  const navigate = useNavigate()
  const handleFinish = () => {
    completeOnboarding()
    onClose?.()
    navigate('/dashboard')
  }

  return (
    <div className="text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
        <Sparkles size={36} className="text-success" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-neutral-90 dark:text-white">¡Listo!</h2>
        <p className="text-sm text-muted leading-relaxed">
          Ya puedes comenzar. Recuerda que puedes volver a cualquier sección desde el menú lateral.
        </p>
      </div>
      <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-4 text-left text-sm space-y-2">
        <p className="font-medium text-neutral-90 dark:text-white">Ruta recomendada:</p>
        <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
          <li>Crear Unidades de Negocio en Administración</li>
          <li>Registrar Aplicaciones en Catálogo</li>
          <li>Sincronizar Tecnologías en Obsolescencia</li>
          <li>Crear Equipos y registrar miembros</li>
          <li>Explorar el Dashboard para ver métricas</li>
          <li>En detalle de app, clickear microservicio → asociar vulnerabilidades/riesgos</li>
        </ol>
      </div>
      <Button onClick={handleFinish} variant="primary" className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
        Ir al Dashboard <ChevronRight size={16} />
      </Button>
    </div>
  )
}

const STEPS = [
  { key: 'welcome', component: StepWelcome },
  { key: 'business-unit', component: StepBusinessUnit },
  { key: 'applications', component: StepApplications },
  { key: 'technologies', component: StepTechnologies },
  { key: 'teams', component: StepTeams },
  { key: 'security', component: StepSecurity },
  { key: 'execution', component: StepExecution },
  { key: 'dashboard', component: StepDashboard },
  { key: 'demo-data', component: StepDemoData },
  { key: 'done', component: StepDone },
]

interface WizardProps { onClose: () => void }

export function OnboardingWizard({ onClose }: WizardProps) {
  const [step, setStep] = useState(0)
  const currentStep = STEPS[step]

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const handleSkip = () => {
    if (step < STEPS.length - 1) {
      if (step === STEPS.length - 2) completeOnboarding()
      setStep((s) => s + 1)
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100
  const StepComponent = currentStep.component

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-card rounded-3xl border border-boundary shadow-2xl relative">
          {step > 0 && (
            <Button onClick={handleBack} variant="ghost" className="absolute top-5 left-5 p-2 rounded-xl hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors z-10" title="Atrás">
              <ChevronLeft size={20} className="text-neutral-50" />
            </Button>
          )}
          <div className="pt-5 px-6">
            <div className="w-full h-1 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="p-6">
            <StepComponent onNext={handleNext} onBack={handleBack} onSkip={handleSkip} onClose={onClose} isFirst={step === 0} />
          </div>
        </div>
      </div>
    </>
  )
}
