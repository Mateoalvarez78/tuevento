import Link from 'next/link';
import { Mail } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import {
  BRAND,
  BRAND_MONOGRAM,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  SOCIAL_LINKS,
  PROVIDER_CONTACT_MAILTO,
  LEGAL_PAGES_REACHABLE,
  CONTACT_REACHABLE,
  legalIdentityRows,
} from '@/lib/site';

// Solo destinos que existen. Antes había 11 entradas apuntando a `href="#"`
// (Nosotros, Blog, Centro de ayuda, Preguntas frecuentes, Reportar problema,
// Cookies…): eran enlaces muertos, uno de los motivos de rechazo de la revisión
// anterior. No se crean páginas vacías para conservar un enlace — se retira el
// enlace. Cuando alguna de esas páginas exista de verdad, se agrega acá.
const EXPLORE_LINKS = [
  { label: 'Explorar servicios', href: '/catalogo' },
  { label: 'Cómo funciona',      href: '/#como-funciona' },
  { label: 'Quiero ser proveedor', href: PROVIDER_CONTACT_MAILTO },
];

// Enlaces condicionados a la compuerta de cumplimiento (lib/site.js). En un
// build de producción con la compuerta cerrada, estas rutas responden 404: si
// se enlazaran igual, el footer ofrecería tres enlaces rotos — exactamente lo
// que esta tanda vino a eliminar. El filtro y el 404 salen de la MISMA
// constante, así que no pueden desincronizarse.
const SUPPORT_LINKS = [
  { label: 'Contacto',                          href: '/contacto',                enabled: CONTACT_REACHABLE },
  { label: 'Centro legal',                      href: '/legal',                   enabled: LEGAL_PAGES_REACHABLE },
  { label: 'Términos y condiciones',            href: '/terminos',                enabled: LEGAL_PAGES_REACHABLE },
  { label: 'Cancelaciones y reembolsos',        href: '/terminos/cancelaciones',  enabled: LEGAL_PAGES_REACHABLE },
  { label: 'Política de privacidad',            href: '/privacidad',              enabled: LEGAL_PAGES_REACHABLE },
].filter((l) => l.enabled);

// Chips de categoría. Antes usaban búsqueda libre (`?q=<etiqueta>`), que el
// backend resuelve como full-text sobre título y descripción: «Bebidas» no
// coincidía con nada y el chip llevaba a un catálogo vacío. Ahora usan el
// contrato ESTABLE de categorías — `?categories=<slug>` → `GET /services?category=<slug>`
// → `c.slug = ANY($1)` (services.service.js) — que es el mismo en todos los
// ambientes. Se usa el slug y nunca el UUID, que sí cambia entre bases.
//
// `slug` debe existir en el catálogo activo; `label` es solo presentación.
const CATEGORY_CHIPS = [
  { label: 'Catering',          slug: 'catering' },
  { label: 'DJ & Música',       slug: 'dj' },
  { label: 'Fotografía',        slug: 'fotografia' },
  { label: 'Decoración',        slug: 'decoracion' },
  { label: 'Animación',         slug: 'animacion' },
  { label: 'Barra de Tragos',   slug: 'barra' },
  { label: 'Sonido & Luces',    slug: 'sonido' },
  { label: 'Salón de fiestas',  slug: 'salon-de-fiestas' },
];

// Barra inferior: los destinos principales de SUPPORT_LINKS, con etiqueta
// corta. Derivan del mismo filtro para que no puedan divergir.
const BOTTOM_LINKS = [
  { label: 'Términos',     href: '/terminos',   enabled: LEGAL_PAGES_REACHABLE },
  { label: 'Privacidad',   href: '/privacidad', enabled: LEGAL_PAGES_REACHABLE },
  { label: 'Centro legal', href: '/legal',      enabled: LEGAL_PAGES_REACHABLE },
  { label: 'Contacto',     href: '/contacto',   enabled: CONTACT_REACHABLE },
].filter((l) => l.enabled);

// Sufijo del copyright — titular y país salen del mismo lugar que el resto de
// la identidad legal, no escritos a mano. Se calcula una sola vez al cargar el
// módulo (LEGAL_ENTITY es una constante, no depende del render).
const LEGAL_FOOTER_SUFFIX = (() => {
  const rows = legalIdentityRows();
  const titular = rows.find((r) => r.label === 'Titular')?.value;
  const pais = rows.find((r) => r.label === 'País')?.value;
  return [titular, pais].filter(Boolean).join(' · ');
})();

/**
 * Un enlace externo (hoy solo los `mailto:`) necesita un `<a>`, no un
 * `next/link`: Link está pensado para navegación interna.
 */
function FooterLink({ href, children }) {
  const isExternal = href.startsWith('mailto:') || href.startsWith('http');
  const className = 'text-sm hover:text-white transition-colors';
  if (isExternal) return <a href={href} className={className}>{children}</a>;
  return <Link href={href} className={className}>{children}</Link>;
}

export default function Footer() {
  const identityRows = legalIdentityRows();

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Marca + contacto real */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
              {/* `aria-hidden` en el monograma: el nombre de marca contiguo ya
                  aporta el nombre accesible. Sin esto, un lector de pantalla
                  anunciaba «enlace EVEventonow». */}
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-sm">{BRAND_MONOGRAM}</span>
              </div>
              <span className="font-bold text-xl text-white group-hover:text-primary transition-colors">
                {BRAND}
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5 max-w-xs">
              Marketplace uruguayo de servicios para eventos. Conectamos a quien organiza
              un evento con proveedores de catering, música, fotografía, decoración y más.
            </p>

            {/* Contacto: solo canales que funcionan de verdad */}
            <ul className="space-y-2">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 text-sm hover:text-white transition-colors"
                >
                  <AppIcon icon={Mail} size={15} className="shrink-0" aria-hidden="true" />
                  {CONTACT_EMAIL}
                </a>
              </li>
              {/* CONTACT_PHONE es null mientras no haya una línea comercial
                  atendida: la fila entera no se renderiza, en lugar de mostrar
                  una etiqueta "Teléfono" sin número. */}
              {CONTACT_PHONE && (
                <li>
                  <a
                    href={`tel:${CONTACT_PHONE.replace(/[^+0-9]/g, '')}`}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {CONTACT_PHONE}
                  </a>
                </li>
              )}
            </ul>

            {/* SOCIAL_LINKS está vacío hoy (no existen cuentas oficiales), así
                que este bloque no renderiza nada. Es deliberado: antes había
                seis iconos con href="#". Agregar una cuenta real en lib/site.js
                la publica acá sola. */}
            {SOCIAL_LINKS.length > 0 && (
              <div className="flex gap-2 mt-5">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.title}
                    href={s.href}
                    title={s.title}
                    aria-label={s.title}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-9 h-9 rounded-full bg-gray-800 hover:bg-primary flex items-center justify-center text-white transition-colors duration-200"
                  >
                    <AppIcon icon={s.icon} size={16} aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Explorar */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Explorar</h4>
            <ul className="space-y-2.5">
              {EXPLORE_LINKS.map((l) => (
                <li key={l.label}><FooterLink href={l.href}>{l.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* Ayuda y legales */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Ayuda y legales</h4>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.label}><FooterLink href={l.href}>{l.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* Identidad del titular — dato que dLocal exige ver publicado.
              Se renderizan solo las filas con valor (ver legalIdentityRows):
              mientras falten RUT y domicilio, esas filas no existen en el DOM,
              no aparecen vacías. */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-white font-semibold text-sm mb-4">Datos del titular</h4>
            <dl className="space-y-1.5 text-sm">
              {identityRows.map((row) => (
                <div key={row.label} className="flex gap-1.5">
                  <dt className="text-gray-500 shrink-0">{row.label}:</dt>
                  <dd className="text-gray-300">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Búsquedas frecuentes */}
        <div className="border-t border-gray-800 pt-8 pb-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">
            Servicios más buscados
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {CATEGORY_CHIPS.map((c) => (
              <Link
                key={c.slug}
                href={`/catalogo?categories=${encodeURIComponent(c.slug)}`}
                className="text-xs text-gray-500 hover:text-primary transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Barra inferior. Sin la fila de badges de medios de pago: decía
            "VISA · MC · Stripe" y ninguno estaba integrado. No se reemplaza por
            un badge de dLocal hasta que el checkout esté operativo y validado —
            anunciar un medio de pago que no funciona es el mismo problema. */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <p>© {new Date().getFullYear()} {BRAND} · {LEGAL_FOOTER_SUFFIX}</p>
          {/* Misma compuerta que SUPPORT_LINKS: si la ruta responde 404, acá
              tampoco se enlaza. Si no queda ninguna, el contenedor no se
              renderiza en lugar de dejar un hueco vacío. */}
          {BOTTOM_LINKS.length > 0 && (
            <div className="flex gap-5">
              {BOTTOM_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
