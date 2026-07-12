// ─── PROVIDER SERVICE ─────────────────────────────────────────────────────────
// All provider operations backed by the real API.
// Keeps the same method signatures for backward compatibility.

import { api, buildQuery } from './api';

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
    const priceUnit = p.price_unit || '';
    return {
      id:            p.id,
      name:          p.name,
      // `price` kept as the headline (adult) price for existing UI references
      price:         adultPrice,
      adultPrice,
      childPrice,
      childAgeLimit: p.child_age_limit != null ? parseInt(p.child_age_limit) : 14,
      hasChildPrice: childPrice != null,
      // Per-person menus multiply by headcount; per-event menus are a flat rate.
      perPerson:     /persona|person/i.test(priceUnit) || childPrice != null,
      minGuests:     p.min_guests != null ? parseInt(p.min_guests) : null,
      maxGuests:     p.max_guests != null ? parseInt(p.max_guests) : null,
      priceUnit,
      description:   p.description || '',
      includes:      Array.isArray(p.includes) ? p.includes : [],
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

// Maps backend provider admin object → frontend admin provider shape
export function mapAdminProvider(p) {
  if (!p) return null;
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
    logo_url:     p.logo_url || '',
    legalName:      p.legal_name || '',
    taxId:          p.tax_id || '',
    currency:       p.currency || 'UYU',
    paymentMethod:  p.payment_method || '',
    bankAccount:    p.bank_account || {},
    commissionRate: p.commission_rate != null ? parseFloat(p.commission_rate) : null,
    internalNotes:  p.internal_notes || '',
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
    async getAll(filters = {}) {
      const res = await api.get(`/admin/providers${buildQuery(filters)}`);
      return (res.data || []).map(mapAdminProvider);
    },

    async getById(id) {
      const res = await api.get(`/admin/providers/${id}`);
      return mapAdminProvider(res.data);
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
