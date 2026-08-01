'use client';

// Tab "Reservas" de Proveedor 360° (Fase A) — mismo patrón que
// app/admin/reservas/page.js (fetch debounced, tabla, paginación) pero
// acotado a un solo proveedor vía providerService.admin.getBookings(id, ...).
// Sin filtro de categoría (ya está fijo el proveedor). El detalle reutiliza
// BookingDetailDrawer TAL CUAL — es genérico, solo necesita un bookingId.
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { adminService } from '@/services/adminService';
import BookingDetailDrawer from '@/components/dashboard/admin/reservas/BookingDetailDrawer';
import BookingsTable from '@/components/dashboard/admin/reservas/BookingsTable';
import Input from '@/components/Input';
import Button from '@/components/Button';
import AppIcon from '@/components/AppIcon';
import { Search, X, AlertTriangle } from 'lucide-react';

const DEFAULT_FILTERS = { status: '', dateFrom: '', dateTo: '', search: '', sort: 'recent', page: 1, limit: 10 };
const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'accepted', label: 'Aceptadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'cancelled', label: 'Canceladas' },
];
const selectCls = 'bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-primary/60';

export default function ProviderBookingsTab({ providerId }) {
  const { showToast } = useApp();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [result, setResult] = useState({ data: [], pagination: null, stats: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      adminService.providers.getBookings(providerId, filters)
        .then((res) => { if (!cancelled) { setResult(res); setLoading(false); } })
        .catch((err) => { if (!cancelled) { setError(err?.message || 'No se pudieron cargar las reservas'); setLoading(false); } });
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, filtersKey, refreshTick]);

  const activeCount = ['status', 'dateFrom', 'dateTo', 'search'].filter((k) => filters[k]).length;
  const set = (patch) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  const handleCopy = (num) => {
    navigator.clipboard?.writeText(num).then(
      () => showToast(`Copiado: ${num}`, 'success'),
      () => showToast('No se pudo copiar', 'error')
    );
  };

  return (
    <div className="space-y-4 w-full">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 space-y-3">
        <Input
          variant="dark" icon={Search}
          placeholder="Buscar por número, cliente o servicio…"
          value={filters.search || ''}
          onChange={(e) => set({ search: e.target.value })}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <select className={selectCls} value={filters.status || ''} onChange={(e) => set({ status: e.target.value })}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 mb-0.5 ml-1">Desde (evento)</label>
            <input type="date" className={selectCls} value={filters.dateFrom || ''} onChange={(e) => set({ dateFrom: e.target.value })} />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 mb-0.5 ml-1">Hasta (evento)</label>
            <input type="date" className={selectCls} value={filters.dateTo || ''} onChange={(e) => set({ dateTo: e.target.value })} />
          </div>
          <select className={selectCls} value={filters.sort || 'recent'} onChange={(e) => set({ sort: e.target.value })}>
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="amount_desc">Mayor importe</option>
            <option value="amount_asc">Menor importe</option>
          </select>
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" theme="dark" size="sm" icon={X} className="!px-0 !py-1" onClick={() => setFilters(DEFAULT_FILTERS)}>
            Limpiar filtros ({activeCount})
          </Button>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
          <AppIcon icon={AlertTriangle} size={28} className="mx-auto text-amber-400 mb-3" aria-hidden="true" />
          <p className="text-gray-200 font-medium mb-1">No pudimos cargar las reservas</p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <Button onClick={() => setFilters({ ...filters })}>Reintentar</Button>
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
