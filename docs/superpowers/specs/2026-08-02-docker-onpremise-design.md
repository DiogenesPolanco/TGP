# TGP On-Premise Docker Deployment — Design

**Fecha:** 2026-08-02
**Estado:** Diseño aprobado (parámetros definidos por el usuario)
**Autor:** OpenAgent

## Objetivo

Permitir desplegar TGP (SPA 100% cliente-side, React 19 + Vite, datos en IndexedDB del navegador, sin backend) en servidores on-premise usando Docker. Hoy la app se publica como build estático en Azure Static Web Apps vía GitHub Actions.

## Decisiones acordadas con el usuario

| Decisión          | Valor                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Alcance           | Build + servir en un solo contenedor (multi-stage Dockerfile)                                                     |
| Red               | HTTP en LAN — nginx escucha en :80, mapeado a :8080 del host; TLS por reverse proxy externo (Caddy/Nginx/Traefik) |
| Entrega de imagen | Dockerfile + docker-compose.yml + workflow de publish a GHCR y Docker Hub                                         |
| Arquitecturas     | linux/amd64 + linux/arm64 (buildx multi-platform)                                                                 |

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  Servidor on-premise (LAN)                              │
│                                                         │
│  docker compose up -d                                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Contenedor tgp (nginx:alpine)                    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  /usr/share/nginx/html ← dist/ de Vite     │  │  │
│  │  │  SPA fallback: try_files $uri /index.html   │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  puerto 80 ← mapeado a :8080 del host             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Reverse proxy externo opcional → TLS (Caddy/Nginx)     │
└─────────────────────────────────────────────────────────┘
```

## Componentes

### 1. `Dockerfile` (multi-stage)

```dockerfile
# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build   # ejecuta scripts/generate-version.cjs + tsc -b + vite build

# Stage 2: runtime
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ || exit 1
```

Puntos clave:

- `npm ci` con cache (usa lockfile, instalación reproducible).
- `.dockerignore` para excluir `node_modules`, `dist`, `.git`, `.codegraph`, `coverage`, etc. (menor contexto de build).
- `nginx:alpine` como imagen runtime (~25 MB).
- HEALTHCHECK para que Docker reinicie si nginx deja de responder.

### 2. `nginx.conf` (config SPA)

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;

  # Assets con hash → cache inmutable
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }

  # index.html nunca cacheado (siempre recibe el build nuevo)
  location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }

  # SPA fallback: cualquier ruta → index.html (React Router)
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Seguridad
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

Puntos clave:

- `try_files $uri $uri/ /index.html;` es **crítico** para React Router — permite refresh en `/dashboard`, `/security/vulnerabilities`, etc. sin 404.
- Assets hasheados de Vite → cache inmutable (performance).
- `index.html` → `no-cache` (actualizaciones visibles inmediatamente).

### 3. `docker-compose.yml`

```yaml
services:
  tgp:
    image: ghcr.io/diogenespolanco/tgp:latest
    build: .
    ports:
      - '8080:80'
    restart: unless-stopped
```

Puntos clave:

- `image:` + `build:` → permite tanto pull de imagen publicada como build local.
- Puerto host `8080` (evita conflicto con otros servicios; configurable por el usuario).
- `restart: unless-stopped` → auto-reinicio tras reboot/fallo.

### 4. `.github/workflows/docker-publish.yml`

```yaml
name: Docker Publish
on:
  push:
    branches: [master]
    tags: ['v*']
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_TOKEN }}
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            ghcr.io/diogenespolanco/tgp
            diogenespolanco/tgp
          tags: |
            type=semver,pattern={{version}}
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}
      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
```

Puntos clave:

- Dispara en push a `master` y en tags `v*` (release Auto Version ya genera `v1.1.x`).
- Multi-platform `linux/amd64,linux/arm64` vía QEMU + buildx.
- GHCR usa `GITHUB_TOKEN` automático (sin secret adicional).
- Docker Hub requiere secrets `DOCKER_HUB_USERNAME` y `DOCKER_HUB_TOKEN` (a configurar por el usuario).
- Tags: semver de la versión, `latest` en master.

### 5. README — sección "Deployment on-premise"

- `docker compose up -d` para desplegar.
- `docker compose up -d --build` para construir localmente.
- Puerto configurable, nota sobre reverse proxy TLS externo.
- Arquitecturas soportadas (amd64/arm64).

## Flujo de datos

Ninguno entre contenedores — TGP es 100% cliente-side (IndexedDB en el navegador). El contenedor solo sirve estáticos; el reverse proxy externo maneja TLS. No se requieren volúmenes persistentes (la app no escribe en el servidor).

## Manejo de errores

- SPA fallback evita 404 en rutas profundas.
- `HEALTHCHECK` permite que Docker reinicie el contenedor si nginx cae.
- `restart: unless-stopped` en compose.
- Si el build falla (tsc/vite), la imagen no se publica (CI rojo).
- `npm audit` en pre-push existente sigue protegiendo contra dependencias vulnerables.

## Testing

- Validación local: `docker build .` + `docker run -p 8080:80` + curl a `/`, `/dashboard`, `/security/vulnerabilities` (verificar fallback SPA).
- Validación de headers: cache inmutable en assets, no-cache en index.html.
- El workflow CI existente (761 tests) corre antes del push de imagen — el publish depende del build exitoso.

## Fuera de alcance (YAGNI)

- Persistencia server-side / backup al servidor (TGP es cliente-side por diseño).
- TLS dentro del contenedor (se maneja con reverse proxy externo).
- Otros runtimes (node directo, caddy) — nginx es suficiente.
- Arquitectura arm/v7 (Raspberry Pi 3) — se puede añadir después si hace falta.

## Pendiente del usuario

- Confirmar nombre de org/repo en Docker Hub (se asume `diogenespolanco/tgp`).
- Configurar secrets `DOCKER_HUB_USERNAME` y `DOCKER_HUB_TOKEN` en GitHub.
