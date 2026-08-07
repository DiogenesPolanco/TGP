# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.1](https://github.com/DiogenesPolanco/TGP/compare/v1.2.0...v1.2.1) (2026-08-07)

### 🐛 Bug Fixes

- **landing:** muestra funcionalidades con fallback y rediseña sección ([4d7d0ed](https://github.com/DiogenesPolanco/TGP/commit/4d7d0eda23a46d80e6793744b0a70cef9dfbdd92))

## [1.2.0](https://github.com/DiogenesPolanco/TGP/compare/v1.1.18...v1.2.0) (2026-08-07)

### 🐛 Bug Fixes

- **finops:** seed siembra catálogo cost_category y lo amplía a 14 categorías ([a55ec64](https://github.com/DiogenesPolanco/TGP/commit/a55ec6485aa6a25a6443bcbd48a7e69231bb3909))

### 🧪 Tests

- **finops:** e2e verifica labels de categoría al listar y editar partidas ([0e9935a](https://github.com/DiogenesPolanco/TGP/commit/0e9935a2edc7b646219e5c3f9ea969f9fe037489))

### 🚀 Features

- **finops:** colores de badge para categorías nuevas de costo ([508998d](https://github.com/DiogenesPolanco/TGP/commit/508998db0f00d12979ccd05d2955341b279228d1))
- **finops:** componentes ui base (periodo, badges, kpis, charts) ([8d563e2](https://github.com/DiogenesPolanco/TGP/commit/8d563e2cfd7dd7f33621f7998496350773bf410f))
- **finops:** crud de partidas de costo y presupuestos ([1db3ea9](https://github.com/DiogenesPolanco/TGP/commit/1db3ea942adb3c6d4e8f5452098f5a2c2c5ebb0e))
- **finops:** data de prueba en seed con microservicios y presupuestos ([15cfeb9](https://github.com/DiogenesPolanco/TGP/commit/15cfeb9308341045c866fb6aaa6d13d655e66524))
- **finops:** datos demo de costos (6 meses) ([0229e4e](https://github.com/DiogenesPolanco/TGP/commit/0229e4e6abd4386c62826feecff609a37aa97813))
- **finops:** distribución de costos (equal, weighted, bymicroservicecount) ([aa07300](https://github.com/DiogenesPolanco/TGP/commit/aa07300ba102c1f430dcfb55f1d469f42e396095))
- **finops:** e2e del módulo y fixes de tipos y seed ([92da753](https://github.com/DiogenesPolanco/TGP/commit/92da75364cbd58d6d28e8a68bc9a6769cfe962a4))
- **finops:** hook usefinopsmetrics para el dashboard ([222b0ae](https://github.com/DiogenesPolanco/TGP/commit/222b0aeb6d079a12d3e53d1b322a0946bfb6cdb2))
- **finops:** métricas del dashboard (total, variación, top, tendencia) ([206fb43](https://github.com/DiogenesPolanco/TGP/commit/206fb43c4e1925f4ac62d3d60ad0d77157fcff2d))
- **finops:** modales de distribución e importación csv ([405754e](https://github.com/DiogenesPolanco/TGP/commit/405754e8d66743c0077c5ff222445b357a24fa26))
- **finops:** páginas dashboard, partidas, formulario y detalle por app ([607118c](https://github.com/DiogenesPolanco/TGP/commit/607118c6a93098b5a91c36fcd2ac6b097601a5ef))
- **finops:** parser e importación de costos desde csv ([7eed8ba](https://github.com/DiogenesPolanco/TGP/commit/7eed8ba979e0029fa3c52ce1ca416ccbae3cea2e))
- **finops:** rediseña formulario de partidas de costo ([406cb82](https://github.com/DiogenesPolanco/TGP/commit/406cb820f5f8418fa1f20e992dc72788c6c9f058))
- **finops:** rollup de costos app + microservicios ([713acd0](https://github.com/DiogenesPolanco/TGP/commit/713acd0150bdeb390c4739743e3df60d8fcf8907))
- **finops:** rutas lazy y navegación en sidebar ([8a53fc3](https://github.com/DiogenesPolanco/TGP/commit/8a53fc3d44b50749acd96c02a9e93a2df8711f25))
- **finops:** seed de categorías de costo en catálogo ([36dfbfc](https://github.com/DiogenesPolanco/TGP/commit/36dfbfcd8a2c01e94d1b418e1cf1a9eda4794cfe))
- **finops:** tipos costentry/costbudget y tablas dexie v24 ([0770dcc](https://github.com/DiogenesPolanco/TGP/commit/0770dcc69685e99b3317fa604fa742171c3fde69))
- **finops:** tool de ia consultar_costos y permiso finops ([5dfa345](https://github.com/DiogenesPolanco/TGP/commit/5dfa345a0a156ffb9d38bd4eea390350aac8159f))
- **ui:** confirmación estándar antes de eliminar registros ([0a87593](https://github.com/DiogenesPolanco/TGP/commit/0a8759330364d56045fe3982a6b8fc44d01d008a))

### 📖 Documentation

- **landing:** documenta módulo finops en readme y landing page ([812d4fc](https://github.com/DiogenesPolanco/TGP/commit/812d4fca78d986d96874173258afcf7852f13427))

### 📦 Chores

- **deps:** actualiza js-yaml a 4.3.1 (cve-2026-59870) ([e6d5db5](https://github.com/DiogenesPolanco/TGP/commit/e6d5db558f8d8a21ad5056c89575e2ddd3ae962c))

### [1.1.18](https://github.com/DiogenesPolanco/TGP/compare/v1.1.17...v1.1.18) (2026-08-06)

### 👷 CI

- filtrar artifacts de desktop en gh release create ([e5efbd3](https://github.com/DiogenesPolanco/TGP/commit/e5efbd3b1aaaa876bd637f1e758ab648a0c4d28d))

### [1.1.17](https://github.com/DiogenesPolanco/TGP/compare/v1.1.16...v1.1.17) (2026-08-06)

### 👷 CI

- reemplazar softprops por gh release create en desktop release ([7b163d2](https://github.com/DiogenesPolanco/TGP/commit/7b163d2fd19e23785e0e8d9e31d4272131d6def9))

### [1.1.16](https://github.com/DiogenesPolanco/TGP/compare/v1.1.15...v1.1.16) (2026-08-06)

### 👷 CI

- unificar pipelines en un solo release workflow ([1526a05](https://github.com/DiogenesPolanco/TGP/commit/1526a05c634dbcc0d38057d34c51edabe29cbb3a))

### 🧪 Tests

- subir cobertura al 90% y corregir bugs en ai tools ([0888f86](https://github.com/DiogenesPolanco/TGP/commit/0888f86391dba6babd4e8de7da4b89ae01cc0ffc))

### 🔧 Refactors

- migrar a react-router v8 ([6ce0883](https://github.com/DiogenesPolanco/TGP/commit/6ce0883e0384be4d46648d0cbfabc502904de59d))

### [1.1.15](https://github.com/DiogenesPolanco/TGP/compare/v1.1.14...v1.1.15) (2026-08-03)

### 📦 Chores

- ignore local docs directory ([bc1be42](https://github.com/DiogenesPolanco/TGP/commit/bc1be4249aae122c8b99d510f34c8784002d8f38))

### [1.1.14](https://github.com/DiogenesPolanco/TGP/compare/v1.1.13...v1.1.14) (2026-08-02)

### [1.1.13](https://github.com/DiogenesPolanco/TGP/compare/v1.1.12...v1.1.13) (2026-08-02)

### [1.1.12](https://github.com/DiogenesPolanco/TGP/compare/v1.1.11...v1.1.12) (2026-08-02)

### 🐛 Bug Fixes

- **docker:** regenerate lockfile with all platform bindings ([779b3c1](https://github.com/DiogenesPolanco/TGP/commit/779b3c1b10163f5f34ca604917db687608ccb069))

### 📦 Chores

- **docker:** exclude deb packages from build context ([92ed814](https://github.com/DiogenesPolanco/TGP/commit/92ed8142a7cf1b0566fb519bd2baecb8b51af48c))

### [1.1.11](https://github.com/DiogenesPolanco/TGP/compare/v1.1.10...v1.1.11) (2026-08-02)

### 🐛 Bug Fixes

- **docker:** use bundled npm to avoid lockfile eusage ([3b9c34d](https://github.com/DiogenesPolanco/TGP/commit/3b9c34d40db0b169cefc8c5b65c5174e017d02a4))

### [1.1.10](https://github.com/DiogenesPolanco/TGP/compare/v1.1.9...v1.1.10) (2026-08-02)

### 🐛 Bug Fixes

- **docker:** pin rolldown native binding for multi-arch builds ([034c113](https://github.com/DiogenesPolanco/TGP/commit/034c1132dfee108149c9dc2f38d9f60f2451cd73))

### [1.1.9](https://github.com/DiogenesPolanco/TGP/compare/v1.1.8...v1.1.9) (2026-08-02)

### 🐛 Bug Fixes

- **docker:** keep nginx.conf in build context ([ddbbf00](https://github.com/DiogenesPolanco/TGP/commit/ddbbf00468b6bb0e33b04f1ad3741a090b4a0032))

### [1.1.8](https://github.com/DiogenesPolanco/TGP/compare/v1.1.7...v1.1.8) (2026-08-02)

### 📦 Chores

- **docker:** add docker compose service ([9f4084f](https://github.com/DiogenesPolanco/TGP/commit/9f4084fa1a8674046eb55344ab75356b662cc8a1))
- **docker:** add dockerignore ([adbe638](https://github.com/DiogenesPolanco/TGP/commit/adbe638998d75dad64e12d5b8ba8801ab034bd89))
- **docker:** add multi-stage dockerfile ([898dbc8](https://github.com/DiogenesPolanco/TGP/commit/898dbc8f670f145ba8748aed0987241f84cf0340))
- **docker:** add spa-aware nginx config ([e4cba09](https://github.com/DiogenesPolanco/TGP/commit/e4cba09fd31394e440fc977f63afbfe2ba8b80ce))

### 👷 CI

- **docker:** publish multi-arch image to ghcr and docker hub ([20ece4a](https://github.com/DiogenesPolanco/TGP/commit/20ece4a5631b6ee1b9ed0070b5e3e19e328340d5))

### 📖 Documentation

- **deploy:** add on-premise docker design spec ([6c0a4f5](https://github.com/DiogenesPolanco/TGP/commit/6c0a4f5ca7700797112e8a175b85c9ca648fadaa))
- **deploy:** add on-premise docker implementation plan ([28f401f](https://github.com/DiogenesPolanco/TGP/commit/28f401f2583ab347cb6bc810feb007fb71366568))
- **readme:** add on-premise docker deployment section ([4e981f3](https://github.com/DiogenesPolanco/TGP/commit/4e981f3e1d1995954999231cf175d46bb33c8933))

### [1.1.7](https://github.com/DiogenesPolanco/TGP/compare/v1.1.6...v1.1.7) (2026-08-02)

### 🐛 Bug Fixes

- **auth:** redirect to dashboard when an active session exists ([3b38866](https://github.com/DiogenesPolanco/TGP/commit/3b388664ee40123bafc23d15a7e135cf9bd04efa))
- **onboarding:** keep wizard mounted across route changes ([2210415](https://github.com/DiogenesPolanco/TGP/commit/221041586453184f63bb7f4fcb3feed94567aa83))

### 🧪 Tests

- **ai:** add unit tests and fix groq rescue and chatstore title bugs ([8d641f0](https://github.com/DiogenesPolanco/TGP/commit/8d641f0b49b4283a4ee41a7f24f9661e0243092a))

### [1.1.6](https://github.com/DiogenesPolanco/TGP/compare/v1.1.5...v1.1.6) (2026-08-02)

### 🐛 Bug Fixes

- **admin:** export all tables with portable encryption and validate before import ([60bce42](https://github.com/DiogenesPolanco/TGP/commit/60bce425f4217ba3539ad1fae9479a0d2cceff14))

### [1.1.5](https://github.com/DiogenesPolanco/TGP/compare/v1.1.4...v1.1.5) (2026-07-31)

### 🐛 Bug Fixes

- **version:** show real version in landing footer ([e0a478f](https://github.com/DiogenesPolanco/TGP/commit/e0a478f657eec0533811373d2e06e25c99a43855))

### [1.1.4](https://github.com/DiogenesPolanco/TGP/compare/v1.1.3...v1.1.4) (2026-07-31)

### 👷 CI

- **version:** allow workflow_dispatch in azure deploy job ([795061f](https://github.com/DiogenesPolanco/TGP/commit/795061fa40f892ac9d14e48441e627a5a4d0c8f7))

### [1.1.3](https://github.com/DiogenesPolanco/TGP/compare/v1.1.2...v1.1.3) (2026-07-31)

### 🐛 Bug Fixes

- **version:** show build hash in footer and restyle update screen ([1f8b573](https://github.com/DiogenesPolanco/TGP/commit/1f8b5735b6036b8e2ff88108bb6f144707e51b5b))

### 👷 CI

- **version:** deploy web after bump and trim release assets ([fd2e703](https://github.com/DiogenesPolanco/TGP/commit/fd2e7037fd304814b27d9b6dc295a3dcb00c5ebc))

### [1.1.2](https://github.com/DiogenesPolanco/TGP/compare/v1.1.1...v1.1.2) (2026-07-31)

### 👷 CI

- **version:** dispatch desktop release after bump because github token pushes are ignored ([796fc74](https://github.com/DiogenesPolanco/TGP/commit/796fc7432a1a880c49de5b3ae77c5b5d93e64d31))

### [1.1.1](https://github.com/DiogenesPolanco/TGP/compare/v1.1.0...v1.1.1) (2026-07-31)

### 🐛 Bug Fixes

- **version:** remove skip-ci marker from release commit so tag push triggers desktop-release ([cb8793a](https://github.com/DiogenesPolanco/TGP/commit/cb8793a420730a84a7ea8a8f99532f8fc7391ea4))

## [1.1.0](https://github.com/DiogenesPolanco/TGP/compare/v1.0.0...v1.1.0) (2026-07-31)

### 🚀 Features

- **version:** auto-bump version via conventional commits with standard-version ([11072aa](https://github.com/DiogenesPolanco/TGP/commit/11072aa17ab5bc2775ed62490e5e3912e9e6ad73))
