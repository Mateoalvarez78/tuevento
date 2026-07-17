// ─── GOOGLE PLACES — NORMALIZACIÓN PURA ────────────────────────────────────
// Sin dependencias de React/DOM — a diferencia de components/LocationAutocomplete.js
// (que tiene JSX y no se puede importar desde un test plano de Node), este
// módulo es JS puro y se puede testear con node:test sin mockear el navegador.
// Extraído de LocationAutocomplete.js — mismo comportamiento, sin duplicar lógica.

/**
 * Normaliza un google.maps.places.PlaceResult (o el objeto equivalente que
 * devuelva el widget de autocomplete) a la forma que usa el resto de la app.
 * @param {object} place
 */
export function normalizePlace(place) {
  const comps = place.address_components || [];
  const find = (type) => comps.find((c) => c.types.includes(type))?.long_name || '';
  const loc = place.geometry?.location;
  return {
    label: place.formatted_address || place.name || '',
    address: place.formatted_address || place.name || '',
    placeId: place.place_id || null,
    lat: loc ? loc.lat() : null,
    lng: loc ? loc.lng() : null,
    city: find('locality') || find('sublocality') || find('administrative_area_level_2') || '',
    department: find('administrative_area_level_1') || '',
    country: find('country') || '',
  };
}

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
