// ─── ADMIN SERVICE ────────────────────────────────────────────────────────────
// Aggregates admin-facing data from providerService and serviceService.
// This is a thin façade — all mutations delegate to the source services.

import { providerService } from './providerService';
import { serviceService } from './serviceService';
import { bookingService } from './bookingService';

export const adminService = {
  /**
   * Returns aggregated platform stats for the admin overview page.
   * Future: GET /api/admin/stats
   */
  getOverviewStats() {
    const providerCounts = providerService.admin.countByStatus();
    const serviceCounts = serviceService.admin.countByStatus();
    return {
      providers: providerCounts,
      services: serviceCounts,
      totalProviders:
        (providerCounts.pending || 0) +
        (providerCounts.approved || 0) +
        (providerCounts.rejected || 0) +
        (providerCounts.suspended || 0),
      totalServices: Object.values(serviceCounts).reduce((a, b) => a + b, 0),
    };
  },

  // ─── PROVIDERS ─────────────────────────────────────────────────────────────
  providers: {
    getAll: (filters) => providerService.admin.getAll(filters),
    getById: (id) => providerService.admin.getById(id),
    approve: (id) => providerService.admin.approve(id),
    reject: (id, reason) => providerService.admin.reject(id, reason),
    suspend: (id, reason) => providerService.admin.suspend(id, reason),
    reactivate: (id) => providerService.admin.reactivate(id),
    countByStatus: () => providerService.admin.countByStatus(),
  },

  // ─── SERVICES ──────────────────────────────────────────────────────────────
  services: {
    getAll: (filters) => serviceService.admin.getAll(filters),
    getById: (id) => serviceService.admin.getById(id),
    approve: (id) => serviceService.admin.approve(id),
    reject: (id, reason) => serviceService.admin.reject(id, reason),
    countByStatus: () => serviceService.admin.countByStatus(),
  },
};
