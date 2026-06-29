// ─── BOOKING SERVICE ──────────────────────────────────────────────────────────
// Manages booking / reservation operations.
// Swap for fetch('/api/bookings/...') when backend is ready.

import { MOCK_RESERVATIONS, PROVIDER_REQUESTS, PROVIDER_STATS } from '@/mocks/bookings.mock';
import { generateRequestNumber } from '@/utils/formatters';

let _reservations = [...MOCK_RESERVATIONS];
let _requests = [...PROVIDER_REQUESTS];

export const bookingService = {
  /** Returns all bookings for a given client. */
  getByClient(clientId) {
    return _reservations.filter((r) => r.clientId === clientId);
  },

  /** Returns all booking requests for a given provider. */
  getByProvider(providerId) {
    // In the demo, all requests go to the logged-in provider (p1).
    return _requests;
  },

  /** Returns provider dashboard statistics. */
  getProviderStats(providerId) {
    // Future: GET /api/providers/:id/stats
    return PROVIDER_STATS;
  },

  /**
   * Creates a new booking request.
   * Future: POST /api/bookings
   */
  create(data) {
    const booking = {
      id: `res${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      requestNumber: generateRequestNumber(),
      depositPaid: false,
      ...data,
    };
    _reservations = [booking, ..._reservations];
    return booking;
  },

  /**
   * Updates booking status (accept / reject).
   * Future: PATCH /api/bookings/:id/status
   */
  updateStatus(id, status, reason) {
    _reservations = _reservations.map((r) =>
      r.id === id ? { ...r, status, ...(reason ? { rejectionReason: reason } : {}) } : r
    );
    _requests = _requests.map((r) =>
      r.id === id ? { ...r, status, ...(reason ? { rejectionReason: reason } : {}) } : r
    );
    return _reservations.find((r) => r.id === id) || _requests.find((r) => r.id === id);
  },
};
