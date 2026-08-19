// ─── SERVICE (LISTING) SERVICE ────────────────────────────────────────────────
// Provider self-service for managing their own listings.

import { api, buildQuery } from './api';
import { mapServiceToProvider } from './providerService';

// Status mapper: some legacy UI uses 'confirmed', backend uses 'accepted'
const STATUS_TO_BACKEND = { confirmed: 'accepted' };
const STATUS_FROM_BACKEND = { accepted: 'confirmed' };

export function normalizeStatus(status) {
  return STATUS_FROM_BACKEND[status] || status;
}

function mapService(s) {
  if (!s) return null;
  return {
    id:            s.id,
    providerId:    s.provider_id,
    providerName:  s.provider_name || '',
    providerLogo:  s.provider_logo || '',
    title:         s.title,
    category:      s.category_slug  || '',
    categoryId:    s.category_id    || '',
    categoryLabel: s.category_name  || '',
    categoryEmoji: s.category_emoji || '',
    // Configuración administrable del campo de subcategoría (Admin >
    // Configuración del catálogo) — viene resuelta directo en la fila del
    // servicio (JOIN a categories, ver services.service.js#getMyServices),
    // nunca hardcodeada por categoryId/slug acá. Solo `getMyServices`
    // selecciona estas 4 columnas hoy (es el único endpoint que alimenta
    // MenuManager.js); en otros mapeos de service quedan en sus defaults
    // seguros ("deshabilitado") si el SQL de origen no las trae.
    packageOptionsEnabled: !!s.category_package_options_enabled,
    packageOptionRequired: s.category_package_option_required !== false,
    packageOptionLabel:    s.category_package_option_label || '',
    packageOptionHelpText: s.category_package_option_help_text || '',
    // Modelo comercial declarativo (Admin > Configuración del catálogo) —
    // reemplaza el hardcode isSalon/isCatering que tenía MenuManager.js.
    // Mismas 4 columnas que packageOptions* de arriba: solo getMyServices
    // las trae (JOIN a categories), con defaults seguros en el resto.
    pricingAllowedModels: s.category_pricing_allowed_models || ['per_person'],
    pricingDefaultModel:  s.category_pricing_default_model || 'per_person',
    guestUsageMode:       s.category_guest_usage_mode || 'price',
    capacityBasis:        s.category_capacity_basis || 'total_guests',
    categoryUnitLabelSingular: s.category_unit_label_singular || '',
    categoryUnitLabelPlural:   s.category_unit_label_plural || '',
    supportsDietaryRestrictions: !!s.category_supports_dietary_restrictions,
    description:   s.description || '',
    priceType:     s.price_type || 'per_event',
    priceFrom:     parseFloat(s.price_from) || 0,
    priceUnit:     s.price_type === 'per_person' ? 'por persona' : 'por evento',
    zones:         Array.isArray(s.zones) ? s.zones : [],
    eventTypes:    Array.isArray(s.event_types) ? s.event_types : [],
    minGuests:     s.min_guests || null,
    maxGuests:     s.max_guests || null,
    durationHours: s.duration_hours || null,
    // Capacidad/disponibilidad propia (opcional, hereda del proveedor por defecto)
    useProviderCapacity:      s.use_provider_capacity !== false,
    maxConcurrentEvents:      s.max_concurrent_events != null ? parseInt(s.max_concurrent_events) : null,
    maxConcurrentGuests:      s.max_concurrent_guests != null ? parseInt(s.max_concurrent_guests) : null,
    durationMinutes:          s.duration_minutes != null ? parseInt(s.duration_minutes) : null,
    preparationMinutes:       s.preparation_minutes != null ? parseInt(s.preparation_minutes) : 0,
    cleanupMinutes:           s.cleanup_minutes != null ? parseInt(s.cleanup_minutes) : 0,
    minimumBookingNoticeHours: s.minimum_booking_notice_hours != null ? parseInt(s.minimum_booking_notice_hours) : null,
    status:        s.status || 'draft',
    statusReason:  s.status_reason || null,
    rating:        parseFloat(s.rating_avg) || 0,
    reviewCount:   parseInt(s.total_reviews) || 0,
    views:         s.views || 0,
    bookings:      s.total_bookings || 0,
    createdAt:     s.created_at ? s.created_at.split('T')[0] : '',
    updatedAt:     s.updated_at  ? s.updated_at.split('T')[0]  : '',
    publishedAt:   s.published_at ? s.published_at.split('T')[0] : null,
    primaryImage:  s.primary_image || (Array.isArray(s.images) && s.images[0]?.url) || null,
    _raw: s,
  };
}

// Maps a backend service_packages row → frontend "menu" shape
function mapMenu(p) {
  if (!p) return null;
  return {
    id:            p.id,
    serviceId:     p.service_id,
    name:          p.name,
    description:   p.description || '',
    adultPrice:    parseFloat(p.adult_price != null ? p.adult_price : p.price) || 0,
    childPrice:    p.child_price != null ? parseFloat(p.child_price) : null,
    childAgeLimit: p.child_age_limit != null ? parseInt(p.child_age_limit) : 14,
    offersCeliacMenu:  !!p.offers_celiac_menu,
    celiacUnitPrice:   p.celiac_unit_price != null ? parseFloat(p.celiac_unit_price) : null,
    celiacDescription: p.celiac_description || '',
    minGuests:     p.min_guests != null ? parseInt(p.min_guests) : null,
    maxGuests:     p.max_guests != null ? parseInt(p.max_guests) : null,
    isActive:      p.is_active !== false,
    sortOrder:     p.sort_order || 0,
    // Paquete de duración fija (ej. salón de fiestas) — se detecta por dato.
    isDurationPackage: p.duration_hours != null,
    durationHours:     p.duration_hours != null ? parseFloat(p.duration_hours) : null,
    allowsExtraHours:  !!p.allows_extra_hours,
    extraHourPrice:    p.extra_hour_price != null ? parseFloat(p.extra_hour_price) : null,
    maxExtraHours:     p.max_extra_hours != null ? parseInt(p.max_extra_hours) : null,
    // Modelo comercial declarativo — `pricingModel` es el campo NUEVO
    // autoritativo (nunca se vuelve a inferir por regex/duration_hours acá,
    // a diferencia de providerService.js#mapPackages que sí lo hacía antes
    // de esta fase). `null` en un paquete histórico se resuelve en
    // lib/packagePricingField.js si hiciera falta mostrarlo igual.
    pricingModel:  p.pricing_model || null,
    unitPrice:     p.unit_price != null ? parseFloat(p.unit_price) : null,
    unitLabelSingular: p.unit_label_singular || null,
    unitLabelPlural:   p.unit_label_plural || null,
    minUnits:      p.min_units != null ? parseInt(p.min_units) : null,
    maxUnits:      p.max_units != null ? parseInt(p.max_units) : null,
    // Incremento comercial de la cantidad (ej. cupcakes por docena) y peso
    // de capacidad por unidad. Ambos opt-in: null = no aplica.
    unitStep:      p.unit_step != null ? parseInt(p.unit_step) : null,
    capacityWeightPerUnit: p.capacity_weight_per_unit != null ? parseInt(p.capacity_weight_per_unit) : null,
    // per_hour: tarifa real por hora + duración de referencia (nunca las
    // horas realmente contratadas, que las elige el cliente al reservar).
    hourlyPrice:   p.hourly_price != null ? parseFloat(p.hourly_price) : null,
    defaultBillableHours: p.default_billable_hours != null ? parseFloat(p.default_billable_hours) : null,
    // Etiqueta de unidad heredada de la subcategoría (si el paquete no tiene
    // la suya propia) — mismo LEFT JOIN sin filtrar por is_active que
    // subcategoryName/Slug, ver comentario debajo.
    subcategoryUnitLabelSingular: p.subcategory_unit_label_singular || null,
    subcategoryUnitLabelPlural:   p.subcategory_unit_label_plural || null,
    // Fase B.1 — subcategoryName/Slug vienen de un LEFT JOIN en el backend
    // SIN filtrar por is_active: siguen resueltos aunque la subcategoría ya
    // esté inactiva (necesario para poder mostrarla como "ya no disponible"
    // en vez de perderla del formulario de edición).
    subcategoryId:   p.subcategory_id || null,
    subcategoryName: p.subcategory_name || null,
    subcategorySlug: p.subcategory_slug || null,
    _raw: p,
  };
}

// Maps frontend menu shape → backend body (snake_case). null clears child price.
function toMenuBody(d) {
  const body = {};
  if (d.name          !== undefined) body.name = d.name;
  if (d.description   !== undefined) body.description = d.description;
  if (d.adultPrice    !== undefined) body.adult_price = d.adultPrice;
  if (d.childPrice    !== undefined) body.child_price = d.childPrice;
  if (d.childAgeLimit !== undefined) body.child_age_limit = d.childAgeLimit;
  if (d.offersCeliacMenu  !== undefined) body.offers_celiac_menu = d.offersCeliacMenu;
  if (d.celiacUnitPrice   !== undefined) body.celiac_unit_price = d.celiacUnitPrice;
  if (d.celiacDescription !== undefined) body.celiac_description = d.celiacDescription;
  if (d.minGuests     !== undefined) body.min_guests = d.minGuests;
  if (d.maxGuests     !== undefined) body.max_guests = d.maxGuests;
  if (d.sortOrder     !== undefined) body.sort_order = d.sortOrder;
  // Fase B.1 — omitido por completo (nunca `undefined` explícito ni `''`)
  // para categorías sin subcategorías: MenuManager solo setea esta clave
  // cuando la categoría del servicio efectivamente tiene subcategorías
  // activas. `''` (defensivo, no debería llegar por la validación del
  // formulario) se traduce a `null`, nunca viaja como string vacío.
  if (d.subcategoryId !== undefined) body.subcategory_id = d.subcategoryId === '' ? null : d.subcategoryId;
  if (d.isActive      !== undefined) body.is_active = d.isActive;
  if (d.durationHours    !== undefined) body.duration_hours = d.durationHours;
  if (d.allowsExtraHours !== undefined) body.allows_extra_hours = d.allowsExtraHours;
  if (d.extraHourPrice   !== undefined) body.extra_hour_price = d.extraHourPrice;
  if (d.maxExtraHours    !== undefined) body.max_extra_hours = d.maxExtraHours;
  if (d.pricingModel  !== undefined) body.pricing_model = d.pricingModel;
  if (d.unitPrice     !== undefined) body.unit_price = d.unitPrice;
  if (d.unitLabelSingular !== undefined) body.unit_label_singular = d.unitLabelSingular || null;
  if (d.unitLabelPlural   !== undefined) body.unit_label_plural = d.unitLabelPlural || null;
  if (d.minUnits      !== undefined) body.min_units = d.minUnits;
  if (d.maxUnits      !== undefined) body.max_units = d.maxUnits;
  if (d.unitStep      !== undefined) body.unit_step = d.unitStep;
  if (d.capacityWeightPerUnit !== undefined) body.capacity_weight_per_unit = d.capacityWeightPerUnit;
  if (d.hourlyPrice   !== undefined) body.hourly_price = d.hourlyPrice;
  if (d.defaultBillableHours !== undefined) body.default_billable_hours = d.defaultBillableHours;
  return body;
}

export const serviceService = {
  /** Active listings for a provider (public). */
  async getActiveByProvider(providerId) {
    const res = await api.get(`/services${buildQuery({ limit: 50 })}`);
    return (res.data || []).map(mapService);
  },

  /** Single active service by ID. */
  async getById(id) {
    const res = await api.get(`/services/${id}`);
    return mapService(res.data);
  },

  /** All listings for the authenticated provider (all statuses). */
  async getByProvider(_providerId, params = {}) {
    const res = await api.get(`/services/mine${buildQuery(params)}`);
    return (res.data || []).map(mapService);
  },

  /** Creates a new service listing (starts as draft). */
  async create(data) {
    const res = await api.post('/services', {
      category_id:    data.category_id || data.categoryId,
      title:          data.title,
      description:    data.description || '',
      price_type:     data.priceType || data.price_type || 'per_event',
      price_from:     data.priceFrom || data.price_from || 0,
      zones:          data.zones || [],
      event_types:    data.eventTypes || data.event_types || [],
      min_guests:     data.minGuests || null,
      max_guests:     data.maxGuests || null,
      duration_hours: data.durationHours || null,
    });
    return mapService(res.data);
  },

  /** Updates an existing listing. */
  async update(id, data) {
    const body = {};
    if (data.title !== undefined)        body.title = data.title;
    if (data.description !== undefined)  body.description = data.description;
    if (data.priceType !== undefined)    body.price_type = data.priceType;
    if (data.price_type !== undefined)   body.price_type = data.price_type;
    if (data.priceFrom !== undefined)    body.price_from = data.priceFrom;
    if (data.price_from !== undefined)   body.price_from = data.price_from;
    if (data.zones !== undefined)        body.zones = data.zones;
    if (data.eventTypes !== undefined)   body.event_types = data.eventTypes;
    if (data.event_types !== undefined)  body.event_types = data.event_types;
    if (data.category_id !== undefined)  body.category_id = data.category_id;
    if (data.categoryId !== undefined)   body.category_id = data.categoryId;
    if (data.minGuests !== undefined)    body.min_guests = data.minGuests;
    if (data.min_guests !== undefined)   body.min_guests = data.min_guests;
    if (data.maxGuests !== undefined)    body.max_guests = data.maxGuests;
    if (data.max_guests !== undefined)   body.max_guests = data.max_guests;
    if (data.durationHours !== undefined) body.duration_hours = data.durationHours;
    if (data.duration_hours !== undefined) body.duration_hours = data.duration_hours;
    if (data.useProviderCapacity !== undefined) body.use_provider_capacity = data.useProviderCapacity;
    if (data.maxConcurrentEvents !== undefined) body.max_concurrent_events = data.maxConcurrentEvents;
    if (data.maxConcurrentGuests !== undefined) body.max_concurrent_guests = data.maxConcurrentGuests;
    if (data.durationMinutes !== undefined) body.duration_minutes = data.durationMinutes;
    if (data.preparationMinutes !== undefined) body.preparation_minutes = data.preparationMinutes;
    if (data.cleanupMinutes !== undefined) body.cleanup_minutes = data.cleanupMinutes;
    if (data.minimumBookingNoticeHours !== undefined) body.minimum_booking_notice_hours = data.minimumBookingNoticeHours;
    const res = await api.put(`/services/${id}`, body);
    return mapService(res.data);
  },

  /** Submits a draft for admin review. */
  async submit(id) {
    const res = await api.patch(`/services/${id}/status`, { status: 'pending_review' });
    return mapService(res.data);
  },

  /** Pauses an active listing. */
  async pause(id) {
    const res = await api.patch(`/services/${id}/status`, { status: 'paused' });
    return mapService(res.data);
  },

  /** Resumes a paused listing. */
  async resume(id) {
    const res = await api.patch(`/services/${id}/status`, { status: 'active' });
    return mapService(res.data);
  },

  /** Soft-deletes a service. */
  async remove(id) {
    await api.delete(`/services/${id}`);
    return true;
  },

  // ── Menu options (service_packages) ─────────────────────────────────────
  /** Lists the provider's menus for a service (all statuses, non-deleted). */
  async getPackages(serviceId) {
    const res = await api.get(`/services/${serviceId}/packages`);
    return (res.data || []).map(mapMenu);
  },

  /** Creates a new menu option. */
  async createPackage(serviceId, data) {
    const res = await api.post(`/services/${serviceId}/packages`, toMenuBody(data));
    return mapMenu(res.data);
  },

  /** Updates a menu option. Pass childPrice: null to remove child pricing. */
  async updatePackage(serviceId, packageId, data) {
    const res = await api.put(`/services/${serviceId}/packages/${packageId}`, toMenuBody(data));
    return mapMenu(res.data);
  },

  /** Activates/deactivates a menu option. */
  async setPackageStatus(serviceId, packageId, isActive) {
    const res = await api.patch(`/services/${serviceId}/packages/${packageId}/status`, { is_active: isActive });
    return mapMenu(res.data);
  },

  /** Soft-deletes a menu option (historical bookings keep their price snapshot). */
  async deletePackage(serviceId, packageId) {
    await api.delete(`/services/${serviceId}/packages/${packageId}`);
    return true;
  },

  // ── Admin API ─────────────────────────────────────────────────────────────
  admin: {
    async getAll(filters = {}) {
      const params = {
        status:   filters.status   || undefined,
        category: filters.category || undefined,
        search:   filters.search   || undefined,
      };
      const res = await api.get(`/admin/services${buildQuery(params)}`);
      return (res.data || []).map(mapService);
    },

    /** Detalle completo (cualquier estado): datos, imágenes, menús. Admin-only. */
    async getById(id) {
      const res = await api.get(`/admin/services/${id}`);
      return mapServiceToProvider(res.data);
    },

    async approve(id) {
      const res = await api.patch(`/admin/services/${id}/approve`);
      return mapService(res.data);
    },

    /** Pausa un servicio ya publicado (no requiere volver a aprobar al reactivar). */
    async pause(id, reason) {
      const res = await api.patch(`/admin/services/${id}/pause`, { reason });
      return mapService(res.data);
    },

    async reject(id, reason) {
      const res = await api.patch(`/admin/services/${id}/reject`, { reason });
      return mapService(res.data);
    },

    async countByStatus() {
      const res = await api.get('/admin/dashboard');
      return res.data?.services || {};
    },
  },
};
