import Link from 'next/link';
import { Mail, Phone, MapPin, AlertTriangle, Store, CalendarCheck } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import ContactForm from '@/components/contact/ContactForm';
import {
  BRAND,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_FORM_ENABLED,
  PUBLIC_CONTACT_READY,
  PROVIDER_CONTACT_MAILTO,
  LEGAL_PAGES_REACHABLE,
  legalBlockers,
  legalIdentityRows,
} from '@/lib/site';

export const metadata = {
  title: 'Contacto',
  description: `Cómo contactar a ${BRAND}: correo ${CONTACT_EMAIL} para consultas sobre reservas, pagos, presupuestos personalizados y alta de proveedores. Datos del titular del sitio.`,
  alternates: { canonical: '/contacto' },
};

// Temas frecuentes: le dicen al visitante qué datos mandar para que la primera
// respuesta ya resuelva. Cada `subject` va en el `mailto:` para ordenar la
// bandeja de entrada.
const TOPICS = [
  {
    icon: CalendarCheck,
    title: 'Una reserva o un pago',
    desc: 'Contanos el número de reserva (o el proveedor y la fecha del evento) y qué necesitás.',
    subject: 'Consulta sobre una reserva',
  },
  {
    icon: Mail,
    title: 'Un presupuesto personalizado',
    desc: 'Decinos qué servicio te interesa, la fecha, el lugar y la cantidad de invitados. Le pasamos el pedido al proveedor y te enviamos su presupuesto.',
    subject: 'Pedido de presupuesto',
  },
];

const mailto = (subject) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

// Server component: todo el contenido —correo, datos del titular— llega en el
// HTML servido, sin depender de JavaScript ni del backend. Es lo que necesita
// ver un revisor externo.
//
// La PÁGINA se sirve siempre (CONTACT_REACHABLE). El FORMULARIO recolecta datos
// personales y enlaza a la Política de Privacidad, así que solo se muestra con
// la compuerta legal abierta (CONTACT_FORM_ENABLED; en dev/test también, para
// probarlo). Mientras tanto, el canal es el correo.
export default function ContactoPage() {
  const identityRows = legalIdentityRows();
  // Aviso interno: solo en dev/test, cuando el formulario se ve sin estar
  // habilitado para producción.
  const blockers = CONTACT_FORM_ENABLED && !PUBLIC_CONTACT_READY ? legalBlockers() : [];

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 sm:mb-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Contacto</h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Atendemos por correo, en español, y respondemos por escrito al mismo
            correo desde el que nos escribas. Si tu consulta es sobre una reserva,
            incluí el número de reserva o el proveedor y la fecha del evento.
          </p>
        </header>

        {blockers.length > 0 && (
          <div role="note" className="mb-8 bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AppIcon icon={AlertTriangle} size={20} className="text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-bold text-amber-900 mb-1.5 uppercase tracking-wide text-sm">
                  Formulario visible solo en desarrollo
                </p>
                <p className="text-sm text-amber-900/90 leading-relaxed mb-3">
                  En producción esta página se sirve sin el formulario: recolecta datos
                  personales, así que se publica junto con los documentos legales
                  vigentes, no antes.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900/90">
                  {blockers.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3 space-y-5">
            {CONTACT_FORM_ENABLED ? (
              <ContactForm />
            ) : (
              <section aria-labelledby="escribinos" className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7">
                <h2 id="escribinos" className="text-lg font-bold text-gray-900 mb-2">Escribinos</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  El canal oficial de {BRAND} es el correo electrónico:
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 text-lg sm:text-xl font-bold text-primary hover:underline break-all"
                >
                  <AppIcon icon={Mail} size={22} aria-hidden="true" />
                  {CONTACT_EMAIL}
                </a>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {TOPICS.map((t) => (
                    <li key={t.title}>
                      <a
                        href={mailto(t.subject)}
                        className="flex h-full gap-3 rounded-xl border border-gray-200 p-4 hover:border-primary/40 hover:shadow-sm transition"
                      >
                        <AppIcon icon={t.icon} size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-gray-900">{t.title}</span>
                          <span className="block text-xs text-gray-500 mt-1 leading-relaxed">{t.desc}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                  <li>
                    <a
                      href={PROVIDER_CONTACT_MAILTO}
                      className="flex h-full gap-3 rounded-xl border border-gray-200 p-4 hover:border-primary/40 hover:shadow-sm transition"
                    >
                      <AppIcon icon={Store} size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900">Quiero ser proveedor</span>
                        <span className="block text-xs text-gray-500 mt-1 leading-relaxed">
                          Contanos qué servicio ofrecés, en qué zonas trabajás y cómo ver tu trabajo. El alta la hace nuestro equipo.
                        </span>
                      </span>
                    </a>
                  </li>
                </ul>
              </section>
            )}

            {LEGAL_PAGES_REACHABLE && (
              <p className="text-xs text-gray-500 leading-relaxed">
                Para cancelaciones, reembolsos o el ejercicio de tus derechos sobre tus datos,
                mirá también la{' '}
                <Link href="/terminos/cancelaciones" className="text-primary hover:underline">política de cancelaciones</Link>{' '}
                y la{' '}
                <Link href="/privacidad" className="text-primary hover:underline">política de privacidad</Link>.
              </p>
            )}
          </div>

          {/* Canales directos + identidad del titular */}
          <aside className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Canales de contacto</h2>
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
                    <AppIcon icon={Phone} size={17} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
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
