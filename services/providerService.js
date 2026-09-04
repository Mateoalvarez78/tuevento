// ─── PROVIDER SERVICE ─────────────────────────────────────────────────────────
// All provider operations backed by the real API.
// Keeps the same method signatures for backward compatibility.

import { api, buildQuery } from './api';
import { mapRow as mapBookingRow } from './bookingAdminService';

// ── Mappers ───────────────────────────────────────────────────────────────────
// Maps backend service object → frontend "provider card" shape used by catalog/ServiceCard
export function mapServiceToProvider(s) {
  if (!s) return null;
  const images = Array.isArray(s.images)
    ? s.images.map((img) => img.url || img)
    : s.primary_image
    ? [s.primary_image]
    : [];

  return {
    id:              s.id,
    // The "name" shown on cards is the service title; provider name is shown as subtitle
    name:            s.provider_name || s.title,
    businessName:    s.provider_name,
    serviceTitle:    s.title,
    category:        s.category_slug  || '',
    categoryLabel:   s.category_name  || '',
    categoryEmoji:   s.category_emoji || '',
    // Uso de la cantidad de invitados (Admin > Configuración del catálogo) —
    // el cliente (BookingWizard/checkout) lo usa para decidir si pide
    // adultos/niños en absoluto (ej. fotografía = 'unused', nunca los pide),
    // nunca hardcodeado por categoría/slug acá. Solo a nivel categoría (sin
    // override de subcategoría) — ver services.service.js#getServiceWithDetails.
    guestUsageMode:  s.category_guest_usage_mode || 'price',
    capacityBasis:   s.category_capacity_basis || 'total_guests',
    rating:          parseFloat(s.rating_avg)     || 0,
    reviewCount:     parseInt(s.total_reviews)    || 0,
    priceFrom:       parseFloat(s.price_from)     || 0,
    priceType:       s.price_type || 'per_event',
    zone:            s.city || (Array.isArray(s.zones) ? s.zones[0] : '') || '',
    zones:           Array.isArray(s.zones) ? s.zones : [],
    images,
    description:     s.description ? s.description.slice(0, 220) : '',
    longDescription: s.description || '',
    badges:          buildBadges(s),
    verified:        Boolean(s.is_verified),
    totalBookings:   parseInt(s.total_bookings) || 0,
    responseTime:    s.response_time || 'Responde en menos de 24hs',
    cancellationPolicy: s.cancellation_policy || 'Consultar con el proveedor.',
    eventTypes:      Array.isArray(s.event_types) ? s.event_types : [],
    packages:        mapPackages(s.packages),
    extras:          mapExtras(s.extras),
    faq:             [],
    // Provider info
    providerId:      s.provider_id,
    providerName:    s.provider_name,
    providerLogo:    s.provider_logo,
    providerCity:    s.city,
    providerRating:  parseFloat(s.provider_rating) || parseFloat(s.rating_avg) || 0,
    // Raw backend data kept for any direct use
    _raw: s,
  };
}

function buildBadges(s) {
  const badges = [];
  if (s.is_verified) badges.push('verified');
  if (s.total_bookings >= 50) badges.push('popular');
  if (s.rating_avg >= 4.8 && s.total_reviews >= 20) badges.push('top');
  return badges;
}

function mapPackages(packages) {
  if (!Array.isArray(packages)) return [];
  return packages.map((p) => {
    const adultPrice = parseFloat(p.adult_price != null ? p.adult_price : p.price) || 0;
    const childPrice = p.child_price != null ? parseFloat(p.child_price) : null;
    const offersCeliacMenu = !!p.offers_celiac_menu;
    const celiacUnitPrice = p.celiac_unit_price != null ? parseFloat(p.celiac_unit_price) : null;
    const priceUnit = p.price_unit || '';
    // Modelo comercial declarativo — `pricing_model` es el campo NUEVO
    // autoritativo (ver pricing-schema.js en el backend); el regex sobre
    // `price_unit` queda SOLO como red de seguridad para una fila que, por
    // algún motivo, no lo tenga seteado (no debería pasar tras la migración
    // 021, que hizo backfill de todas las filas existentes).
    const pricingModel = p.pricing_model || null;
    const perPerson = pricingModel
      ? pricingModel === 'per_person'
      : (/persona|person/i.test(priceUnit) || childPrice != null);
    return {
      id:            p.id,
      name:          p.name,
      // `price` kept as the headline (adult) price for existing UI references
      price:         adultPrice,
      adultPrice,
      childPrice,
      childAgeLimit: p.child_age_limit != null ? parseInt(p.child_age_limit) : 14,
      hasChildPrice: childPrice != null,
      // Celíacos son un SUBCONJUNTO de adultos: celiacUnitPrice reemplaza (no
      // suma sobre) adultPrice para esas personas — nunca una categoría de
      // invitados aparte.
      offersCeliacMenu,
      celiacUnitPrice,
      celiacDescription: p.celiac_description || '',
      hasCeliacOption: offersCeliacMenu,
      pricingModel,
      isPerUnit:     pricingModel === 'per_unit',
      isPerHour:     pricingModel === 'per_hour',
      isCustomQuote: pricingModel === 'custom_quote',
      unitPrice:     p.unit_price != null ? parseFloat(p.unit_price) : null,
      hourlyPrice:   p.hourly_price != null ? parseFloat(p.hourly_price) : null,
      defaultBillableHours: p.default_billable_hours != null ? parseFloat(p.default_billable_hours) : null,
      unitLabelSingular: p.unit_label_singular || null,
      unitLabelPlural:   p.unit_label_plural || null,
      minUnits:      p.min_units != null ? parseInt(p.min_units) : null,
      maxUnits:      p.max_units != null ? parseInt(p.max_units) : null,
      // Incremento comercial de la cantidad (ej. cupcakes por docena). Se
      // cuenta DESDE minUnits, nunca desde cero — ver
      // lib/packageQuantityField.js#validateUnitsSelection.
      unitStep:      p.unit_step != null ? parseInt(p.unit_step) : null,
      // Cuánta capacidad del proveedor consume CADA unidad. Opt-in: `null`
      // significa "no aplica", nunca se deriva de la cantidad.
      capacityWeightPerUnit: p.capacity_weight_per_unit != null ? parseInt(p.capacity_weight_per_unit) : null,
      // Per-person menus multiply by headcount; per-event menus are a flat rate.
      perPerson,
      minGuests:     p.min_guests != null ? parseInt(p.min_guests) : null,
      maxGuests:     p.max_guests != null ? parseInt(p.max_guests) : null,
      priceUnit,
      description:   p.description || '',
      includes:      Array.isArray(p.includes) ? p.includes : [],
      // Inclusiones estructuradas. El backend las deriva de `includes` cuando
      // la opción todavía no tiene filas propias, así que acá siempre hay una
      // sola forma que leer. `includes` se conserva para no romper a nadie.
      inclusions:    Array.isArray(p.inclusions) ? p.inclusions.map((i) => ({
        id: i.id, name: i.name,
        quantity: i.quantity == null ? null : Number(i.quantity),
        description: i.description || '',
      })) : [],
      // Grupos de adicionales. Llegan vacíos si el canal no los soporta o si
      // el flag está apagado: el cliente no recibe lo que no sabe renderizar.
      modifierGroups: Array.isArray(p.modifier_groups) ? p.modifier_groups.map((g) => ({
        id: g.id, name: g.name, description: g.description || '',
        minSelections: Number(g.min_selections || 0),
        maxSelections: g.max_selections == null ? null : Number(g.max_selections),
        isRequired: !!g.is_required,
        items: (g.items || []).map((it) => ({
          id: it.id, extraId: it.extra_id, name: it.name,
          priceDelta: Number(it.price_delta || 0),
        })),
      })) : [],
      // El backend decide si esta opción se puede contratar desde este canal.
      // El frontend no lo recalcula: solo lo respeta.
      selectable: p.selectable !== false,
      // Paquete de duración fija (ej. salón de fiestas) — se detecta por dato,
      // no por categoría: si tiene duración, es de este tipo.
      isDurationPackage: p.duration_hours != null,
      durationHours:     p.duration_hours != null ? parseFloat(p.duration_hours) : null,
      allowsExtraHours:  !!p.allows_extra_hours,
      extraHourPrice:    p.extra_hour_price != null ? parseFloat(p.extra_hour_price) : null,
      maxExtraHours:     p.max_extra_hours != null ? parseInt(p.max_extra_hours) : null,
    };
  });
}

function mapExtras(extras) {
  if (!Array.isArray(extras)) return [];
  return extras.map((e) => ({
    id:        e.id,
    name:      e.name,
    price:     parseFloat(e.price) || 0,
    priceUnit: '',
  }));
}

// Tasa de aceptación/cancelación — Proveedor 360° (Fase A). Aproximación
// documentada (no reconstruye booking_status_history): la aceptación se mide
// sobre reservas ya DECIDIDAS por el proveedor (excluye "pending"); la
// cancelación es sobre el total histórico. Ver plan de Fase A.
function computeBookingRates({ accepted, completed, rejected, cancelled, total }) {
  const decided = accepted + completed + rejected;
  return {
    acceptanceRate: decided > 0 ? (accepted + completed) / decided : null,
    cancellationRate: total > 0 ? cancelled / total : null,
  };
}

// Maps backend provider admin object → frontend admin provider shape
export function mapAdminProvider(p) {
  if (!p) return null;

  // Agregados de Proveedor 360° (Fase A) — solo presentes en las respuestas
  // de admin.getAll/getById (ver PROVIDER_AGGREGATE_COLUMNS en el backend);
  // ausentes en otros contextos que reutilizan este mismo mapper (ej.
  // getByUserId/getByProviderId de la API pública) — por eso todo default a
  // 0/null en vez de asumir que siempre vienen.
  const bookingsPending = parseInt(p.bookings_pending) || 0;
  const bookingsAccepted = parseInt(p.bookings_accepted) || 0;
  const bookingsCompleted = parseInt(p.bookings_completed) || 0;
  const bookingsCancelled = parseInt(p.bookings_cancelled) || 0;
  const bookingsRejected = parseInt(p.bookings_rejected) || 0;
  const bookingsTotal = bookingsPending + bookingsAccepted + bookingsCompleted + bookingsCancelled + bookingsRejected;
  const { acceptanceRate, cancellationRate } = computeBookingRates({
    accepted: bookingsAccepted, completed: bookingsCompleted, rejected: bookingsRejected, cancelled: bookingsCancelled, total: bookingsTotal,
  });
  const lastActivityAt = [p.last_booking_at, p.last_service_update_at, p.updated_at]
    .filter(Boolean)
    .sort()
    .pop() || p.created_at || null;

  return {
    id:           p.id,
    name:         p.business_name,
    businessName: p.business_name,
    ownerName:    p.owner_name,
    email:        p.email,
    phone:        p.phone || p.owner_phone || '',
    category:     p.category_slug || '',
    categoryId:   p.category_id || '',
    categoryLabel:p.category_name || '',
    city:         p.city || '',
    department:   p.department || '',
    address:      p.address || '',
    zones:        p.zones || [],
    description:  p.description || '',
    status:       p.status,
    statusReason: p.status_reason || null,
    rating:       parseFloat(p.rating_avg) || 0,
    reviewCount:  parseInt(p.total_reviews) || 0,
    totalBookings:parseInt(p.total_bookings) || 0,
    verified:     p.is_verified || false,
    createdAt:    p.created_at ? p.created_at.split('T')[0] : '',
    approvedAt:   p.approved_at ? p.approved_at.split('T')[0] : null,
    instagram:    p.instagram || '',
    whatsapp:     p.whatsapp || '',
    website:      p.website || '',
    responseTime: p.response_time || '',
    logo_url:     p.logo_url || '',
    legalName:      p.legal_name || '',
    taxId:          p.tax_id || '',
    currency:       p.currency || 'UYU',
    paymentMethod:  p.payment_method || '',
    bankAccount:    p.bank_account || {},
    commissionRate: p.commission_rate != null ? parseFloat(p.commission_rate) : null,
    internalNotes:  p.internal_notes || '',
    // Proveedor 360° (Fase A)
    servicesCount:          parseInt(p.services_count) || 0,
    publishedServicesCount: parseInt(p.published_services_count) || 0,
    bookingsPending,
    bookingsAccepted,
    bookingsCompleted,
    bookingsCancelled,
    bookingsRejected,
    bookingsActive:             bookingsPending + bookingsAccepted,
    bookingsCancelledRejected:  bookingsCancelled + bookingsRejected,
    grossAmount:       parseFloat(p.gross_amount) || 0,
    commissionAmount:  parseFloat(p.commission_amount) || 0,
    providerNetAmount: parseFloat(p.provider_net_amount) || 0,
    acceptanceRate,
    cancellationRate,
    lastActivityAt,
    upcomingBookings: Array.isArray(p.upcoming_bookings) ? p.upcoming_bookings.map((b) => ({
      id: b.id,
      requestNumber: b.request_number,
      eventDate: b.event_date,
      eventTime: b.event_time,
      serviceTitle: b.service_title,
      clientName: b.client_name,
    })) : [],
    _raw: p,
  };
}

// Maps backend featured-provider row → ServiceCard-compatible shape.
// Navegación: al servicio principal del proveedor (el detalle "/proveedor/:id"
// es la ficha de un servicio en la arquitectura actual).
function buildFeaturedBadges(p) {
  const badges = [];
  if (p.is_verified) badges.push('verified');
  if (parseInt(p.total_bookings) >= 50) badges.push('popular');
  if (parseFloat(p.rating_avg) >= 4.8 && parseInt(p.total_reviews) >= 20) badges.push('top');
  return badges;
}

export function mapFeaturedProvider(p) {
  if (!p) return null;
  const cover = p.logo_url || p.primary_image || null; // logo primero; si no, foto de un servicio
  return {
    id:            p.main_service_id || p.id, // link → detalle del servicio principal
    providerId:    p.id,
    name:          p.business_name,
    categoryLabel: p.category_name || '',
    categoryEmoji: p.category_emoji || '',
    category:      p.category_slug || '',
    rating:        parseFloat(p.rating_avg) || 0,
    reviewCount:   parseInt(p.total_reviews) || 0,
    totalBookings: parseInt(p.total_bookings) || 0,
    priceFrom:     parseFloat(p.price_from) || 0,
    servicesCount: parseInt(p.services_count) || 0,
    zone:          p.city || (Array.isArray(p.zones) ? p.zones[0] : '') || '',
    images:        cover ? [cover] : [],
    description:   p.description ? p.description.slice(0, 140) : '',
    verified:      !!p.is_verified,
    badges:        buildFeaturedBadges(p),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────
export const providerService = {
  /** Proveedores destacados para la home pública (datos reales, orden por reservas/rating). */
  async getFeaturedProviders(limit = 8) {
    const res = await api.get(`/providers/featured${buildQuery({ limit })}`);
    return (res.data || []).map(mapFeaturedProvider);
  },

  /** Returns active services (catalog) as provider-shaped objects. */
  async getAll(filters = {}) {
    const sortMap = {
      recommended: undefined,
      rating:      'rating',
      price_asc:   'price_asc',
      most_booked: 'popular',
    };
    const params = {
      // category acepta uno o varios slugs separados por coma (ej. "catering,dj")
      category:  filters.category  || undefined,
      zone:      filters.zone      || undefined,
      minRating: filters.minRating > 0 ? filters.minRating : undefined,
      maxPrice:  filters.maxPrice < 200000 ? filters.maxPrice : undefined,
      eventType: filters.eventType || undefined,
      search:    filters.search    || undefined,
      sort:      sortMap[filters.sort] || undefined,
      page:      filters.page      || 1,
      limit:     filters.limit     || 9,
      // Base para matching por ubicación real (radio). Hoy no matchea nada
      // porque ningún proveedor tiene lat/lng cargado todavía — no rompe nada.
      lat:       filters.lat       || undefined,
      lng:       filters.lng       || undefined,
    };
    const res = await api.get(`/services${buildQuery(params)}`);
    return {
      data: (res.data || []).map(mapServiceToProvider),
      pagination: res.pagination || { total: 0, page: 1, limit: 9, totalPages: 1 },
    };
  },

  /** Returns full detail of one service (mapped to provider shape). */
  async getById(id) {
    if (!id) return null;
    const res = await api.get(`/services/${id}`);
    return mapServiceToProvider(res.data);
  },

  /** Returns featured services mapped to provider shape. */
  async getFeatured(limit = 4) {
    const res = await api.get(`/services${buildQuery({ sort: 'popular', limit })}`);
    return (res.data || []).map(mapServiceToProvider);
  },

  /** Returns the provider profile linked to the logged-in user. */
  async getByUserId(_userId) {
    // userId param kept for compat; backend uses the JWT to identify the provider
    const res = await api.get('/providers/me');
    return mapAdminProvider(res.data);
  },

  /** Returns provider profile by provider record ID. */
  async getByProviderId(providerId) {
    const res = await api.get(`/providers/${providerId}`);
    return mapAdminProvider(res.data);
  },

  // ── Admin API ─────────────────────────────────────────────────────────────
  // No existe alta pública de proveedor: se crean únicamente desde
  // admin.create() (POST /admin/providers), ver panel de administración.
  admin: {
    /** Listado paginado/filtrado en backend — Proveedor 360° (Fase A). */
    async getAll(filters = {}) {
      const res = await api.get(`/admin/providers${buildQuery(filters)}`);
      return {
        data: (res.data || []).map(mapAdminProvider),
        pagination: res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    },

    /** KPIs globales para la cabecera del listado — no depende de los filtros de la tabla (Fase A). */
    async getSummary(filters = {}) {
      const res = await api.get(`/admin/providers/summary${buildQuery(filters)}`);
      return res.data;
    },

    async getById(id) {
      const res = await api.get(`/admin/providers/${id}`);
      return mapAdminProvider(res.data);
    },

    /** Reservas de un proveedor puntual, paginadas/filtradas — tab "Reservas" del 360°.
     *  Mismo mapeo de fila que el listado global (bookingAdminService#mapRow). */
    async getBookings(id, filters = {}) {
      const params = {
        status:   filters.status   || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo:   filters.dateTo   || undefined,
        sort:     filters.sort     || undefined,
        page:     filters.page     || 1,
        limit:    filters.limit    || 20,
      };
      const res = await api.get(`/admin/providers/${id}/bookings${buildQuery(params)}`);
      return {
        data: (res.data || []).map(mapBookingRow),
        pagination: res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
        stats: res.stats || null,
      };
    },

    /** Alta manual de proveedor. Devuelve también la contraseña temporal (una única vez). */
    async create(data) {
      const body = {
        owner_name:      data.ownerName,
        email:           data.email,
        phone:           data.phone || undefined,
        business_name:   data.businessName,
        legal_name:      data.legalName || undefined,
        tax_id:          data.taxId || undefined,
        category_id:     data.categoryId || null,
        description:     data.description || undefined,
        city:            data.city || undefined,
        department:      data.department || undefined,
        address:         data.address || undefined,
        zones:           Array.isArray(data.zones) ? data.zones : [],
        whatsapp:        data.whatsapp || undefined,
        instagram:       data.instagram || undefined,
        website:         data.website || undefined,
        currency:        data.currency || undefined,
        payment_method:  data.paymentMethod || undefined,
        bank_account:    data.bankAccount || undefined,
        commission_rate: data.commissionRate != null ? data.commissionRate : undefined,
        internal_notes:  data.internalNotes || undefined,
      };
      const res = await api.post('/admin/providers', body);
      return {
        user: res.data.user,
        provider: mapAdminProvider(res.data.provider),
        temporaryPassword: res.data.temporaryPassword,
      };
    },

    /** Edita datos ya cargados (typos, cambios de comisión/contacto/etc.). PATCH parcial. */
    async update(id, data) {
      const body = {
        owner_name:      data.ownerName || undefined,
        email:           data.email || undefined,
        phone:           data.phone || undefined,
        business_name:   data.businessName || undefined,
        legal_name:      data.legalName || undefined,
        tax_id:          data.taxId || undefined,
        category_id:     data.categoryId || undefined,
        description:     data.description || undefined,
        city:            data.city || undefined,
        department:      data.department || undefined,
        address:         data.address || undefined,
        zones:           Array.isArray(data.zones) ? data.zones : undefined,
        whatsapp:        data.whatsapp || undefined,
        instagram:       data.instagram || undefined,
        website:         data.website || undefined,
        currency:        data.currency || undefined,
        payment_method:  data.paymentMethod || undefined,
        bank_account:    data.bankAccount || undefined,
        commission_rate: data.commissionRate != null ? data.commissionRate : undefined,
        internal_notes:  data.internalNotes || undefined,
      };
      const res = await api.patch(`/admin/providers/${id}`, body);
      return mapAdminProvider(res.data);
    },

    /** Transición de estado: 'active' | 'suspended' | 'inactive'. */
    async updateStatus(id, status, reason) {
      const res = await api.patch(`/admin/providers/${id}/status`, { status, reason });
      return mapAdminProvider(res.data);
    },

    async countByStatus() {
      const res = await api.get('/admin/dashboard');
      return res.data?.providers || {};
    },
  },
};
