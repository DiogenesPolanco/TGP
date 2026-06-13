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
| **Backup/Nube** | Azure Blob Storage (@azure/storage-blob) |
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
│   ├── backup/               # Azure Blob Storage backup/restore
│   ├── db/                   # Dexie (20 tablas) + repositorios
│   ├── demo/                 # Seed de tecnologías (180+) + datos demo
│   ├── export/               # Exportación a JSON
│   ├── import/               # Importación Excel con upsert
│   ├── jobs/                 # Programador automático (checks diarios)
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
  - Resumen (información general + métricas consolidadas)
  - Tech Stack (gestor de tecnologías con búsqueda y badges EOL)
  - Microservicios (asociación de microservicios + entidades vinculadas)
  - Vulnerabilidades, Riesgos, Incidentes, Auditoría: muestra **entidades directas + heredadas** de microservicios
  - Entregables (creación, edición inline)

### Herencia Microservicio → Aplicación

Las entidades de seguridad y gobierno (vulnerabilidades, incidentes, riesgos, hallazgos de auditoría) pueden asociarse tanto a una **aplicación directamente** como a sus **microservicios** individualmente mediante tablas junction M:N.

Cuando visualizas una aplicación, las tabs de Vulnerabilidades, Incidentes, Riesgos y Auditoría muestran **la unión deduplicada** de:
- Entidades asociadas directamente a la aplicación (`applicationId`)
- Entidades asociadas a los microservicios de la aplicación (vía tablas junction)

Esto permite modelar escenarios realistas: una vulnerabilidad de SQL Injection puede estar vinculada al `auth-service` de una aplicación, y al ver la aplicación completa, esa vulnerabilidad aparece como heredada. Desde la tabla de microservicios puedes expandir cada servicio y gestionar sus asociaciones directamente.

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
- **Planes** (`/execution/plans`, `/execution/plans/:id`) — Planes de ejecución con health status, health indicators y Gantt de actividades
- **Timeline Ejecutivo** (`/execution/timeline`) — Visión consolidada de todos los planes en un diagrama de Gantt con:
  - StatBox clickeables (Total Planes, Activos, En Riesgo, Vencidos) con filtros combinados por status/salud/vencimiento
  - Navegación temporal (retroceder/avanzar 12 semanas, botón "Hoy")
  - Barras de plan con color de salud (verde/amarillo/rojo), % completado y línea de "Hoy"
  - Sidebar con Próximos Hitos y Alertas del sistema
- **Daily** (`/execution/daily`) — Vista diaria de actividades, bloqueos y tareas pendientes con:
  - WeeklyTimeline clickeable para filtrar la agenda por semana
  - UpNextPanel sincronizado con la semana seleccionada
  - Seguimiento de actividades que vencen hoy, vencidas, compromisos y completadas
  - **Compartir** — genera enlace público del seguimiento diario
- **Compromisos** (`/execution/commitments`) — Compromisos con tracking de estado (active, at_risk, breached, fulfilled)
- **Actividades** — Asociadas a planes, con asignación y fechas
- **Bloqueos** — Severidad y escalamiento, tracking de resolución
- **Dependencias** — Entre tareas, actividades, planes y compromisos
- **Servicio de Escalamiento** — `escalationService.ts`

### Compartir y Enlaces Públicos
- **Compartir Dashboard, Daily, Plan, Timeline, Performance, Reclutamiento y más** — cada módulo permite generar un enlace público con:
  - Cifrado opcional AES-GCM 256 con passphrase
  - Almacenamiento en Azure Blob Storage (cuando está configurado) o localStorage
  - Vista de solo lectura para el receptor
  - Caducidad automática a las 48h
  - Botones de descarga PDF e Imagen en las vistas públicas
  - Páginas públicas standalone sin necesidad de autenticación:
    - `/public/dashboard/:hash` — Dashboard Ejecutivo
    - `/public/daily/:hash` — Seguimiento Diario
    - `/public/plan/:hash` — Detalle de Plan con Diagrama de Gantt
    - `/public/timeline/:hash` — Timeline Ejecutivo (sin hitos próximos)
    - `/public/performance/:hash` — Performance de equipos
    - `/public/member/:hash` — Detalle de miembro
    - `/public/members/:hash` — Vista general de miembros
    - `/public/recruitment/:hash` — Reclutamiento

### Administración (`/admin`)
- **Importación de datos desde Excel** (`/admin/import`)
  - 9 tipos de entidad soportados (Aplicaciones, Tecnologías, Vulnerabilidades, Incidentes, Riesgos, Hallazgos, Equipos, Objetivos, Entregables)
  - Preview de 10 filas antes de importar
  - Upsert inteligente (match por nombre/título, preserva createdAt)
  - Descarga de plantilla por tipo
  - Resumen de resultados con detalle de errores
- **Unidades de Negocio** (`/admin/business-units`) — CRUD de BUs
- **Backup en la Nube** (`/admin`) — Backup de base de datos completa a Azure Blob Storage
  - Configuración SAS URL + nombre de contenedor
  - Prueba de conexión
  - Subida manual de backup
  - Listado y restauración de backups desde la nube
- **Programador Automático** (`/admin`) — Ejecución programada de verificaciones del sistema
  - Configuración de hora de ejecución diaria
  - Ejecución manual inmediata ("Ejecutar Ahora")
  - Verificaciones: vacaciones, obsolescencia EOL, compromisos vencidos, planes vencidos, bloqueos abiertos, actividades vencidas, entregables vencidos y backup automático
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
| AppDatabase | `appDatabases` | Bases de datos por aplicación |
| User | `users` | Usuarios del sistema |
| Plan | `plans` | Planes de ejecución |
| Activity | `activities` | Actividades de planes |
| Task | `tasks` | Tareas operativas |
| Commitment | `commitments` | Compromisos con tracking |
| Blocker | `blockers` | Bloqueos con escalamiento |
| Dependency | `dependencies` | Dependencias entre entidades |
| Vulnerab.-Microserv. | `vulnerabilityMicroservices` | Relación M:N vulnerabilidad ↔ microservicio (herencia) |
| Incidente-Microserv. | `incidentMicroservices` | Relación M:N incidente ↔ microservicio (herencia) |
| Riesgo-Microserv. | `riskMicroservices` | Relación M:N riesgo ↔ microservicio (herencia) |
| Hallazgo-Microserv. | `auditFindingMicroservices` | Relación M:N hallazgo ↔ microservicio (herencia) |

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

## Backup en la Nube (Azure Blob Storage)

El sistema puede realizar copias de seguridad completas de la base de datos IndexedDB en Azure Blob Storage:

1. **Configuración**: Ingresa una SAS URL a nivel de cuenta y el nombre del contenedor desde la sección "Backup en la Nube" en Administración
2. **Conexión**: Prueba la conexión antes de guardar la configuración
3. **Subida**: Exporta toda la base de datos (20 tablas) a un archivo JSON subido a Azure
4. **Listado**: Visualiza los backups disponibles en el contenedor con tamaño y fecha
5. **Restauración**: Descarga un backup desde Azure y restaura todos los datos (sobrescribe datos actuales)

> **Nota de Seguridad**: La SAS URL se almacena en localStorage. Se recomienda usar SAS tokens de nivel cuenta con permisos `rwdlacupiytfx` y expiración lejana para operaciones continuas.

## Programador Automático

El sistema incluye un programador de tareas automáticas que ejecuta verificaciones periódicas y genera alertas en el dashboard:

1. **Configuración**: Desde la sección "Programador Automático" en Administración
2. **Hora de ejecución**: Selecciona la hora del día para la ejecución automática (formato 24h)
3. **Ejecución manual**: Botón "Ejecutar Ahora" para forzar la ejecución inmediata
4. **Verificaciones ejecutadas** (9 en total):
   - Vacaciones del personal — alerta si alguien está de vacaciones
   - Obsolescencia tecnológica — sincroniza EOL y alerta tecnologías obsoletas en uso
   - Compromisos vencidos — alerta compromisos más allá de su fecha
   - Planes vencidos — alerta planes con fecha fin vencida
   - Bloqueos abiertos — alerta bloqueos sin resolver o escalados
   - Actividades vencidas — alerta actividades fuera de plazo
   - Entregables vencidos — alerta entregables no completados
   - Backup automático — guarda copia local y, si está configurado, sube a Azure
   - Limpieza de enlaces compartidos — elimina de Azure archivos de enlaces compartidos con más de 48h

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
| `/execution/timeline` | Timeline Ejecutivo |
| `/admin` | Administración |
| `/admin/import` | Importación Excel |
| `/admin/business-units` | Unidades de Negocio |
| `/public/:hash` | Dashboard público |
| `/public/daily/:hash` | Seguimiento Diario público |
| `/public/plan/:hash` | Detalle de Plan público |
| `/public/timeline/:hash` | Timeline Ejecutivo público |
| `/public/performance/:hash` | Performance público |
| `/public/member/:hash` | Miembro público |
| `/public/members/:hash` | Miembros público |
| `/public/recruitment/:hash` | Reclutamiento público |

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

### Content Security Policy (CSP)

El sitio configura CSP via `<meta>` tag en `index.html`. Las directrices actuales son:

| Directiva | Orígenes permitidos |
|-----------|-------------------|
| `default-src` | `'self'` |
| `script-src` | `'self'` `'unsafe-inline'` `'unsafe-eval'` |
| `style-src` | `'self'` `'unsafe-inline'` `https://fonts.googleapis.com` |
| `font-src` | `'self'` `https://fonts.gstatic.com` |
| `img-src` | `'self'` `data:` `blob:` |
| `connect-src` | `'self'` `blob:` `https://endoflife.date` `https://*.blob.core.windows.net` |
| `frame-src` | `'none'` |
| `object-src` | `'none'` |
| `base-uri` | `'self'` |

Si se añaden nuevos servicios externos (APIs, blob storage, etc.), actualizar las directivas correspondientes en `index.html`.

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

### Bypass para desarrollo

Para saltar la autenticación en entorno de desarrollo, pega esto en la consola del navegador (F12) y recarga:

```js
sessionStorage.setItem('tgp-auth-session', JSON.stringify({
  token: crypto.randomUUID(),
  createdAt: Date.now(),
  expiresAt: Date.now() + 86400000
}));
location.reload();
```

Para reiniciar la configuración desde cero (nuevo QR):

```js
localStorage.removeItem('tgp-auth-secret');
localStorage.removeItem('tgp-auth-secret-iv');
localStorage.removeItem('tgp-auth-secret-salt');
sessionStorage.removeItem('tgp-auth-session');
location.reload();
```

## Compartir Datos y Políticas de Privacidad

TGP permite generar enlaces públicos para compartir información con personas dentro y fuera de la institución. Es responsabilidad del usuario conocer y gestionar los riesgos asociados.

### Responsabilidad del Usuario

- **Contenido sensible**: El usuario es el único responsable de evaluar qué información comparte. TGP no filtra, revisa ni modifica los datos antes de generar un enlace público.
- **Información clasificada**: No compartas información que la institución considere confidencial, clasificada, sujeta a regulación (GDPR, LGPD, Ley General de Protección de Datos local) o que pudiera representar un riesgo si es divulgada.
- **Datos personales**: Evita compartir información personal identificable (nombres completos, correos, identificaciones internas) a menos que sea estrictamente necesario y cuentes con la autorización correspondiente.
- **Datos estratégicos**: Planes, OKRs, métricas de equipos, vulnerabilidades y hallazgos de auditoría pueden revelar estrategia institucional, brechas de seguridad o debilidades operativas. Evalúa el impacto antes de compartir.

### Medidas de Protección Incorporadas

- **Cifrado opcional**: Al compartir, puedes agregar una contraseña que cifra los datos con AES-GCM 256 antes de almacenarlos. Quien reciba el enlace necesitará la misma contraseña para visualizar el contenido.
- **Caducidad automática**: Todos los enlaces compartidos expiran a las 48 horas. Después de ese período, el enlace deja de funcionar y los datos no son accesibles.
- **Limpieza programada**: El programador automático elimina de Azure Blob Storage los archivos de enlaces compartidos con más de 48h.
- **Solo lectura**: Las vistas públicas son exclusivamente de solo lectura. No es posible editar, crear o eliminar datos desde un enlace público.
- **Autenticación requerida**: Para generar un enlace público, el usuario debe haber iniciado sesión en TGP. Las vistas públicas no requieren autenticación (son accesibles por diseño).

### Almacenamiento y Transmisión

- **localStorage**: Cuando no hay Azure configurado, los enlaces se almacenan en localStorage del navegador del usuario que los creó. Esto significa que solo ese navegador puede generar y validar el enlace.
- **Azure Blob Storage**: Si está configurado, los datos compartidos se almacenan en Azure Blob Storage y son accesibles desde cualquier lugar mediante el enlace generado. Los archivos se limpian automáticamente después de 48h.
- **Transmisión**: Los datos viajan cifrados en tránsito (HTTPS). Si se usó cifrado con passphrase, los datos están protegidos adicionalmente con AES-GCM 256.

### Buenas Prácticas

1. **Usa contraseña** para datos que contengan información institucional sensible, incluso si no es clasificada.
2. **Comparte el mínimo necesario** — selecciona solo la vista que contiene la información requerida por el receptor.
3. **Comunica la contraseña por un canal diferente** al del enlace (ej. enlace por email, contraseña por mensaje interno).
4. **Revoca enlaces** desde la sección de administración si sospechas que un enlace fue expuesto antes de su vencimiento.
5. **Notifica al equipo de seguridad** si se comparten datos clasificados por error.
6. **No compartas pantallas** que contengan información sensible si el sistema de captura incluye datos que no deben ser divulgados (los botones PDF/Imagen capturan todo el contenido visible de la página).

### Exención de Responsabilidad

TGP es una herramienta de gestión y gobierno tecnológico. El usuario asume toda responsabilidad por:

- La información que decide compartir mediante enlaces públicos
- El cumplimiento de las políticas institucionales de protección de datos
- Las consecuencias de compartir información sensible, clasificada o regulada
- La custodia y transmisión segura de las contraseñas de cifrado a los receptores

El equipo de TGP no será responsable por daños directos o indirectos derivados del uso indebido de la funcionalidad de compartir, incluyendo pero no limitado a filtración de datos, incumplimiento normativo o暴露 de información estratégica.

## Licencia

Propietaria — TGP &copy; 2026
