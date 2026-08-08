'use client';

import { Wallet, Users, CalendarDays, MapPin, Pencil } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import { formatCurrency } from '@/utils/formatters';
import { safeFormatDate } from '@/lib/date';
import { roundForDisplay } from '@/lib/smartPackages';

/**
 * Resumen compacto del evento para el que se están armando propuestas —
 * reemplaza el string plano "$220.000 · 130 invitados · 31/08/2026" por
 * pares ícono+valor. `location` es opcional y solo se muestra si ya está en
 * el estado del formulario (no dispara ningún request nuevo, no decodifica
 * el location_token: `city`/`formattedAddress` ya vienen del payload que
 * arma LocationPicker.js#handlePlaceSelected al elegir la dirección).
 * Se prioriza `city` (ej. "Montevideo") por ser más compacto que la
 * dirección completa; si por algún motivo Google no la devolvió, cae a
 * `formattedAddress` completa antes que ocultar el dato.
 */
export default function EventSummary({ budget, totalGuests, eventDate, location, onEdit, editDisabled = false }) {
  const locationLabel = location?.city || location?.formattedAddress || null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 mb-6">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 mb-1.5">Armando propuestas para tu evento</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-700">
          <span className="flex items-center gap-1.5 font-semibold text-gray-900">
            <AppIcon icon={Wallet} size={14} className="text-gray-400" aria-hidden="true" />
            {formatCurrency(roundForDisplay(Number(budget)))}
          </span>
          <span className="flex items-center gap-1.5">
            <AppIcon icon={Users} size={14} className="text-gray-400" aria-hidden="true" />
            {totalGuests} invitados
          </span>
          <span className="flex items-center gap-1.5">
            <AppIcon icon={CalendarDays} size={14} className="text-gray-400" aria-hidden="true" />
            {safeFormatDate(eventDate)}
          </span>
          {locationLabel && (
            <span className="flex items-center gap-1.5 min-w-0">
              <AppIcon icon={MapPin} size={14} className="text-gray-400 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[220px]" title={location.formattedAddress || locationLabel}>{locationLabel}</span>
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" icon={Pencil} onClick={onEdit} disabled={editDisabled} className="shrink-0">
        Editar búsqueda
      </Button>
    </div>
  );
}
