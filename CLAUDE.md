---

# Memento MCP (`mcp__memento__*`)

**Load tools:** `ToolSearch query="+memento" max_results=20` — then READ the tool descriptions.

**Memory discipline — notes are instructions, not logs.**
Write: "Skip X until condition Y" — not "checked X, it was quiet."
Every memory must answer: could a future agent with zero context read this and know exactly what to do?

| Tool | What it does |
|------|-------------|
| `memento_health` | System health — item/memory/skip counts, last updated |
| `memento_remember` | Store a memory (fact/decision/observation/instruction) with tags + expiration |
| `memento_recall` | Search memories by keyword/tag/type — ranked by relevance |
| `memento_consolidate` | Merge 3+ overlapping memories into one sharper representation |
| `memento_skip_add` / `memento_skip_check` | Anti-memory: things to NOT investigate right now (with expiration) |
| `memento_item_create` | Create structured item (active_work/standing_decision/skip_list/waiting_for/session_note) |
| `memento_item_update` | Update item fields (status, next_action, priority, category, tags) |
| `memento_item_delete` | Delete item (prefer archiving via status=archived) |
| `memento_item_list` | List items with filters (category, status, query) |
| `memento_identity` | Read identity crystal |
| `memento_identity_update` | Write/replace identity crystal |

# Configuración del Proyecto — TGP

## Preferencias del Usuario

### Autorizaciones y Ejecución
- **Siempre pedir aprobación** antes de ejecutar cualquier comando (bash, write, edit, push, commit, deploy)
- No ejecutar `git commit`, `git push`, `git rebase`, `git merge` ni ningún comando destructivo sin confirmación explícita
- Mostrar plan de acción antes de implementar cambios multi-archivo

### Commits y Git
- Mensajes de commit en **español**
- Formato: `tipo: descripción breve` (ej: `feat:`, `fix:`, `refactor:`, `docs:`)
- Commits atómicos: un cambio lógico por commit
- No hacer amend ni force push sin preguntar
- No commitear sin que el usuario lo solicite explícitamente

### UI/UX
- UI en **español** (etiquetas, botones, mensajes)
- Diseño boarding-pass para tarjetas de autenticación y modales principales
- Modo oscuro con grises neutros, sin tonos azules
- Notificaciones toast en esquina inferior derecha

### Tecnologías
- React 19 + TypeScript 5 + Vite 6 + SWC
- Tailwind CSS 4
- Dexie.js (IndexedDB) — 20+ tablas
- No backend server, todo cliente-side SPA
- Azure Blob Storage para sharing de datos
- RichTextEditor con TipTap para contenido HTML
