// ─── useMyEventState ─────────────────────────────────────────────────────
// Máquina de estados en memoria del borrador activo de "Mi evento"
// (client_events). Hook PURO, sin JSX a propósito — Vitest en este repo no
// puede transformar/importar archivos `.js` que contengan JSX (limitación de
// vite-node/SSR ya diagnosticada, ver la sección "Vitest en el frontend" de
// docs/DECISIONS.md del repo de docs — mismo motivo por el que
// hooks/useDialog.js tampoco tiene JSX). Mantener toda la lógica acá permite
// testearla de punta a punta con @testing-library/react#renderHook, sin
// tocar React.createElement/JSX en ningún lado. El wrapper con JSX
// (`MyEventContext`/`MyEventProvider`) vive aparte, en lib/MyEventContext.js,
// y delega el 100% de la lógica a este hook — no queda nada relevante sin
// cobertura de test por vivir en el archivo con JSX.
//
// Recibe `user`/`authLoading` como PARÁMETROS explícitos (no llama a
// useApp() internamente) — dos motivos: (1) mantiene este archivo libre de
// cualquier import transitivo hacia lib/AppContext.js, que sí tiene JSX, por
// el mismo motivo de arriba; (2) hace que cada transición de auth
// (loading→listo, con/sin usuario, cambio de rol) sea 100% reproducible en
// un test vía `rerender`, sin tener que simular un AppProvider real.
//
// Backend real (eventonow-back/src/modules/my-events, auditado antes de
// escribir esto): un solo borrador activo por cliente, concurrencia
// optimista por `version`, snapshots que arma el backend. Nada de esto se
// recalcula ni se reconstruye acá — cada mutación exitosa reemplaza el
// evento en memoria con la respuesta canónica completa, tal cual vino.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/api';
import { myEventService } from '../services/myEventService';

const CONFLICT_MESSAGE =
  'Tu evento cambió en otra pestaña o dispositivo. Actualizamos la información. ' +
  'Revisá los cambios antes de volver a intentarlo.';

/**
 * @param {{id: string, role: string}|null} user - mismo shape que expone
 *   AppContext (GET /auth/me) — solo se leen `id`/`role`.
 * @param {boolean} authLoading - true mientras AppContext todavía está
 *   restaurando la sesión (rehydrate inicial) — mientras sea true, este hook
 *   nunca llama a ningún endpoint.
 */
export function useMyEventState(user, authLoading) {
  // Estado expuesto.
  const [event, setEventState] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'
  const [loadError, setLoadError] = useState(null);
  const [mutatingKeys, setMutatingKeys] = useState([]);
  const [lastOperation, setLastOperation] = useState(null);
  const [conflict, setConflict] = useState(null);

  // Refs internas — nunca disparan re-render por sí mismas, existen para que
  // las funciones expuestas (estables vía useCallback con deps vacías) lean
  // siempre el valor MÁS FRESCO en el momento de ejecutarse, nunca uno
  // capturado por closure en el render en que se creó la función.
  const eventRef = useRef(null);
  const isMountedRef = useRef(true);
  const sessionIdRef = useRef(0); // cambia con cada transición de auth relevante
  const mutatingKeysRef = useRef(new Set());
  const loadGenerationRef = useRef(0); // cambia con cada lectura (auto-carga o refresh) nueva
  const loadAbortControllerRef = useRef(null);

  const applyEvent = useCallback((nextEvent) => {
    eventRef.current = nextEvent;
    setEventState(nextEvent);
  }, []);

  // ── Doble-submit: SOLO para mutaciones (POST/PATCH/DELETE con efecto de
  // negocio) — una segunda llamada con la misma clave mientras la primera
  // sigue en vuelo se rechaza sin llegar a red. Las lecturas (refresh) usan
  // una estrategia distinta, "la última gana" (ver runRead) — no tiene
  // sentido rechazar un refresh más nuevo solo porque uno viejo no terminó.
  const beginOperation = (key) => {
    if (mutatingKeysRef.current.has(key)) return false;
    mutatingKeysRef.current.add(key);
    setMutatingKeys(Array.from(mutatingKeysRef.current));
    return true;
  };
  const endOperation = (key) => {
    mutatingKeysRef.current.delete(key);
    setMutatingKeys(Array.from(mutatingKeysRef.current));
  };

  // ── Conflicto de versión (DRAFT_VERSION_CONFLICT) ─────────────────────
  // Exactamente UN intento de GET de recuperación, nunca reintenta la
  // mutación que falló. Separa con claridad los dos resultados posibles del
  // refresh (éxito/fracaso) para que una futura UI pueda mostrar ambos casos
  // sin loops.
  const resolveVersionConflict = useCallback(async (operationKey) => {
    const eventId = eventRef.current?.id;
    const base = {
      type: 'DRAFT_VERSION_CONFLICT',
      operation: operationKey,
      occurredAt: Date.now(),
      message: CONFLICT_MESSAGE,
    };
    if (!eventId) {
      setConflict({ ...base, refreshed: false, refreshError: null });
      return;
    }
    try {
      const fresh = await myEventService.getEvent(eventId);
      if (!isMountedRef.current) return;
      applyEvent(fresh);
      setConflict({ ...base, refreshed: true, refreshError: null });
    } catch (refreshErr) {
      if (!isMountedRef.current) return;
      setConflict({ ...base, refreshed: false, refreshError: refreshErr });
    }
  }, [applyEvent]);

  const dismissConflict = useCallback(() => setConflict(null), []);

  // ── Wrapper genérico de mutación ───────────────────────────────────────
  // `applyResult`/`extraSuccessFields` son los únicos puntos de
  // personalización por método — todo lo demás (guarda de doble-submit,
  // guarda de sesión obsoleta, manejo de 409, registro de última operación)
  // es un solo camino, sin duplicar la lógica en cada mutación expuesta.
  const runMutation = useCallback(async (key, fn, { applyResult, extraSuccessFields } = {}) => {
    if (!beginOperation(key)) {
      throw new ApiError('Ya hay una operación de este tipo en curso', 0, 'OPERATION_IN_PROGRESS');
    }
    const mySession = sessionIdRef.current;
    try {
      const result = await fn();
      if (sessionIdRef.current === mySession && isMountedRef.current) {
        (applyResult || ((r) => applyEvent(r)))(result);
        setLastOperation({
          type: key,
          status: 'success',
          at: Date.now(),
          ...(extraSuccessFields ? extraSuccessFields(result) : null),
        });
        setConflict(null);
      }
      return result;
    } catch (err) {
      if (sessionIdRef.current === mySession && isMountedRef.current) {
        if (err instanceof ApiError && err.code === 'DRAFT_VERSION_CONFLICT') {
          await resolveVersionConflict(key);
        } else {
          setLastOperation({ type: key, status: 'error', error: err, at: Date.now() });
        }
      }
      throw err;
    } finally {
      endOperation(key);
    }
  }, [applyEvent, resolveVersionConflict]);

  // ── Lecturas (auto-carga inicial + refresh explícito) ──────────────────
  // "La más nueva gana": cada llamada aborta la lectura anterior en vuelo (si
  // la hay) e incrementa una generación — cuando una respuesta vieja llega
  // tarde, se descarta sola por no matchear la generación vigente. Cubre a
  // la vez: dos refresh simultáneos, una respuesta tardía de la sesión
  // anterior, y Strict Mode (mount→cleanup→mount monta dos veces en dev; el
  // cleanup aborta la primera antes de que la segunda dispare).
  const runRead = useCallback(async (fetcher) => {
    loadGenerationRef.current += 1;
    const myGeneration = loadGenerationRef.current;
    if (loadAbortControllerRef.current) loadAbortControllerRef.current.abort();
    const controller = new AbortController();
    loadAbortControllerRef.current = controller;
    setStatus('loading');
    setLoadError(null);
    try {
      const result = await fetcher(controller.signal);
      if (loadGenerationRef.current !== myGeneration || !isMountedRef.current) return result;
      applyEvent(result);
      setStatus('ready');
      return result;
    } catch (err) {
      if (loadGenerationRef.current !== myGeneration || !isMountedRef.current) {
        return undefined; // superada por una lectura más nueva o el componente ya se desmontó — no se pisa nada
      }
      if (err && err.name === 'AbortError') return undefined; // cancelada a propósito, no es un error real
      setStatus('error');
      setLoadError(err);
      throw err;
    }
  }, [applyEvent]);

  const refreshActiveEvent = useCallback(
    () => runRead((signal) => myEventService.getActiveDraft({ signal })),
    [runRead]
  );

  const refreshEvent = useCallback((eventId) => {
    const id = eventId || eventRef.current?.id;
    if (!id) return Promise.resolve(null); // nada que refrescar todavía — no-op explícito, no error
    return runRead((signal) => myEventService.getEvent(id, { signal }));
  }, [runRead]);

  // ── Ciclo de vida: auth restaurándose / sin sesión / rol no-cliente / cliente ──
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (loadAbortControllerRef.current) loadAbortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    // A. Sesión todavía restaurándose: no se llama a ningún endpoint, y la
    // ausencia temporal de `user` (todavía no rehidrató) NUNCA se trata como
    // logout — se espera a que authLoading baje.
    if (authLoading) return;

    // Toda transición de auth relevante invalida cualquier mutación/lectura
    // en vuelo que perteneciera a la sesión anterior (logout durante un
    // request, cambio de usuario) — cuando esa promesa resuelva tarde, los
    // chequeos de `sessionIdRef`/`loadGenerationRef` en runMutation/runRead
    // van a ignorarla.
    sessionIdRef.current += 1;

    // B. No autenticado, o D. rol distinto de cliente (provider/admin/
    // superadmin — ver lib/roles.js#ROLES; ningún rol puede "actuar también
    // como cliente" en el modelo real, cada usuario tiene un único `role`):
    // limpiar cualquier evento de una sesión anterior, sin llamar a nada.
    if (!user || user.role !== 'client') {
      loadGenerationRef.current += 1;
      const myGeneration = loadGenerationRef.current;
      if (loadAbortControllerRef.current) {
        loadAbortControllerRef.current.abort();
        loadAbortControllerRef.current = null;
      }
      // Diferido a un microtask a propósito — nunca setState síncrono
      // dentro del cuerpo del efecto (react-hooks/set-state-in-effect).
      // Mismo chequeo de generación que runRead: si un efecto más nuevo ya
      // corrió antes de que este microtask se ejecute, no pisa su resultado.
      Promise.resolve().then(() => {
        if (!isMountedRef.current || loadGenerationRef.current !== myGeneration) return;
        applyEvent(null);
        setStatus('ready');
        setLoadError(null);
        setConflict(null);
      });
      return;
    }

    // C. Cliente autenticado: una sola carga del borrador activo. `data:null`
    // del backend se conserva tal cual (nunca se crea un borrador acá).
    // Se difiere solo la INVOCACIÓN a un microtask — refreshActiveEvent llama
    // a setStatus('loading') de forma síncrona en su primer tramo (antes del
    // primer await de runRead), así que llamarla directo acá también dispara
    // react-hooks/set-state-in-effect. runRead ya tiene su propio control de
    // generación/aborto interno para lecturas superpuestas — no hace falta
    // duplicarlo acá, solo evitar el setState síncrono de este primer tramo.
    Promise.resolve().then(() => {
      if (!isMountedRef.current) return;
      refreshActiveEvent().catch(() => {
        // el error ya quedó reflejado en status/loadError dentro de runRead —
        // este catch solo evita un unhandled rejection.
      });
    });
    // `user` (el objeto completo) se deja fuera a propósito — este efecto
    // solo le importan `id`/`role` (ya en las deps); reaccionar a cualquier
    // otro cambio de referencia de `user` dispararía una recarga innecesaria
    // del borrador (mismo criterio que dashboard/cliente#page.js con
    // `JSON.stringify(favorites)`). Si `id`/`role` no cambiaron, seguir
    // leyendo la referencia de `user` de la última vez que el efecto corrió
    // es seguro: su `.role` es idéntico por definición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, user?.role, applyEvent, refreshActiveEvent]);

  // ── API expuesta ────────────────────────────────────────────────────────
  // Estrategia de `version` (única, ver hooks/useMyEventState.js en el
  // informe de cierre para la justificación completa): OPCIÓN A — el caller
  // siempre pasa `expectedVersion` explícito. El hook nunca lo completa
  // solo leyendo `event.version` del closure — así cada mutación queda
  // auditable en el propio call-site (quien llama ve exactamente qué
  // versión mandó) y la función expuesta puede quedar con identidad estable
  // (useCallback con deps vacías) sin arriesgar una versión obsoleta
  // "silenciosa": si el caller manda una vieja, el 409 del backend lo va a
  // decir, nunca queda oculto.
  const createEvent = useCallback(
    (payload) => runMutation('createEvent', () => myEventService.createEvent(payload)),
    [runMutation]
  );

  const updateEvent = useCallback((payload, expectedVersion) => {
    const eventId = eventRef.current?.id;
    if (!eventId) return Promise.reject(new ApiError('No hay un evento activo para actualizar', 0, 'NO_ACTIVE_EVENT'));
    return runMutation('updateEvent', () => myEventService.updateEvent(eventId, payload, expectedVersion));
  }, [runMutation]);

  const deleteEvent = useCallback((expectedVersion) => {
    const eventId = eventRef.current?.id;
    if (!eventId) return Promise.reject(new ApiError('No hay un evento activo para eliminar', 0, 'NO_ACTIVE_EVENT'));
    return runMutation('deleteEvent', () => myEventService.deleteEvent(eventId, expectedVersion), {
      applyResult: () => applyEvent(null),
    });
  }, [runMutation, applyEvent]);

  const addItem = useCallback((payload, expectedVersion) => {
    const eventId = eventRef.current?.id;
    if (!eventId) return Promise.reject(new ApiError('No hay un evento activo para agregar un componente', 0, 'NO_ACTIVE_EVENT'));
    return runMutation('addItem', () => myEventService.addItem(eventId, payload, expectedVersion));
  }, [runMutation]);

  // "Aceptar una propuesta completa" (varios componentes a la vez) — una
  // sola mutación atómica (todo o nada, ver services/myEventService.js e
  // eventonow-back/src/modules/my-events/README.md), nunca una secuencia de
  // addItem: reutiliza el mismo runMutation genérico, así que hereda gratis
  // la guarda de doble-submit (clave propia 'importItems'), el manejo de
  // DRAFT_VERSION_CONFLICT (un solo refresh, nunca reintenta sola) y el
  // reemplazo del evento en memoria por la respuesta canónica completa.
  const importItems = useCallback((payload, expectedVersion) => {
    const eventId = eventRef.current?.id;
    if (!eventId) return Promise.reject(new ApiError('No hay un evento activo para importar componentes', 0, 'NO_ACTIVE_EVENT'));
    return runMutation('importItems', () => myEventService.importItems(eventId, payload, expectedVersion));
  }, [runMutation]);

  const updateItem = useCallback((itemId, payload, expectedVersion) => {
    const eventId = eventRef.current?.id;
    if (!eventId) return Promise.reject(new ApiError('No hay un evento activo', 0, 'NO_ACTIVE_EVENT'));
    return runMutation(`updateItem:${itemId}`, () => myEventService.updateItem(eventId, itemId, payload, expectedVersion));
  }, [runMutation]);

  const removeItem = useCallback((itemId, expectedVersion) => {
    const eventId = eventRef.current?.id;
    if (!eventId) return Promise.reject(new ApiError('No hay un evento activo', 0, 'NO_ACTIVE_EVENT'));
    return runMutation(`removeItem:${itemId}`, () => myEventService.removeItem(eventId, itemId, expectedVersion));
  }, [runMutation]);

  // "Cambiar un servicio sin perder el resto" — reemplazo atómico (PUT),
  // nunca DELETE+POST desde acá (ver services/myEventService.js#replaceItem
  // y el README del backend para el razonamiento completo de por qué eso
  // sería inseguro). Misma clave de doble-submit por item que updateItem/
  // removeItem — un reemplazo en curso del mismo item bloquea uno nuevo,
  // pero no bloquea mutaciones de otros items.
  const replaceItem = useCallback((itemId, payload, expectedVersion) => {
    const eventId = eventRef.current?.id;
    if (!eventId) return Promise.reject(new ApiError('No hay un evento activo', 0, 'NO_ACTIVE_EVENT'));
    return runMutation(`replaceItem:${itemId}`, () => myEventService.replaceItem(eventId, itemId, payload, expectedVersion));
  }, [runMutation]);

  const revalidateEvent = useCallback((expectedVersion) => {
    const eventId = eventRef.current?.id;
    if (!eventId) return Promise.reject(new ApiError('No hay un evento activo para revalidar', 0, 'NO_ACTIVE_EVENT'));
    return runMutation('revalidateEvent', () => myEventService.revalidateEvent(eventId, expectedVersion), {
      applyResult: (result) => applyEvent(result.event),
      extraSuccessFields: (result) => ({ summary: result.summary }),
    });
  }, [runMutation, applyEvent]);

  return {
    event,
    status,
    loadError,
    mutatingKeys,
    lastOperation,
    conflict,
    dismissConflict,
    refreshActiveEvent,
    refreshEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    addItem,
    importItems,
    updateItem,
    replaceItem,
    removeItem,
    revalidateEvent,
  };
}
