// ─── ADMIN DASHBOARD SERVICE ──────────────────────────────────────────────────
// Centraliza los datos del panel admin componiendo endpoints reales existentes.
// Sin fetch en componentes, sin cálculos pesados en la UI.

import { api, buildQuery } from './api';

const num = (v) => parseFloat(v) || 0;

function mapProvider(p) {
  return {
    id: p.id,
    businessName: p.business_name,
    ownerName: p.owner_name || '',
    email: p.email || '',
    category: p.category_name || '',
    status: p.status,
    logoUrl: p.logo_url || null,
    createdAt: p.created_at || null,
  };
}

function mapBooking(b) {
  return {
    id: b.id,
    requestNumber: b.request_number,
    status: b.status,
    date: b.event_date,
    total: num(b.total_amount),
    commission: num(b.commission_amount),
    providerNet: num(b.provider_net),
    serviceTitle: b.service_title || '',
    providerName: b.provider_name || '',
    clientName: b.client_name || '',
    createdAt: b.created_at || null,
  };
}

function mapService(s) {
  return {
    id: s.id,
    title: s.title,
    status: s.status,
    category: s.category_name || '',
    categoryEmoji: s.category_emoji || '',
    providerName: s.provider_name || '',
    priceFrom: num(s.price_from),
    createdAt: s.created_at || null,
  };
}

// Feed de actividad compuesto de datos reales (proveedores/servicios/reservas
// recientes). Preparado para reemplazar por GET /admin/activity (admin_logs).
function buildActivity({ recentProviders, recentServices, recentBookings }) {
  const items = [];
  recentProviders.forEach((p) => items.push({ type: 'provider', text: `Proveedor creado: ${p.businessName}`, date: p.createdAt }));
  recentServices.forEach((s) => items.push({ type: 'service', text: `Servicio publicado: ${s.title}`, date: s.createdAt }));
  recentBookings.forEach((b) => items.push({ type: 'booking', text: `Reserva ${b.requestNumber} · ${b.clientName}`, date: b.createdAt }));
  return items
    .filter((i) => i.date)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 8);
}

function buildAlerts(stats, topCategories) {
  const alerts = [];
  if (stats.services.pendingReview > 0) alerts.push({ tone: 'blue', text: `${stats.services.pendingReview} servicio${stats.services.pendingReview !== 1 ? 's' : ''} pendiente${stats.services.pendingReview !== 1 ? 's' : ''} de revisión.`, href: '/admin/servicios' });
  if (stats.bookings.pending > 0) alerts.push({ tone: 'gray', text: `${stats.bookings.pending} reserva${stats.bookings.pending !== 1 ? 's' : ''} pendiente${stats.bookings.pending !== 1 ? 's' : ''} de respuesta del proveedor.`, href: '/admin/reservas?status=pending' });
  const emptyCats = (topCategories || []).filter((c) => parseInt(c.service_count) === 0);
  if (emptyCats.length > 0) alerts.push({ tone: 'gray', text: `${emptyCats.length} categoría${emptyCats.length !== 1 ? 's' : ''} sin servicios publicados.`, href: '/admin/servicios' });
  return alerts;
}

export const adminDashboardService = {
  async getDashboard() {
    const [dash, recent, bookings, services, monthly] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get(`/admin/providers${buildQuery({ limit: 5 })}`).catch(() => ({ data: [] })),
      api.get(`/admin/bookings${buildQuery({ limit: 6 })}`).catch(() => ({ data: [] })),
      api.get(`/admin/services${buildQuery({ limit: 6 })}`).catch(() => ({ data: [] })),
      api.get('/admin/metrics/monthly').catch(() => ({ data: [] })),
    ]);
    const d = dash.data || {};

    const stats = {
      users:     { total: d.users?.total || 0, clients: d.users?.clients || 0, providers: d.users?.providers || 0, newLast30: d.users?.newLast30 || 0 },
      providers: { total: d.providers?.total || 0, active: d.providers?.active || 0, suspended: d.providers?.suspended || 0, inactive: d.providers?.inactive || 0 },
      services:  { total: d.services?.total || 0, active: d.services?.active || 0, pendingReview: d.services?.pendingReview || 0, draft: d.services?.draft || 0 },
      bookings:  { total: d.bookings?.total || 0, pending: d.bookings?.pending || 0, accepted: d.bookings?.accepted || 0, completed: d.bookings?.completed || 0, rejected: d.bookings?.rejected || 0, cancelled: d.bookings?.cancelled || 0 },
      revenue:   { gmv: num(d.revenue?.gmv), totalCommission: num(d.revenue?.totalCommission) },
    };
    const confirmed = stats.bookings.accepted + stats.bookings.completed;
    stats.revenue.avgTicket = confirmed > 0 ? Math.round(stats.revenue.gmv / confirmed) : 0;
    stats.bookings.active = stats.bookings.pending + stats.bookings.accepted;

    const recentProviders = (recent.data || []).map(mapProvider);
    const recentBookings = (bookings.data || []).map(mapBooking);
    const recentServices = (services.data || []).map(mapService);

    // Métricas mensuales reales (backend ya devuelve camelCase + label es-UY)
    const monthlyMetrics = (monthly.data || []).map((m) => ({
      month: m.month,
      label: m.label,
      bookingsCount: m.bookingsCount || 0,
      grossAmount: num(m.grossAmount),
      commissionAmount: num(m.commissionAmount),
      providerNetAmount: num(m.providerNetAmount),
      averageTicket: num(m.averageTicket),
    }));

    return {
      stats,
      topCategories: d.topCategories || [],
      monthlyNewUsers: d.monthlyNewUsers || [],
      monthlyMetrics,
      recentProviders,
      recentBookings,
      recentServices,
      activity: buildActivity({ recentProviders, recentServices, recentBookings }),
      alerts: buildAlerts(stats, d.topCategories),
    };
  },
};
