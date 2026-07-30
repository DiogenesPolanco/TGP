export interface TroubleEntry {
  question: string
  symptoms: string[]
  diagnosis?: string[]
  causas?: string[]
  rules?: string[]
  rulesLabel?: string
  solution: string[]
  debug?: string
  last?: boolean
}

export const troubleshootingData: TroubleEntry[] = [
  {
    question: 'La página se queda en blanco o muestra error en blanco',
    symptoms: [
      'Pantalla completamente blanca al cargar',
      'Error en consola del navegador (F12 → Console)',
      'No aparece ni el header ni el loader inicial',
    ],
    diagnosis: [
      'Abrir DevTools (F12) → Console. Buscar errores en rojo.',
      'Identificar el tipo: ¿error de módulo, de IndexedDB, o JS genérico?',
      'Verificar que JavaScript no está bloqueado (extensiones, NoScript).',
      'Revisar Application → Storage → ver si IndexedDB está accesible.',
    ],
    solution: [
      'Desactivar bloqueadores (uBlock, Privacy Badger) para el dominio TGP.',
      'Limpiar cache: DevTools → Network → marcar "Disable cache" + recargar.',
      'Si es error de IndexedDB: Application → Storage → Clear site data.',
      'Recargar la página. Si persiste, probar en ventana de incógnito.',
      'Último recurso: chrome://settings → Privacidad → Borrar datos de navegación → "Cookies y otros datos" + "Imágenes y archivos cache".',
    ],
  },
  {
    question: 'El THI no muestra datos o muestra 0',
    symptoms: [
      'Dashboard muestra "0" en todas las dimensiones del THI',
      'Gráficos de radar y barras vacíos',
      'El score general no aparece o es "—"',
    ],
    diagnosis: [
      'Catálogo → Aplicaciones: ¿hay al menos 1 aplicación registrada?',
      'Seguridad → Vulnerabilidades: ¿hay datos cargados? (afecta dimensión Seguridad)',
      'Obsolescencia: ¿hay tecnologías con fechas de fin de soporte?',
      '¿Usaste datos demo? Si sí, el THI debería mostrar valores inmediatamente.',
    ],
    solution: [
      'Registrar al menos 1 aplicación en Catálogo → Aplicaciones → Nueva aplicación.',
      'Si no hay datos de seguridad, cargar dataset demo desde Administración.',
      'Verificar que cada aplicación tenga tecnologías vinculadas (afecta dimensión Obsolescencia).',
      'Forzar recálculo: editar cualquier campo de una aplicación y guardar.',
      'Si persiste en 0, abrir DevTools → Console y ejecutar el debug.',
    ],
    debug: `await db.applications.count()\nawait db.vulnerabilities.count()\nawait db.applications.limit(1).first()`,
  },
  {
    question: 'Error de autenticación: el código OTP no funciona',
    symptoms: [
      'El código de 6 dígitos siempre da "Código inválido"',
      'La app de autenticación no genera códigos',
      'La sesión expiró y el QR actual no funciona',
    ],
    diagnosis: [
      '¿El reloj del dispositivo está sincronizado? TOTP usa hora UNIX exacta (±30s).',
      '¿El código expiró mientras lo escribías? La ventana es de 30 segundos.',
      '¿Escaneaste el QR correcto? Si hay múltiples intentos, usar el último QR generado.',
    ],
    solution: [
      'Sincronizar reloj: activar "Ajustar hora automáticamente" en el dispositivo.',
      'Esperar a que el contador del código llegue a 0 y probar con el nuevo.',
      'Borrar sessionStorage: F12 → Application → Session Storage → Clear.',
      'Recargar la página — el onboarding generará una nueva sesión con nuevo QR.',
      'Último recurso: Clear site data (Application → Storage) y reiniciar onboarding completo.',
    ],
  },
  {
    question: 'Error de build: npm run build falla',
    symptoms: [
      'npm run build termina con exit code ≠ 0',
      'Mensajes: "Module not found", "TypeScript error", "SWC panic"',
      'npm run dev funciona pero build no',
    ],
    diagnosis: [
      'node -v → debe ser ≥ 18. Si no, actualizar Node.js.',
      'npm -v → debe ser ≥ 9.',
      'npm run dev → ¿el servidor de desarrollo arranca? Si no, el error es de dependencias.',
      'npx tsc --noEmit → muestra errores de TypeScript específicos.',
    ],
    solution: [
      '"Module not found" → npm install o npm audit fix.',
      '"TypeScript error" → npx tsc -b para ver el error exacto y corregir el archivo.',
      '"Out of memory" → NODE_OPTIONS="--max-old-space-size=2048" npm run build.',
      '"SWC panic" → rm -rf node_modules && npm install (reconstruir bindings nativos).',
      'Si dev funciona pero build no: suele ser tree-shaking. Revisar imports dinámicos.',
    ],
  },
  {
    question: 'Error de CORS al usar GobIA con Ollama local',
    symptoms: [
      'GobIA muestra "Error de conexión" con Ollama',
      'Consola: "Access-Control-Allow-Origin" header missing',
      'fetch a http://localhost:11434 falla silenciosamente',
    ],
    diagnosis: [
      '¿Ollama está corriendo? curl http://localhost:11434/api/tags en terminal.',
      '¿OLLAMA_ORIGINS está configurado? Sin esto, Ollama bloquea el navegador.',
      '¿Usas Docker? El contenedor necesita la variable de entorno explícitamente.',
    ],
    solution: [
      'Linux/macOS: OLLAMA_ORIGINS=* ollama serve (detener Ollama, reiniciar con la variable).',
      'Windows (CMD): set OLLAMA_ORIGINS=* && ollama serve',
      'Windows (PowerShell): $env:OLLAMA_ORIGINS="*"; ollama serve',
      'Docker: docker run -d -p 11434:11434 -e OLLAMA_ORIGINS="*" ollama/ollama',
      'Verificar: fetch("http://localhost:11434/api/tags") desde consola del navegador.',
    ],
    debug: `fetch('http://localhost:11434/api/tags').then(r => r.text()).catch(e => 'Error: ' + e.message)`,
  },
  {
    question: '[Catálogo] Error al crear o editar una aplicación',
    symptoms: [
      'Al guardar una aplicación muestra "Error de validación"',
      'La aplicación no aparece en el listado después de crearla',
      'Los cambios en una aplicación existente no se guardan',
    ],
    causas: [
      'Campos requeridos vacíos: name y businessUnit son obligatorios',
      'Nombre duplicado: existe otra app con el mismo nombre en la misma BU',
      'BusinessUnitId inválido: la BU fue eliminada después de crear la app',
    ],
    solution: [
      'Verificar que todos los campos marcados con * estén completos.',
      'Ir a Catálogo → buscar si ya existe una app con ese nombre en la misma BU.',
      'Si la BU fue eliminada: reasignar la app a otra BU desde edición.',
      'Abrir DevTools → Network → buscar el PUT/POST y ver el error exacto.',
      'Si el error persiste, recargar la página e intentar de nuevo.',
    ],
    debug: `// Buscar aplicaciones por nombre:\nawait db.applications.where('name').equals('MiApp').toArray()\n\n// Verificar BUs existentes:\nawait db.business_units.toArray()`,
  },
  {
    question: '[Catálogo] Los microservicios no heredan datos a la aplicación padre',
    symptoms: [
      'La aplicación muestra 0 vulnerabilidades aunque sus microservicios tienen',
      'Riesgos o hallazgos de microservicios no aparecen en la vista de detalle',
      'El conteo de incidentes en la app padre no coincide con la suma de MS',
    ],
    diagnosis: [
      'Verificar que los microservicios tengan el campo applicationId correcto.',
      'Consultar: await db.microservices.where({applicationId: appId}).toArray()',
      'La herencia es automática solo para vulnerabilities, risks, incidents, audit_findings.',
      'Datos como tecnologías o métricas DORA NO se heredan.',
    ],
    solution: [
      'Ir al microservicio → verificar que el campo "Aplicación padre" esté asignado.',
      'Si falta: editar el microservicio y seleccionar la aplicación correcta.',
      'Si ya está asignado pero no se refleja: forzar recarga (F5).',
      'La herencia se computa en tiempo real — si el dato está en IndexedDB, debería mostrarse.',
      'Si persiste, ejecutar el debug para verificar la relación.',
    ],
    debug: `const appId = 'ID_DE_TU_APP'\n// Ver microservicios vinculados:\nconst mss = await db.microservices.where({applicationId: appId}).toArray()\n// Ver vulnerabilidades heredadas:\nconst vulns = await db.vulnerabilities.where({applicationId: appId}).toArray()`,
  },
  {
    question: '[Seguridad] Error al registrar vulnerabilidad o CVSS inválido',
    symptoms: [
      'El campo CVSS no acepta el valor ingresado',
      'El nivel de severidad no coincide con el puntaje CVSS',
      'El SLA no se calcula correctamente',
    ],
    rules: [
      'CVSS Score: número decimal entre 0.0 y 10.0 (máximo 1 decimal)',
      'Severidad se deriva del score: 0.1-3.9=Baja, 4.0-6.9=Media, 7.0-8.9=Alta, 9.0-10.0=Crítica',
      'SLA se asigna automáticamente según severidad: P1=48h, P2=7d, P3=30d, P4=90d',
      'Los estados válidos son: abierta | en_análisis | en_remediación | verificada | cerrada',
    ],
    rulesLabel: 'Reglas de validación',
    solution: [
      'Ingresar CVSS como número con punto decimal (ej: 7.5, no 7,5).',
      'Si el SLA se ve incorrecto: verificar que createdAt tenga fecha/hora correcta.',
      'Si no puedes cambiar el estado: seguir la secuencia estricta de estados.',
      'Para reabrir una vulnerabilidad cerrada: usar "Reabrir" en el menú de acciones.',
    ],
  },
  {
    question: '[DORA] Las métricas del equipo muestran nivel incorrecto',
    symptoms: [
      'Un equipo con buen desempeño aparece como "Bajo"',
      'El nivel general no coincide con ninguna métrica individual',
      'Al registrar métricas nuevas, el nivel no se actualiza',
    ],
    diagnosis: [
      'El nivel general se calcula como el PEOR nivel entre las 4 métricas.',
      'Verificar unidad de las métricas: deployFrequency = deploys/día, leadTime = horas, etc.',
      'Si el período no está configurado, las métricas pueden no estar activas.',
    ],
    solution: [
      'Revisar cada métrica individual: si una está en "Bajo", el nivel general será Bajo.',
      'Verificar las unidades: leadTime en días (no horas), CFR en porcentaje (0-100).',
      'Asegurar que el período (Q1 2026, etc.) esté seleccionado correctamente.',
      'Si el nivel no se actualiza: recargar la página para forzar recálculo.',
      'Consultar thresholds exactos en Funcionalidades → Equipos DORA de esta documentación.',
    ],
    debug: `// Ver métricas de un equipo:\nawait db.dora_metrics.where({teamId: 'ID_DEL_EQUIPO'}).toArray()`,
  },
  {
    question: '[OKRs] El progreso no se calcula o muestra incorrecto',
    symptoms: [
      'El progreso del objetivo permanece en 0% aunque hay KRs con avance',
      'El progreso supera el 100%',
      'El estado del objetivo no cambia aunque los KRs estén completos',
    ],
    diagnosis: [
      'Cada KR necesita currentValue y targetValue — si targetValue es 0, el cálculo falla.',
      'Los pesos (weight) deben sumar 100 entre todos los KRs del objetivo.',
      'El progreso del objetivo es el promedio ponderado de los KRs.',
    ],
    solution: [
      'Verificar que cada KR tenga targetValue > 0.',
      'Revisar que la suma de pesos (weight) de todos los KRs sea exactamente 100.',
      'Si el progreso está en 0: editar cualquier KR, poner currentValue = 1, guardar, luego restaurar.',
      'Si supera 100%: el KR progress se capcea en 100, pero la suma ponderada puede exceder si hay múltiples KRs al 100%.',
      'Para cambiar el estado manualmente: usar el selector de estado en la vista del objetivo.',
    ],
    debug: `// Ver KRs de un objetivo:\nconst krs = await db.key_results.where({objectiveId: 'ID_DEL_OKR'}).toArray()\n// Verificar pesos:\nconst sumaPesos = krs.reduce((s, kr) => s + kr.weight, 0)`,
  },
  {
    question: '[Ejecución] Las fechas del Gantt no se muestran correctamente',
    symptoms: [
      'Las actividades aparecen fuera de la línea de tiempo',
      'El Gantt no renderiza ninguna barra',
      'Las fechas se ven desplazadas o incorrectas',
    ],
    diagnosis: [
      'El Gantt usa posicionamiento CSS absoluto sobre grid de días.',
      'Requiere startDate y endDate en formato ISO (YYYY-MM-DD).',
      'Si endDate < startDate, la barra no se renderiza.',
      'Fechas sin timezone se interpretan como UTC — puede haber corrimiento.',
    ],
    solution: [
      'Verificar que startDate y endDate sean fechas ISO válidas (ej: 2026-07-01).',
      'Asegurar que endDate sea >= startDate.',
      'Si el plan tiene muchas actividades (>200), el renderizado puede ser lento.',
      'Recargar la página. Si el problema persiste, el navegador puede tener CSS grid corrupto — probar en otra pestaña.',
    ],
  },
  {
    question: '[Obsolescencia] La sincronización con endoflife.date falla',
    symptoms: [
      'Al sincronizar, muestra "Error de conexión con API externa"',
      'El estado de las tecnologías no se actualiza',
      'Todas las tecnologías aparecen como "unknown"',
    ],
    causas: [
      'Sin conexión a Internet — la API requiere acceso a endoflife.date',
      'La tecnología no existe en la API: endoflife.date solo cubre tecnologías populares',
      'El nombre de la tecnología no coincide exactamente con el slug de la API',
      'Cache de 24 horas: las consultas se cachean en IndexedDB por 24h',
    ],
    solution: [
      'Verificar conexión a Internet y acceso a https://endoflife.date.',
      'En la tecnología, probar con el nombre exacto en inglés (ej: "nodejs" no "Node.js").',
      'Forzar sincronización: botón "Sincronizar ahora" en la vista de Obsolescencia.',
      'Si la API no reconoce la tecnología, asignar el estado manualmente desde edición.',
      'Para forzar recarga sin cache: DevTools → Network → marcar "Disable cache" y sincronizar.',
    ],
    debug: `// Probar API manualmente:\nawait fetch('https://endoflife.date/api/nodejs.json').then(r => r.json())\n\n// Ver cache local:\nawait db.technologies.where('name').equals('Node.js').first()`,
  },
  {
    question: '[GobIA] El asistente no encuentra datos que sí existen',
    symptoms: [
      'Preguntas como "cuántas apps hay" responden "No encontré datos"',
      'GobIA no puede listar tecnologías o equipos',
      'Las respuestas son genéricas sin datos concretos',
    ],
    diagnosis: [
      'GobIA usa tool calls que ejecutan queries contra IndexedDB — si no hay datos, devuelven vacío.',
      'Verificar: ¿los datos existen en la tabla correspondiente? (await db.applications.count())',
      'Los tools disponibles cubren: health-index, aplicaciones, tecnologías, equipo, vulnerabilidades.',
      'Preguntas sobre datos no cubiertos por los tools reciben respuesta genérica.',
    ],
    solution: [
      'Cargar datos demo desde Administración si aún no lo has hecho.',
      'Preguntar de forma específica: "Lista las aplicaciones del área financiera" en vez de "dime algo".',
      'Verificar en Ajustes → IA que el proveedor tenga tool calls habilitados.',
      'Si usas Ollama: verificar que el modelo soporte function calling (llama3 no, llama4 sí).',
      'Si todo falla: cambiar temporalmente a OpenAI gpt-4o que tiene mejor soporte de tools.',
    ],
  },
  {
    question: '[Equipamiento] Error al asignar equipo a un miembro',
    symptoms: [
      'El equipo no aparece disponible en el selector de asignación',
      'El miembro no recibe la notificación de asignación',
      'Error "El equipo ya está asignado a otro miembro"',
    ],
    rules: [
      'Un equipo físico solo puede estar asignado a UNA persona a la vez.',
      'Si el equipo está marcado como "en_reparación", no puede asignarse.',
      'El historial de asignaciones anteriores se mantiene en equipment_tickets.',
    ],
    rulesLabel: 'Reglas del dominio',
    solution: [
      'Verificar estado del equipo: si está "en_reparación" o "baja", no se puede asignar.',
      'Si ya está asignado a otra persona: desasignar primero desde la vista de detalle.',
      'El miembro debe existir en la tabla team_members — registrarlo si es nuevo.',
      'Si el equipo no aparece: filtrar por "disponible" en el listado de equipos.',
    ],
  },
  {
    question: 'La PWA no se actualiza: sigo viendo la versión anterior',
    symptoms: [
      'Después de un despliegue, sigues viendo la interfaz anterior',
      'El Service Worker no descarga la nueva versión',
      'El mensaje "Nueva versión disponible" no aparece nunca',
    ],
    diagnosis: [
      'Abrir DevTools → Application → Service Workers → ¿está registrado y activo?',
      'Verificar la versión en el footer de TGP vs la versión desplegada.',
      '¿Hay múltiples pestañas de TGP abiertas? El SW espera que todas se cierren.',
    ],
    solution: [
      'Abrir DevTools → Application → Service Workers → marcar "Update on reload".',
      'Recargar la página (F5) — el SW debería actualizarse.',
      'Si no funciona: cerrar TODAS las pestañas de TGP y abrir una nueva.',
      'Si sigue: chrome://serviceworker-internals → Find TGP → Unregister.',
      'Forzar recarga completa: Ctrl+F5 (ignora cache del navegador).',
    ],
  },
  {
    question: 'Rendimiento lento con muchos datos o al cargar la página',
    symptoms: [
      'La página tarda más de 5 segundos en cargar',
      'Las tablas se sienten lentas al hacer scroll o filtrar',
      'El dashboard tarda en actualizar los gráficos al cambiar filtros',
    ],
    diagnosis: [
      '¿Cuántas aplicaciones tienes? await db.applications.count() en consola.',
      '¿Cuántas vulnerabilidades? await db.vulnerabilities.count().',
      'Abrir DevTools → Performance → Start profiling, realizar la acción lenta, Stop.',
      'Identificar: ¿el cuello de botella es React (renderizado) o IndexedDB (queries)?',
    ],
    solution: [
      'Usar filtros en lugar de cargar todo: Catálogo → Filtros avanzados por BU.',
      'Reducir período del Dashboard a "Último trimestre" en vez de "Anual".',
      'Si importaste datos masivos (>10k), dividir en lotes de 1k registros.',
      'Cerrar otras pestañas de TGP (menos contención de IndexedDB).',
      'Mantener dentro de límites: <5k apps, <20k vulns, <10k actividades.',
    ],
  },
  {
    question: 'Error QuotaExceededError: IndexedDB no puede escribir más datos',
    symptoms: [
      'Error en consola: "QuotaExceededError" o "The transaction was aborted"',
      'No puedes guardar nuevas aplicaciones, vulnerabilidades, etc.',
      'La importación Excel falla sin mensaje claro',
    ],
    diagnosis: [
      'Ejecutar: await navigator.storage.estimate() → ver usage / quota.',
      'Si usage > 80% de quota, estás cerca del límite.',
      'DevTools → Application → Storage → ver desglose por sitio.',
      'Identificar qué tabla ocupa más espacio (probablemente vulnerabilities).',
    ],
    solution: [
      'Hacer backup: Administración → Exportar datos (antes de limpiar).',
      'Liberar espacio: Application → Storage → Clear site data.',
      'Restaurar desde backup solo los datos necesarios.',
      'Reducir datos futuros: eliminar aplicaciones o tecnologías no utilizadas.',
      'Solicitar almacenamiento persistente: navigator.storage.persist() en consola.',
      'Verificar: navigator.storage.persisted() → debe dar true.',
    ],
    debug: `const est = await navigator.storage.estimate()\nconsole.log('Uso:', (est.usage/1024/1024).toFixed(1), 'MB /', (est.quota/1024/1024).toFixed(1), 'MB')\n\nawait navigator.storage.persist()`,
    last: true,
  },
]
