// ─── SERVICE (LISTING) SERVICE ────────────────────────────────────────────────
// Manages service listings created by providers.
// Swap for fetch('/api/services/...') when backend is ready.

import { MOCK_SERVICES } from '@/mocks/services.mock';

// Module-level mutable state — simulates DB persistence within the session.
let _services = [...MOCK_SERVICES];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
let _nextId = MOCK_SERVICES.length + 1;
const nextId = () => `s${_nextId++}`;

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
export const serviceService = {
  /** Returns active service listings for a given provider (public-facing). */
  getActiveByProvider(providerId) {
    return _services.filter((s) => s.providerId === providerId && s.status === 'active');
  },

  /** Returns a single active service by ID. */
  getById(id) {
    return _services.find((s) => s.id === id) || null;
  },

  // ─── PROVIDER SELF-SERVICE API ────────────────────────────────────────────
  /** Returns all service listings for a provider (all statuses). */
  getByProvider(providerId) {
    return _services.filter((s) => s.providerId === providerId);
  },

  /**
   * Creates a new service listing.
   * Starts with status: 'draft'. Provider must explicitly publish it.
   * Future: POST /api/services
   */
  create(data) {
    const newService = {
      id: nextId(),
      status: 'draft',
      statusReason: null,
      views: 0,
      bookings: 0,
      createdAt: new Date().toISOString().split('T')[0],
      publishedAt: null,
      ...data,
    };
    _services = [newService, ..._services];
    return newService;
  },

  /**
   * Updates an existing service listing.
   * Future: PATCH /api/services/:id
   */
  update(id, data) {
    _services = _services.map((s) => (s.id === id ? { ...s, ...data } : s));
    return _services.find((s) => s.id === id);
  },

  /**
   * Submits a draft service for admin review.
   * Changes status: draft → pending_review.
   * Future: POST /api/services/:id/publish
   */
  submit(id) {
    return serviceService.update(id, { status: 'pending_review' });
  },

  /**
   * Pauses an active service (hides it from catalog without deleting).
   * Future: POST /api/services/:id/pause
   */
  pause(id) {
    return serviceService.update(id, { status: 'paused' });
  },

  /**
   * Resumes a paused service (re-activates it without another review cycle).
   * Future: POST /api/services/:id/resume
   */
  resume(id) {
    return serviceService.update(id, {
      status: 'active',
      publishedAt: new Date().toISOString().split('T')[0],
    });
  },

  /**
   * Soft-deletes a service listing.
   * Future: DELETE /api/services/:id
   */
  remove(id) {
    _services = _services.filter((s) => s.id !== id);
    return true;
  },

  // ─── ADMIN API ────────────────────────────────────────────────────────────
  admin: {
    getAll({ status, providerId, category, search } = {}) {
      let list = [..._services];
      if (status) list = list.filter((s) => s.status === status);
      if (providerId) list = list.filter((s) => s.providerId === providerId);
      if (category) list = list.filter((s) => s.category === category);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.providerName.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q)
        );
      }
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getById(id) {
      return _services.find((s) => s.id === id) || null;
    },

    /** Approves a pending_review service → makes it active. */
    approve(id) {
      _services = _services.map((s) =>
        s.id === id
          ? { ...s, status: 'active', statusReason: null, publishedAt: new Date().toISOString().split('T')[0] }
          : s
      );
      return _services.find((s) => s.id === id);
    },

    /** Rejects a pending_review service with a reason. */
    reject(id, reason) {
      _services = _services.map((s) =>
        s.id === id ? { ...s, status: 'rejected', statusReason: reason } : s
      );
      return _services.find((s) => s.id === id);
    },

    countByStatus() {
      return _services.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {});
    },
  },
};
