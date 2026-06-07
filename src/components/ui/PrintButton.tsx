import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-80 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors shadow-sm"
        title="Descargar PDF"
      >
        <Printer size={16} />
        Descargar PDF
      </button>

      <div
        className="print-watermark"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'rgba(0, 82, 204, 0.08)',
          zIndex: 9999,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          fontFamily: 'Arial, sans-serif',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          display: 'none',
        }}
      >
        Generado por TGP — Diógenes Polanco
      </div>

      <style>{`
        @media print {
          nav, header, .no-print { display: none !important; }
          body { background: white !important; }
          .print-watermark { display: block !important; }
          @page { margin: 15mm; }
        }
      `}</style>
    </>
  )
}
