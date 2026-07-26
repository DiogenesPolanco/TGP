<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/TGP-Plataforma%20de%20Gobierno%20Tecnol%C3%B3gico-6366f1?style=for-the-badge&labelColor=1e1b4b" />
  <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/badge/TGP-Plataforma%20de%20Gobierno%20Tecnol%C3%B3gico-6366f1?style=for-the-badge&labelColor=eef2ff" />
  <img alt="TGP" src="https://img.shields.io/badge/TGP-Plataforma%20de%20Gobierno%20Tecnol%C3%B3gico-6366f1?style=for-the-badge&labelColor=1e1b4b" />
</picture>

<p align="center">
  <strong>SPA cliente-side para gobierno tecnológico empresarial — aplicaciones, seguridad, riesgos, OKRs, equipos y seguimiento de ejecución.</strong>
</p>

<p align="center">
  <a href="#caracteristicas">Características</a> •
  <a href="#stack">Stack</a> •
  <a href="#primeros-pasos">Primeros Pasos</a> •
  <a href="#arquitectura">Arquitectura</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Dexie.js-4-4B32C3" alt="Dexie.js 4" />
  <img src="https://img.shields.io/badge/Licencia-MIT-green" alt="Licencia MIT" />
</p>

---

## Características

### 🤖 GobIA — Asistente de IA
**GobIA** (Gobierno + IA) es un asistente conversacional integrado en el sidebar que permite consultar la plataforma en lenguaje natural. Soporta múltiples proveedores (OpenAI, Groq, Ollama) con tool calls nativos, ejecuta consultas en tiempo real sobre aplicaciones, tecnologías, equipos, riesgos y más, y maneja resultados vacíos, dominios deshabilitados y multi-turno con respuestas contextualizadas.

### 📊 Dashboard Ejecutivo
**Technology Health Index (THI)** en tiempo real — puntuación compuesta en 7 dimensiones ponderadas (Delivery, Seguridad, Obsolescencia, Riesgo, y más). Tarjetas KPI interactivas con drill-down, gráficos de distribución por severidad y filtro por período.

### 📋 Catálogo de Aplicaciones
CRUD completo con búsqueda avanzada, filtros por criticidad/estado/BU, y vista de detalle que consolida vulnerabilidades, riesgos, incidentes y hallazgos **heredados** de microservicios vinculados. Importación desde Excel con upsert inteligente.

### 🔒 Seguridad y Gobierno
Vulnerabilidades con puntuación CVSS, SLA y flujo de estados. Incidentes con severidad P1-P4 y tracking de tiempos de respuesta. Matriz de **riesgos** (probabilidad × impacto) y **hallazgos de auditoría** con evidencia adjunta y planes de acción.

### 🎯 OKRs y Estrategia
Objetivos con Key Results, tracking de período, cálculo de progreso y monitoreo de estado (on track, at risk, behind, achieved). Vincula entregables y planes a objetivos estratégicos.

### 🚀 Seguimiento de Ejecución
Planes con **diagramas de Gantt**, línea de tiempo diaria, compromisos, bloqueos y mapa de dependencias. Servicio de escalamiento para items vencidos. Vista semanal con hitos próximos.

### 👥 Equipos y Métricas DORA
Gestión de equipos con **métricas DORA** (frecuencia de deploy, lead time, change failure rate, MTTR). Benchmarking automático Elite / Alto / Medio / Bajo.

### 💻 Inventario de Equipamiento
CRUD completo de equipos (laptops, monitores, teléfonos, periféricos, etc.) con asignación a miembros, historial de asignaciones, tickets de soporte (reparación/reemplazo/nuevo) y reportes. Los tickets se vinculan a Jira con ID y enlace externo. Dashboard público compartible con métricas, inventario y tickets. Vista de detalle con tabs de Información, Tickets e Historial, más diseño hero con icono de estado.

### 🔗 Enlaces Públicos
Generación de **enlaces públicos cifrados y con expiración** para cualquier vista — dashboard, daily, planes, vulnerabilidades, riesgos, auditoría, OKRs y más. Cifrado AES-GCM 256 en reposo con passphrase opcional. Almacenamiento en Azure Blob Storage o localStorage.

### 🧭 Onboarding Guiado
Asistente de primer inicio con 10 pasos interactivos que guían al usuario desde la creación de unidades de negocio hasta la carga de datos demo, cubriendo aplicaciones, tecnologías, equipos, seguridad, ejecución y dashboard.

### ⚡ 100% Cliente-Side
Sin dependencias de servidor. Todos los datos en **IndexedDB** (Dexie.js). Backup en la nube y enlaces públicos vía Azure Blob Storage. Autenticación TOTP con código QR.

---

## Stack

| Capa | Tecnología |
|---|---|
| **Core** | React 19, TypeScript 5, Vite 6 + SWC |
| **Ruteo** | React Router v7 |
| **Estado** | Zustand 5 |
| **Base de datos** | Dexie.js 4 (IndexedDB) |
| **Estilos** | Tailwind CSS 4 + design system propio |
| **Formularios** | React Hook Form + Zod |
| **Gráficos** | Recharts + ApexCharts |
| **Iconos** | Lucide React |
| **Auth** | TOTP (otpauth + QR code) |
| **Nube** | Azure Blob Storage |
| **Importación** | SheetJS (XLSX) |

---

## Primeros Pasos

```bash
# Clonar
git clone https://github.com/DiogenesPolanco/TGP.git
cd TGP

# Instalar
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

La aplicación corre completamente en el navegador — no requiere backend. Puedes cargar un dataset demo desde la interfaz para explorar las funcionalidades.

> **Primer inicio**: Al ingresar por primera vez, un **onboarding interactivo de 10 pasos** te guiará en la configuración inicial (unidades de negocio, aplicaciones, tecnologías, equipos, seguridad y más). Una vez completado, puedes acceder a **GobIA** desde el sidebar (Alt+A) para consultar la plataforma en lenguaje natural.

---

## Arquitectura

La aplicación sigue una estructura **feature-first** sobre una librería de componentes UI compartidos.

```
src/
├── components/     # UI compartida (botones, modales, badges, layout)
├── features/       # Módulos por dominio (catalog, security, equipment, execution, etc.)
├── services/       # Capa de datos (repos Dexie, import/export, sync, motor THI)
├── stores/         # Stores Zustand
├── hooks/          # Hooks React compartidos
├── types/          # Tipos TypeScript de dominio
└── lib/            # Utilidades
```

Decisiones arquitectónicas clave:

- **Fuente única de verdad**: Todos los datos de dominio en IndexedDB con Dexie.js (25+ tablas)
- **Herencia de entidades**: Vulnerabilidades, riesgos, incidentes y hallazgos pueden vincularse a microservicios y ser heredados automáticamente por sus aplicaciones padre
- **Offline-first**: Todo funciona sin red — las funcionalidades en la nube (backup, sharing) son adicionales
- **Enlaces cifrados**: Los enlaces públicos siempre se cifran en reposo con AES-GCM 256

---

## Estado del Proyecto

Desarrollo activo. Construido para necesidades de gobierno empresarial, diseñado para ser autónomo y fácil de desplegar — solo sirve la carpeta de build estático.

---

## 📄 Licencia

**MIT License** — TGP &copy; 2026

Este software es open-source y libre de usar, modificar y distribuir bajo los términos de la licencia MIT.  
Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 📌 Contribución

¡Contribuciones bienvenidas! Para contribuir:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y pruebas
4. Envía un Pull Request

---

## 📞 Soporte

- **GitHub Issues**: [Reportar bugs o solicitar features](https://github.com/DiogenesPolanco/TGP/issues)
- **Documentación**: `/docs` en la aplicación o [GitHub Wiki](https://github.com/DiogenesPolanco/TGP/wiki)

---

## 📅 Versión

**v1.0.0** — Lanzamiento inicial

---

## 📌 Notas

- **Privacidad**: No se recopilan datos personales. Todo se almacena localmente o en Azure (opcional).
- **Offline-first**: La aplicación funciona sin conexión. Las integraciones cloud son opcionales.

---
