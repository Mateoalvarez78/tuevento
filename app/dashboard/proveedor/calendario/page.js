'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { bookingService } from '@/services/bookingService';
import { FullCalendarView } from '@/components/dashboard/proveedor/DashCalendar';

export default function ProviderCalendarPage() {
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

  if (loading) return <div className="skeleton h-[520px] w-full rounded-2xl" />;

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
        <p className="text-gray-700 font-medium mb-1">No pudimos cargar tu calendario</p>
        <p className="text-sm text-gray-500 mb-5">{error}</p>
        <button onClick={reload} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  return <FullCalendarView bookings={bookings} />;
}
