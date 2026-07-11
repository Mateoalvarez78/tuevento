'use client';

import { Search, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'accepted', label: 'Aceptadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguas' },
  { value: 'amount_desc', label: 'Mayor importe' },
  { value: 'amount_asc', label: 'Menor importe' },
];

const inputCls = 'bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-primary/60';

export default function BookingFilters({ filters, categories = [], onChange, onReset }) {
  const set = (patch) => onChange({ ...filters, ...patch, page: 1 });
  const activeCount = ['status', 'category', 'dateFrom', 'dateTo', 'search'].filter((k) => filters[k]).length;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 space-y-3">
      {/* Búsqueda */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          className={`w-full ${inputCls} pl-9`}
          placeholder="Buscar por número, cliente, proveedor o servicio…"
          value={filters.search || ''}
          onChange={(e) => set({ search: e.target.value })}
        />
      </div>

      {/* Filtros en fila */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <select className={inputCls} value={filters.status || ''} onChange={(e) => set({ status: e.target.value })}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select className={inputCls} value={filters.category || ''} onChange={(e) => set({ category: e.target.value })}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>

        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 mb-0.5 ml-1">Desde (evento)</label>
          <input type="date" className={inputCls} value={filters.dateFrom || ''} onChange={(e) => set({ dateFrom: e.target.value })} />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 mb-0.5 ml-1">Hasta (evento)</label>
          <input type="date" className={inputCls} value={filters.dateTo || ''} onChange={(e) => set({ dateTo: e.target.value })} />
        </div>

        <select className={inputCls} value={filters.sort || 'recent'} onChange={(e) => set({ sort: e.target.value })}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {activeCount > 0 && (
        <button onClick={onReset} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors">
          <X size={12} /> Limpiar filtros ({activeCount})
        </button>
      )}
    </div>
  );
}
