// ─── ROBOTS ───────────────────────────────────────────────────────────────────
// Convención nativa del App Router: se sirve en /robots.txt (antes 404).
//
// Las áreas privadas se excluyen acá por higiene de rastreo, no como control de
// acceso: el acceso real lo garantizan los guards de rol y la autorización del
// backend. Un robots.txt no protege nada — solo evita que un buscador indexe
// pantallas de login o paneles.

import { CANONICAL_ORIGIN } from '@/lib/site';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',          // backoffice
          '/dashboard',      // paneles de cliente y proveedor
          '/provider',       // portal de proveedores
          '/reservar',       // depende de query params; sin valor indexable
          '/api',            // no hay rutas de API en Next hoy, pero si se agregan
        ],
      },
    ],
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    host: CANONICAL_ORIGIN,
  };
}
