'use client';

// ─── LOCATION AUTOCOMPLETE ─────────────────────────────────────────────────────
// Componente reutilizable para capturar una ubicación real (Google Places).
// Pensado para usarse en: buscador de la home, alta de proveedor, alta/edición
// de servicio, reserva, filtros del catálogo, dirección del evento.
//
// Sin NEXT_PUBLIC_GOOGLE_MAPS_API_KEY configurada (o si falla la carga del
// script), degrada a un input de texto simple con sugerencias de las zonas
// canónicas de Uruguay — nunca rompe la pantalla ni bloquea la búsqueda.

import { useEffect, useId, useRef } from 'react';
import { MapPin } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { useGoogleMapsScript } from '@/hooks/useGoogleMapsScript';
import { ZONES } from '@/utils/constants';

function normalizePlace(place) {
  const comps = place.address_components || [];
  const find = (type) => comps.find((c) => c.types.includes(type))?.long_name || '';
  const loc = place.geometry?.location;
  return {
    label: place.formatted_address || place.name || '',
    address: place.formatted_address || place.name || '',
    placeId: place.place_id || null,
    lat: loc ? loc.lat() : null,
    lng: loc ? loc.lng() : null,
    city: find('locality') || find('sublocality') || find('administrative_area_level_2') || '',
    department: find('administrative_area_level_1') || '',
    country: find('country') || '',
  };
}

/**
 * @param {string} value - valor de texto controlado (label mostrado).
 * @param {(label: string) => void} onChange - el usuario tipeó (sin seleccionar aún).
 * @param {(place: object|null) => void} onPlaceSelected - lugar normalizado elegido
 *   (o null si el usuario borró/cambió el texto sin volver a elegir uno real).
 * @param {string} placeholder
 * @param {string} className - clases para el <input>.
 */
export default function LocationAutocomplete({
  value = '',
  onChange,
  onPlaceSelected,
  placeholder = 'Montevideo, Canelones...',
  className = '',
  inputRef: externalRef,
}) {
  const status = useGoogleMapsScript();
  const localRef = useRef(null);
  const inputEl = externalRef || localRef;
  const autocompleteRef = useRef(null);
  const datalistId = `zones-${useId()}`;

  useEffect(() => {
    if (status !== 'ready' || !inputEl.current || autocompleteRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(inputEl.current, {
      types: ['geocode'],
      componentRestrictions: { country: 'uy' },
      fields: ['formatted_address', 'name', 'place_id', 'geometry', 'address_components'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place || (!place.formatted_address && !place.name)) {
        onPlaceSelected?.(null);
        return;
      }
      const normalized = normalizePlace(place);
      onChange?.(normalized.label);
      onPlaceSelected?.(normalized);
    });
    autocompleteRef.current = ac;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleChange = (e) => {
    const next = e.target.value;
    onChange?.(next);
    // Fallback sin Maps: si el valor coincide exacto con una zona canónica
    // (typeahead nativo del <datalist>), lo tratamos como lugar seleccionado.
    if (status !== 'ready' && ZONES.includes(next)) {
      onPlaceSelected?.({
        label: next, address: next, placeId: null, lat: null, lng: null,
        city: '', department: next, country: 'Uruguay',
      });
    } else {
      // El texto ya no corresponde a un lugar confirmado hasta elegir uno nuevo.
      onPlaceSelected?.(null);
    }
  };

  return (
    <div className="relative flex-1 min-w-0">
      <input
        ref={inputEl}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        autoComplete="off"
        list={status === 'ready' ? undefined : datalistId}
      />
      {status !== 'ready' && (
        <datalist id={datalistId}>
          {ZONES.map((z) => <option key={z} value={z} />)}
        </datalist>
      )}
      {status === 'no-key' && (
        <p className="absolute top-full left-0 mt-1 text-[10px] text-gray-400 flex items-center gap-1">
          <AppIcon icon={MapPin} size={9} aria-hidden="true" /> Autocompletado de direcciones próximamente
        </p>
      )}
    </div>
  );
}
