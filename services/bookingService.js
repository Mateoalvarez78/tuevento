// ─── BOOKING SERVICE ──────────────────────────────────────────────────────────
// Real API-backed booking operations.

import { api, buildQuery } from './api';

// Status mapping: backend uses 'accepted', frontend legacy uses 'confirmed'
const STATUS_MAP = { accepted: 'confirmed', confirmed: 'accepted' };

function normalizeStatus(status) {
  return STATUS_MAP[status] || status;
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
    paymentStatus:     b.payment_status || 'pending',
    // Status — normalize accepted→confirmed for legacy UI
    status:            normalizeStatus(b.status),
    rawStatus:         b.status,
    rejectionReason:   b.rejection_reason || null,
    cancellationReason:b.cancellation_reason || null,
    completedAt:       b.completed_at || null,
    createdAt:         b.created_at ? b.created_at.split('T')[0] : '',
    updatedAt:         b.updated_at  || null,
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

  /** Creates a new booking request. */
  async create(data) {
    const body = {
      service_id:     data.serviceId || data.service_id,
      package_id:     data.packageId || data.package_id || undefined,
      event_date:     data.date     || data.event_date,
      event_time:     data.time     || data.event_time || undefined,
      event_location: data.location || data.event_location,
      event_type:     data.eventType|| data.event_type || undefined,
      guest_count:    data.guests   || data.guest_count || undefined,
      message:        data.message  || undefined,
      extras_selected:data.extras   || data.extras_selected || [],
    };
    const res = await api.post('/bookings', body);
    return mapBooking(res.data);
  },

  /** Updates booking status. Maps legacy 'confirmed' → 'accepted'. */
  async updateStatus(id, status, reason) {
    const backendStatus = STATUS_MAP[status] || status;
    const endpointMap = {
      accepted:  'accept',
      rejected:  'reject',
      cancelled: 'cancel',
      completed: 'complete',
    };
    const endpoint = endpointMap[backendStatus] || backendStatus;
    const body = reason ? { reason } : {};
    const res = await api.patch(`/bookings/${id}/${endpoint}`, body);
    return mapBooking(res.data);
  },

  /** Get single booking detail. */
  async getById(id) {
    const res = await api.get(`/bookings/${id}`);
    return mapBooking(res.data);
  },
};
