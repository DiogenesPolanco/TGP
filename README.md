# TGP — Technology Governance Platform

> **Plataforma de Gobierno Tecnológico Empresarial** — monitoreo, gestión y gobernanza de aplicaciones, tecnologías, vulnerabilidades, riesgos, equipos, OKRs, planes de ejecución y entregables en una sola herramienta cliente-side.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | React 19 + TypeScript 5 |
| **Build** | Vite 6 + SWC |
| **Ruteo** | React Router v7 (createBrowserRouter) |
| **Estado** | Zustand 5 (UI + filtros + notificaciones) |
| **Base de datos** | Dexie.js 4 (IndexedDB) — 20 tablas |
| **Estilos** | Tailwind CSS 4 + Design System propio |
| **Formularios** | React Hook Form + Zod |
| **Gráficas** | Recharts + ApexCharts |
| **Iconos** | Lucide React |
| **Autenticación** | TOTP (otpauth + QR code) + sesión 24h |
| **Sincronización** | endoflife.date API v1 |
| **Importación** | SheetJS (XLSX) con preview y upsert |
| **Linter** | ESLint + oxc |

## Arquitectura

```
src/
├── components/               # Componentes atómicos y moleculares
│   ├── auth/                 # InactivityGuard (cierre por inactividad)
│   ├── charts/               # ThiGauge (gauge radial del THI)
│   ├── data-display/         # KpiCard (tarjetas de métrica)
│   ├── forms/                # Formularios compartidos
│   ├── layout/               # AppShell, Sidebar, Header, GlobalSearch, NotificationToast
│   └── ui/                   # Botones, inputs, badges, modales
├── features/                 # Módulos por dominio (feature-first)
│   ├── admin/                # Administración, importación Excel, Unidades de Negocio
│   ├── auth/                 # Login con TOTP
│   ├── catalog/              # Aplicaciones (CRUD + detalle con tabs)
│   ├── dashboard/            # THI ejecutivo con KPI cards y alertas
│   ├── delivery/             # Entregables (vista general)
│   ├── execution/            # Planes, Daily, Actividades, Compromisos, Bloqueos, Dependencias
│   ├── governance/           # Riesgos + Auditoría
│   ├── obsolescence/         # Tecnologías + sincronización EOL
│   ├── security/             # Vulnerabilidades + Incidentes
│   ├── strategy/             # OKRs / KPIs
│   └── teams/                # Equipos + Métricas DORA
├── hooks/                    # useConfirm, useDemoData, useTheme
├── lib/                      # Utilidades (cn, etc.)
├── services/                 # Capa de datos
│   ├── auth/                 # TOTP + sesión + inactividad
│   ├── db/                   # Dexie (20 tablas) + repositorios
│   ├── demo/                 # Seed de tecnologías (180+) + datos demo
│   ├── export/               # Exportación a JSON
│   ├── import/               # Importación Excel con upsert
│   ├── sync/                 # Sincronización endoflife.date API v1
│   └── thi/                  # Motor de cálculo del THI
├── stores/                   # Zustand (app, filtros, usuario, confirmación)
├── styles/                   # CSS global + variables de diseño
├── types/                    # Tipos TypeScript (dominio, API, UI)
└── utils/                    # Formateo, validación, helpers
```

## Funcionalidades

### Dashboard Ejecutivo (`/dashboard`)
- **Technology Health Index (THI)** — gauge radial interactivo con 7 dimensiones (Delivery, Quality, Security, Availability, Obsolescence, Risk, Compliance) y ponderación configurable
- **12 KPI Cards** — métricas clave en tiempo real:
  - THI Score, Vulnerabilidades Críticas, Incidentes P1, Total Aplicaciones
  - Exposición de Riesgos, Hallazgos Vencidos, Equipos Elite DORA, Tecnologías EOL
  - Planes Activos, Bloqueos Abiertos, Compromisos Vencidos, Actividades Hoy
- **THI por Business Unit** — gráfico de barras horizontales comparativo
- **Estado de Tecnologías** — gráfico de dona (activas, soporte extendido, EOL, desconocidas)
- **Alertas Activas** — panel contextual con prioridades (crítico, warning, success)
- **Selector de Período** — 7d / 30d / 90d / YTD con filtro global
- **Filtro por Business Unit** — dashboard filtrable

### Catálogo de Aplicaciones (`/catalog/applications`)
- CRUD completo con formulario modal
- Búsqueda por texto (nombre/owner)
- **Filtros avanzados**: Criticidad, Estado, Business Unit (collapsible)
- **Importar aplicaciones** — navega a `/admin/import` para importación Excel
- **Exportar aplicaciones** — descarga JSON con datos filtrados
- Vista de detalle (`/catalog/applications/:id`) con tabs:
  - Resumen (información general + métricas)
  - Tech Stack (gestor de tecnologías con búsqueda y badges EOL)
  - Microservicios (asociación de microservicios)
  - Vulnerabilidades, Riesgos, Incidentes, Auditoría (asociar/desasociar entidades)
  - Entregables (creación, edición inline)

### Obsolescencia Tecnológica (`/catalog/obsolescence`)
- Registro de tecnologías con versión, vendor, categoría y fecha EOL
- Clasificación por estado de soporte (active, extended, eol, unknown)
- **Catálogo técnico integrado** — 180+ tecnologías pre-cargadas (lenguajes, frameworks, databases, OS, runtimes, cloud)
- **Sincronización automática EOL** — via endoflife.date API v1
  - Auto-seed de tecnologías faltantes antes del sync
  - Actualización de supportStatus y eolDate
  - Reporte detallado de resultados (actualizadas, no encontradas, errores)

### Seguridad
- **Vulnerabilidades** (`/security/vulnerabilities`) — CVSS score, severidad, SLA tracking (open, in_progress, accepted, fixed)
- **Incidentes** (`/security/incidents`) — severidad P1-P4, tiempo de respuesta y resolución, RCA
- Dashboard embebido con KPIs, tendencias y SLA compliance

### Gobierno
- **Riesgos** (`/governance/risks`) — matriz probabilidad × impacto, score automatizado (1-25), plan de mitigación
- **Auditoría** (`/governance/audit`) — hallazgos con evidencia adjunta, plan de acción, items checklist

### OKRs / KPIs (`/strategy/objectives`)
- Objetivos con períodos, progreso, Key Results
- Key Results con medición (baseline, target, current) y estado (on_track, at_risk, behind, achieved, cancelled)

### Equipos y DORA (`/teams`, `/teams/:id`)
- Gestión de equipos con miembros, roles y asignación porcentual
- **Métricas DORA** — deployment frequency, lead time, cycle time, throughput, change failure rate, MTTR
- Clasificación Elite / Alto / Medio / Bajo por benchmark DORA
- Cuadro de mando DORA en detalle del equipo

### Entregables (`/catalog/deliverables`)
- Vista general de entregables con status tracking (pending, in_progress, completed, cancelled)
- Vinculación opcional a OKRs
- Filtros por estado y aplicación

### Ejecución (Módulo completo)
- **Planes** (`/execution/plans`, `/execution/plans/:id`) — Planes de ejecución con health status
- **Daily** (`/execution/daily`) — Vista diaria de actividades y bloqueos
- **Compromisos** (`/execution/commitments`) — Compromisos con tracking de estado (active, at_risk, breached, fulfilled)
- **Actividades** — Asociadas a planes, con asignación y fechas
- **Bloqueos** — Severidad y escalamiento, tracking de resolución
- **Dependencias** — Entre tareas, actividades, planes y compromisos
- **Servicio de Escalamiento** — `escalationService.ts`

### Administración (`/admin`)
- **Importación de datos desde Excel** (`/admin/import`)
  - 9 tipos de entidad soportados (Aplicaciones, Tecnologías, Vulnerabilidades, Incidentes, Riesgos, Hallazgos, Equipos, Objetivos, Entregables)
  - Preview de 10 filas antes de importar
  - Upsert inteligente (match por nombre/título, preserva createdAt)
  - Descarga de plantilla por tipo
  - Resumen de resultados con detalle de errores
- **Unidades de Negocio** (`/admin/business-units`) — CRUD de BUs
- Exportación completa de BD a JSON

### Búsqueda Global
- Command palette modal (`⌘K` o botón de lupa en header)
- Búsqueda cross-entity sobre múltiples tipos de datos
- Scoring de relevancia (exact match → starts with → includes → word match)
- Navegación por teclado (↓↑ Enter Esc)

### Autenticación TOTP
- Setup con código QR (compatible con Google Authenticator, Authy, 1Password)
- Secreto manual como fallback
- Login con código de 6 dígitos + countdown timer
- Sesión de 24h con localStorage
- **Guardia de inactividad** — cierre automático de sesión
- Botón de cerrar sesión en el header

## Modelo de Datos (20 tablas en IndexedDB)

| Entidad | Tabla Dexie | Descripción |
|---------|-------------|-------------|
| Tenant | `tenants` | Organización/tenant |
| BusinessUnit | `businessUnits` | Unidades de negocio |
| Application | `applications` | Aplicaciones del portafolio |
| Technology | `technologies` | Tecnologías con tracking EOL |
| ApplicationDependency | `applicationDependencies` | Dependencias entre aplicaciones |
| Vulnerability | `vulnerabilities` | Vulnerabilidades con SLA |
| Incident | `incidents` | Incidentes de seguridad |
| Risk | `risks` | Riesgos con matriz probabilidad/impacto |
| AuditFinding | `auditFindings` | Hallazgos de auditoría |
| Team | `teams` | Equipos con métricas DORA |
| Objective | `objectives` | OKRs con Key Results |
| HealthIndex | `healthIndexHistory` | Histórico de THI |
| Deliverable | `deliverables` | Entregables vinculados |
| Microservice | `microservices` | Microservicios por aplicación |
| User | `users` | Usuarios del sistema |
| Plan | `plans` | Planes de ejecución |
| Activity | `activities` | Actividades de planes |
| Task | `tasks` | Tareas operativas |
| Commitment | `commitments` | Compromisos con tracking |
| Blocker | `blockers` | Bloqueos con escalamiento |
| Dependency | `dependencies` | Dependencias entre entidades |

## THI — Technology Health Index

El THI es un índice compuesto que mide la salud tecnológica en 7 dimensiones:

```
THI = Σ(dimensionScore × dimensionWeight) / Σ(weights)
```

| Dimensión | Peso por defecto |
|-----------|-----------------|
| Delivery | 20% |
| Quality | 15% |
| Security | 20% |
| Availability | 15% |
| Obsolescence | 10% |
| Risk | 10% |
| Compliance | 10% |

Rangos: **Excelente** (90-100) · **Saludable** (70-89) · **Regular** (50-69) · **En Riesgo** (30-49) · **Crítico** (0-29)

## Rutas

| Ruta | Página |
|------|--------|
| `/` | Redirección al dashboard |
| `/dashboard` | Dashboard Ejecutivo |
| `/catalog/applications` | Catálogo de Aplicaciones |
| `/catalog/applications/:id` | Detalle de Aplicación |
| `/catalog/obsolescence` | Obsolescencia Tecnológica |
| `/catalog/deliverables` | Entregables (vista general) |
| `/security/vulnerabilities` | Vulnerabilidades |
| `/security/incidents` | Incidentes |
| `/governance/risks` | Riesgos |
| `/governance/audit` | Auditoría |
| `/teams` | Equipos |
| `/teams/:id` | Detalle de Equipo |
| `/strategy/objectives` | OKRs / KPIs |
| `/execution/daily` | Daily (ejecución) |
| `/execution/plans` | Planes de ejecución |
| `/execution/plans/:id` | Detalle de Plan |
| `/execution/commitments` | Compromisos |
| `/admin` | Administración |
| `/admin/import` | Importación Excel |
| `/admin/business-units` | Unidades de Negocio |

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Preview de producción
npm run preview

# Linter
npm run lint
```

La aplicación funciona completamente **cliente-side** con IndexedDB (Dexie.js). No requiere backend — los datos de demostración se siembran automáticamente al abrir la app (tecnologías) y se puede cargar data demo completa desde la interfaz.

## Sincronización de Tecnologías

El sistema puede sincronizar el estado de soporte de las tecnologías contra la API de [endoflife.date](https://endoflife.date):

1. **Seed automático**: Antes de sincronizar, se asegura de que todas las tecnologías del catálogo estén en BD (idempotente)
2. **API v1**: Consulta `https://endoflife.date/api/v1/products/{slug}` para cada tecnología
3. **Matching fuzzy**: Empareja versiones (`1.x`, `8.0`, `22.04`) contra los ciclos de release
4. **Actualización**: Actualiza `supportStatus` (active/extended/eol/unknown) y `eolDate`
5. **Reporte**: Retorna resumen detallado con cantidad de actualizadas, no encontradas y errores

Categorías soportadas: lenguajes, frameworks, databases, OS, runtimes, web servers, message brokers, caches, tools, cloud services, libraries.

## Autenticación

Al abrir la app por primera vez:
1. Se genera un secreto TOTP
2. Se muestra un código QR para escanear con cualquier authenticator app
3. Se debe verificar escaneando un primer código de 6 dígitos
4. En visitas posteriores, solo se pide el código de 6 dígitos
5. La sesión dura 24h desde el último login
6. Tras **30 minutos de inactividad**, la sesión se cierra automáticamente
7. Para cerrar sesión manualmente, usar el botón de logout en el header

## Licencia

Propietaria — TGP &copy; 2026
