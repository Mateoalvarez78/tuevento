// ─── SMART PACKAGES SERVICE ────────────────────────────────────────────────
// Único punto de contacto con POST /smart-packages/simulate. El backend ya
// devuelve la respuesta en camelCase (mismo shape que consume la UI) — no
// hace falta mapear snake_case→camelCase acá, a diferencia de otros services
// que sí lo hacen (ver docs/SERVICE_LAYER.md). Ningún cálculo de negocio vive
// acá: precio, traslado, ranking y disponibilidad son responsabilidad
// exclusiva del backend.

import { api } from './api';

export const smartPackagesService = {
  /**
   * @param {object} payload - shape exacto de lib/smartPackages.js#buildSimulatePayload
   * @returns {Promise<{ input: object, proposals: object[] }>}
   */
  async simulate(payload) {
    const res = await api.post('/smart-packages/simulate', payload);
    return res.data;
  },
};
