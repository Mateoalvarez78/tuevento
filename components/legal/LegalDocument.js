import { AlertTriangle } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { PUBLIC_LEGAL_READY, SHOW_INTERNAL_LEGAL_NOTES, legalBlockers } from '@/lib/site';

/**
 * Envoltorio común de /terminos y /privacidad: encabezado, aviso de borrador y
 * tipografía del cuerpo. Un solo lugar para el tratamiento fail-closed, así no
 * puede pasar que una de las dos páginas se publique sin el aviso.
 *
 * ESTRATEGIA DE BORRADOR (lo que permite probarlas sin publicarlas como
 * definitivas):
 *   · Mientras `PUBLIC_LEGAL_READY` sea false, se renderiza un aviso visible e
 *     imposible de confundir arriba del documento.
 *   · Cada página agrega `robots: { index: false, follow: false }` a su metadata
 *     en ese estado, así que no se indexa.
 *   · El sitemap las omite (app/sitemap.js).
 *   · El build de producción imprime el bloqueo en el log (lib/site.js).
 * El valor por defecto es el estado bloqueado: para publicarlas como vigentes
 * hay que completar los datos legales Y marcar la revisión jurídica a mano.
 */
/**
 * Tipografía del cuerpo de los documentos legales. Exportada para que el
 * borrador de condiciones para proveedores (LegalDraftLayout) use exactamente
 * la misma, sin copiar la lista de clases. Sin plugin de prose (el proyecto no
 * lo tiene): se estilan los elementos con selectores de hijos de Tailwind.
 */
export const LEGAL_PROSE_CLASS = `
  text-[0.95rem] leading-relaxed text-gray-700
  [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-9 [&_h2]:mb-3
  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2
  [&_p]:mb-3.5
  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3.5 [&_ul]:space-y-1.5
  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3.5 [&_ol]:space-y-1.5
  [&_strong]:text-gray-900 [&_strong]:font-semibold
  [&_a]:text-primary [&_a]:underline
`;

export default function LegalDocument({ title, updatedNote, intro, children }) {
  const blockers = PUBLIC_LEGAL_READY ? [] : legalBlockers();

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">{title}</h1>
          {updatedNote && <p className="text-sm text-gray-500">{updatedNote}</p>}
        </header>

        {blockers.length > 0 && (
          <div
            role="note"
            className="mb-8 bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <AppIcon
                icon={AlertTriangle}
                size={20}
                className="text-amber-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-bold text-amber-900 mb-1.5 uppercase tracking-wide text-sm">
                  Documento en borrador — sin valor contractual
                </p>
                <p className="text-sm text-amber-900/90 leading-relaxed mb-3">
                  Esta versión está publicada para revisión interna y todavía{' '}
                  <strong>no es la versión vigente</strong>. No la tomes como las
                  condiciones aplicables a una contratación.
                </p>
                {/* Los bloqueos son notas internas: solo en dev/test. */}
                {SHOW_INTERNAL_LEGAL_NOTES && (
                  <>
                    <p className="text-xs font-semibold text-amber-900 mb-1.5">Falta para poder publicarla:</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900/90">
                      {blockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {intro && (
          <p className="text-gray-700 leading-relaxed mb-8 text-[0.95rem]">{intro}</p>
        )}

        {/* Tipografía del cuerpo: ver LEGAL_PROSE_CLASS arriba. */}
        <div className={LEGAL_PROSE_CLASS}>
          {children}
        </div>
      </article>
    </div>
  );
}

/**
 * Metadata compartida para las páginas legales. Mientras el documento sea
 * borrador, `robots: noindex, nofollow` — y por eso esta función existe: que las
 * dos páginas deriven el mismo comportamiento del mismo lugar, en vez de
 * repetirlo y que una se desincronice.
 */
export function legalMetadata({ title, description, path }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(PUBLIC_LEGAL_READY
      ? {}
      : { robots: { index: false, follow: false } }),
  };
}
