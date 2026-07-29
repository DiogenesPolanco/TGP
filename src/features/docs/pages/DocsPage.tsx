import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, CircleHelp } from 'lucide-react'

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
          {/* ─────────────────────────────────────── */}
          {/* PRIMEROS PASOS                          */}
          {/* ─────────────────────────────────────── */}
          <section id="primeros-pasos" className="mb-20 scroll-mt-20">
            <PageH1>Primeros Pasos</PageH1>
            <Divider />

            <SectionTitle>¿Qué es TGP?</SectionTitle>
            <Body>
              TGP (<Green>T</Green>echnology <Green>G</Green>overnance <Green>P</Green>latform) es
              una plataforma de gobierno tecnológico 100% cliente-side. Unifica en un solo lugar el
              inventario de aplicaciones, vulnerabilidades, riesgos, OKRs, métricas DORA,
              seguimiento de ejecución y más — todo sin depender de un backend externo.
            </Body>

            <SectionTitle>Stack tecnológico</SectionTitle>
            <Table
              rows={[
                ['Core', 'React 19', 'TypeScript 5.7'],
                ['Build tool', 'Vite 6', 'SWC (Rust-based compiler)'],
                ['Routing', 'React Router v7', 'createBrowserRouter'],
                ['State', 'Zustand 5', 'Stores atómicos + persist middleware'],
                ['DB', 'Dexie.js 4', 'Wrapper IndexedDB · 25+ tablas'],
                ['Styles', 'Tailwind CSS 4', 'Design system propio con CSS layers'],
                ['Icons', 'Lucide React', 'Tree-shakeable, ~800 iconos'],
                ['Charts', 'Recharts + ApexCharts', 'Gráficos responsive SVG'],
                ['Forms', 'React Hook Form', 'Zod schemas + validación'],
                ['Auth', 'TOTP (otpauth)', 'QR code · sin backend'],
                ['Cloud', 'Azure Blob Storage', '@azure/storage-blob SDK'],
              ]}
            />

            <SectionTitle>Arquitectura general</SectionTitle>
            <Body>
              La aplicación sigue una arquitectura <strong>feature-first</strong> con separación por
              dominio. Cada feature encapsula páginas, componentes, hooks y servicios propios. La
              capa de datos unificada (Dexie.js repos) vive en{' '}
              <InlineCode>src/services/</InlineCode> y expone operaciones CRUD reactivas mediante
              hooks personalizados.
            </Body>
            <CodeBlock>
              {
                'src/\n├── components/     # UI compartida (botones, modales, badges, layout)\n├── features/       # Módulos por dominio\n│   ├── dashboard/\n│   ├── catalog/\n│   ├── security/\n│   ├── teams/\n│   ├── strategy/\n│   ├── execution/\n│   ├── obsolescence/\n│   ├── governance/\n│   ├── ai/\n│   └── equipment/\n├── services/       # Capa de datos (Dexie repos, import/export, THI engine)\n├── stores/         # Zustand stores\n├── hooks/          # Hooks compartidos\n├── types/          # Tipos de dominio\n└── lib/            # Utilidades genéricas'
              }
            </CodeBlock>

            <SectionTitle>Decisiones arquitectónicas</SectionTitle>
            <Body>
              TGP toma decisiones técnicas deliberadas que definen su modelo de desarrollo y
              despliegue:
            </Body>

            <SubSection>Feature-first sobre capas técnicas</SubSection>
            <Body>
              En lugar de organizar por tipo técnico (pages/, components/, hooks/), cada feature
              agrupa todo lo que necesita: página, componentes específicos, hooks de datos,
              servicios. Esto permite desarrollar, testear y eliminar features de forma
              independiente. El código compartido entre features vive en{' '}
              <InlineCode>src/components/</InlineCode> (UI atómica) y
              <InlineCode> src/services/</InlineCode> (repos de datos).
            </Body>

            <SubSection>Offline-first con IndexedDB</SubSection>
            <Body>
              Todos los datos de dominio residen en IndexedDB mediante Dexie.js. No hay caché ni
              sincronización con un backend — IndexedDB <strong>es</strong> la fuente de verdad.
              Esto elimina la necesidad de servidor, base de datos externa, conexión de red y
              caching layer. Las operaciones en la nube (backup Azure Blob, enlaces públicos) son
              adicionales y completamente opcionales.
            </Body>

            <SubSection>UI como máquina de estados</SubSection>
            <Body>
              Cada vista sigue el patrón: <InlineCode>loading → data | empty | error</InlineCode>.
              Los hooks de datos (custom hooks sobre Dexie.js <InlineCode>useLiveQuery</InlineCode>)
              exponen estos cuatro estados de forma consistente, eliminando la necesidad de manejar
              estados implícitos en cada componente.
            </Body>

            <SubSection>Sin dependencias de framework CSS</SubSection>
            <Body>
              TGP no usa componentes de librerías UI (shadcn, MUI, Chakra). Todo el design system es
              propio sobre Tailwind CSS 4 con CSS layers. Esto garantiza consistencia visual, evita
              vendor lock-in y mantiene el bundle size mínimo (~150 KB gzip sin datos). Los
              componentes compuestos (modales, tabs, tooltips) usan React Aria Components por su
              accesibilidad headless.
            </Body>

            <SectionTitle>Requisitos del sistema</SectionTitle>
            <Table
              rows={[
                ['Chrome', '≥ 120', 'Full support'],
                ['Firefox', '≥ 120', 'Full support'],
                ['Edge', '≥ 120', 'Chromium-based, full support'],
                ['Safari', '≥ 17', 'Full support (macOS 14+)'],
                ['Storage', '≥ 50 MB', 'IndexedDB quota (puede solicitar más)'],
                ['Network', 'Opcional', 'Sin conexión para operación local'],
              ]}
            />

            <SectionTitle>Instalación y despliegue</SectionTitle>
            <SubSection>Desarrollo local</SubSection>
            <CodeBlock>
              {
                'git clone https://github.com/DiogenesPolanco/TGP.git\ncd TGP\nnpm install\n\n# Servidor de desarrollo (HMR via SWC)\nnpm run dev\n# → http://localhost:5173'
              }
            </CodeBlock>

            <SubSection>Build de producción</SubSection>
            <CodeBlock>
              {
                'npm run build\n# → dist/  (archivos estáticos)\n\n# Preview local del build\nnpm run preview'
              }
            </CodeBlock>
            <Body>
              El build genera archivos estáticos en <InlineCode>dist/</InlineCode>. No necesita
              Node.js, SSR, ni base de datos. Puedes servirlos con cualquier servidor HTTP estático.
            </Body>

            <SubSection>Despliegue en Vercel</SubSection>
            <CodeBlock>
              {
                '# 1. Conectar repo a Vercel\n# 2. Framework preset: Vite\n# 3. Build command: npm run build\n# 4. Output directory: dist\n# 5. Deploy → https://tup proyecto.vercel.app'
              }
            </CodeBlock>

            <SubSection>Despliegue en Netlify</SubSection>
            <CodeBlock>
              {
                '# netlify.toml (opcional)\n[build]\n  command = "npm run build"\n  publish = "dist"\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200'
              }
            </CodeBlock>

            <SubSection>Despliegue con Nginx</SubSection>
            <CodeBlock>
              {
                'server {\n    listen 80;\n    server_name tgp.miempresa.com;\n    root /var/www/tgp/dist;\n    index index.html;\n\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n\n    # Cache busting para assets con hash\n    location ~* \\.(js|css|png|jpg|svg)$ {\n        expires 1y;\n        add_header Cache-Control "public, immutable";\n    }\n}'
              }
            </CodeBlock>

            <SubSection>Despliegue con Docker (próximamente)</SubSection>
            <CodeBlock>
              {
                'FROM nginx:alpine\nCOPY dist/ /usr/share/nginx/html\nCOPY nginx.conf /etc/nginx/conf.d/default.conf\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]'
              }
            </CodeBlock>

            <SectionTitle>Variables de entorno</SectionTitle>
            <Body>
              TGP expone configuración vía variables <InlineCode>VITE_*</InlineCode> (estándar
              Vite). Son opcionales — la app funciona sin ninguna:
            </Body>
            <Table
              rows={[
                ['Variable', 'Default', 'Propósito'],
                ['VITE_AZURE_ACCOUNT', '—', 'Cuenta Azure Blob Storage para backup'],
                ['VITE_AZURE_CONTAINER', '—', 'Contenedor Azure Blob'],
                ['VITE_AZURE_SAS', '—', 'SAS token para Azure Blob'],
                ['VITE_DEFAULT_AI_PROVIDER', 'openai', 'Proveedor IA por defecto'],
                ['VITE_DEFAULT_AI_MODEL', 'gpt-4o', 'Modelo IA por defecto'],
                ['VITE_APP_TITLE', 'TGP', 'Título del dashboard'],
              ]}
            />

            <SectionTitle>Scripts NPM</SectionTitle>
            <Body>
              Referencia rápida de los comandos disponibles en <InlineCode>package.json</InlineCode>
              :
            </Body>
            <Table
              rows={[
                ['Comando', 'Acción'],
                ['npm run dev', 'Servidor de desarrollo con HMR (SWC) · localhost:5173'],
                ['npm run build', 'Compilar TS + build Vite → dist/'],
                ['npm run preview', 'Servir build local (pruebas de producción)'],
                ['npm run lint', 'ESLint sobre src/'],
                ['npm run typecheck', 'tsc --noEmit (solo verificación de tipos)'],
              ]}
            />

            <SectionTitle>Primer inicio — Onboarding</SectionTitle>
            <Body>
              Al ingresar por primera vez, un asistente interactivo de <strong>10 pasos</strong>{' '}
              guía la configuración inicial. El flujo crea secuencialmente:
            </Body>
            <CodeBlock>
              {
                'Paso   Acción                        Tabla destino\n────   ──────────────────────────── ─────────────────\n  1    Crear unidad de negocio      business_units\n  2    Registrar aplicación           applications\n  3    Registrar tecnología           technologies\n  4    Crear equipo                   teams\n  5    Agregar miembros               team_members\n  6    Registrar métricas DORA        dora_metrics\n  7    Cargar vulnerabilidades        vulnerabilities\n  8    Configurar OKRs                objectives\n  9    Vincular GobIA                 ai_config\n 10    Cargar dataset demo            (múltiples tablas)'
              }
            </CodeBlock>

            <SectionTitle>Carga de datos demo</SectionTitle>
            <Body>
              La función <InlineCode>useDemoData()</InlineCode> en{' '}
              <InlineCode>src/hooks/useDemoData.ts</InlineCode>
              popula 25+ tablas con un dataset representativo. Los datos se generan con UUIDs
              determinísticos para evitar duplicados en re-ejecuciones. Incluye:
            </Body>
            <BulletList>
              <li>3 unidades de negocio con 12 aplicaciones distribuidas</li>
              <li>8 tecnologías con estados de obsolescencia variados</li>
              <li>Vulnerabilidades CVSS simuladas con severidades mezcladas</li>
              <li>2 equipos DORA con métricas en rangos Elite/Bajo</li>
              <li>OKRs anidados con progreso parcial</li>
              <li>Plan de ejecución con actividades, bloqueos y compromisos</li>
            </BulletList>
          </section>

          {/* ─────────────────────────────────────── */}
          {/* FUNCIONALIDADES                          */}
          {/* ─────────────────────────────────────── */}
          <section id="funcionalidades" className="mb-20 scroll-mt-20">
            <PageH1>Funcionalidades</PageH1>
            <Divider />

            {/* --- DASHBOARD THI --- */}
            <SectionTitle>Dashboard THI</SectionTitle>
            <SubSection>Modelo de datos</SubSection>
            <Body>
              El THI se calcula desde la tabla <InlineCode>applications</InlineCode> y sus
              relaciones. Cada aplicación tiene puntuaciones en 7 dimensiones almacenadas como
              campos numéricos (0-100).
            </Body>
            <CodeBlock>
              {
                "// applications table (Dexie.js schema)\ninterface Application {\n  id: string\n  name: string\n  businessUnitId: string\n  criticality: 'baja' | 'media' | 'alta' | 'crítica'\n  status: 'activo' | 'en_desarrollo' | 'deprecado' | 'eliminado'\n  // THI dimensions (0-100)\n  thiSeguridad: number\n  thiDelivery: number\n  thiObsolescencia: number\n  thiRiesgo: number\n  thiArquitectura: number\n  thiCumplimiento: number\n  thiCostos: number\n  thiScore: number        // score compuesto\n  thiUpdatedAt: string    // ISO timestamp\n}"
              }
            </CodeBlock>

            <SubSection>Fórmula del THI compuesto</SubSection>
            <Body>
              Cada dimensión es un promedio ponderado de indicadores subyacentes. El score general
              se calcula como media ponderada de las 7 dimensiones:
            </Body>
            <CodeBlock>
              {`thiScore = Σ (dimensión_i × peso_i) / Σ peso_i

Pesos por defecto:
  Seguridad:      25%
  Delivery:       20%
  Obsolescencia:  15%
  Riesgo:         15%
  Arquitectura:   10%
  Cumplimiento:   10%
  Costos:          5%

  → Los pesos son configurables por unidad de negocio
    en src/config/thiWeights.ts

Cada dimensión se calcula de indicadores:
  thiSeguridad = mean(
    vulnsSeverityScore,     // inverso: más vulns → menor score
    incidentResponseTime,   // inverso: más tiempo → menor score
    auditFindingsRatio,     // ratio hallazgos cerrados/totales
    riskExposure            // inverso: mayor exposición → menor score
  )`}
            </CodeBlock>

            <SubSection>Sistema de pesos personalizable</SubSection>
            <Body>
              Los pesos del THI se pueden ajustar por unidad de negocio desde
              <InlineCode> src/config/thiWeights.ts</InlineCode>. El sistema soporta pesos globales
              y anulaciones por BU:
            </Body>
            <CodeBlock>
              {`interface ThiWeightConfig {
  global: Record<ThiDimension, number>  // pesos base
  overrides?: Record<string, Record<ThiDimension, number>>  // por BU
}

// Ejemplo: para una unidad de negocio con enfoque en seguridad
const config: ThiWeightConfig = {
  global: {
    thiSeguridad: 25, thiDelivery: 20, thiObsolescencia: 15,
    thiRiesgo: 15, thiArquitectura: 10, thiCumplimiento: 10, thiCostos: 5
  },
  overrides: {
    'bu-financiero': {
      thiSeguridad: 35, thiCumplimiento: 20,  // +10 y +10
      thiDelivery: 15, thiCostos: 5            // -5 y -0
    }
  }
}`}
            </CodeBlock>
            <Body>
              El motor de THI (<InlineCode>src/features/dashboard/services/thiEngine.ts</InlineCode>
              ) aplica primero los pesos globales y luego reemplaza con overrides si existen para la
              BU de la aplicación. Esto permite que diferentes unidades de negocio tengan
              ponderaciones alineadas con sus prioridades estratégicas.
            </Body>

            <SubSection>Motor de cálculo</SubSection>
            <Body>
              El motor vive en{' '}
              <InlineCode>src/features/dashboard/hooks/useThiCalculation.ts</InlineCode>. Se ejecuta
              en tiempo real vía <InlineCode>useEffect</InlineCode> cuando cambian los datos fuente.
              Usa <InlineCode>useLiveQuery</InlineCode> de Dexie.js para reactividad.
            </Body>
            <CodeBlock>
              {
                'Flujo de cómputo:\n1. useLiveQuery obtiene todas las applications desde IndexedDB\n2. Por cada app, calcula cada dimensión\n3. Agrega scores por unidad de negocio\n4. Computa THI global como promedio ponderado\n5. Actualiza thiScore + thiUpdatedAt en cada registro\n6. Dispara re-render del DashboardHero y gráficos'
              }
            </CodeBlock>

            {/* --- CATÁLOGO --- */}
            <SectionTitle>Catálogo de Aplicaciones</SectionTitle>
            <SubSection>Modelo relacional</SubSection>
            <CodeBlock>
              {
                'applications ──┬── microservices (0..*)\n               ├── vulnerabilities (0..*)  ← heredadas\n               ├── risks (0..*)\n               ├── incidents (0..*)\n               ├── audit_findings (0..*)\n               ├── technologies (M..N vía app_technologies)\n               └── business_unit (N..1)\n\nmicroservices ──┬── vulnerabilities (0..*)  ← heredables\n                ├── risks (0..*)            ← heredables\n                ├── incidents (0..*)         ← heredables\n                └── audit_findings (0..*)    ← heredables'
              }
            </CodeBlock>
            <Body>
              Un patrón clave de herencia: vulnerabilidades, riesgos, incidentes y hallazgos
              vinculados a un microservicio se heredan automáticamente a la aplicación padre. Esto
              evita duplicación y garantiza visibilidad completa desde el nivel de aplicación.
            </Body>

            <SubSection>Búsqueda y filtros</SubSection>
            <Body>
              La búsqueda usa índices compuestos de Dexie.js sobre los campos{' '}
              <InlineCode>name</InlineCode>,<InlineCode> description</InlineCode>,{' '}
              <InlineCode>businessUnitId</InlineCode>. Los filtros se aplican con{' '}
              <InlineCode>where().and()</InlineCode> sobre colecciones indexadas, con paginación de
              25 registros por página.
            </Body>

            <SubSection>Importación Excel</SubSection>
            <Body>
              El pipeline de importación (<InlineCode>src/services/import/</InlineCode>) parsea el
              archivo XLSX con SheetJS, mapea columnas a la tabla{' '}
              <InlineCode>applications</InlineCode>, detecta duplicados por{' '}
              <InlineCode>name + businessUnitId</InlineCode>, y ejecuta upsert transaccional en una
              sola operación Dexie.js.
            </Body>

            {/* --- SEGURIDAD --- */}
            <SectionTitle>Seguridad</SectionTitle>
            <SubSection>Vulnerabilidades — CVSS y SLA</SubSection>
            <Table
              rows={[
                ['Criticidad', 'Rango CVSS', 'SLA objetivo'],
                ['P1 — Crítica', '9.0 – 10.0', '≤ 48 horas'],
                ['P2 — Alta', '7.0 – 8.9', '≤ 7 días'],
                ['P3 — Media', '4.0 – 6.9', '≤ 30 días'],
                ['P4 — Baja', '0.1 – 3.9', '≤ 90 días'],
              ]}
            />
            <Body>
              Cada vulnerabilidad tiene un flujo de estados:{' '}
              <InlineCode>abierta → en_análisis → en_remediación → verificada → cerrada</InlineCode>
              . El SLA se trackea desde <InlineCode>createdAt</InlineCode> y cambia a color según el
              tiempo restante. El servicio de escalamiento en{' '}
              <InlineCode>src/features/execution/services/escalationService.ts</InlineCode>
              notifica items vencidos.
            </Body>

            <SubSection>Matriz de Riesgos</SubSection>
            <Body>
              La matriz calcula el nivel de riesgo como{' '}
              <InlineCode>probabilidad × impacto</InlineCode>, donde ambos ejes usan valores 1-5. El
              resultado se mapea a:
            </Body>
            <CodeBlock>
              {
                'Riesgo = Probabilidad × Impacto (1–25)\n\n  Bajo     (1–4)   → verde\n  Medio    (5–9)   → amarillo\n  Alto     (10–16) → naranja\n  Crítico  (17–25) → rojo'
              }
            </CodeBlock>

            {/* --- DORA --- */}
            <SectionTitle>Equipos DORA</SectionTitle>
            <SubSection>Métricas y thresholds</SubSection>
            <Table
              rows={[
                ['Métrica', 'Elite', 'Alto', 'Medio', 'Bajo'],
                ['Deploy Frequency', '≥ diario', '≥ semanal', '≥ mensual', '< mensual'],
                ['Lead Time', '< 1 día', '< 1 semana', '< 1 mes', '≥ 1 mes'],
                ['Change Failure Rate', '< 5%', '< 10%', '< 15%', '≥ 15%'],
                ['MTTR', '< 1 hora', '< 1 día', '< 1 semana', '≥ 1 semana'],
              ]}
            />
            <Body>
              Las métricas se registran manualmente por equipo en{' '}
              <InlineCode>dora_metrics</InlineCode>. El benchmark asigna automáticamente el nivel
              según los thresholds de DORA 2024. La vinculación con OKRs permite correlacionar
              entregables con desempeño de equipo.
            </Body>

            <SubSection>Cálculo de benchmark DORA</SubSection>
            <Body>
              TGP implementa los thresholds del <strong>DORA 2024 State of DevOps Report</strong>.
              Cada métrica se evalúa independientemente y el equipo recibe un nivel general igual a
              su peor métrica (el eslabón más débil):
            </Body>
            <CodeBlock>
              {`// Cálculo de nivel por métrica
function getDoraLevel(metric: DoraMetric): 'Elite' | 'Alto' | 'Medio' | 'Bajo' {
  switch (metric.name) {
    case 'deployFrequency':
      if (metric.value >= 1) return 'Elite'       // ≥ 1 deploy/día
      if (metric.value >= 1/7) return 'Alto'       // ≥ 1/semana
      if (metric.value >= 1/30) return 'Medio'     // ≥ 1/mes
      return 'Bajo'

    case 'leadTime':
      if (metric.value < 1) return 'Elite'         // < 1 día
      if (metric.value < 7) return 'Alto'          // < 1 semana
      if (metric.value < 30) return 'Medio'        // < 1 mes
      return 'Bajo'

    case 'changeFailureRate':
      if (metric.value < 5) return 'Elite'
      if (metric.value < 10) return 'Alto'
      if (metric.value < 15) return 'Medio'
      return 'Bajo'

    case 'mttr':
      if (metric.value < 1) return 'Elite'         // < 1 hora
      if (metric.value < 24) return 'Alto'         // < 1 día
      if (metric.value < 168) return 'Medio'       // < 1 semana
      return 'Bajo'
  }
}

// Nivel general = peor nivel entre las 4 métricas
const generalLevel = Math.min(
  getDoraLevel(deployFreq),
  getDoraLevel(leadTime),
  getDoraLevel(cfr),
  getDoraLevel(mttr)
)`}
            </CodeBlock>

            {/* --- OKRs --- */}
            <SectionTitle>OKRs y Estrategia</SectionTitle>
            <SubSection>Modelo de datos</SubSection>
            <CodeBlock>
              {
                "interface Objective {\n  id: string\n  title: string\n  period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'anual'\n  year: number\n  status: 'on_track' | 'at_risk' | 'behind' | 'achieved'\n}\n\ninterface KeyResult {\n  id: string\n  objectiveId: string\n  description: string\n  currentValue: number\n  targetValue: number\n  unit: string\n  weight: number  // 0-100, suma entre KRs = 100\n}"
              }
            </CodeBlock>

            <SubSection>Cálculo de progreso</SubSection>
            <CodeBlock>
              {`KR_progress = currentValue / targetValue × 100 (capped at 100)
Objective_progress = Σ (KR_progress_i × weight_i) / Σ weight_i

Status:
  progress ≥ 90%   → achieved
  progress ≥ 70%   → on_track
  progress ≥ 40%   → at_risk
  progress < 40%   → behind`}
            </CodeBlock>

            <SubSection>Alineación con ejecución</SubSection>
            <Body>Los OKRs se vinculan con la ejecución operativa mediante dos mecanismos:</Body>
            <CodeBlock>
              {`1. Vinculación directa
   key_results.deliverables: string[]  // IDs de actividades del plan
   → El progreso del KR se actualiza automáticamente al completar
     actividades vinculadas

2. Alineación estratégica
   objectives.teamId → teams.id
   → Los OKRs de un equipo se visualizan junto a su plan de ejecución
     en la vista de timeline

3. Reporte de contribución
   Cada actividad completada muestra el OKR al que contribuye:
   "Actividad: Migrar servidores (contribuye a: Q3-2026-1: Reducir deuda técnica)"`}
            </CodeBlock>

            {/* --- EJECUCIÓN --- */}
            <SectionTitle>Ejecución</SectionTitle>
            <SubSection>Diagramas de Gantt</SubSection>
            <Body>
              Los planes tienen actividades con fechas <InlineCode>startDate</InlineCode> y
              <InlineCode> endDate</InlineCode>. El Gantt se renderiza en
              <InlineCode> ActivityGantt.tsx</InlineCode> usando posicionamiento CSS absoluto sobre
              un grid de días. Cada actividad es un bloque coloreado por estado.
            </Body>

            <SubSection>Escalamiento automático</SubSection>
            <Body>
              El servicio <InlineCode>escalationService.ts</InlineCode> ejecuta un barrido cada 5
              minutos sobre actividades, bloqueos y compromisos vencidos. Cuando un item supera su
              fecha límite, se marca como <InlineCode>escalated</InlineCode> y se registra en el log
              de auditoría.
            </Body>

            {/* --- OBSOLESCENCIA --- */}
            <SectionTitle>Obsolescencia</SectionTitle>
            <SubSection>Integración con endoflife.date</SubSection>
            <Body>
              Las tecnologías registradas se comparan contra la API de{' '}
              <InlineCode>endoflife.date</InlineCode>
              para determinar su estado de soporte. La sincronización se ejecuta bajo demanda desde
              la vista de obsolescencia y cachea los resultados en IndexedDB por 24 horas.
            </Body>
            <CodeBlock>
              {
                'GET https://endoflife.date/api/{technology}.json\n\nResponse example:\n{\n  "eol": true,\n  "latest": "17 LTS",\n  "releaseDate": "2021-09-12",\n  "support": {\n    "active": "2024-09-30",\n    "security": "2027-09-30",\n    "end": "2029-09-30"\n  },\n  "cycle": "17"\n}\n\nEstados derivados:\n  active        → dentro del período de soporte activo\n  security_only → solo parches de seguridad\n  eol           → fin de vida (sin parches)\n  unknown       → no encontrado en API'
              }
            </CodeBlock>

            <SubSection>Mapa de obsolescencia</SubSection>
            <Body>
              El mapa renderiza un grafo dirigido donde los nodos son tecnologías y las aristas
              representan dependencias entre aplicaciones. Los nodos se colorean según su estado
              (activo, security-only, EOL) y el tamaño refleja la cantidad de aplicaciones
              impactadas.
            </Body>

            {/* --- GOBIA --- */}
            <SectionTitle>GobIA — Asistente de IA</SectionTitle>
            <SubSection>Arquitectura de proveedores</SubSection>
            <Body>GobIA soporta 4 proveedores de IA. Todos implementan la interfaz unificada:</Body>
            <CodeBlock>
              {
                'interface AiProvider {\n  name: string\n  enabled: boolean\n  baseUrl: string\n  defaultModel: string\n  requiresApiKey: boolean\n  supportsTools: boolean\n}\n\n// Configuración por proveedor\nopenai:   { baseUrl: "https://api.openai.com/v1", models: ["gpt-4o", "gpt-4o-mini"] }\ngroq:     { baseUrl: "https://api.groq.com/openai/v1", models: ["llama-4", "mixtral"] }\nanthropic: { baseUrl: "https://api.anthropic.com/v1", models: ["claude-sonnet-4"] }\nollama:    { baseUrl: "http://localhost:11434/v1", models: ["llama3", "mistral"], requiresApiKey: false }'
              }
            </CodeBlock>

            <SubSection>Sistema de tool calls</SubSection>
            <Body>
              GobIA ejecuta tool calls nativos sobre la base de datos local. Los tools se registran
              en
              <InlineCode> src/features/ai/tools/registry.ts</InlineCode> y cada uno expone un
              schema Zod, un handler asíncrono y una descripción para el LLM.
            </Body>
            <CodeBlock>
              {
                'Tools disponibles:\n  health-index    → consultar THI y dimensiones\n  aplicaciones    → buscar/catalogar aplicaciones\n  tecnologías     → consultar stack y obsolescencia\n  equipo          → miembros, DORA metrics\n  vulnerabilidades→ vulns activas, CVSS, SLA\n  indicadores     → KPIs agregados\n  auditoría       → hallazgos y riesgos\n  dependencias    → mapa de dependencias\n  bloqueos        → items escalados\n  entregables     → OKR deliverables'
              }
            </CodeBlock>
            <Body>
              Cada tool ejecuta queries contra IndexedDB usando Dexie.js, serializa el resultado y
              lo inyecta en el contexto del mensaje al LLM. El sistema multi-turno mantiene el
              historial de conversación en memoria (store Zustand) para respuestas contextualizadas.
            </Body>

            <SubSection>Pipeline de ejecución de tool calls</SubSection>
            <Body>
              GobIA procesa cada mensaje del usuario a través de un pipeline secuencial de 6 etapas:
            </Body>
            <CodeBlock>
              {`1. Parseo de intención
   El mensaje del usuario se envía al LLM junto con las definiciones de tools
   disponibles (name + description + schema Zod serializado a JSON Schema).

2. Selección de tools
   El LLM responde con una o más llamadas a tool (function calling nativo).
   Cada tool incluye: { name, arguments: { ... } }.

3. Ejecución local
   Cada tool se resuelve contra el registro de tools (registry.ts):
   → Se valida arguments contra el schema Zod
   → Se ejecuta el handler asíncrono (query a IndexedDB)
   → Se captura el resultado o error

4. Inyección de contexto
   El resultado de cada tool se inyecta como mensaje del sistema:
   "tool {name} returned: {JSON serializado}"

5. Generación de respuesta
   El LLM recibe el contexto aumentado y genera la respuesta final en
   lenguaje natural, citando los datos obtenidos.

6. Actualización de historial
   El mensaje original + tool calls + respuesta se persisten en el store
   Zustand (aiStore). El historial completo se reenvía en cada turno
   para mantener coherencia multi-turno.`}
            </CodeBlock>
            <Body>
              Este pipeline se ejecuta en el hilo principal del navegador. Para datasets grandes
              (100k+ registros), las queries a IndexedDB pueden superar los 50 ms — GobIA muestra un
              indicador de escritura ("GobIA está pensando...") mientras se completan.
            </Body>
          </section>

          {/* ─────────────────────────────────────── */}
          {/* INTEGRACIONES                             */}
          {/* ─────────────────────────────────────── */}
          <section id="integraciones" className="mb-20 scroll-mt-20">
            <PageH1>Integraciones</PageH1>
            <Divider />

            <SectionTitle>Jira</SectionTitle>
            <Body>
              Los tickets de equipamiento se vinculan a Jira mediante los campos
              <InlineCode> jiraIssueId</InlineCode> e <InlineCode>issueUrl</InlineCode> en la tabla
              <InlineCode> equipment_tickets</InlineCode>. La integración es unidireccional: TGP
              almacena la referencia y provee un enlace directo al issue en Jira desde la vista de
              detalle del ticket.
            </Body>
            <CodeBlock>
              {
                "// Tabla equipment_tickets:\ninterface EquipmentTicket {\n  id: string\n  equipmentId: string\n  type: 'reparación' | 'reemplazo' | 'nuevo'\n  status: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado'\n  jiraIssueId?: string    // ej: \"PROY-123\"\n  issueUrl?: string        // ej: \"https://miempresa.atlassian.net/browse/PROY-123\"\n  description: string\n  createdAt: string\n}"
              }
            </CodeBlock>

            <SectionTitle>Azure Blob Storage</SectionTitle>
            <SubSection>Arquitectura de almacenamiento</SubSection>
            <Body>
              TGP usa Azure Blob Storage para respaldo y enlaces públicos. El contenedor se
              configura desde Administración → Configuración → Azure Cloud.
            </Body>
            <CodeBlock>
              {
                'Configuración requerida:\n  accountName:     string  // nombre de la cuenta de almacenamiento\n  containerName:   string  // nombre del contenedor (ej: "tgp-shares")\n  sasToken:        string  // SAS token con permisos de lectura/escritura\n\nCada blob se nombra con UUID v4:\n  {container}/{uuid}.json\n\nEl contenido del blob es un JSON cifrado con AES-GCM-256.'
              }
            </CodeBlock>

            <SubSection>API del servicio de Azure Blob</SubSection>
            <Body>
              El servicio <InlineCode>azureShareService.ts</InlineCode> expone 4 operaciones
              públicas:
            </Body>
            <CodeBlock>
              {`interface AzureBlobService {
  /** Guardar blob con cifrado AES-GCM */
  upload(hash: string, payload: object, passphrase?: string): Promise<void>

  /** Leer y descifrar blob por hash */
  download(hash: string, passphrase?: string): Promise<object | null>

  /** Listar todos los blobs del contenedor */
  list(): Promise<Array<{ hash: string; size: number; uploadedAt: string }>>

  /** Eliminar blob del contenedor */
  delete(hash: string): Promise<void>
}

// Configuración desde Admin → Azure Cloud
interface AzureConfig {
  accountName: string
  containerName: string
  sasToken: string        // Token SAS con permisos: cw (create+write)
                          // y rl (read+list) según operación
}`}
            </CodeBlock>

            <SubSection>Configuración paso a paso</SubSection>
            <Body>Sigue estos pasos para conectar TGP con Azure Blob Storage:</Body>
            <StepList
              items={[
                'Crear cuenta de almacenamiento: Azure Portal → Storage accounts → Create. Elegir "StorageV2 (general purpose v2)", rendimiento "Standard", redundancia "LRS".',
                'Crear contenedor: Dentro de la cuenta → Containers → + Container. Nombre: "tgp-backups" (o el que prefieras). Nivel de acceso: "Private (no anonymous access)".',
                'Generar SAS token: Ir a tu cuenta → "Shared access signature". Marcar los permisos necesarios: Read, Write, List, Delete. Fecha de expiración: elegir según necesidad (recomendado: 1 año). Protocolo: HTTPS only. Click en "Generate SAS and connection string". Copiar "SAS token".',
                'Alternativa — SAS de contenedor: Ir a Containers → tu contenedor → "Shared access tokens". Esto limita el SAS al contenedor específico. Permisos: Read, Write, List, Delete. Copiar el "Blob SAS token" generado.',
                'Configurar en TGP: Ir a Administración → Configuración → Azure Cloud. Ingresar Account Name, Container Name, y el SAS token. Click "Probar conexión" para verificar.',
                'Verificar: Si la conexión es exitosa, puedes crear enlaces públicos desde cualquier vista (compartir) y hacer backup desde Administración → Exportar → "Subir a Azure".',
              ]}
            />

            <SubSection>Uso de backups en Azure</SubSection>
            <Body>
              Una vez configurado, puedes gestionar backups desde la interfaz de Administración:
            </Body>
            <StepList
              items={[
                'Subir backup: Administración → Exportar datos → "Subir a Azure" → el sistema exporta todas las tablas a un JSON cifrado y lo sube como blob.',
                'Descargar backup: Administración → Importar → "Desde Azure" → lista los blobs disponibles, seleccionas uno y lo descargas/restauras.',
                'Restaurar automatic: seleccionar un blob de la lista → el sistema descarga, descifra e importa todas las tablas automáticamente.',
                'Eliminar backup: en la lista de blobs, hay un botón de eliminar por si necesitas limpiar backups antiguos.',
                'Los blobs se nombran con UUID v4 + timestamp: "tgp-backup-2026-07-19-a1b2c3d4.json".',
              ]}
            />

            <SubSection>Solución de problemas con Azure</SubSection>
            <Body>Si la conexión falla o los backups no funcionan:</Body>
            <BulletListInline
              items={[
                '"SAS token expirado" → generar un nuevo SAS con fecha futura y actualizar en TGP.',
                '"Permission denied (List)" → el SAS necesita permisos Read + Write + List + Delete.',
                '"Container not found" → verificar que el nombre del contenedor coincida exactamente (incluye mayúsculas/minúsculas).',
                '"Network error" → firewalls corporativos pueden bloquear Azure. Probar desde una red diferente.',
                '"Blob no encontrado" → si el contenedor tiene muchos blobs, la paginación puede fallar. Usar nombres cortos.',
              ]}
            />

            <SubSection>Cifrado de enlaces públicos</SubSection>
            <Body>Los enlaces públicos se cifran en reposo antes de almacenarse. El proceso:</Body>
            <CodeBlock>
              {
                '1. Generar clave AES-GCM-256 a partir de passphrase (opcional) + salt\n   key = PBKDF2(passphrase, salt, 100000 iterations, 256 bits)\n\n2. Cifrar payload JSON\n   ciphertext = AES-GCM-256.encrypt(payload, key)\n   → produce: nonce (12 bytes) + ciphertext + authTag (16 bytes)\n\n3. Almacenar blob con: { salt, nonce, ciphertext }\n\n4. El enlace público contiene:\n   /public/{hash}?passphrase={opcional}\n\n5. Al abrir, se descifra del lado del cliente\n   Solo el navegador tiene la clave para descifrar'
              }
            </CodeBlock>

            <SectionTitle>Proveedores de IA — Configuración detallada</SectionTitle>
            <Body>
              GobIA se configura desde <strong>Ajustes → IA</strong>. Cada proveedor requiere:
            </Body>
            <Table
              rows={[
                ['Proveedor', 'API Key', 'Modelo por defecto', 'Tool calls', 'Costo'],
                ['OpenAI', 'Requerida', 'gpt-4o', 'Sí', 'Pago por uso'],
                ['Groq', 'Requerida', 'llama-4', 'Sí', 'Free tier disponible'],
                ['Anthropic', 'Requerida', 'claude-sonnet-4', 'Próximamente', 'Pago por uso'],
                ['Ollama', 'No requiere', 'llama3 (local)', 'Sí', 'Gratuito (local)'],
              ]}
            />
            <Body>
              Las API keys se almacenan en IndexedDB cifradas con <InlineCode>btoa/atob</InlineCode>
              (ofuscación básica). No se envían a ningún servidor externo — las llamadas se hacen
              directamente desde el navegador a la API del proveedor.
            </Body>

            <SubSection>Configuración paso a paso — OpenAI</SubSection>
            <StepList
              items={[
                'Crear cuenta en https://platform.openai.com/signup si no tienes una.',
                'Ir a API keys → "Create new secret key". Copiar la key (sk-...). No se puede recuperar después, guárdala.',
                'En TGP: Ajustes → IA → Proveedor: OpenAI. Pegar la API key en el campo correspondiente.',
                'Seleccionar modelo: gpt-4o (recomendado) o gpt-4o-mini (más económico).',
                'Configurar límites: OpenAI free tier tiene 3 RPM (requests por minuto) — si ves errores 429, reducir frecuencia.',
                'Probar: escribir "¿Cuántas aplicaciones hay?" en GobIA. Debería responder con datos si hay apps cargadas.',
              ]}
            />

            <SubSection>Configuración paso a paso — Groq</SubSection>
            <StepList
              items={[
                'Crear cuenta en https://console.groq.com/signup.',
                'Ir a API Keys → "Create API Key". Copiar la key (gsk_-...).',
                'En TGP: Ajustes → IA → Proveedor: Groq. Pegar la API key.',
                'Seleccionar modelo: llama-4 (recomendado por su soporte de tool calls). Alternativa: mixtral-8x7b.',
                'Groq ofrece free tier generoso (30 RPM en modelos populares) — ideal para pruebas.',
                'Probar con una consulta a GobIA. Si falla, verificar que el modelo elegido soporte function calling.',
              ]}
            />

            <SubSection>Configuración paso a paso — Ollama (local)</SubSection>
            <Body>
              Ollama es la opción gratuita y 100% local. No envía datos a ningún servidor externo.
            </Body>
            <StepList
              items={[
                'Instalar Ollama: https://ollama.com/download → descargar e instalar según tu SO.',
                'Abrir terminal y descargar un modelo con soporte de tool calls: ollama pull llama4 (recomendado) u ollama pull mistral.',
                'Configurar CORS: Ollama bloquea conexiones desde navegadores por seguridad. Ejecutar: OLLAMA_ORIGINS=* ollama serve (Linux/macOS) o set OLLAMA_ORIGINS=* && ollama serve (Windows).',
                'Verificar que Ollama corre: curl http://localhost:11434/api/tags — debe devolver JSON con los modelos instalados.',
                'En TGP: Ajustes → IA → Proveedor: Ollama. No requiere API key. Modelo: el que descargaste (ej: "llama4").',
                'Opcional — Docker: docker run -d -p 11434:11434 -e OLLAMA_ORIGINS="*" ollama/ollama.',
                'Probar: preguntar a GobIA "¿Qué tecnologías hay registradas?". Si falla, revisar la consola del navegador por errores CORS.',
              ]}
            />

            <SubSection>Configuración paso a paso — Anthropic (próximamente)</SubSection>
            <StepList
              items={[
                'Crear cuenta en https://console.anthropic.com/.',
                'Ir a API Keys → "Create Key". Copiar la key (sk-ant-...).',
                'En TGP: Ajustes → IA → Proveedor: Anthropic. Pegar la API key.',
                'Modelo por defecto: claude-sonnet-4. Soporte de tool calls en desarrollo.',
                'Nota: El soporte de tool calls para Anthropic está en implementación. Mientras tanto, GobIA responde sin consultar la base de datos local.',
              ]}
            />

            <SectionTitle>Importación Excel — Formato esperado</SectionTitle>
            <Body>
              El importador acepta archivos <InlineCode>.xlsx</InlineCode> con las siguientes
              columnas:
            </Body>
            <CodeBlock>
              {
                'Columnas de applications:\n  name*             → nombre de la aplicación\n  description       → descripción\n  businessUnit*     → nombre de la unidad de negocio\n  criticality       → baja | media | alta | crítica\n  status            → activo | en_desarrollo | deprecado\n  category          → categoría funcional\n  technicalLead     → responsable técnico\n  repositoryUrl     → URL del repositorio\n  (*) = requerido'
              }
            </CodeBlock>
            <Body>
              El proceso de importación: 1) Lee el archivo con SheetJS, 2) Valúa cada fila contra un
              schema Zod, 3) Detecta duplicados por <InlineCode>name + businessUnitId</InlineCode>,
              4) Ejecuta upsert en transacción Dexie.js, 5) Reporta resultados (insertados,
              actualizados, errores).
            </Body>

            <SectionTitle>Exportación de datos</SectionTitle>
            <SubSection>Formato JSON de exportación</SubSection>
            <Body>
              TGP exporta todas las tablas en un único archivo JSON con estructura versionada. Este
              mismo formato se usa para backup y restauración:
            </Body>
            <CodeBlock>
              {`{
  "version": 6,
  "exportedAt": "2026-07-19T12:00:00Z",
  "data": {
    "business_units": [ ... ],
    "applications": [ ... ],
    "vulnerabilities": [ ... ],
    "technologies": [ ... ],
    // ... 25+ tablas incluidas
  }
}

// El exportador omite tablas internas y de configuración:
// - share_links (los enlaces públicos no se respaldan)
// - ai_config (API keys no se exportan por seguridad)
// - user_preferences (preferencias locales no transferibles)`}
            </CodeBlock>
            <Body>
              La exportación se descarga como <InlineCode>.json</InlineCode> desde
              <InlineCode> Administración → Exportar datos</InlineCode>. Para restaurar, usar
              <InlineCode> Administración → Importar → JSON de backup</InlineCode>. El importador
              detecta la versión del schema y migra automáticamente si es necesario.
            </Body>

            <SubSection>Pipeline de SheetJS</SubSection>
            <Body>
              El motor de importación (<InlineCode>src/services/import/importService.ts</InlineCode>
              ) sigue un pipeline de 6 etapas:
            </Body>
            <CodeBlock>
              {`1. Parseo binario
   SheetJS.read(data, { type: 'array', cellDates: true })
   → WorkBook con todas las hojas

2. Extracción de hoja activa
   const sheet = workbook.Sheets[workbook.SheetNames[0]]
   const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

3. Mapeo de columnas (heuristico)
   Busca coincidencias entre headers del Excel y campos del schema Zod:
   "Nombre aplicación" → name, "BU" → businessUnit, etc.
   Si no hay match exacto, muestra tabla de mapeo para confirmación manual.

4. Validación Zod por fila
   const result = applicationSchema.safeParse(row)
   Los errores se recolectan sin detener el proceso:
   { row: 42, field: 'criticality', error: 'Invalid enum value: "critica"' }

5. Detección de duplicados
   const existing = await db.applications
     .where({ name: row.name, businessUnitId: buId })
     .first()
   Si existe → UPDATE (upsert), si no → INSERT

6. Transacción Dexie.js
   await db.transaction('rw', db.applications, async () => {
     for (const record of records) {
       await db.applications.put(record)
     }
   })
   → Una transacción atómica: si falla, rollback completo`}
            </CodeBlock>
          </section>

          {/* ─────────────────────────────────────── */}
          {/* CONSIDERACIONES TÉCNICAS                  */}
          {/* ─────────────────────────────────────── */}
          <section id="tecnico" className="mb-20 scroll-mt-20">
            <PageH1>Consideraciones Técnicas</PageH1>
            <Divider />

            <SectionTitle>Esquema de IndexedDB (Dexie.js)</SectionTitle>
            <Body>
              La base de datos local <InlineCode>TGP</InlineCode> contiene 25+ tablas. Las
              principales:
            </Body>
            <CodeBlock>
              {
                "// Versión 6 del schema Dexie.js\nconst db = new Dexie('TGP')\ndb.version(6).stores({\n  // Core\n  business_units:     'id, name',\n  applications:       'id, name, businessUnitId, criticality, status, thiScore',\n  microservices:      'id, name, applicationId',\n  technologies:       'id, name, category',\n  app_technologies:   'id, appId, techId',\n\n  // Seguridad\n  vulnerabilities:    'id, applicationId, severity, status, cvssScore, createdAt',\n  incidents:          'id, applicationId, severity, status, createdAt',\n  risks:              'id, applicationId, probability, impact',\n  audit_findings:     'id, applicationId, status',\n\n  // Equipos\n  teams:              'id, name',\n  team_members:       'id, teamId, name',\n  dora_metrics:       'id, teamId, period',\n\n  // Estrategia\n  objectives:         'id, teamId, period, year, status',\n  key_results:        'id, objectiveId',\n\n  // Ejecución\n  plans:              'id, teamId, status, startDate, endDate',\n  activities:         'id, planId, status, startDate, endDate',\n  blockers:           'id, planId, status, escalated',\n  commitments:        'id, teamId, status, dueDate',\n  tasks:              'id, activityId, status, assigneeId',\n\n  // Eventos & Calendar\n  events:             'id, type, startDate, endDate, category',\n\n  // Equipamiento\n  equipment:          'id, type, status, assignedTo',\n  equipment_tickets:  'id, equipmentId, status, jiraIssueId',\n\n  // Sharing\n  share_links:        'id, hash, expiresAt',\n\n  // Config\n  ai_config:          'id, userId',\n  user_preferences:   'id, userId',\n})"
              }
            </CodeBlock>

            <SectionTitle>Estrategia de índices</SectionTitle>
            <Body>
              Dexie.js usa los índices declarados en <InlineCode>stores()</InlineCode> para queries
              eficientes. Las búsquedas compuestas se resuelven con índices agrupados:
            </Body>
            <CodeBlock>
              {
                "// Búsqueda eficiente: apps por BU + criticidad\ndb.applications\n  .where('businessUnitId')\n  .equals(buId)\n  .filter((a) => a.criticality === 'crítica')\n  .toArray()\n\n// Búsqueda por rango: vulns abiertas con CVSS > 7\ndb.vulnerabilities\n  .where('severity')\n  .equals('alta')\n  .filter((v) => v.cvssScore >= 7)\n  .toArray()\n\n// Ordenamiento por fecha (usando índice created_at)\ndb.vulnerabilities\n  .where('createdAt')\n  .between('2026-01-01', '2026-12-31')\n  .reverse()\n  .toArray()"
              }
            </CodeBlock>

            <SectionTitle>Ciclo de vida de los datos</SectionTitle>
            <Table
              rows={[
                ['Operación', 'Mecanismo', 'Persistencia'],
                ['Lectura', 'Dexie.js useLiveQuery', 'Reactivo (subscripción)'],
                ['Escritura', 'Repos service + transacción', 'Síncrono a IndexedDB'],
                ['Backup', 'Export JSON completo', 'Manual / Azure Blob'],
                ['Restore', 'Import JSON → upsert', 'Manual desde Admin'],
                ['Share', 'Cifrado AES-GCM-256', 'Azure Blob / localStorage'],
                ['Purga', 'Eliminación lógica', 'Borrado manual desde Admin'],
              ]}
            />

            <SectionTitle>Autenticación TOTP</SectionTitle>
            <Body>
              TGP usa TOTP (Time-based One-Time Password) para autenticación. El flujo completo:
            </Body>
            <CodeBlock>
              {
                "1. Setup: generar secret de 20 bytes (base32 encoded)\n   secret = randomBytes(20).toString('base32')\n\n2. Mostrar QR code al usuario\n   otpauth://totp/TGP:{username}?secret={secret}&issuer=TGP\n\n3. Verificar código OTP (RFC 6238)\n   window = 30 segundos\n   validCodes = [\n     TOTP(secret, currentTime - 30s),\n     TOTP(secret, currentTime),\n     TOTP(secret, currentTime + 30s),\n   ]\n   // Se acepta ±1 ventana para tolerancia de desfase\n\n4. Sesión: JWT simulado almacenado en sessionStorage\n   session = { token, createdAt, expiresAt }\n   expiresAt = now + 24h"
              }
            </CodeBlock>

            <SectionTitle>Performance targets</SectionTitle>
            <Table
              rows={[
                ['Operación', 'Target', 'Notas'],
                ['Query por ID', '< 1 ms', 'Índice primario Dexie.js'],
                ['Query por índice', '< 5 ms', 'Índice secundario'],
                ['Filtro + orden', '< 15 ms', 'Colección < 10k registros'],
                ['THI completo', '< 50 ms', '7 dimensiones × 100 apps'],
                ['Import Excel (100 rows)', '< 2 s', 'SheetJS + upsert transaccional'],
                ['Build production', '< 30 s', 'Vite + SWC (cold)'],
                ['Bundle size (gzip)', '~150 KB', 'Sin contar datos'],
              ]}
            />

            <SectionTitle>Límites de almacenamiento</SectionTitle>
            <Body>
              IndexedDB solicita cuota al navegador. La mayoría de navegadores permiten hasta
              <strong> 60% del espacio en disco</strong> (o al menos 1 GB). TGP con uso típico ocupa
              entre 5-50 MB. Para monitorear el uso actual:
            </Body>
            <CodeBlock>
              {`// En consola del navegador:
navigator.storage.estimate().then((e) => {
  console.log('Usado:', e.usage / 1024 / 1024, 'MB')
  console.log('Cuota:', e.quota / 1024 / 1024, 'MB')
})`}
            </CodeBlock>

            <SectionTitle>Cifrado de datos</SectionTitle>
            <Body>
              TGP implementa cifrado en múltiples capas según la sensibilidad de los datos:
            </Body>
            <Table
              rows={[
                ['Capa', 'Algoritmo', 'Aplicación'],
                ['En reposo (local)', 'N/A', 'IndexedDB (sandbox del navegador)'],
                ['En tránsito (API IA)', 'TLS 1.3', 'Llamadas a proveedores externos'],
                ['Enlaces públicos', 'AES-GCM-256', 'Payload cifrado + passphrase opcional'],
                ['API keys', 'btoa/atob', 'Ofuscación básica en IndexedDB'],
              ]}
            />

            <SectionTitle>Service Worker y PWA</SectionTitle>
            <Body>
              TGP usa <InlineCode>vite-plugin-pwa</InlineCode> con estrategia{' '}
              <strong>generateSW</strong>
              para generar el Service Worker automáticamente durante el build. Los detalles:
            </Body>
            <Table
              rows={[
                ['Estrategia SW', 'generateSW (Workbox v7)', 'Pre-cache de todos los assets'],
                ['Cache de navegación', 'NetworkFirst', 'API calls y navigations'],
                ['Offline fallback', 'index.html', 'App shell para cualquier ruta'],
                ['Pre-cache', '142 entries', 'JS, CSS, imágenes, fuentes'],
                ['Tamaño total cache', '~5.6 MB', 'Compressed en CDN'],
                ['Actualización', 'Al recargar', 'SW busca nueva versión en segundo plano'],
              ]}
            />
            <Body>
              Al abrir TGP en un navegador compatible, el Service Worker se instala automáticamente.
              En la segunda visita, la app carga completa incluso sin conexión de red (App Shell
              pattern). Para forzar actualización del SW:{' '}
              <InlineCode>DevTools → Application → Service Workers → Update</InlineCode>.
            </Body>

            <SectionTitle>Estrategia de manejo de errores</SectionTitle>
            <Body>
              TGP implementa 3 capas de captura de errores para garantizar que ningún crash deje la
              aplicación en blanco:
            </Body>
            <CodeBlock>
              {`1. Error Boundary (React)
   <ErrorBoundary fallback={<GenericErrorPage />}>
     <App />
   </ErrorBoundary>
   → Captura errores durante renderizado de componentes
   → Muestra página de error genérica con botón "Recargar"

2. Evento window.onerror
   window.addEventListener('error', (e) => {
     console.error('[TGP] Uncaught:', e.error)
     // Opcional: enviar a servicio de telemetría
   })
   → Captura errores no manejados fuera del árbol React
   → Errores de carga de módulos, promises sin catch

3. Promise rejection handler
   window.addEventListener('unhandledrejection', (e) => {
     console.error('[TGP] Unhandled promise:', e.reason)
   })
   → Captura promesas rechazadas sin catch
   → Común en errores de IndexedDB o fetch a APIs`}
            </CodeBlock>

            <SectionTitle>Optimización de bundle</SectionTitle>
            <Body>
              TGP aplica varias estrategias para mantener el bundle size mínimo (~150 KB gzip sin
              datos):
            </Body>
            <Table
              rows={[
                ['Técnica', 'Implementación', 'Impacto'],
                ['Tree shaking', 'ESM + Vite Rollup', 'Elimina código muerto automáticamente'],
                ['Code splitting', 'React.lazy + Suspense', 'Carga diferida por ruta'],
                ['SWC minify', 'SWC (Rust)', 'Minificación ~5× más rápida que Terser'],
                ['Lucide tree-shake', 'Importaciones nombradas', 'Solo iconos usados en el bundle'],
                ['CSS purging', 'Tailwind CSS v4', 'Solo clases utilizadas en HTML/JSX'],
                ['Compression', 'CDN con gzip/brotli', 'Reducción ~70% del tamaño transferido'],
                ['Dynamic imports', 'Import() en rutas pesadas', 'Azure SDK, SheetJS, ApexCharts'],
              ]}
            />
          </section>

          {/* ─────────────────────────────────────── */}
          {/* TROUBLESHOOTING                           */}
          {/* ─────────────────────────────────────── */}
          <section id="troubleshooting" className="mb-20 scroll-mt-20">
            <PageH1>Troubleshooting</PageH1>
            <Divider />

            <TroubleBlock q="La página se queda en blanco o muestra error en blanco">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'Pantalla completamente blanca al cargar',
                    'Error en consola del navegador (F12 → Console)',
                    'No aparece ni el header ni el loader inicial',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    'Abrir DevTools (F12) → Console. Buscar errores en rojo.',
                    'Identificar el tipo: ¿error de módulo, de IndexedDB, o JS genérico?',
                    'Verificar que JavaScript no está bloqueado (extensiones, NoScript).',
                    'Revisar Application → Storage → ver si IndexedDB está accesible.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Desactivar bloqueadores (uBlock, Privacy Badger) para el dominio TGP.',
                    'Limpiar cache: DevTools → Network → marcar "Disable cache" + recargar.',
                    'Si es error de IndexedDB: Application → Storage → Clear site data.',
                    'Recargar la página. Si persiste, probar en ventana de incógnito.',
                    'Último recurso: chrome://settings → Privacidad → Borrar datos de navegación → "Cookies y otros datos" + "Imágenes y archivos cache".',
                  ]}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="El THI no muestra datos o muestra 0">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'Dashboard muestra "0" en todas las dimensiones del THI',
                    'Gráficos de radar y barras vacíos',
                    'El score general no aparece o es "—"',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    'Catálogo → Aplicaciones: ¿hay al menos 1 aplicación registrada?',
                    'Seguridad → Vulnerabilidades: ¿hay datos cargados? (afecta dimensión Seguridad)',
                    'Obsolescencia: ¿hay tecnologías con fechas de fin de soporte?',
                    '¿Usaste datos demo? Si sí, el THI debería mostrar valores inmediatamente.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Registrar al menos 1 aplicación en Catálogo → Aplicaciones → Nueva aplicación.',
                    'Si no hay datos de seguridad, cargar dataset demo desde Administración.',
                    'Verificar que cada aplicación tenga tecnologías vinculadas (afecta dimensión Obsolescencia).',
                    'Forzar recálculo: editar cualquier campo de una aplicación y guardar.',
                    'Si persiste en 0, abrir DevTools → Console y ejecutar el debug.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Debug">
                <DebugCode
                  code={`await db.applications.count()\nawait db.vulnerabilities.count()\nawait db.applications.limit(1).first()`}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="Error de autenticación: el código OTP no funciona">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'El código de 6 dígitos siempre da "Código inválido"',
                    'La app de autenticación no genera códigos',
                    'La sesión expiró y el QR actual no funciona',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    '¿El reloj del dispositivo está sincronizado? TOTP usa hora UNIX exacta (±30s).',
                    '¿El código expiró mientras lo escribías? La ventana es de 30 segundos.',
                    '¿Escaneaste el QR correcto? Si hay múltiples intentos, usar el último QR generado.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Sincronizar reloj: activar "Ajustar hora automáticamente" en el dispositivo.',
                    'Esperar a que el contador del código llegue a 0 y probar con el nuevo.',
                    'Borrar sessionStorage: F12 → Application → Session Storage → Clear.',
                    'Recargar la página — el onboarding generará una nueva sesión con nuevo QR.',
                    'Último recurso: Clear site data (Application → Storage) y reiniciar onboarding completo.',
                  ]}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="Error de build: npm run build falla">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'npm run build termina con exit code ≠ 0',
                    'Mensajes: "Module not found", "TypeScript error", "SWC panic"',
                    'npm run dev funciona pero build no',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    'node -v → debe ser ≥ 18. Si no, actualizar Node.js.',
                    'npm -v → debe ser ≥ 9.',
                    'npm run dev → ¿el servidor de desarrollo arranca? Si no, el error es de dependencias.',
                    'npx tsc --noEmit → muestra errores de TypeScript específicos.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    '"Module not found" → npm install o npm audit fix.',
                    '"TypeScript error" → npx tsc -b para ver el error exacto y corregir el archivo.',
                    '"Out of memory" → NODE_OPTIONS="--max-old-space-size=2048" npm run build.',
                    '"SWC panic" → rm -rf node_modules && npm install (reconstruir bindings nativos).',
                    'Si dev funciona pero build no: suele ser tree-shaking. Revisar imports dinámicos.',
                  ]}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="Error de CORS al usar GobIA con Ollama local">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'GobIA muestra "Error de conexión" con Ollama',
                    'Consola: "Access-Control-Allow-Origin" header missing',
                    'fetch a http://localhost:11434 falla silenciosamente',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    '¿Ollama está corriendo? curl http://localhost:11434/api/tags en terminal.',
                    '¿OLLAMA_ORIGINS está configurado? Sin esto, Ollama bloquea el navegador.',
                    '¿Usas Docker? El contenedor necesita la variable de entorno explícitamente.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Linux/macOS: OLLAMA_ORIGINS=* ollama serve (detener Ollama, reiniciar con la variable).',
                    'Windows (CMD): set OLLAMA_ORIGINS=* && ollama serve',
                    'Windows (PowerShell): $env:OLLAMA_ORIGINS="*"; ollama serve',
                    'Docker: docker run -d -p 11434:11434 -e OLLAMA_ORIGINS="*" ollama/ollama',
                    'Verificar: fetch("http://localhost:11434/api/tags") desde consola del navegador.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Debug">
                <DebugCode
                  code={`fetch('http://localhost:11434/api/tags').then(r => r.text()).catch(e => 'Error: ' + e.message)`}
                />
              </TroubleSection>
            </TroubleBlock>

            {/* ─── Errores por funcionalidad ─── */}
            <div
              className="font-mono text-[10px] uppercase tracking-widest mb-4 mt-8 px-3 py-1.5 rounded-sm inline-block"
              style={{
                background: 'rgba(0,255,136,0.04)',
                color: '#4a5568',
                border: '1px solid rgba(0,255,136,0.06)',
              }}
            >
              Errores por funcionalidad
            </div>

            <TroubleBlock q="[Catálogo] Error al crear o editar una aplicación">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'Al guardar una aplicación muestra "Error de validación"',
                    'La aplicación no aparece en el listado después de crearla',
                    'Los cambios en una aplicación existente no se guardan',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Causas comunes">
                <BulletListInline
                  items={[
                    'Campos requeridos vacíos: name y businessUnit son obligatorios',
                    'Nombre duplicado: existe otra app con el mismo nombre en la misma BU',
                    'BusinessUnitId inválido: la BU fue eliminada después de crear la app',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Verificar que todos los campos marcados con * estén completos.',
                    'Ir a Catálogo → buscar si ya existe una app con ese nombre en la misma BU.',
                    'Si la BU fue eliminada: reasignar la app a otra BU desde edición.',
                    'Abrir DevTools → Network → buscar el PUT/POST y ver el error exacto.',
                    'Si el error persiste, recargar la página e intentar de nuevo.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Debug">
                <DebugCode
                  code={`// Buscar aplicaciones por nombre:\nawait db.applications.where('name').equals('MiApp').toArray()\n\n// Verificar BUs existentes:\nawait db.business_units.toArray()`}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="[Catálogo] Los microservicios no heredan datos a la aplicación padre">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'La aplicación muestra 0 vulnerabilidades aunque sus microservicios tienen',
                    'Riesgos o hallazgos de microservicios no aparecen en la vista de detalle',
                    'El conteo de incidentes en la app padre no coincide con la suma de MS',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    'Verificar que los microservicios tengan el campo applicationId correcto.',
                    'Consultar: await db.microservices.where({applicationId: appId}).toArray()',
                    'La herencia es automática solo para vulnerabilities, risks, incidents, audit_findings.',
                    'Datos como tecnologías o métricas DORA NO se heredan.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Ir al microservicio → verificar que el campo "Aplicación padre" esté asignado.',
                    'Si falta: editar el microservicio y seleccionar la aplicación correcta.',
                    'Si ya está asignado pero no se refleja: forzar recarga (F5).',
                    'La herencia se computa en tiempo real — si el dato está en IndexedDB, debería mostrarse.',
                    'Si persiste, ejecutar el debug para verificar la relación.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Debug">
                <DebugCode
                  code={`const appId = 'ID_DE_TU_APP'\n// Ver microservicios vinculados:\nconst mss = await db.microservices.where({applicationId: appId}).toArray()\n// Ver vulnerabilidades heredadas:\nconst vulns = await db.vulnerabilities.where({applicationId: appId}).toArray()`}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="[Seguridad] Error al registrar vulnerabilidad o CVSS inválido">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'El campo CVSS no acepta el valor ingresado',
                    'El nivel de severidad no coincide con el puntaje CVSS',
                    'El SLA no se calcula correctamente',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Reglas de validación">
                <BulletListInline
                  items={[
                    'CVSS Score: número decimal entre 0.0 y 10.0 (máximo 1 decimal)',
                    'Severidad se deriva del score: 0.1-3.9=Baja, 4.0-6.9=Media, 7.0-8.9=Alta, 9.0-10.0=Crítica',
                    'SLA se asigna automáticamente según severidad: P1=48h, P2=7d, P3=30d, P4=90d',
                    'Los estados válidos son: abierta | en_análisis | en_remediación | verificada | cerrada',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Ingresar CVSS como número con punto decimal (ej: 7.5, no 7,5).',
                    'Si el SLA se ve incorrecto: verificar que createdAt tenga fecha/hora correcta.',
                    'Si no puedes cambiar el estado: seguir la secuencia estricta de estados.',
                    'Para reabrir una vulnerabilidad cerrada: usar "Reabrir" en el menú de acciones.',
                  ]}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="[DORA] Las métricas del equipo muestran nivel incorrecto">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'Un equipo con buen desempeño aparece como "Bajo"',
                    'El nivel general no coincide con ninguna métrica individual',
                    'Al registrar métricas nuevas, el nivel no se actualiza',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    'El nivel general se calcula como el PEOR nivel entre las 4 métricas.',
                    'Verificar unidad de las métricas: deployFrequency = deploys/día, leadTime = horas, etc.',
                    'Si el período no está configurado, las métricas pueden no estar activas.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Revisar cada métrica individual: si una está en "Bajo", el nivel general será Bajo.',
                    'Verificar las unidades: leadTime en días (no horas), CFR en porcentaje (0-100).',
                    'Asegurar que el período (Q1 2026, etc.) esté seleccionado correctamente.',
                    'Si el nivel no se actualiza: recargar la página para forzar recálculo.',
                    'Consultar thresholds exactos en Funcionalidades → Equipos DORA de esta documentación.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Debug">
                <DebugCode
                  code={`// Ver métricas de un equipo:\nawait db.dora_metrics.where({teamId: 'ID_DEL_EQUIPO'}).toArray()`}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="[OKRs] El progreso no se calcula o muestra incorrecto">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'El progreso del objetivo permanece en 0% aunque hay KRs con avance',
                    'El progreso supera el 100%',
                    'El estado del objetivo no cambia aunque los KRs estén completos',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    'Cada KR necesita currentValue y targetValue — si targetValue es 0, el cálculo falla.',
                    'Los pesos (weight) deben sumar 100 entre todos los KRs del objetivo.',
                    'El progreso del objetivo es el promedio ponderado de los KRs.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Verificar que cada KR tenga targetValue > 0.',
                    'Revisar que la suma de pesos (weight) de todos los KRs sea exactamente 100.',
                    'Si el progreso está en 0: editar cualquier KR, poner currentValue = 1, guardar, luego restaurar.',
                    'Si supera 100%: el KR progress se capcea en 100, pero la suma ponderada puede exceder si hay múltiples KRs al 100%.',
                    'Para cambiar el estado manualmente: usar el selector de estado en la vista del objetivo.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Debug">
                <DebugCode
                  code={`// Ver KRs de un objetivo:\nconst krs = await db.key_results.where({objectiveId: 'ID_DEL_OKR'}).toArray()\n// Verificar pesos:\nconst sumaPesos = krs.reduce((s, kr) => s + kr.weight, 0)`}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="[Ejecución] Las fechas del Gantt no se muestran correctamente">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'Las actividades aparecen fuera de la línea de tiempo',
                    'El Gantt no renderiza ninguna barra',
                    'Las fechas se ven desplazadas o incorrectas',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    'El Gantt usa posicionamiento CSS absoluto sobre grid de días.',
                    'Requiere startDate y endDate en formato ISO (YYYY-MM-DD).',
                    'Si endDate < startDate, la barra no se renderiza.',
                    'Fechas sin timezone se interpretan como UTC — puede haber corrimiento.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Verificar que startDate y endDate sean fechas ISO válidas (ej: 2026-07-01).',
                    'Asegurar que endDate sea >= startDate.',
                    'Si el plan tiene muchas actividades (>200), el renderizado puede ser lento.',
                    'Recargar la página. Si el problema persiste, el navegador puede tener CSS grid corrupto — probar en otra pestaña.',
                  ]}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="[Obsolescencia] La sincronización con endoflife.date falla">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'Al sincronizar, muestra "Error de conexión con API externa"',
                    'El estado de las tecnologías no se actualiza',
                    'Todas las tecnologías aparecen como "unknown"',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Causas comunes">
                <BulletListInline
                  items={[
                    'Sin conexión a Internet — la API requiere acceso a endoflife.date',
                    'La tecnología no existe en la API: endoflife.date solo cubre tecnologías populares',
                    'El nombre de la tecnología no coincide exactamente con el slug de la API',
                    'Cache de 24 horas: las consultas se cachean en IndexedDB por 24h',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Verificar conexión a Internet y acceso a https://endoflife.date.',
                    'En la tecnología, probar con el nombre exacto en inglés (ej: "nodejs" no "Node.js").',
                    'Forzar sincronización: botón "Sincronizar ahora" en la vista de Obsolescencia.',
                    'Si la API no reconoce la tecnología, asignar el estado manualmente desde edición.',
                    'Para forzar recarga sin cache: DevTools → Network → marcar "Disable cache" y sincronizar.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Debug">
                <DebugCode
                  code={`// Probar API manualmente:\nawait fetch('https://endoflife.date/api/nodejs.json').then(r => r.json())\n\n// Ver cache local:\nawait db.technologies.where('name').equals('Node.js').first()`}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="[GobIA] El asistente no encuentra datos que sí existen">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'Preguntas como "cuántas apps hay" responden "No encontré datos"',
                    'GobIA no puede listar tecnologías o equipos',
                    'Las respuestas son genéricas sin datos concretos',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    'GobIA usa tool calls que ejecutan queries contra IndexedDB — si no hay datos, devuelven vacío.',
                    'Verificar: ¿los datos existen en la tabla correspondiente? (await db.applications.count())',
                    'Los tools disponibles cubren: health-index, aplicaciones, tecnologías, equipo, vulnerabilidades.',
                    'Preguntas sobre datos no cubiertos por los tools reciben respuesta genérica.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Cargar datos demo desde Administración si aún no lo has hecho.',
                    'Preguntar de forma específica: "Lista las aplicaciones del área financiera" en vez de "dime algo".',
                    'Verificar en Ajustes → IA que el proveedor tenga tool calls habilitados.',
                    'Si usas Ollama: verificar que el modelo soporte function calling (llama3 no, llama4 sí).',
                    'Si todo falla: cambiar temporalmente a OpenAI gpt-4o que tiene mejor soporte de tools.',
                  ]}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="[Equipamiento] Error al asignar equipo a un miembro">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'El equipo no aparece disponible en el selector de asignación',
                    'El miembro no recibe la notificación de asignación',
                    'Error "El equipo ya está asignado a otro miembro"',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Reglas del dominio">
                <BulletListInline
                  items={[
                    'Un equipo físico solo puede estar asignado a UNA persona a la vez.',
                    'Si el equipo está marcado como "en_reparación", no puede asignarse.',
                    'El historial de asignaciones anteriores se mantiene en equipment_tickets.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Verificar estado del equipo: si está "en_reparación" o "baja", no se puede asignar.',
                    'Si ya está asignado a otra persona: desasignar primero desde la vista de detalle.',
                    'El miembro debe existir en la tabla team_members — registrarlo si es nuevo.',
                    'Si el equipo no aparece: filtrar por "disponible" en el listado de equipos.',
                  ]}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="La PWA no se actualiza: sigo viendo la versión anterior">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'Después de un despliegue, sigues viendo la interfaz anterior',
                    'El Service Worker no descarga la nueva versión',
                    'El mensaje "Nueva versión disponible" no aparece nunca',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    'Abrir DevTools → Application → Service Workers → ¿está registrado y activo?',
                    'Verificar la versión en el footer de TGP vs la versión desplegada.',
                    '¿Hay múltiples pestañas de TGP abiertas? El SW espera que todas se cierren.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Abrir DevTools → Application → Service Workers → marcar "Update on reload".',
                    'Recargar la página (F5) — el SW debería actualizarse.',
                    'Si no funciona: cerrar TODAS las pestañas de TGP y abrir una nueva.',
                    'Si sigue: chrome://serviceworker-internals → Find TGP → Unregister.',
                    'Forzar recarga completa: Ctrl+F5 (ignora cache del navegador).',
                  ]}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="Rendimiento lento con muchos datos o al cargar la página">
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'La página tarda más de 5 segundos en cargar',
                    'Las tablas se sienten lentas al hacer scroll o filtrar',
                    'El dashboard tarda en actualizar los gráficos al cambiar filtros',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    '¿Cuántas aplicaciones tienes? await db.applications.count() en consola.',
                    '¿Cuántas vulnerabilidades? await db.vulnerabilities.count().',
                    'Abrir DevTools → Performance → Start profiling, realizar la acción lenta, Stop.',
                    'Identificar: ¿el cuello de botella es React (renderizado) o IndexedDB (queries)?',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Usar filtros en lugar de cargar todo: Catálogo → Filtros avanzados por BU.',
                    'Reducir período del Dashboard a "Último trimestre" en vez de "Anual".',
                    'Si importaste datos masivos (>10k), dividir en lotes de 1k registros.',
                    'Cerrar otras pestañas de TGP (menos contención de IndexedDB).',
                    'Mantener dentro de límites: <5k apps, <20k vulns, <10k actividades.',
                  ]}
                />
              </TroubleSection>
            </TroubleBlock>

            <TroubleBlock q="Error QuotaExceededError: IndexedDB no puede escribir más datos" last>
              <TroubleSection label="Síntomas">
                <BulletListInline
                  items={[
                    'Error en consola: "QuotaExceededError" o "The transaction was aborted"',
                    'No puedes guardar nuevas aplicaciones, vulnerabilidades, etc.',
                    'La importación Excel falla sin mensaje claro',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Diagnóstico">
                <StepList
                  items={[
                    'Ejecutar: await navigator.storage.estimate() → ver usage / quota.',
                    'Si usage > 80% de quota, estás cerca del límite.',
                    'DevTools → Application → Storage → ver desglose por sitio.',
                    'Identificar qué tabla ocupa más espacio (probablemente vulnerabilities).',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Solución paso a paso">
                <StepList
                  items={[
                    'Hacer backup: Administración → Exportar datos (antes de limpiar).',
                    'Liberar espacio: Application → Storage → Clear site data.',
                    'Restaurar desde backup solo los datos necesarios.',
                    'Reducir datos futuros: eliminar aplicaciones o tecnologías no utilizadas.',
                    'Solicitar almacenamiento persistente: navigator.storage.persist() en consola.',
                    'Verificar: navigator.storage.persisted() → debe dar true.',
                  ]}
                />
              </TroubleSection>
              <TroubleSection label="Debug">
                <DebugCode
                  code={`const est = await navigator.storage.estimate()\nconsole.log('Uso:', (est.usage/1024/1024).toFixed(1), 'MB /', (est.quota/1024/1024).toFixed(1), 'MB')\n\nawait navigator.storage.persist()`}
                />
              </TroubleSection>
            </TroubleBlock>
          </section>

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

/* ═══════════════════════════════════════════════════ */
/* SUB-COMPONENTES                                    */
/* ═══════════════════════════════════════════════════ */

function PageH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-mono text-2xl font-bold mb-1" style={{ color: '#e8edf5' }}>
      {children}
    </h1>
  )
}
function Divider() {
  return <div className="w-12 h-px mb-8" style={{ background: '#00ff88' }} />
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-mono text-sm font-semibold mb-3 mt-8 first:mt-0"
      style={{ color: '#e8edf5' }}
    >
      {children}
    </h3>
  )
}
function SubSection({ children }: { children: React.ReactNode }) {
  return (
    <h4
      className="font-mono text-[11px] font-semibold uppercase tracking-wider mb-2 mt-6"
      style={{ color: '#6b7a99' }}
    >
      {children}
    </h4>
  )
}
function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed mb-4" style={{ color: '#8899bb' }}>
      {children}
    </p>
  )
}
function BulletList({ children }: { children: React.ReactNode }) {
  return (
    <ul
      className="text-sm leading-relaxed mb-6 pl-5 space-y-1.5"
      style={{ color: '#8899bb', listStyle: 'disc' }}
    >
      {children}
    </ul>
  )
}
function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="font-mono text-xs px-1.5 py-0.5 rounded-sm"
      style={{
        background: 'rgba(0,255,136,0.06)',
        color: '#00ff88',
        border: '1px solid rgba(0,255,136,0.08)',
      }}
    >
      {children}
    </code>
  )
}
function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="font-mono text-xs leading-relaxed p-4 rounded-sm mb-6 overflow-x-auto"
      style={{
        background: 'rgba(0,0,0,0.4)',
        color: '#b0b8c8',
        border: '1px solid rgba(0,255,136,0.06)',
      }}
    >
      <code>{children}</code>
    </pre>
  )
}
function Green({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#00ff88' }}>{children}</span>
}

function Table({ rows }: { rows: string[][] }) {
  const cols = rows[0]?.length ?? 0
  return (
    <div className="overflow-x-auto mb-6" style={{ border: '1px solid rgba(0,255,136,0.06)' }}>
      <table className="w-full font-mono text-[11px] border-collapse">
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                borderBottom: ri < rows.length - 1 ? '1px solid rgba(0,255,136,0.04)' : 'none',
              }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-4 py-2.5"
                  style={{
                    color: ci === 0 ? '#6b7a99' : ri === 0 ? '#e8edf5' : '#8899bb',
                    borderRight: ci < cols - 1 ? '1px solid rgba(0,255,136,0.04)' : 'none',
                    fontWeight: ri === 0 ? 600 : ci === 0 ? 500 : 400,
                    background: ri === 0 ? 'rgba(0,255,136,0.02)' : 'transparent',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TroubleBlock({
  q,
  children,
  last,
}: {
  q: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className="pb-6 mb-6"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(0,255,136,0.06)' }}
    >
      <div className="flex items-start gap-3">
        <CircleHelp
          size={14}
          className="shrink-0 mt-0.5"
          style={{ color: 'rgba(0,255,136,0.3)' }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-mono text-sm font-semibold mb-3" style={{ color: '#e8edf5' }}>
            {q}
          </h4>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── Subcomponentes para Troubleshooting estructurado ─── */

function TroubleSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div
        className="font-mono text-[10px] uppercase tracking-widest mb-1.5 inline-block px-1.5 py-0.5 rounded-sm"
        style={{ background: 'rgba(0,255,136,0.06)', color: '#00ff88' }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function StepList({ items }: { items: string[] }) {
  return (
    <ol
      className="font-mono text-xs leading-relaxed space-y-1.5 mb-0 ml-0"
      style={{ color: '#8899bb' }}
    >
      {items.map((item, i) => (
        <li key={i} className="flex items-baseline gap-2">
          <span
            className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
            style={{ background: 'rgba(0,255,136,0.08)', color: '#00ff88' }}
          >
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function BulletListInline({ items }: { items: string[] }) {
  return (
    <ul className="font-mono text-xs leading-relaxed space-y-1 ml-0" style={{ color: '#8899bb' }}>
      {items.map((item, i) => (
        <li key={i} className="flex items-baseline gap-2">
          <span className="shrink-0" style={{ color: 'rgba(0,255,136,0.3)' }}>
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function DebugCode({ code }: { code: string }) {
  return (
    <pre
      className="font-mono text-[11px] leading-relaxed p-2.5 rounded-sm overflow-x-auto mt-1"
      style={{
        background: 'rgba(0,0,0,0.3)',
        color: '#b0b8c8',
        border: '1px solid rgba(0,255,136,0.04)',
      }}
    >
      <code>{code}</code>
    </pre>
  )
}
