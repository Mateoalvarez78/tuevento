// ─── MY EVENT SERVICE ───────────────────────────────────────────────────────
// Capa HTTP de "Mi evento" (client_events/client_event_items). Contrato real,
// auditado directo contra eventonow-back/src/modules/my-events (routes,
// controller, service, mapper, README.md) antes de escribir este archivo —
// no inventa endpoints ni campos.
//
// A diferencia del resto de services/*.js (ver docs/SERVICE_LAYER.md del
// repo de docs), ACÁ NO SE MAPEA snake_case → camelCase ni se recorta el
// objeto a una whitelist propia: el evento/items que devuelve el backend
// (my-events.mapper.js#mapEvent/mapItem) YA es la fuente única de verdad —
// incluye `quote_snapshot`/`selection_snapshot` (JSON versionados por el
// backend, `schema_version` propio) que una futura UI debe poder leer campo
// por campo tal cual el backend los define. Un mapper propio acá correría el
// riesgo de recortar u "olvidar" en silencio un campo que el backend agregue
// después — exactamente lo que las decisiones ya cerradas de esta etapa piden
// evitar ("no reconstruyas manualmente el evento", "no fusiones objetos que
// dejen atrás campos eliminados por backend"). Cada método devuelve
// `res.data` verbatim (o `null`, cuando el backend lo dice explícitamente).
//
// Fuera de alcance a propósito — no se inventa nada de esto:
//   - reordenar items (no existe endpoint real);
//   - archivar/restaurar un evento (no existe endpoint real — solo DELETE,
//     que es soft-delete completo del draft, no un archivado reversible);
//   - checkout/bookings/pagos (fuera del alcance de este módulo backend);
//   - idempotency_key (no existe en el contrato real de este módulo hoy).
//
// GET /me/events?limit=1 NUNCA se usa para descubrir el activo (no es
// confiable — ver auditoría: puede empatar entre el draft recién desactivado
// y el nuevo, porque createEvent corre ambos dentro de la misma transacción
// y Postgres NOW() es constante durante toda una transacción). El único
// mecanismo de descubrimiento es GET /me/events/active.

import { api, ApiError } from './api';

const BASE = '/me/events';

// ── Validaciones locales — solo lo mínimo para evitar un request evidentemente
// inválido (mismo código que usaría el backend para el mismo motivo, para no
// inventar una segunda taxonomía de errores). Nunca duplica reglas de rango
// (adults_count/children_count/budget_approx/celiacs_count/extra_hours/etc.)
// — esas son y siguen siendo responsabilidad exclusiva del backend.
function localValidationError(message, code) {
  // status 0 marca a propósito "nunca llegó a salir un request" — distinto
  // de cualquier status HTTP real devuelto por el backend.
  return new ApiError(message, 0, code);
}

function requireVersion(expectedVersion) {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    throw localValidationError('version es requerida y debe ser un entero positivo', 'VERSION_REQUIRED');
  }
}

function bodyWithVersion(fields, expectedVersion) {
  requireVersion(expectedVersion);
  return { ...(fields || {}), version: expectedVersion };
}

export const myEventService = {
  /**
   * GET /me/events/active — único mecanismo de descubrimiento aprobado del
   * borrador activo. Estrictamente de solo lectura del lado del backend (no
   * crea, no revalida, no modifica version, no reactiva nada).
   * @param {{signal?: AbortSignal}} [options]
   * @returns {Promise<object|null>} evento canónico completo (con items[]),
   *   o `null` si no hay ningún borrador activo — el `data:null` explícito
   *   del backend se conserva tal cual, nunca se convierte en `undefined`.
   */
  async getActiveDraft({ signal } = {}) {
    const res = await api.get(`${BASE}/active`, { signal });
    return res.data;
  },

  /**
   * GET /me/events/:eventId — detalle + items. Lectura pura, sin efectos
   * secundarios (no revalida, no toca `updated_at`/`version`).
   * @param {{signal?: AbortSignal}} [options]
   */
  async getEvent(eventId, { signal } = {}) {
    const res = await api.get(`${BASE}/${eventId}`, { signal });
    return res.data;
  },

  /**
   * POST /me/events — crea un borrador nuevo. Todos los campos son
   * opcionales (el backend aplica sus propios defaults: `status:'draft'`,
   * `version:1`, `items:[]`). Nunca manda `version` (no aplica a creación).
   * Si el cliente ya tenía un borrador activo, el backend lo desactiva (no
   * lo borra) automáticamente — comportamiento del backend, no de acá.
   * @param {{event_type?, event_date?, adults_count?, children_count?,
   *   budget_approx?, location_zone?, location_token?}} [payload]
   */
  async createEvent(payload = {}) {
    const res = await api.post(BASE, payload);
    return res.data;
  },

  /**
   * PATCH /me/events/:eventId — actualiza SOLO datos generales del evento.
   * El propio backend garantiza que nunca toca ningún campo de item. Requiere
   * `expectedVersion` (concurrencia optimista — ver hooks/useMyEventState.js
   * para la estrategia de versión elegida).
   */
  async updateEvent(eventId, payload, expectedVersion) {
    const res = await api.patch(`${BASE}/${eventId}`, bodyWithVersion(payload, expectedVersion));
    return res.data;
  },

  /**
   * DELETE /me/events/:eventId — soft delete del evento y, en cascada, de
   * todos sus items (mismo contrato de backend, misma transacción). No hay
   * archivar/restaurar en el contrato real — no se inventa acá.
   * @returns {Promise<undefined>} el backend no devuelve `data` en este
   *   endpoint (su `success()` la omite cuando es `null`) — no hay contenido
   *   canónico que propagar. El caller es responsable de limpiar su propio
   *   estado del evento a `null` tras un `await` exitoso.
   */
  async deleteEvent(eventId, expectedVersion) {
    const res = await api.delete(`${BASE}/${eventId}`, bodyWithVersion({}, expectedVersion));
    return res.data; // undefined a propósito, ver arriba
  },

  /**
   * POST /me/events/:eventId/items — agrega un componente. `service_id` es
   * el único campo verdaderamente requerido (mismo motivo que el backend:
   * `SERVICE_ID_REQUIRED`) — se valida acá antes de salir a red para evitar
   * un round-trip evidentemente inútil, nunca se duplican los demás rangos
   * (extras_selected/adults_count_override/celiacs_count/extra_hours: los
   * valida el backend).
   */
  async addItem(eventId, payload, expectedVersion) {
    if (!payload || typeof payload.service_id !== 'string' || !payload.service_id) {
      throw localValidationError('service_id es requerido para agregar un componente', 'SERVICE_ID_REQUIRED');
    }
    const res = await api.post(`${BASE}/${eventId}/items`, bodyWithVersion(payload, expectedVersion));
    return res.data;
  },

  /**
   * PATCH /me/events/:eventId/items/:itemId — edita paquete/extras/
   * cantidades de un item existente (mismo servicio — el backend ignora
   * `service_id` si se manda, nunca lo cambia).
   */
  async updateItem(eventId, itemId, payload, expectedVersion) {
    const res = await api.patch(`${BASE}/${eventId}/items/${itemId}`, bodyWithVersion(payload, expectedVersion));
    return res.data;
  },

  /**
   * PUT /me/events/:eventId/items/:itemId — reemplaza atómicamente el
   * `service_id` (y su cotización/snapshot) de un item existente, "cambiar
   * un servicio sin perder el resto del evento". Único método que puede
   * cambiar de qué servicio es un item — `updateItem` (PATCH) lo prohíbe a
   * propósito, igual que el backend. `service_id` es requerido (mismo
   * motivo que `addItem`).
   */
  async replaceItem(eventId, itemId, payload, expectedVersion) {
    if (!payload || typeof payload.service_id !== 'string' || !payload.service_id) {
      throw localValidationError('service_id es requerido para reemplazar un componente', 'SERVICE_ID_REQUIRED');
    }
    const res = await api.put(`${BASE}/${eventId}/items/${itemId}`, bodyWithVersion(payload, expectedVersion));
    return res.data;
  },

  /**
   * DELETE /me/events/:eventId/items/:itemId — soft delete de un item.
   */
  async removeItem(eventId, itemId, expectedVersion) {
    const res = await api.delete(`${BASE}/${eventId}/items/${itemId}`, bodyWithVersion({}, expectedVersion));
    return res.data;
  },

  /**
   * POST /me/events/:eventId/items/import — acepta una propuesta completa
   * (varios componentes) de forma ATÓMICA: todo o nada. Reemplaza al patrón
   * "un POST /items por categoría" (que dejaba la propuesta a medio guardar
   * si un componente fallaba a mitad de camino) — acá el backend valida y
   * cotiza TODOS los componentes dentro de una sola transacción, y si
   * cualquiera falla hace rollback completo (ningún item queda persistido).
   * `event_patch` es opcional: datos generales del evento a aplicar en la
   * MISMA transacción (ver my-events README) — nunca se manda
   * `quote_snapshot`/`selection_snapshot`/precios calculados acá, el backend
   * los reconstruye siempre server-side.
   * @param {{items: Array<{service_id:string, package_id?:string}>, event_patch?: object}} payload
   */
  async importItems(eventId, payload, expectedVersion) {
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw localValidationError('items es requerido y debe tener al menos un elemento', 'ITEMS_REQUIRED');
    }
    for (const item of payload.items) {
      if (!item || typeof item.service_id !== 'string' || !item.service_id) {
        throw localValidationError('cada item de la propuesta requiere service_id', 'SERVICE_ID_REQUIRED');
      }
    }
    const res = await api.post(`${BASE}/${eventId}/items/import`, bodyWithVersion(payload, expectedVersion));
    return res.data;
  },

  /**
   * POST /me/events/:eventId/revalidate — reconcilia TODOS los items
   * activos contra el catálogo/disponibilidad actual. Shape de respuesta
   * DISTINTO al resto (`{event, summary}`, no solo el evento) — se conserva
   * tal cual, nunca se aplana ni se descarta `summary`.
   */
  async revalidateEvent(eventId, expectedVersion) {
    const res = await api.post(`${BASE}/${eventId}/revalidate`, bodyWithVersion({}, expectedVersion));
    return res.data; // { event, summary }
  },
};

/**
 * Clasifica (sin reemplazar) un error atrapado al llamar a myEventService,
 * para que un consumidor (hook/UI futura) pueda reaccionar sin repetir
 * `instanceof`/chequeos de `.name` en cada callsite. NO es un segundo sistema
 * de errores — no reemplaza a `ApiError` (que sigue siendo lo que se
 * lanza/guarda), es una función pura de lectura sobre lo ya lanzado.
 *
 * - 'client_validation': una de las guardas locales de arriba (nunca salió
 *   un request — service_id faltante, version faltante/inválida).
 * - 'api': el backend respondió con un status no-2xx (`status`/`code`/
 *   `reasonCode`/`message` tal cual los dio, incluye 401/403/404/409/429).
 * - 'aborted': se canceló mediante AbortController — no es un error real
 *   para mostrarle al usuario.
 * - 'network': `fetch` en sí rechazó (sin conexión, DNS, CORS, etc.) — el
 *   backend nunca llegó a responder.
 */
export function classifyMyEventError(err) {
  if (err instanceof ApiError) {
    if (err.status === 0) {
      return { kind: 'client_validation', code: err.code, message: err.message };
    }
    return { kind: 'api', status: err.status, code: err.code, reasonCode: err.reasonCode, message: err.message };
  }
  if (err && err.name === 'AbortError') {
    return { kind: 'aborted', message: err.message || 'Solicitud cancelada' };
  }
  return { kind: 'network', message: (err && err.message) || 'No se pudo conectar con el servidor' };
}
