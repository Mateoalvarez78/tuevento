import { Scale } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { SHOW_INTERNAL_LEGAL_NOTES } from '@/lib/site';

/**
 * Marca una cláusula que depende de una decisión todavía abierta.
 *
 *  · `children`: el texto PROPUESTO de la cláusula. Se publica siempre, dentro
 *    de un recuadro rotulado «En revisión legal», para que nadie lo lea como
 *    obligación firme.
 *  · `note`: qué falta decidir. Es una nota de trabajo del equipo: se muestra
 *    solo en desarrollo/test (SHOW_INTERNAL_LEGAL_NOTES), rotulada «Pendiente
 *    de validación legal». En producción no se publica.
 *
 * Si solo hay `note` y estamos en producción, no se renderiza nada: el aviso
 * de versión preliminar del encabezado ya cubre todo el documento.
 *
 * Rótulo y nota usan <div> y no <p> a propósito: dentro del cuerpo del
 * documento, LEGAL_PROSE_CLASS le da margen inferior a todo <p> descendiente.
 */
export default function PendingLegal({ note, children }) {
  const showNote = SHOW_INTERNAL_LEGAL_NOTES && note;
  if (!children && !showNote) return null;

  return (
    <aside
      aria-label="Cláusula en revisión legal"
      className="my-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5"
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-800 mb-2">
        <AppIcon icon={Scale} size={14} className="shrink-0" aria-hidden="true" />
        {children ? 'En revisión legal' : 'Pendiente de validación legal'}
      </div>
      {children && <div className="text-sm text-gray-800 leading-relaxed [&>p:last-child]:mb-0">{children}</div>}
      {showNote && (
        <div className="text-xs text-amber-900/90 leading-relaxed mt-2">
          <span className="font-semibold">Nota interna: </span>{note}
        </div>
      )}
    </aside>
  );
}
