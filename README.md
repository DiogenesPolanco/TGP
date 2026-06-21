<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/TGP-Technology%20Governance%20Platform-6366f1?style=for-the-badge&labelColor=1e1b4b" />
  <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/badge/TGP-Technology%20Governance%20Platform-6366f1?style=for-the-badge&labelColor=eef2ff" />
  <img alt="TGP" src="https://img.shields.io/badge/TGP-Technology%20Governance%20Platform-6366f1?style=for-the-badge&labelColor=1e1b4b" />
</picture>

<p align="center">
  <strong>Client-side SPA for enterprise technology governance — applications, security, risk, OKRs, teams, and execution tracking.</strong>
</p>

<p align="center">
  <a href="#key-features">Features</a> •
  <a href="#tech-stack">Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Dexie.js-4-4B32C3" alt="Dexie.js 4" />
  <img src="https://img.shields.io/badge/License-Proprietary-ef4444" alt="License" />
</p>

---

## Key Features

### 📊 Executive Dashboard
Real-time **Technology Health Index (THI)** — a composite score across 7 weighted dimensions (Delivery, Security, Obsolescence, Risk, and more). Interactive KPI cards with drill-down, severity distribution charts, and period filtering.

### 📋 Application Catalog
Full CRUD for your portfolio with advanced search, filtering by criticality/status/BU, and a detail view that consolidates **inherited** vulnerabilities, risks, incidents, and audit findings from linked microservices. Import from Excel with smart upsert.

### 🔒 Security & Governance
Track **vulnerabilities** with CVSS scoring, SLA deadlines, and status workflow. Manage **incidents** with P1-P4 severity and response-time tracking. Built-in **risk matrix** (probability × impact) and **audit findings** with evidence attachments and action plans.

### 🎯 OKRs & Strategy
Objectives with Key Results, period tracking, progress calculation, and status monitoring (on track, at risk, behind, achieved). Align deliverables and plans to strategic objectives.

### 🚀 Execution Tracking
Plan management with **Gantt charts**, daily activity timeline, commitments, blockers, and dependency mapping. Escalation service for overdue items. Weekly view with upcoming milestones.

### 👥 Teams & DORA Metrics
Team management with **DORA metrics** (deployment frequency, lead time, change failure rate, MTTR). Automated benchmarking against Elite / High / Medium / Low thresholds.

### 🔗 Public Sharing
Generate **encrypted, expiring public links** for any view — dashboard, daily, plans, vulnerabilities, risks, audit, OKRs, and more. AES-GCM 256 encryption at rest with optional passphrase. Store in Azure Blob Storage or localStorage.

### ⚡ Fully Client-Side
Zero server dependencies. All data lives in **IndexedDB** (Dexie.js). Cloud backup and sharing via Azure Blob Storage. TOTP authentication with QR setup.

---

## Screenshots

> _Coming soon — preview images of the dashboard, application catalog, and execution views._

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Core** | React 19, TypeScript 5, Vite 6 + SWC |
| **Routing** | React Router v7 |
| **State** | Zustand 5 |
| **Database** | Dexie.js 4 (IndexedDB) |
| **Styling** | Tailwind CSS 4 + custom design system |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts + ApexCharts |
| **Icons** | Lucide React |
| **Auth** | TOTP (otpauth + QR code) |
| **Cloud** | Azure Blob Storage |
| **Import** | SheetJS (XLSX) |

---

## Getting Started

```bash
# Clone
git clone https://github.com/DiogenesPolanco/TGP.git
cd TGP

# Install
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

The app runs entirely in the browser — no backend required. A demo dataset can be loaded from the UI to explore features.

> **First run**: Scan the QR code with any authenticator app (Google Authenticator, Authy, 1Password) to set up TOTP.

---

## Architecture

The application follows a **feature-first** modular structure on top of a shared UI component library.

```
src/
├── components/     # Shared UI (buttons, modals, badges, layout)
├── features/       # Domain modules (catalog, security, governance, execution, etc.)
├── services/       # Data layer (Dexie repos, import/export, sync, THI engine)
├── stores/         # Zustand stores
├── hooks/          # Shared React hooks
├── types/          # TypeScript domain types
└── lib/            # Utilities
```

Key architectural decisions:

- **Single source of truth**: All domain data in IndexedDB with Dexie.js (20+ tables)
- **Entity inheritance**: Vulnerabilities, risks, incidents, and audit findings can be linked to microservices and automatically inherited by parent applications
- **Offline-first**: Everything works without network — cloud features (backup, sharing) are additive
- **Encrypted sharing**: Public links are always encrypted at rest with AES-GCM 256

---

## Project Status

Active development. Built for enterprise governance needs, designed to be self-contained and easy to deploy — just serve the static build folder.

---

## License

Proprietary — TGP &copy; 2026
