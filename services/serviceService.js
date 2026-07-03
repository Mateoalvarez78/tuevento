// ─── SERVICE (LISTING) SERVICE ────────────────────────────────────────────────
// Provider self-service for managing their own listings.

import { api, buildQuery } from './api';

// Status mapper: some legacy UI uses 'confirmed', backend uses 'accepted'
const STATUS_TO_BACKEND = { confirmed: 'accepted' };
const STATUS_FROM_BACKEND = { accepted: 'confirmed' };

export function normalizeStatus(status) {
  return STATUS_FROM_BACKEND[status] || status;
}

function mapService(s) {
  if (!s) return null;
  return {
    id:            s.id,
    providerId:    s.provider_id,
    providerName:  s.provider_name || '',
    providerLogo:  s.provider_logo || '',
    title:         s.title,
    category:      s.category_slug  || '',
    categoryLabel: s.category_name  || '',
    categoryEmoji: s.category_emoji || '',
    description:   s.description || '',
    priceType:     s.price_type || 'per_event',
    priceFrom:     parseFloat(s.price_from) || 0,
    priceUnit:     s.price_type === 'per_person' ? 'por persona' : 'por evento',
    zones:         Array.isArray(s.zones) ? s.zones : [],
    eventTypes:    Array.isArray(s.event_types) ? s.event_types : [],
    minGuests:     s.min_guests || null,
    maxGuests:     s.max_guests || null,
    durationHours: s.duration_hours || null,
    status:        s.status || 'draft',
    statusReason:  s.status_reason || null,
    views:         s.views || 0,
    bookings:      s.total_bookings || 0,
    createdAt:     s.created_at ? s.created_at.split('T')[0] : '',
    publishedAt:   s.published_at ? s.published_at.split('T')[0] : null,
    primaryImage:  s.primary_image || (Array.isArray(s.images) && s.images[0]?.url) || null,
    _raw: s,
  };
}

export const serviceService = {
  /** Active listings for a provider (public). */
  async getActiveByProvider(providerId) {
    const res = await api.get(`/services${buildQuery({ limit: 50 })}`);
    return (res.data || []).map(mapService);
  },

  /** Single active service by ID. */
  async getById(id) {
    const res = await api.get(`/services/${id}`);
    return mapService(res.data);
  },

  /** All listings for the authenticated provider (all statuses). */
  async getByProvider(_providerId, params = {}) {
    const res = await api.get(`/services/mine${buildQuery(params)}`);
    return (res.data || []).map(mapService);
  },

  /** Creates a new service listing (starts as draft). */
  async create(data) {
    const res = await api.post('/services', {
      category_id:    data.category_id || data.categoryId,
      title:          data.title,
      description:    data.description || '',
      price_type:     data.priceType || data.price_type || 'per_event',
      price_from:     data.priceFrom || data.price_from || 0,
      zones:          data.zones || [],
      event_types:    data.eventTypes || data.event_types || [],
      min_guests:     data.minGuests || null,
      max_guests:     data.maxGuests || null,
      duration_hours: data.durationHours || null,
    });
    return mapService(res.data);
  },

  /** Updates an existing listing. */
  async update(id, data) {
    const body = {};
    if (data.title !== undefined)        body.title = data.title;
    if (data.description !== undefined)  body.description = data.description;
    if (data.priceType !== undefined)    body.price_type = data.priceType;
    if (data.price_type !== undefined)   body.price_type = data.price_type;
    if (data.priceFrom !== undefined)    body.price_from = data.priceFrom;
    if (data.price_from !== undefined)   body.price_from = data.price_from;
    if (data.zones !== undefined)        body.zones = data.zones;
    if (data.eventTypes !== undefined)   body.event_types = data.eventTypes;
    if (data.event_types !== undefined)  body.event_types = data.event_types;
    if (data.category_id !== undefined)  body.category_id = data.category_id;
    const res = await api.put(`/services/${id}`, body);
    return mapService(res.data);
  },

  /** Submits a draft for admin review. */
  async submit(id) {
    const res = await api.patch(`/services/${id}/status`, { status: 'pending_review' });
    return mapService(res.data);
  },

  /** Pauses an active listing. */
  async pause(id) {
    const res = await api.patch(`/services/${id}/status`, { status: 'paused' });
    return mapService(res.data);
  },

  /** Resumes a paused listing. */
  async resume(id) {
    const res = await api.patch(`/services/${id}/status`, { status: 'active' });
    return mapService(res.data);
  },

  /** Soft-deletes a service. */
  async remove(id) {
    await api.delete(`/services/${id}`);
    return true;
  },

  // ── Admin API ─────────────────────────────────────────────────────────────
  admin: {
    async getAll(filters = {}) {
      const params = {
        status:   filters.status   || undefined,
        category: filters.category || undefined,
        search:   filters.search   || undefined,
      };
      const res = await api.get(`/admin/services${buildQuery(params)}`);
      return (res.data || []).map(mapService);
    },

    async getById(id) {
      const res = await api.get(`/services/${id}`);
      return mapService(res.data);
    },

    async approve(id) {
      const res = await api.patch(`/admin/services/${id}/approve`);
      return mapService(res.data);
    },

    async reject(id, reason) {
      const res = await api.patch(`/admin/services/${id}/reject`, { reason });
      return mapService(res.data);
    },

    async countByStatus() {
      const res = await api.get('/admin/dashboard');
      return res.data?.services || {};
    },
  },
};
