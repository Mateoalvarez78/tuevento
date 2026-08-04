// ─── useAddToMyEvent ────────────────────────────────────────────────────
// "Agregar a Mi evento" desde el catálogo/ficha de servicio — un único
// servicio, a diferencia de hooks/useAcceptProposal.js (varios, uno por
// categoría de una propuesta). Mismo criterio de testabilidad: recibe
// `user`/`event`/`myEventStatus`/`createEvent`/`updateEvent`/`addItem`/
// `router`/`loginNextPath` como parámetros explícitos, nunca llama a
// useApp()/useMyEvent()/useRouter()/usePathname() internamente (esos
// archivos tienen JSX, ver hooks/useAcceptProposal.js para el motivo
// completo ya documentado).
//
// Si el borrador no existe, o existe pero no tiene fecha, se crea/actualiza
// con la fecha mínima provista ANTES de agregar el item — el backend exige
// event_date para poder cotizar cualquier item (ver EVENT_DATE_REQUIRED,
// no exclusivo de /revalidate).
import { useCallback, useEffect, useRef, useState } from 'react';
import { savePendingIntent, readPendingIntent, clearPendingIntent } from '../lib/pendingIntent';

function serializeForIntent({ serviceId, packageId, extrasSelected, eventDate }) {
  return {
    serviceId,
    packageId: packageId || null,
    extrasSelected: Array.isArray(extrasSelected) ? extrasSelected : [],
    eventDate: eventDate || null,
  };
}

export function useAddToMyEvent({ user, event, myEventStatus, createEvent, updateEvent, addItem, router, loginNextPath }) {
  const [status, setStatus] = useState('idle'); // idle | working | done | error
  const [error, setError] = useState(null);
  const resumedRef = useRef(false);

  const runAdd = useCallback(async ({ serviceId, packageId, extrasSelected, eventDate }) => {
    setStatus('working');
    setError(null);
    try {
      let currentEvent = event;
      if (!currentEvent) {
        currentEvent = await createEvent(eventDate ? { event_date: eventDate } : {});
      } else if (eventDate && !currentEvent.event_date) {
        currentEvent = await updateEvent({ event_date: eventDate }, currentEvent.version);
      }
      const updated = await addItem(
        { service_id: serviceId, package_id: packageId || undefined, extras_selected: extrasSelected || [] },
        currentEvent.version
      );
      setStatus('done');
      return updated;
    } catch (err) {
      setStatus('error');
      setError(err);
      throw err;
    }
  }, [event, createEvent, updateEvent, addItem]);

  const addToMyEvent = useCallback(async (payload) => {
    if (!user) {
      savePendingIntent({ type: 'add_item', ...serializeForIntent(payload) });
      router.push(`/login?next=${encodeURIComponent(loginNextPath)}`);
      return null;
    }
    return runAdd(payload);
  }, [user, router, loginNextPath, runAdd]);

  useEffect(() => {
    if (!user || resumedRef.current) return;
    if (myEventStatus === 'idle' || myEventStatus === 'loading') return;
    const intent = readPendingIntent();
    if (!intent || intent.type !== 'add_item') return;
    resumedRef.current = true;
    clearPendingIntent();
    Promise.resolve().then(() => {
      runAdd(intent).catch(() => { /* estado de error ya expuesto en status/error */ });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runAccept-equivalente estable en la práctica; solo debe reevaluarse cuando cambian user/myEventStatus
  }, [user, myEventStatus]);

  return { addToMyEvent, status, error };
}
