'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import { useSessionState } from '@/hooks/useSessionState';
import { bookingService } from '@/services/bookingService';
import { FullCalendarView } from '@/components/dashboard/proveedor/DashCalendar';
import AvailabilityPanel from '@/components/dashboard/proveedor/availability/AvailabilityPanel';
import AvailabilitySettingsForm from '@/components/dashboard/proveedor/availability/AvailabilitySettingsForm';
import WeeklyHoursForm from '@/components/dashboard/proveedor/availability/WeeklyHoursForm';

const TABS = [
  { value: 'calendario', label: 'Calendario' },
  { value: 'disponibilidad', label: 'Disponibilidad' },
  { value: 'configuracion', label: 'Configuración' },
];

export default function ProviderCalendarPage() {
  const [tab, setTab] = useSessionState('provCalendarioTab', 'calendario');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingService.getByProvider(null, { limit: 50 });
      setBookings(res.data || []);
    } catch (e) {
      setError(e?.message || 'No se pudo cargar el calendario');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <>
      <div className="flex gap-1 mb-6 border-b border-gray-100 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
              tab === t.value
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'calendario' && (
        loading ? (
          <div className="skeleton h-[520px] w-full rounded-2xl" />
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <AppIcon icon={AlertTriangle} size={32} className="mx-auto text-amber-500 mb-3" aria-hidden="true" />
            <p className="text-gray-700 font-medium mb-1">No pudimos cargar tu calendario</p>
            <p className="text-sm text-gray-500 mb-5">{error}</p>
            <Button onClick={reload}>Reintentar</Button>
          </div>
        ) : (
          <FullCalendarView bookings={bookings} />
        )
      )}

      {tab === 'disponibilidad' && <AvailabilityPanel />}

      {tab === 'configuracion' && (
        <div className="space-y-6">
          <AvailabilitySettingsForm />
          <WeeklyHoursForm />
        </div>
      )}
    </>
  );
}
