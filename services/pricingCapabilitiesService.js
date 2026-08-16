import { api } from './api';

// ─── CAPACIDADES DE PRICING ───────────────────────────────────────────────────
// Única fuente de verdad sobre qué modelos de precio están habilitados
// comercialmente. La web NUNCA mantiene su propia copia de los flags del
// backend: los consulta acá (GET /services/pricing-capabilities) y decide la
// UI con eso. La validación autoritativa sigue siendo server-side — si esta
// respuesta quedara desactualizada, el peor caso es una UI momentáneamente
// inconsistente, nunca una contratación incorrecta.
//
// El endpoint es público (no expone datos de proveedor ni de negocio, solo
// capacidades del backend) y devuelve, por modelo:
//   publishable         — puede estar activo/visible en el catálogo
//   directBookable      — se puede cotizar y reservar por el flujo normal
//   quoteRequestEnabled — existe el flujo de solicitar presupuesto
//   supportedByChannel  — este cliente (web) sabe configurarlo
export const pricingCapabilitiesService = {
  async get() {
    const res = await api.get('/services/pricing-capabilities');
    return mapCapabilities(res.data);
  },
};

export function mapCapabilities(raw) {
  if (!raw) return null;
  return {
    models: raw.models || [],
    publishable: raw.publishable || {},
    directBookable: raw.directBookable || {},
    quoteRequestEnabled: raw.quoteRequestEnabled || {},
    supportedByChannel: raw.supportedByChannel || {},
    channel: raw.channel ?? null,
    errorCodes: raw.error_codes || {},
  };
}
