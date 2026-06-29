// ─── PROVIDER SERVICE ─────────────────────────────────────────────────────────
// Single interface for all provider operations.
// Swap these implementations for fetch('/api/providers/...') when backend is ready.
//
// Public methods  → only approved providers
// admin.* methods → all providers regardless of status

import { PROVIDERS as BASE_PROVIDERS } from '@/lib/mockData';
import { PROVIDER_OVERRIDES, NEW_PROVIDERS } from '@/mocks/providers.mock';

// Merge base providers (full data) with status/contact overrides
const buildAllProviders = () => [
  ...BASE_PROVIDERS.map((p) => ({
    ...p,
    status: 'approved',
    statusReason: null,
    ...(PROVIDER_OVERRIDES[p.id] || {}),
  })),
  ...NEW_PROVIDERS,
];

// Module-level mutable state — simulates DB persistence within the session.
// Future: replace with real API calls; this entire file gets swapped out.
let _providers = buildAllProviders();

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function applyFilters(list, { category, zone, minRating, maxPrice, eventType, verified, search } = {}) {
  return list.filter((p) => {
    if (category && p.category !== category) return false;
    if (zone && !p.zones?.some((z) => z.toLowerCase().includes(zone.toLowerCase()))) return false;
    if (minRating && (p.rating || 0) < minRating) return false;
    if (maxPrice && p.priceFrom > maxPrice) return false;
    if (eventType && !p.eventTypes?.includes(eventType)) return false;
    if (verified && !p.verified) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !p.name.toLowerCase().includes(s) &&
        !p.categoryLabel?.toLowerCase().includes(s) &&
        !p.description?.toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
// These are the methods used by public-facing pages (catalog, home, detail).

export const providerService = {
  /** Returns only approved providers, with optional filtering. */
  getAll(filters = {}) {
    const approved = _providers.filter((p) => p.status === 'approved');
    return applyFilters(approved, filters);
  },

  /** Returns a single approved provider by ID. */
  getById(id) {
    return _providers.find((p) => p.id === id && p.status === 'approved') || null;
  },

  /** Returns featured providers (top or popular badges). */
  getFeatured(limit = 4) {
    return _providers
      .filter((p) => p.status === 'approved' && (p.badges?.includes('top') || p.badges?.includes('popular')))
      .slice(0, limit);
  },

  /** Returns the provider linked to a given userId. */
  getByUserId(userId) {
    return _providers.find((p) => p.userId === userId) || null;
  },

  /** Returns the provider by providerId (used from user.providerId). */
  getByProviderId(providerId) {
    return _providers.find((p) => p.id === providerId) || null;
  },

  /**
   * Registers a new provider.
   * Creates with status: 'pending' — must be approved by admin to be public.
   * Future: POST /api/providers
   */
  register(data) {
    const newProvider = {
      id: `p${Date.now()}`,
      status: 'pending',
      statusReason: null,
      rating: 0,
      reviewCount: 0,
      totalBookings: 0,
      responseTime: null,
      badges: [],
      verified: false,
      packages: [],
      extras: [],
      reviews: [],
      faq: [],
      images: data.logo ? [data.logo] : [],
      createdAt: new Date().toISOString().split('T')[0],
      approvedAt: null,
      ...data,
    };
    _providers = [newProvider, ..._providers];
    return newProvider;
  },

  // ─── ADMIN API ──────────────────────────────────────────────────────────────
  admin: {
    /** Returns ALL providers (any status), with optional filtering. */
    getAll({ status, search, category } = {}) {
      let list = [..._providers];
      if (status) list = list.filter((p) => p.status === status);
      if (category) list = list.filter((p) => p.category === category);
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            p.ownerName?.toLowerCase().includes(s) ||
            p.email?.toLowerCase().includes(s)
        );
      }
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getById(id) {
      return _providers.find((p) => p.id === id) || null;
    },

    /** Approves a provider — makes them visible on the platform. */
    approve(id) {
      _providers = _providers.map((p) =>
        p.id === id
          ? { ...p, status: 'approved', statusReason: null, approvedAt: new Date().toISOString().split('T')[0] }
          : p
      );
      return _providers.find((p) => p.id === id);
    },

    /** Rejects a provider with a mandatory reason. */
    reject(id, reason) {
      _providers = _providers.map((p) =>
        p.id === id ? { ...p, status: 'rejected', statusReason: reason } : p
      );
      return _providers.find((p) => p.id === id);
    },

    /** Suspends an approved provider. */
    suspend(id, reason) {
      _providers = _providers.map((p) =>
        p.id === id ? { ...p, status: 'suspended', statusReason: reason } : p
      );
      return _providers.find((p) => p.id === id);
    },

    /** Reactivates a rejected or suspended provider. */
    reactivate(id) {
      _providers = _providers.map((p) =>
        p.id === id
          ? { ...p, status: 'approved', statusReason: null, approvedAt: new Date().toISOString().split('T')[0] }
          : p
      );
      return _providers.find((p) => p.id === id);
    },

    /** Counts by status — used for admin dashboard stats. */
    countByStatus() {
      return _providers.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});
    },
  },
};
