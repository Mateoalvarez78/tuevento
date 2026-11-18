// ─── PAYMENT SERVICE ──────────────────────────────────────────────────────────
// Cobros online con dLocal Go (seña + saldo). El backend crea el checkout y
// devuelve la URL alojada de dLocal; acá solo se pide y se redirige.
// Ver eventonow-back/docs/payments/ARCHITECTURE.md.

import { api } from './api';

export const paymentService = {
  /** Crea (o reutiliza) el checkout del próximo cobro de la reserva. */
  async createCheckout(bookingId) {
    const res = await api.post(`/payments/booking/${bookingId}/checkout`, {});
    return res.data; // { intentId, checkoutUrl, kind, amount, currency, reused }
  },

  /** Al volver de dLocal: el backend consulta a dLocal y devuelve el estado real. */
  async syncIntent(intentId) {
    const res = await api.post(`/payments/intents/${intentId}/sync`, {});
    return res.data; // { id, payment_kind, status, charge_amount, currency, booking_id, payment_status }
  },

  async listIntents(bookingId) {
    const res = await api.get(`/payments/booking/${bookingId}/intents`);
    return res.data || [];
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  async adminListIntents(status) {
    const res = await api.get(`/payments/admin/intents${status ? `?status=${encodeURIComponent(status)}` : ''}`);
    return res.data || [];
  },

  async adminResync(intentId) {
    const res = await api.post(`/payments/admin/intents/${intentId}/resync`, {});
    return res.data;
  },

  /** action: 'apply_late_payment' | 'mark_refunded' */
  async adminResolve(intentId, action) {
    const res = await api.post(`/payments/admin/intents/${intentId}/resolve`, { action });
    return res.data;
  },

  async adminGetPaymentAccount(providerId) {
    const res = await api.get(`/admin/providers/${providerId}/payment-account`);
    return res.data;
  },

  async adminConnectPaymentAccount(providerId, splitCode) {
    const res = await api.put(`/admin/providers/${providerId}/payment-account`, { split_code: splitCode });
    return res.data;
  },

  async adminSetPaymentAccountEnabled(providerId, isEnabled) {
    const res = await api.patch(`/admin/providers/${providerId}/payment-account`, { is_enabled: isEnabled });
    return res.data;
  },
};

/** Etiquetas del estado de un intento de cobro (espejo de payment-state.js del backend). */
export const INTENT_STATUS_LABELS = {
  creating: 'Creando',
  pending: 'Pendiente',
  creation_unknown: 'Sin confirmar',
  paid: 'Cobrado',
  rejected: 'Rechazado',
  expired: 'Vencido',
  cancelled: 'Cancelado',
  amount_mismatch: 'Importe distinto',
  late_paid: 'Pago tardío',
  partially_refunded: 'Reembolso parcial',
  refunded: 'Reembolsado',
  charged_back: 'Contracargo',
};

/** Estados que requieren que alguien del equipo actúe. */
export const INTENT_REVIEW_STATUSES = ['creation_unknown', 'amount_mismatch', 'late_paid'];
