'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { bookingAdminService } from '@/services/bookingAdminService';
import { categoryService } from '@/services/categoryService';
import { Download, AlertTriangle } from 'lucide-react';
import BookingKpis from '@/components/dashboard/admin/reservas/BookingKpis';
import BookingFilters from '@/components/dashboard/admin/reservas/BookingFilters';
import BookingsTable from '@/components/dashboard/admin/reservas/BookingsTable';
import BookingDetailDrawer from '@/components/dashboard/admin/reservas/BookingDetailDrawer';
import { buildCsv, downloadCsv, datedFilename } from '@/lib/csvExport';

const DEFAULT_FILTERS = { status: '', category: '', dateFrom: '', dateTo: '', search: '', sort: 'recent', page: 1, limit: 20 };

const STATUS_ES = { pending: 'Pendiente', confirmed: 'Aceptada', completed: 'Completada', rejected: 'Rechazada', cancelled: 'Cancelada' };
const CSV_COLUMNS = [
  { label: 'Número', value: 'requestNumber' },
  { label: 'Cliente', value: 'clientName' },
  { label: 'Proveedor', value: 'providerName' },
  { label: 'Servicio', value: 'serviceTitle' },
  { label: 'Categoría', value: 'category' },
  { label: 'Estado', value: (r) => STATUS_ES[r.status] || r.status },
  { label: 'Fecha evento', value: (r) => r.eventDate || '' },
  { label: 'Fecha creación', value: (r) => (r.createdAt ? r.createdAt.split('T')[0] : '') },
  { label: 'Importe', value: (r) => r.total },
  { label: 'Comisión', value: (r) => r.commission },
  { label: 'Neto proveedor', value: (r) => r.providerNet },
  { label: 'Invitados', value: (r) => (r.adults != null ? r.adults + r.children : r.guests) },
];

export default function AdminReservasPage() {
  const { showToast } = useApp();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [result, setResult] = useState({ data: [], pagination: null, stats: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => { categoryService.getAll().then(setCategories).catch(() => setCategories([])); }, []);

  // Aplica ?status=... si viene del launcher/alertas del dashboard
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('status');
    if (status) setFilters((f) => ({ ...f, status }));
  }, []);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  // Fetch con debounce (evita spamear al tipear en el buscador)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      bookingAdminService.getBookings(filters)
        .then((res) => { if (!cancelled) { setResult(res); setLoading(false); } })
        .catch((err) => { if (!cancelled) { setError(err?.message || 'No se pudieron cargar las reservas'); setLoading(false); } });
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, refreshTick]);

  const handleCopy = (num) => {
    navigator.clipboard?.writeText(num).then(
      () => showToast(`Copiado: ${num}`, 'success'),
      () => showToast('No se pudo copiar', 'error')
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = await bookingAdminService.getForExport(filters);
      if (!rows.length) { showToast('No hay reservas para exportar con estos filtros', 'info'); return; }
      downloadCsv(datedFilename('reservas-eventonow'), buildCsv(rows, CSV_COLUMNS));
      showToast(`${rows.length} reserva${rows.length !== 1 ? 's' : ''} exportada${rows.length !== 1 ? 's' : ''}`, 'success');
    } catch (err) {
      showToast(err?.message || 'No se pudo exportar', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Reservas</h1>
          <p className="text-sm text-gray-400 mt-1">
            Administrá todas las reservas realizadas en Eventonow.
            {result.stats != null && <span className="text-gray-500"> · {result.stats.total} encontrada{result.stats.total !== 1 ? 's' : ''}</span>}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-200 bg-gray-800 border border-gray-700 px-4 py-2.5 rounded-xl hover:border-primary/50 transition-colors self-start disabled:opacity-50"
        >
          <Download size={15} /> {exporting ? 'Exportando…' : 'Exportar CSV'}
        </button>
      </div>

      {/* KPIs */}
      <BookingKpis stats={result.stats} />

      {/* Filtros */}
      <BookingFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Tabla / estados */}
      {error ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
          <AlertTriangle size={28} className="mx-auto text-amber-400 mb-3" />
          <p className="text-gray-200 font-medium mb-1">No pudimos cargar las reservas</p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button onClick={() => setFilters({ ...filters })} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">Reintentar</button>
        </div>
      ) : (
        <BookingsTable
          bookings={result.data}
          loading={loading}
          pagination={result.pagination}
          onPage={(p) => setFilters((f) => ({ ...f, page: p }))}
          onRowClick={(b) => setSelectedId(b.id)}
          onCopy={handleCopy}
        />
      )}

      {/* Drawer de detalle */}
      {selectedId && (
        <BookingDetailDrawer
          bookingId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => setRefreshTick((t) => t + 1)}
        />
      )}
    </div>
  );
}
