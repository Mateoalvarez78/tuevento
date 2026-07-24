'use client';

// ─── LOCATION PICKER ───────────────────────────────────────────────────────
// Integra autocomplete + mapa + resumen + campos complementarios en un único
// campo controlado (value/onChange), listo para insertar en un formulario
// (BookingWizard hoy; el perfil de proveedor en una fase futura). Compone
// LocationAutocomplete + LocationMap ya existentes/nuevos — no reimplementa
// nada de Google acá.
//
// Regla dura: una reserva nueva nunca se confirma con una zona aproximada o
// un texto libre. `value` solo pasa a ser no-nulo cuando viene de una
// selección real de Google Places (formattedAddress + lat/lng numéricos).

import { useState } from 'react';
import { MapPin, Pencil } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Card from '@/components/Card';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import LocationMap from '@/components/LocationMap';
import { isValidSelectedLocation } from '@/lib/googlePlaces';

// Mismas clases que components/Input.js (variant="light", con icono) — no se
// puede reusar Input.js tal cual porque LocationAutocomplete necesita ser
// dueño del <input> para engancharle el widget de Google.
const INPUT_CLASSES =
  'w-full border rounded-xl text-sm transition-colors duration-200 outline-none pl-9 pr-3 py-2.5 ' +
  'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20';

/**
 * @param {object|null} value - { formattedAddress, placeId, lat, lng, city,
 *   department, addressComplement, accessNotes, source, locationToken,
 *   tokenExpiresAt } | null. `locationToken` es lo único que POST /bookings
 *   acepta como prueba de que la dirección salió realmente de Google Places
 *   (ver docs/SECURITY.md) — se renueva en cada nueva selección.
 * @param {(value: object|null) => void} onChange
 */
export default function LocationPicker({ value, onChange }) {
  const [inputLabel, setInputLabel] = useState(value?.formattedAddress || '');
  const [typedWithoutSelecting, setTypedWithoutSelecting] = useState(false);
  const [editing, setEditing] = useState(!value);

  const handleChange = (label) => {
    setInputLabel(label);
    setTypedWithoutSelecting(label.trim().length > 0);
  };

  const handlePlaceSelected = (place) => {
    // isValidSelectedLocation solo chequea address+lat/lng; locationToken se
    // valida acá aparte porque es lo único que el backend realmente exige —
    // sin token, esta selección no sirve para crear una reserva.
    if (!isValidSelectedLocation(place) || !place.locationToken) {
      setTypedWithoutSelecting(inputLabel.trim().length > 0);
      onChange(null);
      return;
    }
    setTypedWithoutSelecting(false);
    setInputLabel(place.address);
    setEditing(false);
    onChange({
      formattedAddress: place.address,
      placeId: place.placeId,
      lat: place.lat,
      lng: place.lng,
      city: place.city,
      department: place.department,
      addressComplement: value?.addressComplement || '',
      accessNotes: value?.accessNotes || '',
      source: 'google_places',
      locationToken: place.locationToken,
      tokenExpiresAt: place.tokenExpiresAt,
    });
  };

  const handleChangeAddressClick = () => {
    setEditing(true);
    setTypedWithoutSelecting(false);
  };

  const updateComplement = (field, val) => {
    if (!value) return;
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-3">
      {editing || !value ? (
        <div>
          <div className="relative">
            <AppIcon icon={MapPin} size="input" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <LocationAutocomplete
              value={inputLabel}
              onChange={handleChange}
              onPlaceSelected={handlePlaceSelected}
              placeholder="Ej: Bulevar Artigas 1234, Montevideo"
              className={INPUT_CLASSES}
            />
          </div>
          {typedWithoutSelecting && (
            <p className="mt-1.5 text-xs text-amber-600">Elegí una dirección de la lista para continuar.</p>
          )}
        </div>
      ) : (
        <Card padding="sm" className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <AppIcon icon={MapPin} size={16} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm text-gray-800 break-words">{value.formattedAddress}</p>
          </div>
          <Button variant="ghost" size="sm" icon={Pencil} onClick={handleChangeAddressClick} className="shrink-0">
            Cambiar dirección
          </Button>
        </Card>
      )}

      {value && !editing && (
        <>
          <LocationMap lat={value.lat} lng={value.lng} height="h-48" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Apartamento, piso, salón <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Ej: Apto 302, 3er piso"
                value={value.addressComplement}
                onChange={(e) => updateComplement('addressComplement', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Instrucciones de acceso <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Ej: Timbre 302, portón negro"
                value={value.accessNotes}
                onChange={(e) => updateComplement('accessNotes', e.target.value)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
