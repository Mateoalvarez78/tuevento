// ─── SITEMAP ──────────────────────────────────────────────────────────────────
// Convención nativa del App Router: este archivo se sirve en /sitemap.xml.
// Antes devolvía 404 (verificado en producción) — el matcher de proxy.js ya lo
// excluía, o sea que estaba previsto y nunca se construyó.
//
// Solo rutas PÚBLICAS e indexables. Quedan fuera a propósito:
//  · /admin/* y /dashboard/* — áreas privadas.
//  · /provider/* — portal de proveedores.
//  · /login, /registro — utilitarias, sin valor de búsqueda.
//  · /reservar, /mi-evento — dependen de parámetros o de estado local.
//  · /proveedor/[id] — el catálogo está en transición a proveedores reales
//    (hoy la oferta publicada es data sembrada). Indexar fichas que van a
//    cambiar de dueño o desaparecer sería contraproducente; se agregan cuando
//    el catálogo sea real.
//  · /terminos y /privacidad MIENTRAS sigan en borrador — ver abajo.

import { CANONICAL_ORIGIN, PUBLIC_LEGAL_READY, PUBLIC_CONTACT_READY } from '@/lib/site';

export default function sitemap() {
  const now = new Date();

  const entries = [
    { url: '/', changeFrequency: 'weekly', priority: 1 },
    { url: '/catalogo', changeFrequency: 'daily', priority: 0.8 },
  ];

  // FAIL-CLOSED. Nada entra al sitemap antes de estar publicado de verdad:
  //  · /contacto se sirve solo cuando la compuerta de cumplimiento está
  //    abierta (recolecta datos personales y enlaza a la Privacidad), así que
  //    anunciarlo antes sería anunciar un 404.
  //  · /terminos y /privacidad, ídem: datos legales completos + revisión
  //    jurídica + las cinco secciones de política cerradas.
  // Las constantes son las MISMAS que deciden el 404 de cada página, así que el
  // sitemap no puede desincronizarse de lo que realmente se sirve.
  if (PUBLIC_CONTACT_READY) {
    entries.push({ url: '/contacto', changeFrequency: 'yearly', priority: 0.5 });
  }

  if (PUBLIC_LEGAL_READY) {
    entries.push(
      { url: '/terminos', changeFrequency: 'yearly', priority: 0.4 },
      { url: '/privacidad', changeFrequency: 'yearly', priority: 0.4 },
    );
  }

  return entries.map((e) => ({
    url: `${CANONICAL_ORIGIN}${e.url}`,
    lastModified: now,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
