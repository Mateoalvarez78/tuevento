// ─── ADMIN SERVICE ────────────────────────────────────────────────────────────
// Admin-facing operations backed by real API.

import { api, buildQuery } from './api';
import { providerService, mapAdminProvider } from './providerService';
import { serviceService } from './serviceService';
import { reviewService } from './reviewService';
import { categoryService } from './categoryService';

export const adminService = {
  /** Aggregated platform stats for the admin overview page. */
  async getOverviewStats() {
    const res = await api.get('/admin/dashboard');
    const d = res.data || {};
    return {
      providers: {
        active:    d.providers?.active    || 0,
        suspended: d.providers?.suspended || 0,
        inactive:  d.providers?.inactive  || 0,
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

  /** Detalle de un proveedor por id (admin, cualquier estado). */
  async getProvider(id) {
    const res = await api.get(`/admin/providers/${id}`);
    return mapAdminProvider(res.data);
  },

  /** Servicios de un proveedor puntual (admin endpoint, evita el 403 de /services/mine).
   *  Incluye calificación y fechas de actualización/publicación (Proveedor 360°, tab Servicios). */
  async getProviderServices(id) {
    const res = await api.get(`/admin/providers/${id}/services`);
    return (res.data || []).map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      category: s.category_name || '',
      categoryEmoji: s.category_emoji || '',
      priceFrom: parseFloat(s.price_from) || 0,
      priceType: s.price_type || '',
      totalBookings: parseInt(s.total_bookings) || 0,
      views: parseInt(s.views) || 0,
      createdAt: s.created_at || null,
      updatedAt: s.updated_at || null,
      publishedAt: s.published_at || null,
      ratingAvg: parseFloat(s.rating_avg) || 0,
      reviewCount: parseInt(s.total_reviews) || 0,
      primaryImage: s.primary_image || null,
    }));
  },

  // ── Providers ──────────────────────────────────────────────────────────────
  providers: {
    getAll:       (filters)      => providerService.admin.getAll(filters),
    getSummary:   (filters)      => providerService.admin.getSummary(filters),
    getById:      (id)           => providerService.admin.getById(id),
    getBookings:  (id, filters)  => providerService.admin.getBookings(id, filters),
    create:       (data)         => providerService.admin.create(data),
    update:       (id, data)     => providerService.admin.update(id, data),
    updateStatus: (id, status, r)=> providerService.admin.updateStatus(id, status, r),
    countByStatus:()             => providerService.admin.countByStatus(),
  },

  // ── Services ───────────────────────────────────────────────────────────────
  services: {
    getAll:       (filters) => serviceService.admin.getAll(filters),
    getById:      (id)      => serviceService.admin.getById(id),
    approve:      (id)      => serviceService.admin.approve(id),
    reject:       (id, r)   => serviceService.admin.reject(id, r),
    pause:        (id, r)   => serviceService.admin.pause(id, r),
    countByStatus:()        => serviceService.admin.countByStatus(),
  },

  // ── Reviews (moderación) ──────────────────────────────────────────────────
  reviews: {
    getAll:  (filters) => reviewService.admin.getAll(filters),
    hide:    (id)      => reviewService.admin.hide(id),
    restore: (id)      => reviewService.admin.restore(id),
  },

  // ── Configuración del catálogo (categorías + subcategorías) ──────────────
  categories: {
    getAll:               ()                       => categoryService.admin.getAll(),
    create:               (data)                    => categoryService.admin.create(data),
    update:               (id, data)                => categoryService.admin.update(id, data),
    remove:               (id)                      => categoryService.admin.remove(id),
    reorder:              (orderedIds)              => categoryService.admin.reorder(orderedIds),
    getSubcategories:     (categoryId)              => categoryService.admin.getSubcategories(categoryId),
    createSubcategory:    (data)                    => categoryService.admin.createSubcategory(data),
    updateSubcategory:    (id, data)                => categoryService.admin.updateSubcategory(id, data),
    removeSubcategory:    (id)                      => categoryService.admin.removeSubcategory(id),
    reorderSubcategories: (categoryId, orderedIds)  => categoryService.admin.reorderSubcategories(categoryId, orderedIds),
  },
};
