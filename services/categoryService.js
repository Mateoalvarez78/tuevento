// ─── CATEGORY SERVICE ─────────────────────────────────────────────────────────
// Real API-backed category operations with local cache.

import { api } from './api';
import { CATEGORIES as MOCK_CATEGORIES } from '@/mocks/categories.mock';
import { getCategoryIcon } from '@/utils/icons';

// In-memory cache to avoid repeated requests within the session
let _cache = null;

function mapCategory(c) {
  return {
    id:    c.slug || c.id,   // slug — usado por filtros del catálogo
    categoryId: c.id,        // UUID real — necesario para crear servicios
    label: c.name,
    icon:  getCategoryIcon(c.slug || c.id), // componente Lucide, no emoji
    count: parseInt(c.service_count) || 0,
    _raw: c,
  };
}

// Contrato: GET /categories/:id/subcategories (Fase B.1) — solo activas para
// cualquier caller no-admin (el backend filtra is_active=true, ver
// categories.controller.js#getSubcategories), ya ordenadas por sort_order.
// Los 7 campos de pricing (ver pricing-schema.js en el backend) viajan acá
// incluso en el contrato PÚBLICO — MenuManager.js los necesita apenas el
// proveedor elige una subcategoría, para resolver en vivo qué modelos de
// precio quedan permitidos (precedencia subcategoría > categoría), sin
// esperar a guardar. `null` = la subcategoría hereda el valor de la
// categoría (ver lib/packagePricingField.js#resolveEffectivePricingConfig).
function mapSubcategory(s) {
  return {
    id:          s.id,
    categoryId:  s.category_id,
    slug:        s.slug,
    name:        s.name,
    description: s.description || '',
    sortOrder:   s.sort_order || 0,
    pricingAllowedModels: s.pricing_allowed_models || null,
    pricingDefaultModel: s.pricing_default_model || null,
    guestUsageMode: s.guest_usage_mode || null,
    capacityBasis: s.capacity_basis || null,
    unitLabelSingular: s.unit_label_singular || null,
    unitLabelPlural: s.unit_label_plural || null,
    supportsDietaryRestrictions: s.supports_dietary_restrictions == null ? null : !!s.supports_dietary_restrictions,
    _raw: s,
  };
}

// Fila completa de categoría para Admin > Configuración del catálogo — suma
// estado/orden/conteos de uso y los 4 campos de configuración del campo de
// paquete (Fase de catálogo administrable) a lo que ya mapea `mapCategory`.
function mapAdminCategory(c) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    emoji: c.emoji || '',
    description: c.description || '',
    sortOrder: c.sort_order || 0,
    isActive: c.is_active !== false,
    serviceCount: parseInt(c.service_count) || 0,
    providerCount: parseInt(c.provider_count) || 0,
    subcategoryCount: parseInt(c.subcategory_count) || 0,
    subcategoryActiveCount: parseInt(c.subcategory_active_count) || 0,
    packageOptionsEnabled: !!c.package_options_enabled,
    packageOptionRequired: c.package_option_required !== false,
    packageOptionLabel: c.package_option_label || '',
    packageOptionHelpText: c.package_option_help_text || '',
    pricingAllowedModels: c.pricing_allowed_models || ['per_person'],
    pricingDefaultModel: c.pricing_default_model || 'per_person',
    guestUsageMode: c.guest_usage_mode || 'price',
    capacityBasis: c.capacity_basis || 'total_guests',
    unitLabelSingular: c.unit_label_singular || '',
    unitLabelPlural: c.unit_label_plural || '',
    supportsDietaryRestrictions: !!c.supports_dietary_restrictions,
    _raw: c,
  };
}

// Fila completa de subcategoría para Admin — incluye is_active/timestamps
// (nunca expuestos en el contrato público) + `packages_count` (uso real,
// resuelto por el backend en una sola query — ver
// service-subcategories.service.js#getByCategoryWithUsage).
function mapAdminSubcategory(s) {
  return {
    id: s.id,
    categoryId: s.category_id,
    slug: s.slug,
    name: s.name,
    description: s.description || '',
    sortOrder: s.sort_order || 0,
    isActive: s.is_active !== false,
    packagesCount: parseInt(s.packages_count) || 0,
    createdAt: s.created_at || null,
    updatedAt: s.updated_at || null,
    // `null` = hereda de la categoría — nunca se reemplaza por un default acá
    // (a diferencia de mapAdminCategory), el admin necesita distinguir
    // "hereda" de "override explícito igual al default".
    pricingAllowedModels: s.pricing_allowed_models || null,
    pricingDefaultModel: s.pricing_default_model || null,
    guestUsageMode: s.guest_usage_mode || null,
    capacityBasis: s.capacity_basis || null,
    unitLabelSingular: s.unit_label_singular || null,
    unitLabelPlural: s.unit_label_plural || null,
    supportsDietaryRestrictions: s.supports_dietary_restrictions == null ? null : !!s.supports_dietary_restrictions,
    _raw: s,
  };
}

// snake_case del payload de categoría — compartido por create/update de
// Admin. `undefined` se omite (nunca se manda como '' ni como null salvo
// que el campo lo admita explícitamente), mismo criterio que
// serviceService.js#toMenuBody.
function toAdminCategoryBody(d) {
  const body = {};
  if (d.slug !== undefined) body.slug = d.slug;
  if (d.name !== undefined) body.name = d.name;
  if (d.emoji !== undefined) body.emoji = d.emoji || null;
  if (d.description !== undefined) body.description = d.description || null;
  if (d.sortOrder !== undefined) body.sort_order = d.sortOrder;
  if (d.isActive !== undefined) body.is_active = d.isActive;
  if (d.packageOptionsEnabled !== undefined) body.package_options_enabled = d.packageOptionsEnabled;
  if (d.packageOptionRequired !== undefined) body.package_option_required = d.packageOptionRequired;
  if (d.packageOptionLabel !== undefined) body.package_option_label = d.packageOptionLabel || null;
  if (d.packageOptionHelpText !== undefined) body.package_option_help_text = d.packageOptionHelpText || null;
  if (d.pricingAllowedModels !== undefined) body.pricing_allowed_models = d.pricingAllowedModels;
  if (d.pricingDefaultModel !== undefined) body.pricing_default_model = d.pricingDefaultModel;
  if (d.guestUsageMode !== undefined) body.guest_usage_mode = d.guestUsageMode;
  if (d.capacityBasis !== undefined) body.capacity_basis = d.capacityBasis;
  if (d.unitLabelSingular !== undefined) body.unit_label_singular = d.unitLabelSingular || null;
  if (d.unitLabelPlural !== undefined) body.unit_label_plural = d.unitLabelPlural || null;
  if (d.supportsDietaryRestrictions !== undefined) body.supports_dietary_restrictions = d.supportsDietaryRestrictions;
  return body;
}

// A diferencia de toAdminCategoryBody, acá los 7 campos de pricing pueden
// viajar explícitamente en `null` (limpiar el override, volver a heredar de
// la categoría) — nunca se convierte un `null` intencional en "no tocar".
function toAdminSubcategoryBody(d) {
  const body = {};
  if (d.categoryId !== undefined) body.category_id = d.categoryId;
  if (d.slug !== undefined) body.slug = d.slug;
  if (d.name !== undefined) body.name = d.name;
  if (d.description !== undefined) body.description = d.description || null;
  if (d.sortOrder !== undefined) body.sort_order = d.sortOrder;
  if (d.isActive !== undefined) body.is_active = d.isActive;
  if (d.pricingAllowedModels !== undefined) body.pricing_allowed_models = d.pricingAllowedModels;
  if (d.pricingDefaultModel !== undefined) body.pricing_default_model = d.pricingDefaultModel;
  if (d.guestUsageMode !== undefined) body.guest_usage_mode = d.guestUsageMode;
  if (d.capacityBasis !== undefined) body.capacity_basis = d.capacityBasis;
  if (d.unitLabelSingular !== undefined) body.unit_label_singular = d.unitLabelSingular || null;
  if (d.unitLabelPlural !== undefined) body.unit_label_plural = d.unitLabelPlural || null;
  if (d.supportsDietaryRestrictions !== undefined) body.supports_dietary_restrictions = d.supportsDietaryRestrictions;
  return body;
}

export const categoryService = {
  async getAll() {
    if (_cache) return _cache;
    try {
      const res = await api.get('/categories');
      _cache = (res.data || []).map(mapCategory);
      return _cache;
    } catch {
      // Fallback to mock categories if API unavailable
      return MOCK_CATEGORIES;
    }
  },

  async getById(id) {
    const all = await this.getAll();
    return all.find((c) => c.id === id) || null;
  },

  async getLabel(id) {
    const cat = await this.getById(id);
    return cat?.label || id;
  },

  /**
   * Subcategorías activas de una categoría (contrato canónico Fase B.1).
   * `categoryId` es el UUID real (`category.categoryId`/`service.categoryId`),
   * nunca el slug. Nunca dispara la petición sin un id — un `categoryId`
   * vacío/undefined devuelve `[]` directo, sin pegarle al backend.
   */
  async getSubcategories(categoryId) {
    if (!categoryId) return [];
    const res = await api.get(`/categories/${categoryId}/subcategories`);
    return (res.data || []).map(mapSubcategory);
  },

  /** Clears the cache (e.g. after admin creates a category) */
  clearCache() {
    _cache = null;
  },

  // ── Admin — Configuración del catálogo ────────────────────────────────────
  // Categorías + subcategorías administrables. Nunca usado por el flujo
  // público/proveedor (esos siguen con getAll/getSubcategories de arriba).
  admin: {
    /** Todas las categorías (activas e inactivas) con contadores de uso. */
    async getAll() {
      const res = await api.get('/categories?includeInactive=true');
      return (res.data || []).map(mapAdminCategory);
    },

    async create(data) {
      const res = await api.post('/categories', toAdminCategoryBody(data));
      categoryService.clearCache();
      return mapAdminCategory(res.data);
    },

    /** `slug` nunca viaja acá aunque `data.slug` esté presente — el backend lo ignora, ver categories.service.js#update. */
    async update(id, data) {
      const res = await api.put(`/categories/${id}`, toAdminCategoryBody(data));
      categoryService.clearCache();
      return mapAdminCategory(res.data);
    },

    /** 409 con mensaje humano si está en uso (services/providers/client_event_items/subcategorías) — nunca 500. */
    async remove(id) {
      await api.delete(`/categories/${id}`);
      categoryService.clearCache();
    },

    /** `orderedIds` debe incluir EXACTAMENTE todas las categorías existentes, en el orden deseado. */
    async reorder(orderedIds) {
      const res = await api.put('/categories/reorder', { ids: orderedIds });
      categoryService.clearCache();
      return (res.data || []).map(mapAdminCategory);
    },

    /** Subcategorías de una categoría, activas + inactivas, con `packagesCount` (contrato admin, vía includeInactive=true). */
    async getSubcategories(categoryId) {
      if (!categoryId) return [];
      const res = await api.get(`/categories/${categoryId}/subcategories?includeInactive=true`);
      return (res.data || []).map(mapAdminSubcategory);
    },

    async createSubcategory(data) {
      const res = await api.post('/service-subcategories', toAdminSubcategoryBody(data));
      return mapAdminSubcategory(res.data);
    },

    async updateSubcategory(id, data) {
      const res = await api.put(`/service-subcategories/${id}`, toAdminSubcategoryBody(data));
      return mapAdminSubcategory(res.data);
    },

    /** 409 con el conteo exacto de paquetes si está en uso — nunca 500. */
    async removeSubcategory(id) {
      await api.delete(`/service-subcategories/${id}`);
    },

    /** `orderedIds` debe incluir EXACTAMENTE todas las subcategorías de `categoryId`. */
    async reorderSubcategories(categoryId, orderedIds) {
      const res = await api.put('/service-subcategories/reorder', { category_id: categoryId, ids: orderedIds });
      return (res.data || []).map(mapAdminSubcategory);
    },
  },
};
