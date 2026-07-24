// ─── LOCATIONS SERVICE ─────────────────────────────────────────────────────
// Cliente del proxy backend a Google Places API (New) (eventonow-back
// src/modules/locations). Nunca llama a Google directamente ni carga
// ninguna API key en el navegador — reemplaza a la integración anterior
// (hooks/useGoogleMapsScript.js + widget google.maps.places.Autocomplete),
// que quedó deprecada porque dependía de la API clásica de Places
// (deshabilitada) y de una key pública en el bundle.

import { api, buildQuery } from './api';

/** Un token de sesión por interacción de búsqueda (ver docs/SECURITY.md) —
 * lo genera el cliente, Google solo lo usa para agrupar la facturación de
 * un autocomplete + su Place Details. Nunca es un dato de negocio, no se
 * persiste. */
export function createLocationSessionToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `st-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const locationsService = {
  async autocomplete(input, sessionToken, { signal } = {}) {
    const res = await api.get(`/locations/autocomplete${buildQuery({ input, sessionToken })}`, { signal });
    return (res.data?.suggestions || []).map((s) => ({
      placeId: s.placeId,
      mainText: s.mainText || '',
      secondaryText: s.secondaryText || '',
      description: s.description || '',
    }));
  },

  async details(placeId, sessionToken, { signal } = {}) {
    const res = await api.get(`/locations/places/${encodeURIComponent(placeId)}${buildQuery({ sessionToken })}`, { signal });
    const d = res.data || {};
    return {
      placeId: d.placeId || null,
      address: d.formattedAddress || '',
      lat: typeof d.latitude === 'number' ? d.latitude : null,
      lng: typeof d.longitude === 'number' ? d.longitude : null,
      city: d.city || '',
      department: d.department || '',
      country: d.countryCode === 'UY' ? 'Uruguay' : (d.countryCode || ''),
      // Certifica que esta dirección salió realmente de Google Places — la
      // única forma en que POST /bookings acepta una ubicación (ver
      // docs/SECURITY.md). Vive solo en memoria del formulario, nunca se
      // persiste ni se guarda en localStorage.
      locationToken: d.locationToken || null,
      tokenExpiresAt: d.expiresAt || null,
    };
  },
};
