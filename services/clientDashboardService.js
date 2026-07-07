// ─── CLIENT DASHBOARD SERVICE ─────────────────────────────────────────────────
// Compone endpoints existentes (sin backend nuevo): reservas del cliente +
// categorías. Deriva stats, próximo evento, historial, checklist del organizador
// y recomendaciones. Los favoritos se manejan en el contexto (ya cargados).

import { bookingService } from './bookingService';
import { categoryService } from './categoryService';

// Categorías clave para el "organizador del evento" (usa slugs reales del catálogo).
const ORGANIZER_SLUGS = ['catering', 'dj', 'barra', 'fotografia', 'decoracion', 'animacion', 'sonido'];

// Recomendaciones complementarias simples por categoría ya contratada.
const COMPLEMENTS = {
  catering:   ['dj', 'barra', 'decoracion', 'fotografia'],
  dj:         ['barra', 'animacion', 'sonido', 'fotografia'],
  barra:      ['catering', 'dj', 'animacion'],
  fotografia: ['dj', 'decoracion', 'animacion'],
  decoracion: ['fotografia', 'animacion', 'catering'],
  animacion:  ['dj', 'decoracion', 'castillo'],
  sonido:     ['dj', 'animacion'],
};

const ACTIVE_STATUSES = ['pending', 'confirmed'];

function matchesCategory(booking, cat) {
  const label = (booking.providerCategory || '').toLowerCase();
  return label.includes((cat.label || '').toLowerCase().split(' ')[0]) ||
         label.includes((cat.id || '').toLowerCase());
}

export const clientDashboardService = {
  /**
   * Dashboard agregado del cliente autenticado.
   * @param {number} favoritesCount - cantidad de favoritos (del contexto).
   */
  async getDashboard({ favoritesCount = 0 } = {}) {
    const [bookingsRes, categories] = await Promise.all([
      bookingService.getByClient(null, { limit: 50 }).catch(() => ({ data: [] })),
      categoryService.getAll().catch(() => []),
    ]);
    const bookings = bookingsRes.data || [];
    const today = new Date().toISOString().split('T')[0];

    // Stats
    const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
    const completed = bookings.filter((b) => b.status === 'completed');
    const contractedServices = new Set(bookings.map((b) => b.serviceId)).size;

    // Próximo evento: reserva futura activa más cercana
    const upcoming = bookings
      .filter((b) => b.date && b.date >= today && ACTIVE_STATUSES.includes(b.status))
      .sort((a, b) => a.date.localeCompare(b.date));
    const nextBooking = upcoming[0] || null;

    // Historial reciente (por fecha de creación desc, fallback fecha evento)
    const recentBookings = [...bookings]
      .sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''))
      .slice(0, 6);

    // Organizador: checklist de categorías clave, marcadas si ya reservó una
    const bySlug = Object.fromEntries((categories || []).map((c) => [c.id, c]));
    const organizerCategories = ORGANIZER_SLUGS
      .map((slug) => bySlug[slug])
      .filter(Boolean)
      .map((cat) => ({
        id: cat.id,
        label: cat.label,
        icon: cat.icon,
        done: bookings.some((b) => matchesCategory(b, cat)),
      }));

    // Recomendaciones: complementarias a lo contratado; si no hay, categorías destacadas
    const bookedSlugs = organizerCategories.filter((c) => c.done).map((c) => c.id);
    let recSlugs = [];
    bookedSlugs.forEach((slug) => { recSlugs.push(...(COMPLEMENTS[slug] || [])); });
    recSlugs = [...new Set(recSlugs)].filter((s) => !bookedSlugs.includes(s));
    if (recSlugs.length === 0) {
      recSlugs = ORGANIZER_SLUGS.filter((s) => !bookedSlugs.includes(s));
    }
    const recommendedCategories = recSlugs
      .map((slug) => bySlug[slug])
      .filter(Boolean)
      .slice(0, 6);

    return {
      stats: {
        activeBookings: active.length,
        completedBookings: completed.length,
        favoritesCount,
        contractedServices,
        hasNextEvent: !!nextBooking,
      },
      nextBooking,
      recentBookings,
      organizerCategories,
      recommendedCategories,
      allCategories: categories || [],
    };
  },
};
