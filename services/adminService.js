// ─── ADMIN SERVICE ────────────────────────────────────────────────────────────
// Admin-facing operations backed by real API.

import { api, buildQuery } from './api';
import { providerService } from './providerService';
import { serviceService } from './serviceService';

export const adminService = {
  /** Aggregated platform stats for the admin overview page. */
  async getOverviewStats() {
    const res = await api.get('/admin/dashboard');
    const d = res.data || {};
    return {
      providers: {
        pending:   d.providers?.pending   || 0,
        approved:  d.providers?.approved  || 0,
        rejected:  d.providers?.rejected  || 0,
        suspended: d.providers?.suspended || 0,
      },
      services: {
        draft:          d.services?.draft          || 0,
        pending_review: d.services?.pendingReview  || 0,
        active:         d.services?.active         || 0,
        paused:         0,
        rejected:       0,
      },
      totalProviders: d.providers?.total || 0,
      totalServices:  d.services?.total  || 0,
      totalBookings:  d.bookings?.total  || 0,
      gmv:            d.revenue?.gmv     || 0,
      totalCommission:d.revenue?.totalCommission || 0,
      newUsersLast30: d.users?.newLast30 || 0,
      totalUsers:     d.users?.total     || 0,
      _raw: d,
    };
  },

  // ── Providers ──────────────────────────────────────────────────────────────
  providers: {
    getAll:       (filters) => providerService.admin.getAll(filters),
    getById:      (id)      => providerService.admin.getById(id),
    approve:      (id)      => providerService.admin.approve(id),
    reject:       (id, r)   => providerService.admin.reject(id, r),
    suspend:      (id, r)   => providerService.admin.suspend(id, r),
    reactivate:   (id)      => providerService.admin.reactivate(id),
    countByStatus:()        => providerService.admin.countByStatus(),
  },

  // ── Services ───────────────────────────────────────────────────────────────
  services: {
    getAll:       (filters) => serviceService.admin.getAll(filters),
    getById:      (id)      => serviceService.admin.getById(id),
    approve:      (id)      => serviceService.admin.approve(id),
    reject:       (id, r)   => serviceService.admin.reject(id, r),
    countByStatus:()        => serviceService.admin.countByStatus(),
  },
};
