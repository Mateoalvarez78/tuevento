import Link from 'next/link';
import { FileText, ListOrdered, ShieldAlert } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Badge from '@/components/Badge';
import { LEGAL_PROSE_CLASS } from '@/components/legal/LegalDocument';
import { BRAND, SHOW_INTERNAL_LEGAL_NOTES } from '@/lib/site';
import { LEGAL_SPACES, STATUS_LABELS, effectiveLabel, formatLegalDate, relatedDocs } from '@/lib/legalDocs';

/**
 * Layout de un documento legal con índice de navegación.
 *
 * Recibe la entrada del registro (lib/legalDocs.js) y de ahí saca versión,
 * fechas, estado y documentos relacionados: el encabezado de cada página no
 * puede quedar desincronizado del Centro legal.
 *
 * `space` ('cliente' | 'proveedor') decide a qué centro legal vuelve el enlace
 * superior y qué documentos se ofrecen como relacionados: SOLO los de la misma
 * área. Un cliente nunca ve enlazadas las condiciones de proveedores ni al revés.
 *
 * Aviso de estado:
 *  · Versión preliminar → aviso visible: en revisión legal, sin valor
 *    contractual, no se aplica a reservas. Es lo que ve el público.
 *  · `internalNotes` (qué falta decidir) solo se muestran en dev/test
 *    (SHOW_INTERNAL_LEGAL_NOTES). En producción no se publica la lista de
 *    pendientes del equipo.
 *
 * Accesibilidad:
 *  · El índice es un <nav> con nombre accesible; en móvil va dentro de un
 *    <details> nativo (teclado y lector de pantalla sin JS).
 *  · Los <h2> llevan scroll-margin para que el ancla no quede bajo el navbar.
 *  · El aviso es role="note" y dice su estado en texto, no solo con color.
 */
export default function LegalDraftLayout({ doc, space = 'cliente', intro, sections, internalNotes = [], children }) {
  const isPreliminary = doc.status !== 'published';
  const { hub, hubTitle } = LEGAL_SPACES[space];
  const related = relatedDocs(doc.key, space);

  const tocItems = (
    <ol className="space-y-1 text-sm">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="flex gap-2 rounded-lg px-2 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="tabular-nums text-gray-400 w-5 shrink-0 text-right">{i + 1}.</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        {/* Índice — desktop: barra lateral fija */}
        <nav aria-label="Índice del documento" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            <Link
              href={hub}
              className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary mb-5 px-2"
            >
              ← {hubTitle}
            </Link>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 px-2">
              <AppIcon icon={ListOrdered} size={14} aria-hidden="true" />
              Contenido
            </p>
            {tocItems}
          </div>
        </nav>

        <article className="max-w-3xl min-w-0">
          <header className="mb-6">
            <Link href={hub} className="lg:hidden inline-block text-xs font-semibold text-gray-500 hover:text-primary mb-3">
              ← {hubTitle}
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={isPreliminary ? 'warning' : 'success'} size="sm">
                {STATUS_LABELS[doc.status]}
              </Badge>
              <span className="text-xs text-gray-500">Para: {doc.audience}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">{doc.title}</h1>
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
              <div className="flex gap-1.5">
                <dt>Versión:</dt>
                <dd className="font-medium text-gray-700">{doc.version}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Actualizada:</dt>
                <dd className="font-medium text-gray-700">{formatLegalDate(doc.updatedOn)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Vigencia:</dt>
                <dd className="font-medium text-gray-700">{effectiveLabel(doc)}</dd>
              </div>
            </dl>
          </header>

          {isPreliminary && (
            <div role="note" className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <AppIcon icon={ShieldAlert} size={20} className="text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0 text-sm text-amber-950/90 leading-relaxed">
                  <p className="font-semibold text-amber-950 mb-1">Versión preliminar en revisión legal</p>
                  <p>
                    Publicamos este documento para que conozcas cómo va a funcionar {BRAND}.
                    Todavía está en revisión jurídica: <strong>no es la versión vigente</strong>, no
                    tiene valor contractual y no se aplica a ninguna reserva. Cuando se publique la
                    versión definitiva vas a ver acá su fecha de vigencia y te vamos a pedir que la
                    aceptes.
                  </p>
                  {SHOW_INTERNAL_LEGAL_NOTES && internalNotes.length > 0 && (
                    <div className="mt-3 border-t border-amber-200 pt-3">
                      <p className="text-xs font-semibold text-amber-900 mb-1.5">
                        Notas internas (solo visibles en desarrollo) — falta para la versión definitiva:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs">
                        {internalNotes.map((r) => <li key={r}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Índice — móvil y tablet: plegable nativo */}
          <details className="lg:hidden mb-8 rounded-2xl border border-gray-200 bg-white">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-800">
              Índice ({sections.length} secciones)
            </summary>
            <nav aria-label="Índice del documento (móvil)" className="px-2 pb-3">
              {tocItems}
            </nav>
          </details>

          {intro && <p className="text-gray-700 leading-relaxed mb-8 text-[0.95rem]">{intro}</p>}

          <div className={`${LEGAL_PROSE_CLASS} [&_h2]:scroll-mt-24 [&_table]:w-full [&_table]:text-sm`}>
            {children}
          </div>

          {/* Documentos relacionados — salen del registro */}
          {related.length > 0 && (
          <aside aria-labelledby="documentos-relacionados" className="mt-12 border-t border-gray-200 pt-8">
            <h2 id="documentos-relacionados" className="text-base font-bold text-gray-900 mb-4">
              Documentos relacionados
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {related.map((d) => (
                <li key={d.key}>
                  <Link
                    href={d.href}
                    className="flex h-full items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-3.5 text-sm hover:border-primary/40 hover:shadow-sm transition"
                  >
                    <AppIcon icon={FileText} size={16} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-gray-900">{d.title}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">Para: {d.audience}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
          )}
        </article>
      </div>
    </div>
  );
}
