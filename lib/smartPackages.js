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
