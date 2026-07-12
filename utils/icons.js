// ─── ICON SYSTEM ──────────────────────────────────────────────────────────────
// Fuente única de verdad para tamaños e íconos de categoría. Todo el proyecto
// usa exclusivamente lucide-react — ver docs/o el pedido de rediseño para el
// criterio de elección por categoría/estado.

import {
  UtensilsCrossed, Music, Camera, Sparkles, PartyPopper,
  Martini, Speaker, Tent, Users, Aperture, Building2,
} from 'lucide-react';

// Tamaños consistentes por contexto. La UI densa (checkmarks en checkboxes,
// chevrons, badges de 10-13px dentro de pills) no está listada a propósito:
// forzarla a estos 6 tamaños la rompería visualmente — queda en su tamaño
// actual, más chico, documentado como micro/xs.
export const ICON_SIZE = {
  micro: 12,
  xs: 14,
  badge: 14,
  sidebar: 20,
  navbar: 20,
  button: 18,
  input: 18,
  kpi: 24,
  card: 32,
  emptyState: 28,
  hero: 40,
};

// slug (eventonow-back/src/db/seeds/seed.js) → ícono Lucide.
const CATEGORY_ICON_MAP = {
  catering: UtensilsCrossed,
  dj: Music,
  fotografia: Camera,
  decoracion: Sparkles,
  animacion: PartyPopper,
  barra: Martini,
  sonido: Speaker,
  castillo: Tent,
  mozos: Users,
  cabina_fotos: Aperture,
  'salon-de-fiestas': Building2,
};

const DEFAULT_CATEGORY_ICON = Sparkles;

/** Ícono Lucide para una categoría por slug. Nunca devuelve null. */
export function getCategoryIcon(slug) {
  return CATEGORY_ICON_MAP[slug] || DEFAULT_CATEGORY_ICON;
}
