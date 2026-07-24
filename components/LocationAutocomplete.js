'use client';

// ─── LOCATION AUTOCOMPLETE ─────────────────────────────────────────────────
// Componente reutilizable para capturar una ubicación real (Google Places).
// Pensado para usarse en: buscador de la home, alta de proveedor, alta/edición
// de servicio, reserva, filtros del catálogo, dirección del evento.
//
// Consulta el proxy backend (/locations/autocomplete, /locations/places/:id
// — eventonow-back src/modules/locations), nunca Google directamente: no hay
// ninguna API key en este componente ni en el bundle del navegador. Reemplaza
// al widget legacy `google.maps.places.Autocomplete` (API clásica,
// deshabilitada en Google Cloud) manteniendo la misma interfaz externa que
// ya consumen LocationPicker/BookingWizard/SearchBar.

import { useEffect, useId, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { locationsService, createLocationSessionToken } from '@/services/locationsService';

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;

/**
 * @param {string} value - valor de texto controlado (label mostrado).
 * @param {(label: string) => void} onChange - el usuario tipeó (sin seleccionar aún).
 * @param {(place: object|null) => void} onPlaceSelected - lugar normalizado elegido
 *   (con locationToken firmado por el backend) o null si el usuario borró/cambió
 *   el texto sin volver a elegir uno real.
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
  const localRef = useRef(null);
  const inputEl = externalRef || localRef;
  const listboxId = `location-suggestions-${useId()}`;
  const containerRef = useRef(null);

  // idle: sin búsqueda activa · loading: esperando al backend ·
  // results/empty: respuesta con o sin sugerencias · error: recuperable
  // (el usuario puede seguir escribiendo o reintentar).
  const [status, setStatus] = useState('idle');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState('');

  const sessionTokenRef = useRef(createLocationSessionToken());
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);
  // Última selección confirmada — si el texto deja de coincidir, la
  // dirección ya no está validada (el usuario la tocó después de elegirla).
  const lastConfirmedLabelRef = useRef(value);

  useEffect(() => () => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runSearch = (text) => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (text.trim().length < MIN_QUERY_LENGTH) {
      setStatus('idle');
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('loading');
      setErrorMessage('');
      try {
        const results = await locationsService.autocomplete(text.trim(), sessionTokenRef.current, { signal: controller.signal });
        if (requestId !== requestIdRef.current) return; // respuesta obsoleta: se ignora
        setSuggestions(results);
        setStatus(results.length ? 'results' : 'empty');
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if (err?.name === 'AbortError' || requestId !== requestIdRef.current) return;
        setStatus('error');
        setErrorMessage(
          err?.code === 'LOCATIONS_RATE_LIMIT_EXCEEDED'
            ? 'Demasiadas búsquedas, esperá un momento.'
            : 'No se pudieron cargar sugerencias. Probá de nuevo.'
        );
        setOpen(true);
      }
    }, DEBOUNCE_MS);
  };

  const handleChange = (e) => {
    const next = e.target.value;
    onChange?.(next);
    runSearch(next);
    // Invalidación al editar: el texto ya no coincide con la última
    // selección confirmada → deja de ser una dirección validada.
    if (next !== lastConfirmedLabelRef.current) {
      onPlaceSelected?.(null);
    }
  };

  const selectSuggestion = async (suggestion) => {
    setOpen(false);
    setStatus('loading');
    try {
      const place = await locationsService.details(suggestion.placeId, sessionTokenRef.current);
      lastConfirmedLabelRef.current = place.address;
      onChange?.(place.address);
      onPlaceSelected?.(place);
      setStatus('idle');
      setSuggestions([]);
      // El ciclo autocomplete+details ya se cerró con esta selección — la
      // próxima búsqueda es una interacción nueva e independiente.
      sessionTokenRef.current = createLocationSessionToken();
    } catch {
      setStatus('error');
      setErrorMessage('No se pudo confirmar esa dirección. Probá de nuevo.');
      setOpen(true);
      onPlaceSelected?.(null);
    }
  };

  const handleKeyDown = (e) => {
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <input
        ref={inputEl}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
      />
      {status === 'loading' && (
        <AppIcon icon={Loader2} size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" aria-hidden="true" />
      )}
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {status === 'results' && (
            <ul id={listboxId} role="listbox" className="max-h-64 overflow-y-auto py-1">
              {suggestions.map((s, i) => (
                <li
                  key={s.placeId}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`px-3.5 py-2.5 text-sm cursor-pointer flex items-start gap-2 ${i === activeIndex ? 'bg-primary-light' : 'hover:bg-gray-50'}`}
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <AppIcon icon={MapPin} size={14} className="text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-gray-800 truncate">{s.mainText}</span>
                    {s.secondaryText && <span className="block text-xs text-gray-400 truncate">{s.secondaryText}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {status === 'empty' && (
            <p className="px-3.5 py-3 text-sm text-gray-400">No encontramos direcciones para esa búsqueda.</p>
          )}
          {status === 'error' && (
            <p className="px-3.5 py-3 text-sm text-red-500">{errorMessage}</p>
          )}
          {/* Atribución exigida por Google cuando se muestran predicciones de
              Places sin un mapa de Google visible al lado (ver docs/SECURITY.md). */}
          <p className="px-3.5 py-1.5 text-[10px] text-gray-300 border-t border-gray-100">Powered by Google</p>
        </div>
      )}
    </div>
  );
}
