export function InvalidLinkPage() {
  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{
        background: 'radial-gradient(ellipse 60% 50% at 20% 30%, #0052CC 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 70%, #C85A48 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 50%, #36B37E 0%, transparent 50%)'
      }} />
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px'
      }} />

      <div className="w-full max-w-3xl relative">
        <div className="bg-white/95 dark:bg-neutral-80/95 backdrop-blur-xl rounded-3xl border border-neutral-20/80 dark:border-neutral-70/80 shadow-2xl shadow-neutral-30/30 dark:shadow-black/30 overflow-hidden">
          <div className="flex flex-col sm:flex-row min-h-[360px]">
            {/* Left: gradient branding */}
            <div className="sm:w-[42%] bg-gradient-to-br from-primary via-primary-dark to-[#03245E] p-8 sm:p-10 text-white flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{
                background: 'radial-gradient(circle at 30% 40%, white 0%, transparent 60%), radial-gradient(circle at 70% 80%, #4C9AFF 0%, transparent 50%)'
              }} />
              <div className="relative flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                  <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight">TGP</p>
                  <p className="text-[11px] font-medium opacity-60 tracking-wide">Technology Governance Platform</p>
                </div>
              </div>
              <div className="relative flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-medium uppercase tracking-widest opacity-60">Error de acceso</span>
                </div>
                <h2 className="text-2xl font-bold leading-tight mb-3">Enlace no<br />disponible</h2>
                <p className="text-sm leading-relaxed opacity-80">
                  Este enlace ha expirado, fue revocado o no es válido
                  para el recurso solicitado.
                </p>
              </div>
              <div className="relative mt-6 pt-4 border-t border-white/15">
                <p className="text-xs opacity-60 leading-relaxed">
                  TGP · Tecnología, gobierno y decisiones en un solo lugar
                </p>
              </div>
            </div>

            {/* Divider: perforated line */}
            <div className="hidden sm:block w-5 bg-white/95 dark:bg-neutral-80/95 relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-neutral-20 dark:bg-neutral-70" />
                ))}
              </div>
            </div>

            {/* Right: information */}
            <div className="sm:w-[58%] p-8 sm:p-10 bg-white/95 dark:bg-neutral-80/95 flex flex-col justify-center">
              <div className="max-w-xs mx-auto w-full space-y-6 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto sm:mx-0">
                  <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-90 dark:text-white mb-2">Enlace no válido</h3>
                  <p className="text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed">
                    Este enlace ha expirado, ya fue utilizado o no es válido.
                  </p>
                </div>
                <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-4 text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed">
                  <p className="font-medium text-neutral-90 dark:text-white mb-1">¿Qué puedo hacer?</p>
                  <p>Solicita un nuevo enlace al administrador de TGP. Los enlaces compartidos expiran después de 48 horas por seguridad.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
