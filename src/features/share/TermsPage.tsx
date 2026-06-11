import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, AlertTriangle, Lock, Clock, Eye, Database, CheckCircle } from 'lucide-react'
import { isTermsAccepted, acceptTerms, resetTermsAcceptance } from '@/services/share/termsService'

export function TermsPage() {
  const navigate = useNavigate()
  const [accepted, setAccepted] = useState(isTermsAccepted())

  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90">
      <header className="bg-white dark:bg-neutral-80 border-b border-neutral-20 dark:border-neutral-70">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Términos y Condiciones</h1>
              <p className="text-xs text-neutral-50">Compartir Datos y Políticas de Privacidad</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-neutral-80 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Introducción */}
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 space-y-3">
          <p className="text-sm text-neutral-70 dark:text-neutral-30 leading-relaxed">
            TGP permite generar enlaces públicos para compartir información con personas dentro y fuera de la institución.
            El uso de esta funcionalidad implica la aceptación de los términos aquí descritos. Es responsabilidad del
            usuario conocer y gestionar los riesgos asociados a la compartición de datos institucionales.
          </p>
          <p className="text-sm text-neutral-70 dark:text-neutral-30 leading-relaxed">
            Estos términos aplican a todas las funcionalidades de compartir del sistema, incluyendo pero no limitado a:
            Dashboard Ejecutivo, Seguimiento Diario, Planes, Timeline Ejecutivo, Performance de Equipos,
            Miembros y Reclutamiento.
          </p>
        </div>

        {/* Responsabilidad del Usuario */}
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-20 dark:border-neutral-70 bg-danger/5">
            <AlertTriangle size={18} className="text-danger" />
            <h2 className="text-base font-bold text-neutral-90 dark:text-white">Responsabilidad del Usuario</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-danger mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">Contenido sensible</p>
                <p className="text-xs text-neutral-60 mt-0.5">
                  El usuario es el único responsable de evaluar qué información comparte. TGP no filtra, revisa ni
                  modifica los datos antes de generar un enlace público.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">Información clasificada</p>
                <p className="text-xs text-neutral-60 mt-0.5">
                  No compartas información que la institución considere confidencial, clasificada, sujeta a regulación
                  (GDPR, LGPD, Ley General de Protección de Datos local) o que pudiera representar un riesgo si es divulgada.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">Datos personales</p>
                <p className="text-xs text-neutral-60 mt-0.5">
                  Evita compartir información personal identificable (nombres completos, correos, identificaciones
                  internas) a menos que sea estrictamente necesario y cuentes con la autorización correspondiente.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-danger mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">Datos estratégicos</p>
                <p className="text-xs text-neutral-60 mt-0.5">
                  Planes, OKRs, métricas de equipos, vulnerabilidades y hallazgos de auditoría pueden revelar
                  estrategia institucional, brechas de seguridad o debilidades operativas. Evalúa el impacto antes
                  de compartir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medidas de Protección */}
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-20 dark:border-neutral-70 bg-success/5">
            <Lock size={18} className="text-success" />
            <h2 className="text-base font-bold text-neutral-90 dark:text-white">Medidas de Protección Incorporadas</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Lock size={16} className="text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">Cifrado opcional</p>
                <p className="text-xs text-neutral-60 mt-0.5">
                  Al compartir, puedes agregar una contraseña que cifra los datos con AES-GCM 256 antes de
                  almacenarlos. Quien reciba el enlace necesitará la misma contraseña para visualizar el contenido.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">Caducidad automática</p>
                <p className="text-xs text-neutral-60 mt-0.5">
                  Todos los enlaces compartidos expiran a las 48 horas. Después de ese período, el enlace deja de
                  funcionar y los datos no son accesibles.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Database size={16} className="text-info mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">Limpieza programada</p>
                <p className="text-xs text-neutral-60 mt-0.5">
                  El programador automático elimina de Azure Blob Storage los archivos de enlaces compartidos con
                  más de 48 horas.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Eye size={16} className="text-info mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">Solo lectura</p>
                <p className="text-xs text-neutral-60 mt-0.5">
                  Las vistas públicas son exclusivamente de solo lectura. No es posible editar, crear o eliminar
                  datos desde un enlace público.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-90 dark:text-white">Autenticación requerida</p>
                <p className="text-xs text-neutral-60 mt-0.5">
                  Para generar un enlace público, el usuario debe haber iniciado sesión en TGP. Las vistas públicas
                  no requieren autenticación (son accesibles por diseño).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buenas Prácticas */}
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-20 dark:border-neutral-70 bg-primary/5">
            <CheckCircle size={18} className="text-primary" />
            <h2 className="text-base font-bold text-neutral-90 dark:text-white">Buenas Prácticas</h2>
          </div>
          <div className="p-6 space-y-3">
            {[
              { label: 'Usa contraseña', desc: 'para datos que contengan información institucional sensible, incluso si no es clasificada.' },
              { label: 'Comparte el mínimo necesario', desc: 'selecciona solo la vista que contiene la información requerida por el receptor.' },
              { label: 'Comunica la contraseña por un canal diferente', desc: 'ej. enlace por email, contraseña por mensaje interno o llamada.' },
              { label: 'Revoca enlaces', desc: 'desde la sección de administración si sospechas que un enlace fue expuesto antes de su vencimiento.' },
              { label: 'Notifica al equipo de seguridad', desc: 'si se comparten datos clasificados por error.' },
              { label: 'No compartas pantallas sin revisar', desc: 'los botones PDF/Imagen capturan todo el contenido visible de la página. Revisa que no incluyan datos no destinados al receptor.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle size={14} className="text-primary mt-1 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-neutral-90 dark:text-white">{item.label}</span>
                  <span className="text-sm text-neutral-60 dark:text-neutral-40"> — {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exención de Responsabilidad */}
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-danger/30 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-danger/20 bg-danger/5">
            <AlertTriangle size={18} className="text-danger" />
            <h2 className="text-base font-bold text-neutral-90 dark:text-white">Exención de Responsabilidad</h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-sm text-neutral-70 dark:text-neutral-30 leading-relaxed">
              TGP es una herramienta de gestión y gobierno tecnológico. El usuario asume toda responsabilidad por:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-neutral-70 dark:text-neutral-30">
              <li>La información que decide compartir mediante enlaces públicos</li>
              <li>El cumplimiento de las políticas institucionales de protección de datos</li>
              <li>Las consecuencias de compartir información sensible, clasificada o regulada</li>
              <li>La custodia y transmisión segura de las contraseñas de cifrado a los receptores</li>
            </ul>
            <p className="text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed mt-4 italic">
              El equipo de TGP no será responsable por daños directos o indirectos derivados del uso indebido de la
              funcionalidad de compartir, incluyendo pero no limitado a filtración de datos, incumplimiento normativo
              o exposición de información estratégica.
            </p>
          </div>
        </div>

        {/* Aceptación */}
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                const checked = e.target.checked
                setAccepted(checked)
                if (checked) acceptTerms()
                else resetTermsAcceptance()
              }}
              className="mt-0.5 w-4 h-4 rounded border-neutral-30 text-primary focus:ring-primary/30"
            />
            <div>
              <p className="text-sm font-medium text-neutral-90 dark:text-white">
                He leído y acepto los términos y condiciones de uso de la funcionalidad de compartir datos
              </p>
              <p className="text-xs text-neutral-50 mt-0.5">
                Al marcar esta casilla, reconoces que entiendes tu responsabilidad al compartir información
                institucional a través de enlaces públicos y aceptas las políticas aquí descritas.
              </p>
            </div>
          </label>
        </div>

        <div className="text-center text-xs text-neutral-40 py-4">
          TGP — Technology Governance Platform &copy; 2026 &middot; Versión 1.0
        </div>
      </main>
    </div>
  )
}
