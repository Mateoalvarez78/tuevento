// ─── GOOGLE PLACES — VALIDACIÓN PURA ───────────────────────────────────────
// Sin dependencias de React/DOM — a diferencia de components/LocationAutocomplete.js
// (que tiene JSX y no se puede importar desde un test plano de Node), este
// módulo es JS puro y se puede testear con node:test sin mockear el navegador.

/**
 * ¿Esta ubicación normalizada alcanza para confirmar una reserva nueva?
 * Regla dura del wizard: nunca se guarda una zona aproximada o un texto
 * libre como si fuera una dirección validada — tiene que venir de una
 * selección real de Google Places, con dirección formateada y coordenadas
 * numéricas válidas.
 * @param {object|null} location - objeto devuelto por normalizePlace(), o el
 *   armado a mano por el fallback de zonas (que nunca pasa esta validación).
 */
export function isValidSelectedLocation(location) {
  return !!(
    location &&
    typeof location.address === 'string' && location.address.trim().length > 0 &&
    typeof location.lat === 'number' && Number.isFinite(location.lat) &&
    typeof location.lng === 'number' && Number.isFinite(location.lng)
  );
}
