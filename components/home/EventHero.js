'use client';

// ─── EVENT HERO ─────────────────────────────────────────────────────────
// Reemplaza a SearchBar como contenido principal del hero de la Home — el
// hero deja de ser un buscador tradicional (comparar/filtrar catálogo) y
// pasa a ser la entrada al armado de un evento completo (varias categorías,
// 3 propuestas reales comparables). El buscador/multiselect de categorías
// para "solo quiero contratar una cosa" sigue disponible más abajo, en las
// secciones de categorías/destacados (sin cambios) y desde "Explorar
// servicios" en el header.
//
// A propósito NO duplica el formulario completo de /armar-evento
// (EventStepForm + CategoriesStepForm, ya construido y validado) — colecta
// solo 3 campos rápidos para no sobrecargar la Home, y navega a
// /armar-evento con esos valores como prefill (querystring), donde el
// usuario completa presupuesto/ubicación/categorías y ve las propuestas.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PartyPopper, CalendarDays, Users } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { todayStr } from '@/lib/date';
import { EVENT_TYPES } from '@/components/smart-packages/EventStepForm';

export default function EventHero({ className = '' }) {
  const router = useRouter();
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [adults, setAdults] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return; // evita doble submit por doble click/Enter
    setSubmitting(true);
    const params = new URLSearchParams();
    if (eventType) params.set('eventType', eventType);
    if (eventDate) params.set('eventDate', eventDate);
    if (adults) params.set('adults', adults);
    router.push(`/armar-evento${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl shadow-2xl p-5 sm:p-6 ${className}`}
      aria-label="Armar mi evento"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
          <AppIcon icon={PartyPopper} size={20} className="text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm sm:text-base font-bold text-gray-900">Armá tu evento completo</p>
          <p className="text-xs sm:text-sm text-gray-500">Te armamos 3 propuestas con proveedores y precios reales, listas para comparar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label htmlFor="hero-event-type" className="block text-xs font-semibold text-gray-500 mb-1.5">
            Tipo de evento
          </label>
          <select
            id="hero-event-type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Elegí un tipo</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hero-date" className="block text-xs font-semibold text-gray-500 mb-1.5">
            Fecha
          </label>
          <Input
            id="hero-date"
            type="date"
            icon={CalendarDays}
            min={todayStr()}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="hero-adults" className="block text-xs font-semibold text-gray-500 mb-1.5">
            Invitados (aprox.)
          </label>
          <Input
            id="hero-adults"
            type="number"
            min="1"
            step="1"
            icon={Users}
            placeholder="Ej: 50"
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" size="lg" icon={PartyPopper} className="w-full" loading={submitting}>
        Armar mi evento
      </Button>
    </form>
  );
}
