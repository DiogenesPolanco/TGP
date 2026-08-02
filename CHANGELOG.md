# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
