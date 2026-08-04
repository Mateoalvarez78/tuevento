'use client';

import { Wallet, Users, Baby, CalendarDays, AlertTriangle, PartyPopper } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Input from '@/components/Input';
import LocationPicker from '@/components/LocationPicker';
import { formatCurrency } from '@/utils/formatters';
import { todayStr } from '@/lib/date';

// Mismas opciones que components/BookingWizard.js#EVENT_TYPES — no se
// extrae a un módulo compartido para un array de 6 strings; si un tercer
// lugar lo necesita, ahí sí vale la pena.
export const EVENT_TYPES = ['Cumpleaños', 'Casamiento', 'Empresarial', 'Infantil', 'Fiesta privada', 'Otro'];

/**
 * Paso 1 del generador: tipo de evento, presupuesto, invitados, fecha y
 * ubicación. Controlado — no guarda estado propio, todo vive en
 * SmartPackagesGenerator (mismo patrón que BookingWizard). `eventType` es
 * el único campo que no viaja a POST /smart-packages/simulate (el motor no
 * lo necesita) — se guarda igual acá porque sí es un dato general real de
 * `client_events.event_type` al confirmar una propuesta.
 */
export default function EventStepForm({ value, onChange, errors = {} }) {
  const { eventType, budget, adults, children, eventDate, location } = value;
  const adultsN = Number(adults) || 0;
  const childrenN = Number(children) || 0;
  const totalGuests = adultsN + childrenN;
  const budgetN = Number(budget);
  const budgetIsValid = budget !== '' && !Number.isNaN(budgetN) && budgetN > 0;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="sp-event-type" className="block text-sm font-medium text-gray-700 mb-1.5">
          Tipo de evento
        </label>
        <div className="relative">
          <AppIcon icon={PartyPopper} size="input" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
          <select
            id="sp-event-type"
            value={eventType || ''}
            onChange={(e) => onChange({ eventType: e.target.value })}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-800 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Elegí un tipo (opcional)</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="sp-budget" className="block text-sm font-medium text-gray-700 mb-1.5">
          Presupuesto total (UYU) *
        </label>
        <Input
          id="sp-budget"
          type="number"
          min="1"
          step="1"
          inputMode="decimal"
          icon={Wallet}
          placeholder="Ej: 150000"
          value={budget}
          onChange={(e) => onChange({ budget: e.target.value })}
          error={errors.budget}
          aria-describedby="sp-budget-preview"
        />
        {budgetIsValid && (
          <p id="sp-budget-preview" className="mt-1.5 text-sm text-gray-500">
            {formatCurrency(budgetN)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sp-adults" className="block text-sm font-medium text-gray-700 mb-1.5">
            Adultos *
          </label>
          <Input
            id="sp-adults"
            type="number"
            min="0"
            step="1"
            icon={Users}
            placeholder="0"
            value={adults}
            onChange={(e) => onChange({ adults: e.target.value })}
            error={errors.adults}
          />
        </div>
        <div>
          <label htmlFor="sp-children" className="block text-sm font-medium text-gray-700 mb-1.5">
            Niños *
          </label>
          <Input
            id="sp-children"
            type="number"
            min="0"
            step="1"
            icon={Baby}
            placeholder="0"
            value={children}
            onChange={(e) => onChange({ children: e.target.value })}
            error={errors.children}
          />
        </div>
      </div>
      <p className={`text-sm ${errors.guests ? 'text-danger' : 'text-gray-500'}`}>
        {errors.guests || `Total de invitados: ${totalGuests}`}
      </p>

      <div>
        <label htmlFor="sp-date" className="block text-sm font-medium text-gray-700 mb-1.5">
          Fecha del evento *
        </label>
        <Input
          id="sp-date"
          type="date"
          icon={CalendarDays}
          min={todayStr()}
          value={eventDate}
          onChange={(e) => onChange({ eventDate: e.target.value })}
          error={errors.eventDate}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          ¿Dónde se realizará el evento? *
        </label>
        <p className="text-xs text-gray-400 mb-1.5">
          La necesitamos para calcular el costo de traslado de cada proveedor.
        </p>
        <LocationPicker value={location} onChange={(loc) => onChange({ location: loc })} />
        {errors.location && (
          <p className="mt-1.5 text-xs text-danger flex items-center gap-1">
            <AppIcon icon={AlertTriangle} size={12} aria-hidden="true" />
            {errors.location}
          </p>
        )}
      </div>
    </div>
  );
}
