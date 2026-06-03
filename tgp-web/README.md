# TGP — Technology Governance Platform

> **Plataforma de Gobierno Tecnológico Empresarial** — monitoreo, gestión y gobernanza de aplicaciones, tecnologías, vulnerabilidades, riesgos, equipos y OKRs en una sola herramienta.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | React 19 + TypeScript 5 |
| **Build** | Vite 6 |
| **Ruteo** | React Router v7 |
| **Estado** | Zustand (UI) + TanStack React Query (server state) |
| **Base de datos** | Dexie.js (IndexedDB) — todo el dato es cliente |
| **Estilos** | Tailwind CSS v4 + Design System propio |
| **Formularios** | React Hook Form + Zod |
| **Gráficas** | ApexCharts + Recharts |
| **Iconos** | Lucide React |
| **Autenticación** | TOTP (otpauth + QR code) |
| **Exportación** | jsPDF + PapaParse (CSV) |
| **Linter** | ESLint + oxc |

## Arquitectura

```
src/
├── components/          # Componentes atómicos y moleculares
│   ├── charts/          # Gráficas reutilizables (THI Gauge, etc)
│   ├── data-display/    # KPI Cards, tablas genéricas
│   ├── forms/           # Formularios compartidos
│   ├── layout/          # AppShell, Sidebar, Header, GlobalSearch
│   └── ui/              # Botones, inputs, badges, modales
├── features/            # Módulos por dominio (feature-first)
│   ├── admin/           # Configuración global, importación Excel
│   ├── auth/            # Login con TOTP
│   ├── catalog/         # Aplicaciones + Entregables
│   ├── dashboard/       # THI ejecutivo
│   ├── delivery/        # Entregables global
│   ├── governance/      # Riesgos + Auditoría
│   ├── obsolescence/    # Obsolescencia tecnológica
│   ├── security/        # Vulnerabilidades + Incidentes
│   ├── strategy/        # OKRs / KPIs
│   └── teams/           # Equipos + Métricas DORA
├── hooks/               # Custom hooks genéricos
├── lib/                 # Utilidades (cn, etc)
├── services/            # Capa de datos
│   ├── auth/            # Servicio TOTP + sesión
│   ├── db/              # Esquema Dexie (9 tablas)
│   ├── demo/            # Seed data para pruebas
│   ├── export/          # Exportación PDF/CSV
│   ├── import/          # Importación Excel con upsert
│   └── thi/             # Cálculo del THI
├── stores/              # Zustand stores (tema, filtros, notificaciones)
├── styles/              # CSS global + variables de diseño
├── types/               # Tipos TypeScript (dominio, API, UI)
└── utils/               # Funciones helpers
```

## Funcionalidades

### Dashboard Ejecutivo
- **Technology Health Index (THI)** — gauge interactivo con 7 dimensiones (Delivery, Quality, Security, Availability, Obsolescence, Risk, Compliance) y ponderación configurable
- **KPI Cards** — 8 tarjetas con métricas clave (vulnerabilidades críticas, incidentes P1, exposición de riesgo, hallazgos vencidos, equipos Elite DORA, tecnologías EOL)
- **THI por Business Unit** — barra horizontal comparativa
- **Estado de Tecnologías** — gráfico de dona (activas, soporte extendido, EOL, desconocidas)
- **Alertas Activas** — panel contextual con prioridades (crítico, warning, success)
- **Selector de Período** — 7d / 30d / 90d / YTD con filtro global

### Catálogo de Aplicaciones
- CRUD completo con formulario modal
- Búsqueda y filtrado por nombre
- Vista de detalle con tabs:
  - Información general
  - Dependencias
  - Vulnerabilidades
  - Incidentes
  - Riesgos
  - Auditoría
  - **Entregables** (creación, edición inline, vinculación a OKRs)

### Obsolescencia Tecnológica
- Registro de tecnologías con versión, vendor, categoría y fecha EOL
- Clasificación por estado de soporte (active, extended, eol, unknown)
- Visualización de tecnologías EOL y su impacto en aplicaciones críticas

### Seguridad
- **Vulnerabilidades** — CVSS score, severidad, SLA, tracking de estado (open, in_progress, accepted, fixed)
- **Incidentes** — severidad P1-P4, tiempo de respuesta y resolución, RCA
- Estadísticas por período con tarjetas resumen

### Gobierno
- **Riesgos** — matriz probabilidad x impacto, score automatizado, plan de mitigación
- **Auditoría** — hallazgos con evidencia adjunta, plan de acción, items checklist

### OKRs / KPIs (Estrategia)
- Objetivos con períodos, progreso, Key Results
- Key Results con medición (baseline, target, current) y estado (on_track, at_risk, behind, achieved, cancelled)

### Equipos
- Gestión de equipos con miembros, roles y asignación porcentual
- **Métricas DORA** — deployment frequency, lead time, cycle time, throughput, change failure rate, MTTR
- Clasificación Elite / Alto / Medio / Bajo por benchmark DORA

### Entregables
- Vista por aplicación (tab en detalle) y vista general (`/catalog/deliverables`)
- Status tracking (pending, in_progress, completed, cancelled)
- Vinculación opcional a OKRs
- Filtros por estado y aplicación

### Búsqueda Global
- Command palette modal (`⌘K` o botón de lupa)
- Búsqueda cross-entity sobre 9 tipos de datos
- Scoring de relevancia (exact match → starts with → includes → word match)
- Navegación por teclado (↓↑ Enter Esc)

### Administración
- Importación de datos desde Excel
  - 9 tipos de entidad soportados
  - Preview de 10 filas antes de importar
  - Upsert inteligente (match por nombre/título, preserva createdAt)
  - Descarga de plantilla por tipo
  - Resumen de resultados con detalle de errores

### Autenticación TOTP
- Setup con código QR (compatible con Google Authenticator, Authy, 1Password)
- Secreto manual como fallback
- Login con código de 6 dígitos + countdown timer
- Sesión de 24h con localStorage
- Botón de cerrar sesión en el header

## Modelo de Datos

| Entidad | Tabla Dexie | Descripción |
|---------|-------------|-------------|
| BusinessUnit | `businessUnits` | Unidades de negocio |
| Application | `applications` | Aplicaciones del portafolio |
| Technology | `technologies` | Tecnologías con tracking EOL |
| ApplicationDependency | `dependencies` | Dependencias entre aplicaciones |
| Vulnerability | `vulnerabilities` | Vulnerabilidades con SLA |
| Incident | `incidents` | Incidentes de seguridad |
| Risk | `risks` | Riesgos con matriz probabilidad/impacto |
| AuditFinding | `auditFindings` | Hallazgos de auditoría |
| Team | `teams` | Equipos con métricas DORA |
| Objective | `objectives` | OKRs con Key Results |
| Deliverable | `deliverables` | Entregables vinculados |
| HealthIndex | `healthIndex` | Histórico de THI |
| User | `users` | Usuarios del sistema |

## THI — Technology Health Index

El THI es un índice compuesto que mide la salud tecnológica en 7 dimensiones:

```
THI = Σ(dimensión × peso)
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
| `/admin` | Administración |
| `/admin/import` | Importación Excel |

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar
npm run build

# Preview de producción
npm run preview

# Linter
npm run lint
```

La aplicación funciona completamente **cliente-side** con IndexedDB (Dexie.js). No requiere backend — los datos de demostración se siembran automáticamente al abrir la app.

## Autenticación

Al abrir la app por primera vez:

1. Se genera un secreto TOTP
2. Se muestra un código QR para escanear con cualquier authenticator app
3. Se debe verificar escaneando un primer código de 6 dígitos
4. En visitas posteriores, solo se pide el código de 6 dígitos
5. La sesión dura 24h desde el último login
6. Para cerrar sesión, usar el botón de logout en el header

## Licencia

Propietaria — TGP &copy; 2026
