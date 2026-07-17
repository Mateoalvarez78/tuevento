'use client';

import { useEffect, useState } from 'react';

let scriptPromise = null;
// Instancias de useGoogleMapsScript() montadas en este momento, para poder
// reintentar sin perder el estado del resto de la pantalla (ej. el wizard de
// reserva) — retryGoogleMapsScript() las notifica a todas.
const retryListeners = new Set();

function loadScript(apiKey) {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('no window')); return; }
    if (window.google?.maps?.places) { resolve(window.google); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,marker&language=es&region=UY`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Carga el script de Google Maps (Places) una sola vez para toda la app.
 * @returns {'no-key'|'loading'|'ready'|'error'}
 * - 'no-key': falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY — los consumidores deben
 *   degradar a un input simple, nunca romper la pantalla.
 */
export function useGoogleMapsScript() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [status, setStatus] = useState(apiKey ? 'loading' : 'no-key');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const retry = () => { scriptPromise = null; setAttempt((n) => n + 1); };
    retryListeners.add(retry);
    return () => retryListeners.delete(retry);
  }, []);

  useEffect(() => {
    if (!apiKey) { setStatus('no-key'); return; }
    let cancelled = false;
    setStatus('loading');
    loadScript(apiKey)
      .then(() => { if (!cancelled) setStatus('ready'); })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [apiKey, attempt]);

  return status;
}

/**
 * Fuerza un reintento de carga en todos los componentes que usan
 * useGoogleMapsScript() montados ahora mismo — sin recargar la página, así
 * no se pierde el estado de un formulario en curso (ej. el booking wizard).
 * Pensado para un botón "Reintentar" cuando el status quedó en 'error'.
 */
export function retryGoogleMapsScript() {
  retryListeners.forEach((retry) => retry());
}
