import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, FileText, Mail, ShieldAlert } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Badge from '@/components/Badge';
import { legalMetadata } from '@/components/legal/LegalDocument';
import { BRAND, CONTACT_EMAIL, LEGAL_PAGES_REACHABLE } from '@/lib/site';
import { LEGAL_DOCS_LIST, STATUS_LABELS, formatLegalDate } from '@/lib/legalDocs';

export const metadata = legalMetadata({
  title: 'Centro legal',
  description: `Términos, políticas y condiciones de ${BRAND}: todo lo que regula el uso de la plataforma en un solo lugar.`,
  path: '/legal',
});

// ─── CENTRO LEGAL ────────────────────────────────────────────────────────────
// Índice de todos los documentos legales. Sale entero del registro
// (lib/legalDocs.js): no hay títulos, versiones ni fechas escritos acá.
// Misma compuerta que los documentos que lista.

export default function LegalHubPage() {
  if (!LEGAL_PAGES_REACHABLE) notFound();

  const anyPreliminary = LEGAL_DOCS_LIST.some((d) => d.status !== 'published');

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <p className="text-sm font-semibold text-primary mb-2">Centro legal</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Reglas claras para clientes y proveedores
          </h1>
          <p className="text-gray-600 leading-relaxed max-w-2xl">
            Acá están todos los documentos que regulan el uso de {BRAND}: cómo se
            reserva y se paga, qué pasa si alguien cancela, qué condiciones aceptan los
            proveedores y cómo cuidamos tus datos.
          </p>
        </header>

        {anyPreliminary && (
          <div role="note" className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AppIcon icon={ShieldAlert} size={20} className="text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-amber-950/90 leading-relaxed">
                <strong className="text-amber-950">Versiones preliminares.</strong> Estos
                documentos están en revisión legal y todavía no son las versiones vigentes.
                Cuando se publiquen las definitivas, cada uno va a indicar su fecha de
                vigencia y te vamos a pedir que lo aceptes.
              </p>
            </div>
          </div>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {LEGAL_DOCS_LIST.map((d) => (
            <li key={d.key}>
              <Link
                href={d.href}
                className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 hover:border-primary/40 hover:shadow-md transition focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <AppIcon icon={FileText} size={20} aria-hidden="true" />
                  </span>
                  <Badge variant={d.status === 'published' ? 'success' : 'warning'} size="sm">
                    {STATUS_LABELS[d.status]}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                  {d.title}
                </h2>
                <p className="text-xs font-medium text-gray-500 mb-3">Para: {d.audience}</p>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{d.summary}</p>
                <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
                  <span>Versión {d.version} · {formatLegalDate(d.updatedOn)}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    Leer
                    <AppIcon icon={ArrowRight} size={14} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <section aria-labelledby="consultas" className="mt-10 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 id="consultas" className="text-base font-bold text-gray-900 mb-2">¿Tenés una consulta?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Escribinos y te respondemos por escrito.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <AppIcon icon={Mail} size={16} aria-hidden="true" />
            {CONTACT_EMAIL}
          </a>
        </section>
      </div>
    </div>
  );
}
