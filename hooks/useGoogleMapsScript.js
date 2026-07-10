'use client';

import { useEffect, useState } from 'react';

let scriptPromise = null;

function loadScript(apiKey) {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('no window')); return; }
    if (window.google?.maps?.places) { resolve(window.google); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=es&region=UY`;
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

  useEffect(() => {
    if (!apiKey) { setStatus('no-key'); return; }
    let cancelled = false;
    loadScript(apiKey)
      .then(() => { if (!cancelled) setStatus('ready'); })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [apiKey]);

  return status;
}
