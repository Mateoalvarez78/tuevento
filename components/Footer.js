'use client';

import { useState } from 'react';
import Link from 'next/link';

const COMPANY_LINKS = [
  { label: 'Nosotros',           href: '#' },
  { label: 'Blog',               href: '#' },
  { label: 'Cómo funciona',      href: '/#como-funciona' },
  { label: 'Para proveedores',   href: '/proveedor/registro' },
  { label: 'Términos y cond.',   href: '#' },
  { label: 'Privacidad',         href: '#' },
];

const SUPPORT_LINKS = [
  { label: 'Centro de ayuda',      href: '#' },
  { label: 'Preguntas frecuentes', href: '#' },
  { label: 'Contacto',             href: '#' },
  { label: 'Reportar problema',    href: '#' },
];

const SOCIALS = [
  { label: 'IG', href: '#', title: 'Instagram' },
  { label: 'FB', href: '#', title: 'Facebook' },
  { label: 'WA', href: '#', title: 'WhatsApp' },
  { label: 'YT', href: '#', title: 'YouTube' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-gray-950 text-gray-400">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">TE</span>
              </div>
              <span className="font-bold text-xl text-white group-hover:text-primary transition-colors">
                Tu<span className="text-primary">Evento</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              El marketplace de servicios para eventos más completo de Uruguay. Conectamos organizadores con los mejores proveedores.
            </p>
            <div className="flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  title={s.title}
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-primary flex items-center justify-center text-xs font-bold text-white transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Compañía */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Compañía</h4>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Soporte</h4>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <h4 className="text-white font-semibold text-sm mb-2">Conéctate</h4>
            <p className="text-sm mb-4 leading-relaxed">
              Recibí tips de eventos y los mejores proveedores cada semana.
            </p>
            {subscribed ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400 font-medium">
                ✓ ¡Gracias! Te sumamos a la lista.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
                >
                  Ok
                </button>
              </form>
            )}

            {/* Payment methods */}
            <div className="mt-6">
              <p className="text-xs text-gray-600 mb-2.5 uppercase tracking-wide font-medium">Pagos seguros</p>
              <div className="flex flex-wrap gap-2">
                {['VISA', 'MC', 'Stripe'].map((logo) => (
                  <span
                    key={logo}
                    className="bg-gray-800 border border-gray-700 text-gray-400 text-xs font-bold px-3 py-1.5 rounded-lg tracking-wide"
                  >
                    {logo}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Categories row */}
        <div className="border-t border-gray-800 pt-8 pb-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">Servicios populares</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {['Catering', 'DJ & Música', 'Fotografía', 'Decoración', 'Animación', 'Parrilla', 'Bebidas', 'Seguridad', 'Video'].map((s) => (
              <Link
                key={s}
                href={`/catalogo?q=${s}`}
                className="text-xs text-gray-500 hover:text-primary transition-colors"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <p>© 2026 TuEvento · Todos los derechos reservados. · Uruguay</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-white transition-colors">Términos</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
