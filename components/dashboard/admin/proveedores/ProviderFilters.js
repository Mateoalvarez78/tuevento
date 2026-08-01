'use client';

// Filtros del listado de Proveedor 360° (Fase A) — todo se resuelve en
// backend (ver admin.getProviders). Fila principal siempre visible + un
// panel "Más filtros" desplegable para no saturar la tabla visualmente,
// mismo criterio de "limpiar filtros (N)" que BookingFilters.js.
import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import Input from '@/components/Input';
import Button from '@/components/Button';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'suspended', label: 'Suspendidos' },
  { value: 'inactive', label: 'Desactivados' },
];

const VERIFIED_OPTIONS = [
  { value: '', label: 'Verificación (todas)' },
  { value: 'true', label: 'Verificados' },
  { value: 'false', label: 'No verificados' },
];

const PUBLISHED_OPTIONS = [
  { value: '', label: 'Servicios (todos)' },
  { value: 'true', label: 'Con servicio publicado' },
  { value: 'false', label: 'Sin servicio publicado' },
];

const BOOKINGS_OPTIONS = [
  { value: '', label: 'Reservas (todas)' },
  { value: 'true', label: 'Con reservas' },
  { value: 'false', label: 'Sin reservas' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Alta más reciente' },
  { value: 'oldest', label: 'Alta más antigua' },
  { value: 'name_asc', label: 'Nombre (A-Z)' },
  { value: 'name_desc', label: 'Nombre (Z-A)' },
  { value: 'rating_desc', label: 'Mejor calificados' },
  { value: 'bookings_desc', label: 'Más reservas' },
  { value: 'revenue_desc', label: 'Mayor facturación' },
];

const selectCls = 'bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-primary/60';

const ADVANCED_KEYS = ['city', 'category', 'hasPublishedServices', 'dateFrom', 'dateTo', 'hasBookings', 'minRating'];
const ALL_FILTER_KEYS = ['search', 'status', 'verified', 'sort', ...ADVANCED_KEYS];

export default function ProviderFilters({ filters, categories = [], onChange, onReset }) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const set = (patch) => onChange({ ...filters, ...patch, page: 1 });
  const activeCount = ALL_FILTER_KEYS.filter((k) => filters[k] && !(k === 'sort' && filters[k] === 'recent')).length;
  const advancedActiveCount = ADVANCED_KEYS.filter((k) => filters[k]).length;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 space-y-3">
      <Input
        variant="dark"
        icon={Search}
        placeholder="Buscar por nombre, responsable, email, teléfono o ID…"
        value={filters.search || ''}
        onChange={(e) => set({ search: e.target.value })}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <select className={selectCls} value={filters.status || ''} onChange={(e) => set({ status: e.target.value })}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className={selectCls} value={filters.verified || ''} onChange={(e) => set({ verified: e.target.value })}>
          {VERIFIED_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className={selectCls} value={filters.sort || 'recent'} onChange={(e) => set({ sort: e.target.value })}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Button
          variant="outline" theme="dark" icon={SlidersHorizontal}
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          Más filtros{advancedActiveCount > 0 ? ` (${advancedActiveCount})` : ''}
        </Button>
      </div>

      {advancedOpen && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-3 border-t border-gray-800">
          <Input
            variant="dark"
            placeholder="Ciudad o zona"
            value={filters.city || ''}
            onChange={(e) => set({ city: e.target.value })}
          />
          <select className={selectCls} value={filters.category || ''} onChange={(e) => set({ category: e.target.value })}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select className={selectCls} value={filters.hasPublishedServices || ''} onChange={(e) => set({ hasPublishedServices: e.target.value })}>
            {PUBLISHED_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={selectCls} value={filters.hasBookings || ''} onChange={(e) => set({ hasBookings: e.target.value })}>
            {BOOKINGS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 mb-0.5 ml-1">Alta desde</label>
            <input type="date" className={selectCls} value={filters.dateFrom || ''} onChange={(e) => set({ dateFrom: e.target.value })} />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 mb-0.5 ml-1">Alta hasta</label>
            <input type="date" className={selectCls} value={filters.dateTo || ''} onChange={(e) => set({ dateTo: e.target.value })} />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 mb-0.5 ml-1">Calificación mínima</label>
            <select className={selectCls} value={filters.minRating || ''} onChange={(e) => set({ minRating: e.target.value })}>
              <option value="">Cualquiera</option>
              {[4.5, 4, 3.5, 3].map((r) => <option key={r} value={r}>{r}+ ★</option>)}
            </select>
          </div>
        </div>
      )}

      {activeCount > 0 && (
        <Button variant="ghost" theme="dark" size="sm" icon={X} className="!px-0 !py-1" onClick={onReset}>
          Limpiar filtros ({activeCount})
        </Button>
      )}
    </div>
  );
}
