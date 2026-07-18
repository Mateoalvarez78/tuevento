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
  return {
    budget: Number(budget),
    adults: Number(adults) || 0,
    children: Number(children) || 0,
    eventDate,
    location: {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: location.formattedAddress || null,
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
