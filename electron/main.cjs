/* ───────────────────────────────────────────────
 * Electron Main Process
 * ───────────────────────────────────────────────
 * - Inicia el proxy WebSocket → PostgreSQL
 * - Sirve archivos estáticos (producción) o proxy al dev server
 * - Abre la ventana de TGP
 * ─────────────────────────────────────────────── */

const { app, BrowserWindow } = require('electron')
const { createServer } = require('node:http')
const { readFileSync, existsSync, statSync } = require('node:fs')
const { join, extname, dirname } = require('node:path')
const { WebSocketServer } = require('ws')
const { Pool } = require('pg')
const { fileURLToPath } = require('node:url')

// ─── Rutas ─────────────────────────────────────
const DIST_DIR = join(__dirname, '..', 'dist')
const PRELOAD_PATH = join(__dirname, 'preload.cjs')
const isDev = !!process.env.VITE_DEV_SERVER_URL
const DEV_SERVER = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
const PROXY_PORT = parseInt(process.env.PGP_PROXY_PORT || '9876', 10)
const STATIC_PORT = 8765

// ─── Proxy WebSocket → PostgreSQL ──────────────
const pools = new Map()

function getPool(clientId, config) {
  const key = `${clientId}-${config.host}-${config.port}-${config.database}`
  if (pools.has(key)) return pools.get(key)
  const pool = new Pool({
    host: config.host,
    port: config.port || 5432,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
  })
  pools.set(key, pool)
  return pool
}

function closePool(clientId) {
  for (const [key, pool] of pools) {
    if (key.startsWith(clientId)) {
      pool.end().catch(() => {})
      pools.delete(key)
    }
  }
}

let wss = null

function startProxy() {
  wss = new WebSocketServer({ port: PROXY_PORT })

  wss.on('connection', (ws, req) => {
    const clientId = `${req.socket.remoteAddress}:${req.socket.remotePort}`
    let connected = false
    let pool = null

    ws.on('message', async (raw) => {
      let msg
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'JSON inválido' }))
        return
      }

      if (msg.type === 'connect') {
        const cfg = msg.config
        if (!cfg || !cfg.host || !cfg.database || !cfg.user) {
          ws.send(JSON.stringify({ type: 'error', message: 'Config incompleta' }))
          return
        }
        try {
          pool = getPool(clientId, cfg)
          const client = await pool.connect()
          await client.query('SELECT 1')
          client.release()
          connected = true
          ws.send(JSON.stringify({ type: 'connected' }))
          console.log(`[proxy] Conectado a ${cfg.host}:${cfg.port}/${cfg.database}`)
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', message: `Conexión fallida: ${err.message}` }))
        }
        return
      }

      if (!connected) {
        ws.send(JSON.stringify({ type: 'error', message: 'No autenticado' }))
        return
      }

      if (msg.type === 'request') {
        const { id, sql, params } = msg
        if (!id || !sql) {
          ws.send(JSON.stringify({ type: 'error', id, message: 'request requiere id y sql' }))
          return
        }
        try {
          const result = await pool.query(sql, params || [])
          ws.send(JSON.stringify({
            type: 'response', id,
            rows: result.rows,
            fields: result.fields ? result.fields.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })) : [],
            rowCount: result.rowCount,
          }))
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', id, message: err.message }))
        }
        return
      }

      ws.send(JSON.stringify({ type: 'error', message: `Tipo desconocido: ${msg.type}` }))
    })

    ws.on('close', () => closePool(clientId))
    ws.on('error', () => closePool(clientId))
  })

  console.log(`[proxy] WebSocket server en puerto ${PROXY_PORT}`)
}

function stopProxy() {
  if (wss) {
    wss.close()
    wss = null
  }
  for (const [key, pool] of pools) {
    pool.end().catch(() => {})
  }
  pools.clear()
}

// ─── Servidor HTTP para archivos estáticos ─────
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

function startStaticServer() {
  const server = createServer((req, res) => {
    let filePath = join(DIST_DIR, req.url === '/' ? 'index.html' : req.url)

    if (!existsSync(filePath)) {
      // SPA fallback — servir index.html para cualquier ruta
      filePath = join(DIST_DIR, 'index.html')
    }

    try {
      const ext = extname(filePath)
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'
      const content = readFileSync(filePath)
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  server.listen(STATIC_PORT, '127.0.0.1', () => {
    console.log(`[static] Sirviendo dist/ en http://127.0.0.1:${STATIC_PORT}`)
  })

  return server
}

// ─── Ventana ───────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'TGP - Technology Governance Platform',
    icon: join(DIST_DIR, 'favicon.svg'),
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = isDev ? DEV_SERVER : `http://127.0.0.1:${STATIC_PORT}`
  win.loadURL(url)

  if (isDev) {
    win.webContents.openDevTools({ mode: 'bottom' })
  }

  return win
}

// ─── App lifecycle ─────────────────────────────
let staticServer = null

app.whenReady().then(() => {
  if (!isDev && existsSync(DIST_DIR)) {
    staticServer = startStaticServer()
  }
  startProxy()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopProxy()
  if (staticServer) staticServer.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopProxy()
  if (staticServer) staticServer.close()
})
