// ─── BOOKING SERVICE ──────────────────────────────────────────────────────────
// Real API-backed booking operations.

import { api, buildQuery, ApiError } from './api';

// Status mapping: backend uses 'accepted', frontend legacy uses 'confirmed'
const STATUS_MAP = { accepted: 'confirmed', confirmed: 'accepted' };

function normalizeStatus(status) {
  return STATUS_MAP[status] || status;
}

// Estado "humano" para UI: distingue aceptada-esperando-seña de confirmada-con-
// seña-pagada sin tocar el status crudo del backend (que sigue siendo solo
// pending/accepted/rejected/cancelled/completed). Úsese solo para badges/color,
// nunca para lógica de negocio (ahí seguí usando `status`/`rawStatus`).
function computeDisplayStatus(normalizedStatus, paymentStatus) {
  if (normalizedStatus === 'confirmed' && paymentStatus !== 'paid') return 'accepted';
  return normalizedStatus;
}

function mapBooking(b) {
  if (!b) return null;
  return {
    id:                b.id,
    requestNumber:     b.request_number,
    clientId:          b.client_id,
    providerId:        b.provider_id,
    serviceId:         b.service_id,
    packageId:         b.package_id,
    providerName:      b.provider_name || '',
    providerCategory:  b.category_name || '',
    providerImage:     b.service_image || b.provider_logo || '',
    providerLogo:      b.provider_logo || '',
    serviceTitle:      b.service_title || '',
    packageName:       b.package_name || '',
    clientName:        b.client_name  || '',
    clientPhone:       b.client_phone || '',
    clientAvatar:      b.client_avatar || '',
    date:              b.event_date,
    time:              b.event_time || '',
    location:          b.event_location || '',
    eventType:         b.event_type || '',
    guests:            b.guest_count || 0,
    // Per-person breakdown (menu model)
    adults:            b.adults_count != null ? parseInt(b.adults_count) : null,
    children:          b.children_count != null ? parseInt(b.children_count) : 0,
    adultUnitPrice:    parseFloat(b.adult_unit_price) || 0,
    childUnitPrice:    parseFloat(b.child_unit_price) || 0,
    subtotalAdults:    parseFloat(b.subtotal_adults) || 0,
    subtotalChildren:  parseFloat(b.subtotal_children) || 0,
    extrasTotal:       parseFloat(b.extras_total) || 0,
    // Paquete de duración fija (ej. salón de fiestas) — snapshot al reservar.
    durationHours:     b.duration_hours != null ? parseFloat(b.duration_hours) : null,
    extraHours:        parseInt(b.extra_hours) || 0,
    extraHourPrice:    b.extra_hour_price != null ? parseFloat(b.extra_hour_price) : null,
    extraHoursAmount:  parseFloat(b.extra_hours_amount) || 0,
    message:           b.message || '',
    extras:            Array.isArray(b.extras_selected) ? b.extras_selected : [],
    // Financial
    totalEstimated:    parseFloat(b.total_amount) || 0,
    subtotal:          parseFloat(b.subtotal) || 0,
    commissionAmount:  parseFloat(b.commission_amount) || 0,
    commissionRate:    parseFloat(b.commission_rate) || 0.08,
    providerNet:       parseFloat(b.provider_net) || 0,
    depositAmount:     parseFloat(b.deposit_amount) || 0,
    depositPaid:       b.deposit_paid || false,
    paymentStatus:     b.payment_status || 'unpaid',
    // Status — normalize accepted→confirmed for legacy UI
    status:            normalizeStatus(b.status),
    rawStatus:         b.status,
    // Solo para mostrar: "accepted" (esperando seña) vs "confirmed" (seña pagada).
    displayStatus:     computeDisplayStatus(normalizeStatus(b.status), b.payment_status || 'unpaid'),
    rejectionReason:   b.rejection_reason || null,
    cancellationReason:b.cancellation_reason || null,
    completedAt:       b.completed_at || null,
    createdAt:         b.created_at ? b.created_at.split('T')[0] : '',
    updatedAt:         b.updated_at  || null,
    // Valoración del cliente sobre esta reserva (si existe).
    reviewId:          b.review_id || null,
    reviewRating:      b.review_rating != null ? parseInt(b.review_rating) : null,
    reviewCreatedAt:   b.review_created_at || null,
    reviewTitle:       b.review_title || '',
    reviewComment:     b.review_comment || '',
    canReview:         b.status === 'completed' && !b.review_id,
    _raw: b,
  };
}

export const bookingService = {
  /** Returns all bookings for the logged-in client. */
  async getByClient(_clientId, params = {}) {
    const res = await api.get(`/users/me/bookings${buildQuery(params)}`);
    return {
      data: (res.data || []).map(mapBooking),
      pagination: res.pagination,
    };
  },

  /** Returns all booking requests for the logged-in provider. */
  async getByProvider(_providerId, params = {}) {
    const res = await api.get(`/bookings/provider${buildQuery(params)}`);
    return {
      data: (res.data || []).map(mapBooking),
      pagination: res.pagination,
    };
  },

  /** Returns provider dashboard statistics. */
  async getProviderStats(_providerId) {
    const res = await api.get('/dashboard/provider');
    const d = res.data || {};
    return {
      totalBookings:     d.bookings?.total || 0,
      pendingBookings:   d.bookings?.pending || 0,
      acceptedBookings:  d.bookings?.accepted || 0,
      completedBookings: d.bookings?.completed || 0,
      grossRevenue:      d.earnings?.grossRevenue || 0,
      commissionAmount:  d.earnings?.totalCommission || 0,
      netRevenue:        d.earnings?.netRevenue || 0,
      commissionRate:    d.earnings?.commissionRate || 0.08,
      conversionRate:    d.bookings?.conversionRate || 0,
      acceptanceRate:    d.bookings?.acceptanceRate || 0,
      ratingAvg:         d.ratingAvg || 0,
      totalReviews:      d.totalReviews || 0,
      monthlyBookings:   d.monthlyStats || [],
      topServices:       d.topServices || [],
      upcomingCalendar:  d.upcomingCalendar || [],
      recentBookings:    d.recentBookings || [],
    };
  },

  /**
   * Creates a new booking request.
   * The backend recomputes all amounts from stored prices — the client only
   * sends quantities and the selected menu; totals are never trusted from here.
   */
  async create(data) {
    const adults   = data.adults   != null ? Number(data.adults)   : (data.guests != null ? Number(data.guests) : undefined);
    const children = data.children != null ? Number(data.children) : undefined;
    const body = {
      service_id:      data.serviceId || data.service_id,
      package_id:      data.packageId || data.package_id || undefined,
      adults_count:    adults,
      children_count:  children,
      extra_hours:     data.extraHours != null ? Number(data.extraHours) : undefined,
      event_date:      data.date     || data.event_date,
      event_time:      data.time     || data.event_time || undefined,
      event_location:  data.location || data.event_location,
      event_type:      data.eventType || data.event_type || undefined,
      message:         data.message  || undefined,
      extras_selected: data.extras   || data.extras_selected || [],
    };
    const res = await api.post('/bookings', body);
    return mapBooking(res.data);
  },

  /**
   * Updates booking status.
   * Accepts backend statuses (accepted/rejected/cancelled/completed) and also
   * the legacy UI term 'confirmed' (→ accepted). Maps to the REST action path.
   */
  async updateStatus(id, status, reason) {
    // One-way normalization only: 'confirmed' (legacy) → 'accepted'.
    const backendStatus = status === 'confirmed' ? 'accepted' : status;
    const endpointMap = {
      accepted:  'accept',
      rejected:  'reject',
      cancelled: 'cancel',
      completed: 'complete',
    };
    const endpoint = endpointMap[backendStatus];
    if (!endpoint) throw new ApiError(`Acción de reserva no soportada: ${status}`, 400, 'UNSUPPORTED_STATUS');
    const body = reason ? { reason } : {};
    const res = await api.patch(`/bookings/${id}/${endpoint}`, body);
    return mapBooking(res.data);
  },

  /** Get single booking detail. */
  async getById(id) {
    const res = await api.get(`/bookings/${id}`);
    return mapBooking(res.data);
  },

  /**
   * Simula el pago de la seña (sin pasarela real todavía). Solo el cliente
   * dueño de la reserva puede llamarlo, y solo si está aceptada y sin pago.
   */
  async payDeposit(id) {
    const res = await api.post(`/payments/booking/${id}/simulate-deposit`, {});
    return mapBooking(res.data);
  },
};
