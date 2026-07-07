// ─── BOOKING ADMIN SERVICE ────────────────────────────────────────────────────
// Backoffice de reservas: listado con filtros + stats + detalle con timeline.
// Solo consumido por el área admin (backend valida requireAdmin).

import { api, buildQuery } from './api';

const num = (v) => parseFloat(v) || 0;
// El backend usa 'accepted'; la UI muestra 'confirmed' en los badges.
const uiStatus = (s) => (s === 'accepted' ? 'confirmed' : s);

function mapRow(b) {
  return {
    id: b.id,
    requestNumber: b.request_number,
    status: uiStatus(b.status),
    rawStatus: b.status,
    eventDate: b.event_date,
    eventTime: b.event_time || '',
    total: num(b.total_amount),
    commission: num(b.commission_amount),
    providerNet: num(b.provider_net),
    createdAt: b.created_at,
    guests: parseInt(b.guest_count) || 0,
    adults: b.adults_count != null ? parseInt(b.adults_count) : null,
    children: b.children_count != null ? parseInt(b.children_count) : 0,
    serviceTitle: b.service_title || '',
    category: b.category_name || '',
    categoryEmoji: b.category_emoji || '',
    packageName: b.package_name || '',
    providerId: b.provider_id,
    providerName: b.provider_name || '',
    clientId: b.client_id,
    clientName: b.client_name || '',
  };
}

function mapDetail(b) {
  if (!b) return null;
  return {
    id: b.id,
    requestNumber: b.request_number,
    status: uiStatus(b.status),
    rawStatus: b.status,
    // Evento
    eventDate: b.event_date,
    eventTime: b.event_time || '',
    location: b.event_location || '',
    eventType: b.event_type || '',
    guests: parseInt(b.guest_count) || 0,
    adults: b.adults_count != null ? parseInt(b.adults_count) : null,
    children: b.children_count != null ? parseInt(b.children_count) : 0,
    message: b.message || '',
    // Servicio / partes
    serviceTitle: b.service_title || '',
    serviceImage: b.service_image || null,
    category: b.category_name || '',
    categoryEmoji: b.category_emoji || '',
    packageName: b.package_name || '',
    extras: Array.isArray(b.extras_selected) ? b.extras_selected : [],
    // Partes
    providerName: b.provider_name || '',
    providerPhone: b.provider_phone || '',
    clientName: b.client_name || '',
    clientEmail: b.client_email || '',
    clientPhone: b.client_phone || '',
    // Financiero
    adultUnitPrice: num(b.adult_unit_price),
    childUnitPrice: num(b.child_unit_price),
    subtotalAdults: num(b.subtotal_adults),
    subtotalChildren: num(b.subtotal_children),
    extrasTotal: num(b.extras_total),
    subtotal: num(b.subtotal),
    total: num(b.total_amount),
    commission: num(b.commission_amount),
    commissionRate: num(b.commission_rate) || 0.08,
    providerNet: num(b.provider_net),
    deposit: num(b.deposit_amount),
    depositPaid: b.deposit_paid || false,
    paymentStatus: b.payment_status || 'pending',
    rejectionReason: b.rejection_reason || null,
    cancellationReason: b.cancellation_reason || null,
    completedAt: b.completed_at || null,
    createdAt: b.created_at,
    history: (b.history || []).map((h) => ({
      status: uiStatus(h.status),
      reason: h.reason || null,
      changedBy: h.changed_by_name || null,
      date: h.created_at,
    })),
  };
}

export const bookingAdminService = {
  /**
   * Listado paginado de reservas con filtros y stats filtro-aware.
   * @param {object} filters - { status, category, dateFrom, dateTo, search, sort, page, limit }
   */
  async getBookings(filters = {}) {
    const params = {
      status:   filters.status   || undefined,
      category: filters.category || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo:   filters.dateTo   || undefined,
      search:   filters.search   || undefined,
      sort:     filters.sort     || undefined,
      page:     filters.page     || 1,
      limit:    filters.limit    || 20,
    };
    const res = await api.get(`/admin/bookings${buildQuery(params)}`);
    return {
      data: (res.data || []).map(mapRow),
      pagination: res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
      stats: res.stats || null,
    };
  },

  /** Detalle completo de una reserva + timeline. */
  async getDetail(id) {
    const res = await api.get(`/admin/bookings/${id}`);
    return mapDetail(res.data);
  },

  /**
   * Cambia el estado de una reserva (backoffice). El backend valida transiciones,
   * exige motivo para cancelar/rechazar, escribe historial y auditoría.
   * @param {string} status - accepted | rejected | completed | cancelled
   */
  async changeStatus(id, status, reason) {
    const res = await api.patch(`/admin/bookings/${id}/status`, { status, reason: reason || undefined });
    return res.data;
  },

  /** Trae el conjunto filtrado completo (sin paginar) para exportar a CSV. */
  async getForExport(filters = {}) {
    const params = {
      status:   filters.status   || undefined,
      category: filters.category || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo:   filters.dateTo   || undefined,
      search:   filters.search   || undefined,
      sort:     filters.sort     || undefined,
    };
    const res = await api.get(`/admin/bookings/export${buildQuery(params)}`);
    return (res.data || []).map(mapRow);
  },
};
