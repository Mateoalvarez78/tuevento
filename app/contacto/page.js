import { notFound } from 'next/navigation';
import { Mail, Clock, MapPin, AlertTriangle } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import ContactForm from '@/components/contact/ContactForm';
import {
  BRAND,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_REACHABLE,
  PUBLIC_CONTACT_READY,
  legalBlockers,
  legalIdentityRows,
} from '@/lib/site';

export const metadata = {
  title: 'Contacto',
  description: `Escribinos por el formulario de contacto de ${BRAND} o al correo ${CONTACT_EMAIL}. Respondemos consultas sobre reservas, servicios y alta de proveedores.`,
  alternates: { canonical: '/contacto' },
  // Mientras el formulario no esté habilitado públicamente, la página tampoco
  // debe indexarse: en producción no existe, y en desarrollo es un borrador.
  ...(PUBLIC_CONTACT_READY ? {} : { robots: { index: false, follow: false } }),
};

// Server component: la página es estática y el único trozo interactivo es
// <ContactForm />, que es el que lleva 'use client'. Así el contenido —correo,
// datos del titular— llega en el HTML servido, sin depender de JavaScript. Es
// exactamente lo que necesita ver un revisor externo.
export default function ContactoPage() {
  // FAIL-CLOSED, atado a la compuerta legal. El formulario recolecta datos
  // personales y enlaza a la Política de Privacidad para explicar su
  // tratamiento: publicarlo mientras esa política no está vigente dejaría el
  // formulario, los Términos y la Privacidad en estados incompatibles. Las tres
  // piezas se habilitan juntas. En producción, con la compuerta cerrada, 404.
  if (!CONTACT_REACHABLE) notFound();

  const identityRows = legalIdentityRows();
  const blockers = PUBLIC_CONTACT_READY ? [] : legalBlockers();

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 sm:mb-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Contacto</h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Escribinos y te respondemos al correo que nos dejes. Si tu consulta es
            sobre una reserva concreta, contanos el nombre del proveedor y la
            fecha del evento para poder ayudarte más rápido.
          </p>
        </header>

        {/* Visible solo en desarrollo/test: en producción esta página no existe
            mientras la compuerta esté cerrada. Deja explícito, para quien
            desarrolla, que el formulario todavía no está habilitado para
            publicarse. */}
        {blockers.length > 0 && (
          <div role="note" className="mb-8 bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AppIcon icon={AlertTriangle} size={20} className="text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-bold text-amber-900 mb-1.5 uppercase tracking-wide text-sm">
                  Formulario no habilitado para producción
                </p>
                <p className="text-sm text-amber-900/90 leading-relaxed mb-3">
                  Esta página es visible solo en desarrollo. Recolecta datos
                  personales, así que se publica junto con los documentos legales,
                  no antes.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900/90">
                  {blockers.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Formulario */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>

          {/* Canales directos + identidad del titular */}
          <aside className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Otras formas de contacto</h2>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <AppIcon icon={Mail} size={17} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">Correo</p>
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline break-all">
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </li>

                {/* Teléfono: solo si existe una línea comercial atendida. Hoy
                    CONTACT_PHONE es null, así que esta entrada no se renderiza —
                    en lugar de mostrar "Teléfono:" sin número. */}
                {CONTACT_PHONE && (
                  <li className="flex gap-3">
                    <AppIcon icon={Clock} size={17} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800">Teléfono</p>
                      <a
                        href={`tel:${CONTACT_PHONE.replace(/[^+0-9]/g, '')}`}
                        className="text-primary hover:underline"
                      >
                        {CONTACT_PHONE}
                      </a>
                    </div>
                  </li>
                )}

                <li className="flex gap-3">
                  <AppIcon icon={MapPin} size={17} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">Dónde operamos</p>
                    <p className="text-gray-600">
                      Uruguay. {BRAND} opera exclusivamente en línea: no tenemos
                      local de atención al público.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Identidad del titular. Solo filas con valor — ver
                legalIdentityRows en lib/site.js. */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Titular del sitio</h2>
              <dl className="space-y-2 text-sm">
                {identityRows.map((row) => (
                  <div key={row.label} className="flex gap-2">
                    <dt className="text-gray-500 shrink-0">{row.label}:</dt>
                    <dd className="text-gray-800 font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
