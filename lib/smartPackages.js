// ─── GENERADOR DE PAQUETES — lógica pura del formulario ───────────────────
// Nada acá toca React, fetch ni cálculos de negocio (precio/traslado/ranking
// son responsabilidad exclusiva del backend, ver docs/DECISIONS.md). Solo
// validación de formulario y armado del payload — separado del componente
// para poder testearlo sin renderizar nada.

import { todayStr } from './date';

export const MAX_CATEGORIES = 12;

/** Único lugar que decide si la feature flag está prendida — nunca comparar el env var suelto en más de un archivo. */
export function isSmartPackagesEnabled(envValue) {
  return envValue === 'true';
}

// Mismos 4 valores que acepta smart-packages.routes.js en el backend. La UI
// solo ofrece 3 opciones (sin "premium" separado de "mejor_valorada" — ver
// docs/DECISIONS.md) pero el valor enviado coincide exactamente con el enum real.
export const PREFERENCE_OPTIONS = [
  { value: 'economica', label: 'Económica' },
  { value: 'equilibrada', label: 'Equilibrada' },
  { value: 'mejor_valorada', label: 'Mejor valorada' },
];
export const DEFAULT_PREFERENCE = 'equilibrada';

// Cómo mostrar cada `profile` que devuelve el backend (siempre son estos 3,
// en este orden, sin importar la preferencia elegida).
export const PROFILE_LABELS = {
  economica: 'Económica',
  equilibrada: 'Equilibrada',
  premium: 'Premium o mejor valorada',
};
export const PROFILE_ORDER = ['economica', 'equilibrada', 'premium'];

// Copy puramente presentacional (qué transmite cada perfil) — no participa
// del cálculo ni del ranking, solo ayuda a leer la card en un vistazo.
export const PROFILE_DESCRIPTIONS = {
  economica: 'La opción que prioriza gastar menos',
  equilibrada: 'La mejor relación entre precio y calidad',
  premium: 'Proveedores y paquetes de mayor nivel',
};

const isValidLocation = (location) =>
  !!location &&
  typeof location.lat === 'number' && Number.isFinite(location.lat) &&
  typeof location.lng === 'number' && Number.isFinite(location.lng);

/**
 * Valida el paso 1 (datos del evento). Devuelve un objeto de errores por
 * campo — vacío si todo es válido. Nunca lanza, nunca golpea la red.
 */
export function validateEventStep({ budget, adults, children, eventDate, location }) {
  const errors = {};

  const budgetN = Number(budget);
  if (budget === '' || budget == null || Number.isNaN(budgetN) || budgetN <= 0) {
    errors.budget = 'Ingresá un presupuesto mayor a $0';
  }

  const adultsN = Number(adults);
  if (adults === '' || adults == null || !Number.isInteger(adultsN) || adultsN < 0) {
    errors.adults = 'Ingresá un número entero de 0 o más';
  }

  const childrenN = Number(children);
  if (children === '' || children == null || !Number.isInteger(childrenN) || childrenN < 0) {
    errors.children = 'Ingresá un número entero de 0 o más';
  }

  if (!errors.adults && !errors.children && adultsN + childrenN < 1) {
    errors.guests = 'Ingresá al menos un invitado (adulto o niño)';
  }

  if (!eventDate) {
    errors.eventDate = 'Elegí una fecha para el evento';
  } else if (eventDate < todayStr()) {
    errors.eventDate = 'La fecha no puede ser anterior a hoy';
  }

  if (!isValidLocation(location)) {
    errors.location = 'Elegí una ubicación válida para el evento';
  }

  return errors;
}

/** Valida el paso 2 (categorías). */
export function validateCategoriesStep({ categoryIds }) {
  const errors = {};
  if (!Array.isArray(categoryIds) || categoryIds.length < 1) {
    errors.categoryIds = 'Seleccioná al menos una categoría';
  } else if (categoryIds.length > MAX_CATEGORIES) {
    errors.categoryIds = `Como máximo ${MAX_CATEGORIES} categorías`;
  }
  return errors;
}

/**
 * Arma el body exacto que espera POST /smart-packages/simulate. Solo
 * normaliza tipos (string de un <input> → number) — ningún cálculo de negocio.
 */
export function buildSimulatePayload({ budget, adults, children, eventDate, location, categoryIds, preference }) {
  // locationToken (si LocationPicker llegó a verificar la dirección y sigue
  // vigente) habilita que el backend filtre candidatos por cobertura de zona
  // (services.zones) — sin esto, el generador podía proponer un proveedor
  // que luego se rechazaba al aceptar la propuesta real (zone_not_covered).
  // Nunca se manda si expiró: un token vencido rechazado por el backend
  // degradaría la simulación entera a "sin ubicación", cuando lo único que
  // se pierde acá es el filtro de zona (mismo criterio de "mejor esfuerzo"
  // que useAcceptProposal.js#buildLocationFields, pero sin el fallback a
  // location_zone porque acá no existe ese campo en el contrato de simulate).
  const tokenValid = !!location.locationToken && !!location.tokenExpiresAt
    && new Date(location.tokenExpiresAt).getTime() > Date.now();
  return {
    budget: Number(budget),
    adults: Number(adults) || 0,
    children: Number(children) || 0,
    eventDate,
    location: {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: location.formattedAddress || null,
      ...(tokenValid ? { locationToken: location.locationToken } : {}),
    },
    categoryIds,
    preference: preference || DEFAULT_PREFERENCE,
  };
}

/** % del presupuesto que consume una propuesta — solo formateo, no negocio. */
export function budgetSharePct(totalPrice, budget) {
  if (!budget || budget <= 0) return 0;
  return Math.round((totalPrice / budget) * 100);
}

/** true si NINGUNA de las 3 propuestas encontró ni una sola categoría. */
export function hasNoResultsAtAll(proposals) {
  return !Array.isArray(proposals) || proposals.every((p) => !p.categories || p.categories.length === 0);
}

/**
 * Ancho (0-100) de la barra visual de presupuesto. Reusa `budgetSharePct`
 * (que sí puede superar 100 cuando la propuesta excede el presupuesto) y solo
 * lo acota para que la barra nunca desborde su contenedor — el texto sigue
 * mostrando el porcentaje real sin acotar.
 */
export function budgetBarWidthPct(totalPrice, budget) {
  return Math.min(100, Math.max(0, budgetSharePct(totalPrice, budget)));
}

/**
 * Redondea un monto para la vista resumen (sin decimales de centavos) sin
 * tocar el valor real que sigue usándose para cálculos (%, restante, etc.).
 * Puramente presentacional — ver docs de este archivo.
 */
export function roundForDisplay(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return amount;
  return Math.round(Number(amount));
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// ─── Elegir menú/paquete ANTES de aceptar una propuesta ────────────────────
// Smart Packages arranca cada categoría con el paquete más barato compatible
// de su proveedor (smart-packages.service.js#fetchCandidatesForCategory) —
// ese es el sugerido/default, nunca una decisión final. Estas funciones
// puras permiten que el usuario cambie de paquete DENTRO de la propuesta
// (mismo proveedor/servicio, ver PackagePickerModal.js) sin recalcular
// ningún precio en el frontend: el número nuevo sale siempre de
// services/availabilityService.js#quotePreview (POST /services/:id/quote-preview).

/**
 * Arma el bloque `event` que espera quote-preview a partir del mismo estado
 * del formulario que ya usa buildSimulatePayload — mismo criterio de
 * location_token vencido (degrada a sin filtro de zona, nunca rechaza la
 * cotización entera).
 */
export function buildQuotePreviewEvent({ adults, children, eventDate, location }) {
  const tokenValid = !!location?.locationToken && !!location?.tokenExpiresAt
    && new Date(location.tokenExpiresAt).getTime() > Date.now();
  return {
    event_date: eventDate,
    adults_count: Number(adults) || 0,
    children_count: Number(children) || 0,
    ...(tokenValid
      ? { location_token: location.locationToken }
      : location?.formattedAddress ? { location_zone: location.formattedAddress } : {}),
  };
}

/**
 * true si un paquete es compatible con la cantidad de invitados del evento
 * — mismo criterio que smart-packages.service.js#effectiveCapacity/
 * isCompatibleCapacity (rango del paquete, si no está definido cae al rango
 * del servicio). quote-preview NO valida esto (ver nota en
 * services/availabilityService.js#quotePreview) — se filtra acá para no
 * ofrecer una alternativa que el motor original nunca hubiese aceptado;
 * igual el backend queda como autoridad final vía `available` al cotizar.
 */
export function isPackageGuestCompatible(pkg, service, totalGuests) {
  const min = pkg.minGuests ?? service?.minGuests ?? null;
  const max = pkg.maxGuests ?? service?.maxGuests ?? null;
  if (min != null && totalGuests < min) return false;
  if (max != null && totalGuests > max) return false;
  return true;
}

/**
 * true si un extra es válido para ESTE servicio — los extras
 * (service_extras) pertenecen al servicio, no al paquete (sin FK a
 * service_packages en el esquema real, confirmado antes de escribir esto):
 * un extra activo del servicio es compatible con cualquiera de sus
 * paquetes, sin excepción modelada hoy. `category.availableExtras` (ya
 * viene en la respuesta de simulate(), sin fetch nuevo) es la lista real.
 */
export function isExtraAvailable(extraId, availableExtras) {
  return (availableExtras || []).some((e) => e.id === extraId);
}

/**
 * Arma el override de una categoría al cambiar SOLO paquete/extras (mismo
 * proveedor/servicio — ver PackagePickerModal.js) a partir de la respuesta
 * de quotePreview. `estimated_total` de quote-preview ya incluye paquete +
 * extras (nunca traslado, ver nota en availabilityService.js) — se
 * recompone sumando el `category.travelCost` VIGENTE (el mismo proveedor de
 * siempre, así que su traslado no cambia). Identidad de proveedor/servicio
 * se copia tal cual de `category` — no cambian. Nunca calcula un precio
 * nuevo: solo combina números que ya vinieron del backend.
 *
 * `extrasSelected`: formato wire exacto (`[{id, quantity}]`, mismo que
 * items/import y el editor de Mi Evento) — nunca objetos de UI con
 * nombre/precio, eso se resuelve cruzando contra `availableExtras` al
 * mostrar.
 */
export function buildServiceOverride({ category, pkg, extrasSelected, quotePreviewResult }) {
  const basePrice = quotePreviewResult.quote_snapshot.amounts.estimated_total;
  return {
    providerId: category.providerId,
    providerName: category.providerName,
    providerLogo: category.providerLogo,
    providerVerified: category.providerVerified,
    rating: category.rating,
    reviewCount: category.reviewCount,
    capacity: category.capacity,
    distanceKm: category.distanceKm,
    serviceId: category.serviceId,
    serviceTitle: category.serviceTitle,
    servicePrimaryImage: category.servicePrimaryImage,
    packageId: pkg.id,
    packageName: pkg.name,
    includes: pkg.includes || [],
    extrasSelected: extrasSelected || [],
    basePrice,
    travelCost: category.travelCost,
    subtotal: round2(basePrice + (category.travelCost || 0)),
  };
}

/**
 * Arma un "candidato" a partir de la categoría VIGENTE (sugerida por el
 * motor, u overrideada) — mismo shape exacto que un `substitute` real
 * (`ApiProposalSubstitute`, ver smart-packages.service.js#toSubstitute) —
 * para que ProviderPickerModal.js pueda mostrar y comparar el proveedor
 * actual junto a las alternativas reales sin un shape especial, y para
 * poder detectar "el usuario volvió a elegir el mismo proveedor" (ver
 * isSameProvider) sin recotizar innecesariamente.
 */
export function currentProviderAsCandidate(category) {
  return {
    providerId: category.providerId,
    providerName: category.providerName,
    providerLogo: category.providerLogo,
    providerVerified: category.providerVerified,
    providerRating: category.rating,
    providerTotalReviews: category.reviewCount,
    serviceId: category.serviceId,
    serviceTitle: category.serviceTitle,
    servicePrimaryImage: category.servicePrimaryImage,
    packageId: category.packageId,
    packageName: category.packageName,
    includes: category.includes,
    capacity: category.capacity,
    travelCost: category.travelCost,
    categoryTotal: category.subtotal,
    distanceKm: category.distanceKm,
  };
}

/** true si un candidato (substitute o el actual, mismo shape) ES el
 * proveedor ya vigente en la categoría — para no recotizar/confirmar un
 * "cambio" que en realidad no cambia nada. */
export function isSameProvider(candidate, category) {
  return !!candidate && !!category && candidate.providerId === category.providerId;
}

/**
 * Arma el override de una categoría al CAMBIAR DE PROVEEDOR — a partir de un
 * candidato real (`category.substitutes[i]`, ya validado por el motor:
 * categoría/capacidad/cobertura/disponibilidad, ver smart-packages.service.js
 * #fetchCandidatesForCategory) y la respuesta de quotePreview para ESE
 * servicio/paquete nuevo. A diferencia de buildServiceOverride: TODA la
 * identidad de proveedor/servicio cambia (se copia del candidato, nunca de
 * la categoría vieja), `travelCost` es el del candidato (propio de ESE
 * proveedor — nunca se arrastra el traslado del anterior), y
 * `extrasSelected` siempre arranca en `[]` (los extras pertenecen al
 * servicio anterior, nunca se migran ni se mapean por nombre — ver
 * ProviderPickerModal.js).
 */
export function buildProviderOverride({ candidate, quotePreviewResult }) {
  const basePrice = quotePreviewResult.quote_snapshot.amounts.estimated_total;
  return {
    providerId: candidate.providerId,
    providerName: candidate.providerName,
    providerLogo: candidate.providerLogo,
    providerVerified: candidate.providerVerified,
    rating: candidate.providerRating,
    reviewCount: candidate.providerTotalReviews,
    capacity: candidate.capacity,
    distanceKm: candidate.distanceKm,
    serviceId: candidate.serviceId,
    serviceTitle: candidate.serviceTitle,
    servicePrimaryImage: candidate.servicePrimaryImage,
    packageId: candidate.packageId,
    packageName: candidate.packageName,
    includes: candidate.includes || [],
    extrasSelected: [],
    basePrice,
    travelCost: candidate.travelCost,
    subtotal: round2(basePrice + (candidate.travelCost || 0)),
  };
}

/**
 * Aplica los overrides de categoría (proveedor y/o paquete y/o extras, ver
 * buildServiceOverride/buildProviderOverride) sobre una propuesta original
 * del motor, recalculando totalPrice/remainingBudget/overBudget con la
 * MISMA fórmula que ya usa smart-packages.service.js#buildProposal (suma de
 * subtotales, budget-total, total>budget) — nunca una fórmula de precio
 * nueva, solo reagrega números que ya vinieron del backend. Reemplaza TODOS
 * los campos del override (nunca una mezcla parcial: si cambió el
 * proveedor, ningún dato visual del anterior sobrevive en la categoría
 * mostrada).
 */
export function applyProposalOverrides(proposal, budget, overridesByCategoryId) {
  if (!overridesByCategoryId || Object.keys(overridesByCategoryId).length === 0) return proposal;

  let changed = false;
  const categories = proposal.categories.map((cat) => {
    const o = overridesByCategoryId[cat.categoryId];
    if (!o) return cat;
    changed = true;
    return {
      ...cat,
      providerId: o.providerId,
      providerName: o.providerName,
      providerLogo: o.providerLogo,
      providerVerified: o.providerVerified,
      rating: o.rating,
      reviewCount: o.reviewCount,
      capacity: o.capacity,
      distanceKm: o.distanceKm,
      serviceId: o.serviceId,
      serviceTitle: o.serviceTitle,
      servicePrimaryImage: o.servicePrimaryImage,
      packageId: o.packageId,
      packageName: o.packageName,
      includes: o.includes,
      extrasSelected: o.extrasSelected,
      basePrice: o.basePrice,
      travelCost: o.travelCost,
      subtotal: o.subtotal,
      customized: true,
    };
  });
  if (!changed) return proposal;

  const totalPrice = round2(categories.reduce((sum, c) => sum + c.subtotal, 0));
  return {
    ...proposal,
    categories,
    totalPrice,
    remainingBudget: round2(budget - totalPrice),
    overBudget: totalPrice > budget,
  };
}
