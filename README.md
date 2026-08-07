<div align="center">

# 🚀 TGP — Plataforma de Gobierno Tecnológico

### Gobierno Tecnológico Empresarial • Inteligencia Artificial • Offline First • Open Source

<p>

<img src="https://img.shields.io/docker/pulls/diogenespolanco/tgp?style=for-the-badge&logo=docker&color=2496ED" />
<img src="https://img.shields.io/docker/image-size/diogenespolanco/tgp/latest?style=for-the-badge&logo=docker" />
<img src="https://img.shields.io/docker/v/diogenespolanco/tgp?style=for-the-badge&logo=docker" />
<img src="https://img.shields.io/github/license/DiogenesPolanco/TGP?style=for-the-badge" />
<img src="https://img.shields.io/github/stars/DiogenesPolanco/TGP?style=for-the-badge" />

</p>

**TGP es una plataforma moderna de Gobierno Tecnológico Empresarial impulsada por Inteligencia Artificial que centraliza aplicaciones, arquitectura, ciberseguridad, riesgos, auditoría, ejecución, OKRs, activos tecnológicos y métricas ejecutivas en un solo lugar.**

Construida con **React 19**, **TypeScript**, **Vite** e **IndexedDB**, funciona completamente desde el navegador sin necesidad de backend ni bases de datos externas.

---

## ⚡ Una sola plataforma para gobernar toda tu organización

TGP unifica las funciones normalmente distribuidas entre múltiples herramientas:

📊 Gobierno Tecnológico

🏛 Arquitectura Empresarial

🔒 Ciberseguridad

⚠ Gestión de Riesgos

📋 Auditoría

🚀 Gestión de Proyectos

🎯 OKRs

👥 Equipos de Ingeniería

💻 Inventario Tecnológico

💰 FinOps — Costos por Aplicación

🤖 Inteligencia Artificial

Todo integrado en una experiencia moderna, rápida y completamente offline.

</div>

---

# ✨ Características

## 🤖 GobIA — Asistente de Inteligencia Artificial

Asistente conversacional integrado capaz de responder preguntas sobre toda la plataforma utilizando lenguaje natural.

Compatible con:

- OpenAI
- Ollama
- Groq
- Tool Calling
- Conversaciones con contexto
- Consultas sobre aplicaciones, tecnologías, riesgos, auditorías, equipos y métricas

---

## 📊 Dashboard Ejecutivo

Obtén una visión completa del estado tecnológico mediante indicadores en tiempo real.

Incluye:

- Technology Health Index (THI)
- KPIs Ejecutivos
- Estado del Portafolio
- Nivel de Riesgo
- Indicadores de Seguridad
- Salud Tecnológica
- Deuda Técnica
- Dashboards por Unidad de Negocio

---

## 🏢 Gobierno de Aplicaciones

Administra todo el ciclo de vida de las aplicaciones.

- Catálogo Empresarial
- Arquitectura
- Microservicios
- Dependencias
- Propietarios
- Criticidad
- Estado
- Tecnologías utilizadas
- Relaciones entre aplicaciones

---

## 💰 FinOps — Costos por Aplicación

Controla el gasto tecnológico con visibilidad por aplicación, categoría y periodo.

- Dashboard FinOps con KPIs y tendencias
- Costos por aplicación, categoría y microservicio
- Presupuestos por periodo con alertas de sobreuso
- Asignaciones de costos compartidos
- Importación de costos vía CSV

---

## 🔒 Ciberseguridad

Gestión integral de seguridad tecnológica.

- Vulnerabilidades
- CVSS
- CVE
- Integración con NVD
- Incidentes
- Riesgos
- Hallazgos
- Planes de remediación
- SLA

---

## 🚀 Gestión de Ejecución

Controla la ejecución estratégica de la organización.

- Diagramas de Gantt
- Roadmaps
- Hitos
- Dependencias
- Compromisos
- Bloqueos
- Seguimiento semanal

---

## 🎯 Gestión Estratégica

Administra objetivos organizacionales.

- OKRs
- Key Results
- Seguimiento
- Progreso
- Estado
- Objetivos Estratégicos

---

## 👥 Ingeniería

Gestiona equipos de alto desempeño.

- Equipos
- Métricas DORA
- Lead Time
- MTTR
- Deployment Frequency
- Change Failure Rate
- Benchmarking automático

---

## 💻 Inventario Tecnológico

Control completo de activos tecnológicos.

- Equipos
- Laptops
- Monitores
- Teléfonos
- Historial
- Asignaciones
- Tickets
- Reportes

---

## 🔍 Búsqueda Global

Consulta información en más de **40 dominios funcionales** desde un único buscador.

Entre ellos:

- Aplicaciones
- Tecnologías
- Equipos
- Vulnerabilidades
- Riesgos
- Auditorías
- Incidentes
- Equipamiento
- OKRs
- Planes
- Roadmaps

---

## ☁️ Integraciones Opcionales

- Azure Blob Storage
- Enlaces Públicos Seguros
- Backup y Restauración
- Cifrado AES-256
- Sincronización de información

---

# ⚙ Stack Tecnológico

| Capa          | Tecnología             |
| ------------- | ---------------------- |
| Frontend      | React 19               |
| Lenguaje      | TypeScript 5           |
| Build         | Vite 6                 |
| UI            | Tailwind CSS 4         |
| Estado        | Zustand                |
| Base de Datos | IndexedDB (Dexie)      |
| Formularios   | React Hook Form + Zod  |
| Gráficos      | ApexCharts + Recharts  |
| Autenticación | TOTP                   |
| IA            | OpenAI · Ollama · Groq |

---

# 🐳 Inicio Rápido

## Descargar la imagen

```bash
docker pull diogenespolanco/tgp
```

## Ejecutar

```bash
docker run -d \
  --name tgp \
  -p 8080:80 \
  --restart unless-stopped \
  diogenespolanco/tgp
```

Abrir el navegador

```
http://localhost:8080
```

o

```
http://IP_DEL_SERVIDOR:8080
```

---

# Docker Compose

```yaml
services:
  tgp:
    image: diogenespolanco/tgp:latest
    container_name: tgp
    restart: unless-stopped
    ports:
      - '8080:80'
```

Desplegar

```bash
docker compose up -d
```

---

# 🏗 Arquitectura

TGP está diseñado bajo un enfoque **100% Cliente (Client-Side)**.

```
Navegador
      │

      ▼

React 19
TypeScript
Vite

      │

IndexedDB (Dexie)

      │

Servicios Opcionales

Azure Blob Storage
OpenAI
Groq
Ollama
```

No requiere:

- Backend
- Node.js
- SQL Server
- PostgreSQL
- MySQL
- APIs
- Servicios adicionales

Todo funciona directamente desde el navegador.

---

# 🏢 Casos de Uso

Ideal para organizaciones que necesitan una plataforma integral para el gobierno tecnológico.

Sectores recomendados:

- Bancos
- Entidades Financieras
- Seguros
- Gobierno
- Telecomunicaciones
- Salud
- Retail
- Empresas de Software
- Arquitectura Empresarial
- Oficinas CIO
- Oficinas CTO
- Oficinas CISO
- PMO
- Transformación Digital

---

# 📦 Información del Contenedor

| Propiedad     | Valor                   |
| ------------- | ----------------------- |
| Imagen        | `diogenespolanco/tgp`   |
| Registro      | Docker Hub              |
| Arquitecturas | amd64 / arm64           |
| Puerto        | 8080                    |
| Licencia      | MIT                     |
| Despliegue    | Docker / Docker Compose |

---

# 🚀 Principales Beneficios

✅ Sin configuración compleja

✅ Instalación en menos de un minuto

✅ Offline First

✅ Inteligencia Artificial Integrada

✅ Arquitectura Empresarial

✅ Gobierno Tecnológico

✅ Gestión de Riesgos

✅ Ciberseguridad

✅ Dashboard Ejecutivo

✅ Responsive

✅ Dark Mode

✅ Open Source

---

# 📄 Licencia

Licencia MIT

Copyright © 2026 Diogenes Polanco

---

# ⭐ ¿Te gusta TGP?

Si el proyecto te resulta útil:

- ⭐ Dale una estrella al repositorio
- 🍴 Haz un Fork
- 🐞 Reporta incidencias
- 💡 Propón nuevas funcionalidades
- 🤝 Contribuye al proyecto

---

# 🔗 Recursos

**GitHub**

https://github.com/DiogenesPolanco/TGP

**Docker Hub**

https://hub.docker.com/r/diogenespolanco/tgp

---

<div align="center">

## El Gobierno Tecnológico Empresarial en una sola plataforma.

### Inteligencia Artificial • Arquitectura • Seguridad • Riesgos • Ejecución • Open Source

</div>
