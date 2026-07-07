// ─── PROVIDER DASHBOARD SERVICE ───────────────────────────────────────────────
// Datos agregados del panel del proveedor. Consume el endpoint real
// GET /dashboard/provider (solo provider/admin) y mapea a camelCase.

import { api } from './api';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function monthLabel(key) {
  // key: 'YYYY-MM'
  if (!key || !key.includes('-')) return key || '';
  const [, m] = key.split('-');
  return MONTHS_ES[parseInt(m, 10) - 1] || key;
}

function mapMonthly(r) {
  return {
    monthKey: r.month,
    label: monthLabel(r.month),
    bookings: parseInt(r.total_bookings) || 0,
    completed: parseInt(r.completed_bookings) || 0,
    revenue: parseFloat(r.revenue) || 0,
  };
}

function mapUpcoming(r) {
  return {
    id: r.id,
    date: r.event_date,
    time: r.event_time || '',
    status: r.status,
    guests: parseInt(r.guest_count) || 0,
    serviceTitle: r.service_title || '',
    clientName: r.client_name || '',
  };
}

function mapRecent(r) {
  return {
    id: r.id,
    requestNumber: r.request_number,
    status: r.status,
    date: r.event_date,
    time: r.event_time || '',
    total: parseFloat(r.total_amount) || 0,
    guests: parseInt(r.guest_count) || 0,
    serviceTitle: r.service_title || '',
    clientName: r.client_name || '',
    clientAvatar: r.client_avatar || '',
  };
}

function mapTopService(r) {
  return {
    id: r.id,
    title: r.title,
    confirmedBookings: parseInt(r.confirmed_bookings) || 0,
    revenue: parseFloat(r.revenue) || 0,
    ratingAvg: parseFloat(r.rating_avg) || 0,
    totalReviews: parseInt(r.total_reviews) || 0,
    views: parseInt(r.views) || 0,
    image: r.primary_image || null,
  };
}

export const providerDashboardService = {
  /**
   * Devuelve el dashboard agregado del proveedor autenticado.
   * @returns {{ bookings, earnings, recentBookings, topServices, monthlyStats, upcomingCalendar }}
   */
  async getDashboard() {
    const res = await api.get('/dashboard/provider');
    const d = res.data || {};
    return {
      bookings: {
        total:          d.bookings?.total || 0,
        pending:        d.bookings?.pending || 0,
        accepted:       d.bookings?.accepted || 0,
        completed:      d.bookings?.completed || 0,
        rejected:       d.bookings?.rejected || 0,
        cancelled:      d.bookings?.cancelled || 0,
        conversionRate: parseFloat(d.bookings?.conversionRate) || 0,
        acceptanceRate: parseFloat(d.bookings?.acceptanceRate) || 0,
      },
      earnings: {
        grossRevenue:    parseFloat(d.earnings?.grossRevenue) || 0,
        totalCommission: parseFloat(d.earnings?.totalCommission) || 0,
        netRevenue:      parseFloat(d.earnings?.netRevenue) || 0,
        commissionRate:  parseFloat(d.earnings?.commissionRate) || 0.08,
      },
      recentBookings:   (d.recentBookings || []).map(mapRecent),
      topServices:      (d.topServices || []).map(mapTopService),
      monthlyStats:     (d.monthlyStats || []).map(mapMonthly),
      upcomingCalendar: (d.upcomingCalendar || []).map(mapUpcoming),
    };
  },
};
