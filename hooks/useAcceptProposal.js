// ─── useAcceptProposal ──────────────────────────────────────────────────
// "Elegir una propuesta del generador" → aplicar datos generales al borrador
// canónico + agregar TODOS los servicios de la propuesta en una única
// mutación atómica (todo o nada) — ver
// eventonow-back/src/modules/my-events/README.md#POST-.../items/import.
//
// Recibe `user`/`event`/`myEventStatus`/`createEvent`/`importItems`/`router`
// como PARÁMETROS explícitos (no llama a useApp()/useMyEvent()/useRouter()
// internamente) — mismo motivo que hooks/useMyEventState.js recibe
// `user`/`authLoading` en vez de llamar useApp(): mantiene este archivo
// libre de imports transitivos hacia lib/AppContext.js/lib/MyEventContext.js,
// que sí tienen JSX y no se pueden importar en un test de Vitest en este
// repo (confirmado empíricamente — falla al parsear, mismo límite ya
// documentado). El wrapper real (components/smart-packages/
// SmartPackagesGenerator.js) sí llama a esos hooks y le pasa el resultado
// acá — no tiene test de render propio, mismo criterio que MyEventContext.js.
//
// Por qué ya NO es una secuencia de addItem: una falla a mitad de camino
// dejaba la propuesta parcialmente guardada, sin forma de deshacer lo ya
// persistido — inaceptable para "elegir una propuesta" (o se guarda entera,
// o no se guarda nada). `importItems` (hooks/useMyEventState.js, que delega
// en myEventService.importItems → POST .../items/import) hace exactamente
// eso: un solo POST, una sola transacción en el backend, rollback completo
// si cualquier componente falla. Ya no existe un estado "partial".
//
// Reutiliza únicamente lib/pendingIntent.js + las dos acciones de
// useMyEvent() que le pasan — no duplica estado, no inventa un segundo
// "carrito".
import { useCallback, useEffect, useRef, useState } from 'react';
import { savePendingIntent, readPendingIntent, clearPendingIntent } from '../lib/pendingIntent';

const LOGIN_NEXT_PATH = '/armar-evento';

function serializeEventDataForIntent(eventData) {
  return {
    eventType: eventData.eventType || '',
    budget: eventData.budget,
    adults: eventData.adults,
    children: eventData.children,
    eventDate: eventData.eventDate,
    // Nunca se guarda locationToken/tokenExpiresAt acá (ver lib/pendingIntent.js)
    // — al reanudar tras login, la ubicación siempre cae a location_zone
    // (no verificada), nunca a un token que ya no sobrevive el viaje.
    location: eventData.location ? {
      lat: eventData.location.lat,
      lng: eventData.location.lng,
      formattedAddress: eventData.location.formattedAddress || null,
    } : null,
  };
}

function serializeCategoriesForIntent(categories) {
  return categories.map((c) => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    serviceId: c.serviceId,
    packageId: c.packageId || null,
  }));
}

function buildLocationFields(location) {
  if (!location) return {};
  const tokenValid = !!location.locationToken && !!location.tokenExpiresAt
    && new Date(location.tokenExpiresAt).getTime() > Date.now();
  if (tokenValid) return { location_token: location.locationToken };
  if (location.formattedAddress) return { location_zone: location.formattedAddress };
  return {};
}

function buildGeneralPayload(eventData) {
  return {
    ...(eventData.eventType ? { event_type: eventData.eventType } : {}),
    budget_approx: eventData.budget != null && eventData.budget !== '' ? Number(eventData.budget) : null,
    adults_count: Number(eventData.adults) || 0,
    children_count: Number(eventData.children) || 0,
    event_date: eventData.eventDate || null,
    ...buildLocationFields(eventData.location),
  };
}

function buildImportItems(categories) {
  return categories.map((c) => ({
    service_id: c.serviceId,
    ...(c.packageId ? { package_id: c.packageId } : {}),
  }));
}

/**
 * @param {{id:string, role:string}|null} user
 * @param {object|null} event - evento canónico actual (useMyEvent().event)
 * @param {string} myEventStatus - useMyEvent().status
 * @param {(payload:object)=>Promise<object>} createEvent
 * @param {(payload:{items:Array, event_patch?:object}, expectedVersion:number)=>Promise<object>} importItems
 * @param {{push:(path:string)=>void}} router - de next/navigation#useRouter()
 */
export function useAcceptProposal({ user, event, myEventStatus, createEvent, importItems, router }) {
  const [acceptStatus, setAcceptStatus] = useState('idle'); // idle | working | done | error
  const [error, setError] = useState(null);
  const resumedRef = useRef(false);
  // Guarda de doble-submit propia de este hook (además de la que ya trae
  // `importItems`/`createEvent` vía useMyEventState#runMutation, con clave
  // por tipo de mutación): acá hacen falta DOS llamadas encadenadas
  // (createEvent → importItems) cuando todavía no hay borrador activo, y esa
  // guarda por-clave no alcanza para impedir que un segundo click dispare un
  // SEGUNDO createEvent mientras el primero ya liberó su clave pero el
  // importItems del primero todavía sigue en vuelo — de ahí este ref, que
  // cubre la operación compuesta completa de punta a punta.
  const busyRef = useRef(false);

  const runAccept = useCallback(async ({ eventData, categories }) => {
    if (busyRef.current) return null; // doble submit: se ignora, nunca se reintenta en paralelo
    busyRef.current = true;
    setAcceptStatus('working');
    setError(null);
    try {
      const items = buildImportItems(categories);
      const generalPayload = buildGeneralPayload(eventData);

      const updatedEvent = event
        // Ya hay borrador activo: un solo POST atómico aplica los datos
        // generales (`event_patch`) Y todos los componentes en la MISMA
        // transacción del backend — nunca dos requests separados que
        // puedan dejar la propuesta a medio guardar.
        ? await importItems({ event_patch: generalPayload, items }, event.version)
        // Sin borrador activo todavía: crearlo es un paso previo e
        // independiente — un draft recién creado y vacío no es "una
        // propuesta a medio guardar" (no tiene items). Los componentes de
        // la propuesta sí se importan atómicamente en un segundo paso, con
        // la `version` que acaba de devolver la creación.
        : await importItems({ items }, (await createEvent(generalPayload)).version);

      setAcceptStatus('done');
      return updatedEvent;
    } catch (err) {
      setAcceptStatus('error');
      setError(err);
      throw err;
    } finally {
      busyRef.current = false;
    }
  }, [event, createEvent, importItems]);

  /**
   * Punto de entrada real. Si no hay sesión, guarda la intención mínima y
   * redirige a login — nunca ejecuta la mutación sin sesión.
   */
  const acceptProposal = useCallback(async ({ eventData, profile, categories }) => {
    if (!user) {
      savePendingIntent({
        type: 'accept_proposal',
        profile,
        eventData: serializeEventDataForIntent(eventData),
        categories: serializeCategoriesForIntent(categories),
      });
      router.push(`/login?next=${encodeURIComponent(LOGIN_NEXT_PATH)}`);
      return null;
    }
    return runAccept({ eventData, categories });
  }, [user, router, runAccept]);

  // Reanudación tras login: una sola vez, y solo cuando ya sabemos con
  // certeza si hay o no un borrador activo (myEventStatus !== 'loading') —
  // si se dispara antes, podría crear un draft duplicado en vez de
  // actualizar el que ya existe.
  useEffect(() => {
    if (!user || resumedRef.current) return;
    if (myEventStatus === 'idle' || myEventStatus === 'loading') return;
    const intent = readPendingIntent();
    if (!intent || intent.type !== 'accept_proposal') return;
    resumedRef.current = true;
    clearPendingIntent();
    // Se difiere la INVOCACIÓN a un microtask — runAccept llama a
    // setAcceptStatus('working') de forma síncrona en su primer tramo
    // (antes del primer await), así que invocarla directo acá también
    // dispara react-hooks/set-state-in-effect (mismo criterio que
    // hooks/useMyEventState.js#runRead).
    Promise.resolve().then(() => {
      runAccept({ eventData: intent.eventData, categories: intent.categories }).then(() => {
        router.push('/mi-evento');
      }).catch(() => { /* el estado de error ya queda expuesto en acceptStatus/error */ });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runAccept es estable en la práctica; solo debe reevaluarse cuando cambian user/myEventStatus
  }, [user, myEventStatus]);

  return { acceptProposal, acceptStatus, error };
}
