// ─── REVIEW SERVICE ───────────────────────────────────────────────────────────
// Reseñas — backed por la API real (POST/PATCH /reviews, /services/:id/reviews,
// /providers/:id/reviews, /users/me/reviews).

import { api, buildQuery, assetUrl } from './api';

function mapReview(r) {
  if (!r) return null;
  return {
    id:             r.id,
    bookingId:      r.booking_id,
    serviceId:      r.service_id,
    providerId:     r.provider_id,
    rating:         parseInt(r.rating) || 0,
    title:          r.title || '',
    comment:        r.comment || '',
    clientName:     r.client_name || 'Cliente',
    clientAvatar:   r.client_avatar ? assetUrl(r.client_avatar) : '',
    serviceTitle:   r.service_title || '',
    providerName:   r.provider_name || '',
    createdAt:      r.created_at || null,
    updatedAt:      r.updated_at || null,
    providerReply:  r.provider_reply || null,
    repliedAt:      r.provider_replied_at || null,
    status:         r.status || 'visible',
  };
}

export const reviewService = {
  /** Crea una reseña sobre una reserva completada. */
  async create({ bookingId, rating, title, comment }) {
    const res = await api.post('/reviews', {
      booking_id: bookingId,
      rating,
      title: title || undefined,
      comment: comment || undefined,
    });
    return mapReview(res.data);
  },

  /** Edita una reseña propia (el backend rechaza fuera de la ventana de edición). */
  async update(id, { rating, title, comment }) {
    const res = await api.patch(`/reviews/${id}`, {
      rating: rating || undefined,
      title: title ?? undefined,
      comment: comment ?? undefined,
    });
    return mapReview(res.data);
  },

  /** Reporta una reseña ajena (contenido inapropiado, etc.). */
  async report(id) {
    const res = await api.post(`/reviews/${id}/report`, {});
    return mapReview(res.data);
  },

  /** Reseñas de un servicio (detalle público). Incluye distribución 1-5★ real. */
  async getForService(serviceId, params = {}) {
    const res = await api.get(`/services/${serviceId}/reviews${buildQuery(params)}`);
    return {
      data: (res.data || []).map(mapReview),
      pagination: res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
      distribution: res.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  },

  /** Reseñas recibidas por un proveedor (ficha pública). */
  async getForProvider(providerId, params = {}) {
    const res = await api.get(`/providers/${providerId}/reviews${buildQuery(params)}`);
    return {
      data: (res.data || []).map(mapReview),
      pagination: res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  },

  /** Reseñas del proveedor autenticado (dashboard, incluye stats de respuesta). */
  async getMine(filters = {}) {
    const res = await api.get(`/reviews/mine${buildQuery(filters)}`);
    return {
      data: (res.data || []).map(mapReview),
      pagination: res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
      stats: res.stats || { unanswered: 0, avgResponseHours: null },
    };
  },

  /** Reseñas hechas por el cliente autenticado ("Mis valoraciones"). */
  async getMyReviews(params = {}) {
    const res = await api.get(`/users/me/reviews${buildQuery(params)}`);
    return {
      data: (res.data || []).map(mapReview),
      pagination: res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  },

  /** Responde una reseña (solo el proveedor dueño). */
  async reply(id, reply) {
    const res = await api.post(`/reviews/${id}/respond`, { reply });
    return mapReview(res.data);
  },

  // ── Admin API ─────────────────────────────────────────────────────────────
  admin: {
    async getAll(filters = {}) {
      const res = await api.get(`/admin/reviews${buildQuery(filters)}`);
      return {
        data: (res.data || []).map(mapReview),
        pagination: res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    },
    async hide(id) {
      const res = await api.patch(`/admin/reviews/${id}`, { status: 'hidden' });
      return mapReview(res.data);
    },
    async restore(id) {
      const res = await api.patch(`/admin/reviews/${id}`, { status: 'visible' });
      return mapReview(res.data);
    },
  },
};
