import Link from 'next/link';
import { ArrowRight, FileText, Mail, ShieldAlert } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Badge from '@/components/Badge';
import { BRAND, CONTACT_EMAIL } from '@/lib/site';
import { STATUS_LABELS, formatLegalDate, spaceDocs } from '@/lib/legalDocs';

/**
 * Centro legal de un área. Lo usan /legal (clientes) y /provider/legal
 * (proveedores). Sale entero del registro (lib/legalDocs.js): no hay títulos,
 * versiones ni fechas escritos acá, y cada área lista SOLO sus documentos.
 */
const COPY = {
  cliente: {
    eyebrow: 'Centro legal',
    title: 'Reglas claras para reservar con confianza',
    intro: `Acá están los documentos que regulan el uso de ${BRAND} como cliente: cómo se reserva y se paga, qué pasa si alguien cancela y cómo cuidamos tus datos.`,
  },
  proveedor: {
    eyebrow: 'Centro legal para proveedores',
    title: `Cómo trabajás con ${BRAND}`,
    intro: `Acá están los documentos que regulan tu relación con ${BRAND} como proveedor: comisión, cobros, obligaciones en cada reserva, cancelaciones y cómo cuidamos tus datos.`,
  },
};

export default function LegalHub({ space }) {
  const docs = spaceDocs(space);
  const copy = COPY[space];
  const anyPreliminary = docs.some((d) => d.status !== 'published');

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <p className="text-sm font-semibold text-primary mb-2">{copy.eyebrow}</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{copy.title}</h1>
          <p className="text-gray-600 leading-relaxed max-w-2xl">{copy.intro}</p>
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
          {docs.map((d) => (
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
                <p className="text-sm text-gray-600 leading-relaxed flex-1 mt-2">{d.summary}</p>
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
          <p className="text-sm text-gray-600 leading-relaxed">Escribinos y te respondemos por escrito.</p>
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
