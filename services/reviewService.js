// ─── REVIEW SERVICE ───────────────────────────────────────────────────────────
// Reseñas de un proveedor. Backed by GET/POST /reviews (real API).

import { api, buildQuery, assetUrl } from './api';

function mapReview(r) {
  if (!r) return null;
  return {
    id:             r.id,
    rating:         parseInt(r.rating) || 0,
    comment:        r.comment || '',
    clientName:     r.client_name || 'Cliente',
    clientAvatar:   r.client_avatar ? assetUrl(r.client_avatar) : '',
    serviceTitle:   r.service_title || '',
    createdAt:      r.created_at || null,
    providerReply:  r.provider_reply || null,
    repliedAt:      r.provider_replied_at || null,
  };
}

export const reviewService = {
  /** Reseñas del proveedor autenticado. */
  async getMine(filters = {}) {
    const res = await api.get(`/reviews/mine${buildQuery(filters)}`);
    return {
      data: (res.data || []).map(mapReview),
      pagination: res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  },

  /** Responde una reseña (solo el proveedor dueño). */
  async reply(id, reply) {
    const res = await api.post(`/reviews/${id}/reply`, { reply });
    return mapReview(res.data);
  },
};
