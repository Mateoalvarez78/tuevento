// ─── pendingIntent ──────────────────────────────────────────────────────
// Intención mínima para reanudar una acción de "Mi evento" después de un
// login/registro intercalado (elegir una propuesta del generador, agregar
// un servicio desde la ficha). `sessionStorage` a propósito (no
// localStorage): no debe sobrevivir más que la pestaña/sesión actual.
//
// Nunca guarda: JWT, location_token, quote_snapshot/selection_snapshot,
// precios calculados, ni ninguna respuesta completa del backend — solo los
// IDs/valores mínimos para poder repetir la llamada real una vez
// autenticado (la cotización se recalcula siempre en el backend en ese
// momento, nunca se "reutiliza" una vieja).
const KEY = 'te_pending_my_event_intent';
const TTL_MS = 30 * 60 * 1000; // 30 min — mismo orden que la vida del location_token

export function savePendingIntent(intent) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...intent, savedAt: Date.now() }));
  } catch {
    // storage no disponible (navegación privada, cuota llena, etc.) — no
    // debe romper el flujo, el usuario simplemente repite la acción a mano.
  }
}

/** Lee la intención pendiente si no expiró; la descarta (y borra) si expiró. */
export function readPendingIntent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > TTL_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingIntent() {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(KEY); } catch { /* noop */ }
}
