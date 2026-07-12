'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { siInstagram, siFacebook, siTiktok, siYoutube, siWhatsapp } from 'simple-icons';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';

// simple-icons no incluye LinkedIn (retirado del paquete). Se define el path
// oficial de su logomark localmente, en el mismo formato { path, hex } que ya
// usa simple-icons, para que siga pasando por el mismo <AppIcon>.
const siLinkedin = {
  title: 'LinkedIn',
  hex: '0A66C2',
  path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
};

const COMPANY_LINKS = [
  { label: 'Nosotros',           href: '#' },
  { label: 'Blog',               href: '#' },
  { label: 'Cómo funciona',      href: '/#como-funciona' },
  { label: 'Para proveedores',   href: 'mailto:hola@eventonow.com?subject=Quiero%20ser%20proveedor' },
  { label: 'Términos y cond.',   href: '#' },
  { label: 'Privacidad',         href: '#' },
];

const SUPPORT_LINKS = [
  { label: 'Centro de ayuda',      href: '#' },
  { label: 'Preguntas frecuentes', href: '#' },
  { label: 'Contacto',             href: '#' },
  { label: 'Reportar problema',    href: '#' },
];

// Íconos de marca reales vía simple-icons (Lucide se mantiene para todo lo
// demás — ver AppIcon, que renderiza ambos casos de forma transparente).
const SOCIALS = [
  { icon: siInstagram, href: '#', title: 'Instagram' },
  { icon: siFacebook, href: '#', title: 'Facebook' },
  { icon: siTiktok, href: '#', title: 'TikTok' },
  { icon: siYoutube, href: '#', title: 'YouTube' },
  { icon: siLinkedin, href: '#', title: 'LinkedIn' },
  { icon: siWhatsapp, href: '#', title: 'WhatsApp' },
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
                  key={s.title}
                  href={s.href}
                  title={s.title}
                  aria-label={s.title}
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-primary flex items-center justify-center text-white transition-colors duration-200"
                >
                  <AppIcon icon={s.icon} size={16} aria-hidden="true" />
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
              <div className="flex items-center gap-2 bg-success/10 border border-success/30 rounded-xl px-4 py-3 text-sm text-success font-medium">
                <AppIcon icon={CheckCircle2} size={16} className="shrink-0" aria-hidden="true" />
                ¡Gracias! Te sumamos a la lista.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  type="email"
                  variant="dark"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  wrapperClassName="flex-1 min-w-0"
                />
                <Button type="submit" theme="dark" size="md" className="whitespace-nowrap">
                  Ok
                </Button>
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
