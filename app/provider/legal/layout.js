import Link from 'next/link';
import { BRAND, BRAND_MONOGRAM, CONTACT_EMAIL } from '@/lib/site';
import { LEGAL_SPACES, spaceDocs } from '@/lib/legalDocs';

/**
 * Chrome del centro legal de PROVEEDORES.
 *
 * Las rutas /provider/* no muestran el navbar/footer del marketplace
 * (ConditionalNav), así que estas páginas necesitan su propio encabezado y pie.
 * Solo enlazan a destinos del portal de proveedores (login y documentos de
 * esta área): nada del lado cliente, que en el host de proveedores el proxy
 * redirigiría al login.
 */
export default function ProviderLegalLayout({ children }) {
  const docs = spaceDocs('proveedor');
  const { hub, hubTitle } = LEGAL_SPACES.proveedor;
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href={hub} className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
              {BRAND_MONOGRAM}
            </span>
            <span className="font-bold text-gray-900 text-lg truncate">{BRAND}</span>
            <span className="hidden sm:inline text-xs font-semibold text-primary bg-primary-light rounded-full px-2.5 py-1">
              Proveedores
            </span>
          </Link>
          <Link
            href="/provider/login"
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors shrink-0"
          >
            Ingresar al panel
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-gray-500">
          <p>© {year} {BRAND} · Portal de proveedores</p>
          <nav aria-label="Documentos para proveedores">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              <li><Link href={hub} className="hover:text-primary">{hubTitle}</Link></li>
              {docs.map((d) => (
                <li key={d.key}><Link href={d.href} className="hover:text-primary">{d.title}</Link></li>
              ))}
              <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary">{CONTACT_EMAIL}</a></li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
