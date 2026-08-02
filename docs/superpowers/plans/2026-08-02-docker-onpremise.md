# On-Premise Docker Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Empaquetar TGP en una imagen Docker multi-stage (node build → nginx serve) con SPA fallback, docker-compose.yml y workflow de publish a GHCR + Docker Hub (amd64 + arm64).

**Architecture:** Dockerfile de dos etapas: `node:22-alpine` ejecuta el build de Vite (`npm run build` → `dist/`); `nginx:alpine` sirve `dist/` con un `nginx.conf` propio que implementa SPA fallback (`try_files $uri /index.html`), cache inmutable para assets hasheados y headers de seguridad. `docker-compose.yml` mapea :8080→:80 con restart automático. Workflow GitHub Actions `docker-publish.yml` construye multi-platform y publica a GHCR y Docker Hub en push a master y tags `v*`.

**Tech Stack:** Docker (buildx multi-platform), nginx:alpine, node:22-alpine, GitHub Actions (setup-qemu, buildx, login-action, metadata-action, build-push-action).

**Validación:** Sin Docker local disponible — la validación de imagen se hace en CI (workflow) o en el servidor on-premise. La validación local del build (`npm run build`) sí es posible (node v22 presente).

---

### Task 1: `.dockerignore`

**Files:**

- Create: `.dockerignore`

- [ ] **Step 1: Crear el archivo**

```dockerignore
node_modules
dist
.git
.gitignore
.github
coverage
.codegraph
.playwright-mcp
.tmp
docs
e2e
Dockerfile
docker-compose.yml
nginx.conf
*.log
.env
.env.*
```

- [ ] **Step 2: Verificar**

Run: `cat .dockerignore`
Expected: contenido listado arriba.

- [ ] **Step 3: Commit**

```bash
git add .dockerignore
git commit -m "chore(docker): add dockerignore"
```

---

### Task 2: `nginx.conf`

**Files:**

- Create: `nginx.conf`

- [ ] **Step 1: Crear el archivo**

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;

  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }

  location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }

  location / {
    try_files $uri $uri/ /index.html;
  }

  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

- [ ] **Step 2: Validar sintaxis (si nginx local, opcional)**

Run: `nginx -t -c nginx.conf 2>/dev/null || echo "nginx no disponible localmente — validar en CI"`
Expected: echo (nginx no está local).

- [ ] **Step 3: Commit**

```bash
git add nginx.conf
git commit -m "chore(docker): add spa-aware nginx config"
```

---

### Task 3: `Dockerfile`

**Files:**

- Create: `Dockerfile`

- [ ] **Step 1: Crear el archivo**

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
```

- [ ] **Step 2: Verificar build local (sin Docker no posible — alternativa: confirmar que `npm run build` funciona)**

Run: `npm run build`
Expected: exit 0, `dist/` generado (assets con hash + index.html).

- [ ] **Step 3: Commit**

```bash
git add Dockerfile
git commit -m "chore(docker): add multi-stage dockerfile"
```

---

### Task 4: `docker-compose.yml`

**Files:**

- Create: `docker-compose.yml`

- [ ] **Step 1: Crear el archivo**

```yaml
services:
  tgp:
    image: ghcr.io/diogenespolanco/tgp:latest
    build: .
    ports:
      - '8080:80'
    restart: unless-stopped
```

- [ ] **Step 2: Validar sintaxis (si docker compose local, opcional)**

Run: `docker compose config 2>/dev/null || echo "docker no disponible localmente"`
Expected: echo (docker no está local).

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore(docker): add docker compose service"
```

---

### Task 5: `.github/workflows/docker-publish.yml`

**Files:**

- Create: `.github/workflows/docker-publish.yml`

- [ ] **Step 1: Crear el archivo**

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

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Login to Docker Hub
        uses: docker/login-action@v3
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
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 2: Verificar sintaxis YAML**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/docker-publish.yml','utf8');console.log('OK yaml length', s.length)"`
Expected: `OK yaml length <número>`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/docker-publish.yml
git commit -m "ci(docker): publish multi-arch image to ghcr and docker hub"
```

---

### Task 6: README — sección "Deployment on-premise"

**Files:**

- Modify: `README.md` (añadir sección antes de "Estado del Proyecto")

- [ ] **Step 1: Añadir la sección**

````markdown
## 🐳 Deployment On-Premise (Docker)

Despliega TGP en tu propio servidor (LAN o nube privada) con una sola imagen
multi-arch (amd64 + arm64) publicada en GitHub Container Registry y Docker Hub.

```bash
# Opción A: imagen publicada
docker compose up -d

# Opción B: construir localmente desde el repo
docker compose up -d --build
```
````

La app queda disponible en `http://<servidor>:8080`. Cambia el puerto en
`docker-compose.yml` si lo necesitas. Para HTTPS, apunta un reverse proxy
(Caddy, Nginx o Traefik) al puerto del contenedor.

````

- [ ] **Step 2: Verificar que el markdown no rompe el README**

Run: `node -e "const s=require('fs').readFileSync('README.md','utf8'); console.log('README ok, badges:', s.includes('MIT'))"`
Expected: `README ok, badges: true`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): add on-premise docker deployment section"
````

---

### Task 7: Validación final y push de assets

**Files:**

- Todos los creados en Tasks 1-6

- [ ] **Step 1: Correr validación completa**

```bash
npm run build
npx vitest run
npx tsc -b
npx eslint Dockerfile nginx.conf docker-compose.yml .github/workflows/docker-publish.yml README.md
```

Expected: build exit 0; tests 761+ pass; tsc clean; eslint 0 errors (solo avisa que los archivos no-ts se ignoran o se validan por extensión — los assets infra no son lint-eables por eslint JS).

- [ ] **Step 2: Verificar git status limpio y commits**

```bash
git status --short
git log --oneline -7
```

Expected: working tree limpio; 7 commits del plan + spec previo.

- [ ] **Step 3: Push a origin/master (cuando el usuario lo autorice)**

```bash
git push origin master
```

Expected: push exitoso; el workflow `Docker Publish` se dispara y construye la imagen multi-arch; el usuario debe agregar los secrets `DOCKER_HUB_USERNAME` y `DOCKER_HUB_TOKEN` en GitHub → Settings → Secrets and variables → Actions para que el login a Docker Hub funcione.

**Nota:** Si el org/repo de Docker Hub difiere de `diogenespolanco/tgp`, actualizar `docker-compose.yml` (image) y `docker-publish.yml` (images) antes del push.
