'use client';

// ─── LOCATION MAP ──────────────────────────────────────────────────────────
// Mapa de solo visualización con un marcador FIJO (sin arrastre — no forma
// parte de esta fase). Se monta solo cuando el caller ya tiene lat/lng
// válidos; nunca decide por su cuenta si debe mostrarse o no.

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { useGoogleMapsScript } from '@/hooks/useGoogleMapsScript';

// Map ID de Google Cloud Console (Maps → Map IDs) — lo exige
// AdvancedMarkerElement. Paso manual, ver docs/DEPLOYMENT.md.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

/**
 * @param {number} lat
 * @param {number} lng
 * @param {boolean} readOnly - true: sin gestos de mapa (preview chica en un
 *   detalle de reserva). false: pan/zoom normal (picker del wizard). El
 *   marcador nunca es arrastrable en ninguno de los dos casos.
 * @param {string} height - alto Tailwind, ej. 'h-56'.
 * @param {string} className
 */
export default function LocationMap({ lat, lng, readOnly = false, height = 'h-56', className = '' }) {
  const status = useGoogleMapsScript();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [renderError, setRenderError] = useState(false);

  const hasValidCoords = typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng);

  // Crea el mapa + marcador una sola vez por montaje; si lat/lng cambian
  // después, solo reposiciona (nunca reinstancia el Map/Marker).
  useEffect(() => {
    if (status !== 'ready' || !hasValidCoords || !containerRef.current) return;
    try {
      if (!mapRef.current) {
        mapRef.current = new window.google.maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 16,
          mapId: MAP_ID || undefined,
          disableDefaultUI: readOnly,
          gestureHandling: readOnly ? 'none' : 'cooperative',
          zoomControl: !readOnly,
          fullscreenControl: false,
          streetViewControl: false,
        });
      } else {
        mapRef.current.setCenter({ lat, lng });
      }

      if (!markerRef.current) {
        markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat, lng },
        });
      } else {
        markerRef.current.position = { lat, lng };
      }
      setRenderError(false);
    } catch {
      setRenderError(true);
    }
  }, [status, hasValidCoords, lat, lng, readOnly]);

  // Limpieza real al desmontar (no solo al cambiar props) — evita mapas
  // "fantasma" cuando un drawer/modal se cierra y se vuelve a abrir.
  useEffect(() => {
    return () => {
      if (markerRef.current) { markerRef.current.map = null; markerRef.current = null; }
      mapRef.current = null;
    };
  }, []);

  if (!hasValidCoords) return null;

  if (status === 'no-key' || status === 'error' || renderError) {
    return (
      <div className={`${height} ${className} rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-center px-4`}>
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <AppIcon icon={AlertTriangle} size={14} aria-hidden="true" /> No se pudo cargar el mapa
        </p>
      </div>
    );
  }

  if (status === 'loading') {
    return <div className={`${height} ${className} rounded-xl bg-gray-100 skeleton`} aria-hidden="true" />;
  }

  return (
    <div
      ref={containerRef}
      className={`${height} ${className} rounded-xl overflow-hidden`}
      role="img"
      aria-label="Mapa con la ubicación seleccionada"
    />
  );
}
