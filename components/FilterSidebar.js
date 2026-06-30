'use client';

import { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, Check, Star } from 'lucide-react';
import { CATEGORIES } from '@/lib/mockData';

const ZONES = ['Montevideo', 'Canelones', 'Maldonado', 'Interior del país'];
const RATINGS = [5, 4, 3];

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full py-3.5 group"
      >
        <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
          {title}
        </span>
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function CheckRow({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors text-left group ${
        active ? 'bg-primary-light' : 'hover:bg-gray-50'
      }`}
    >
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          active ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary/50'
        }`}
      >
        {active && <Check size={10} className="text-white" />}
      </div>
      <span className={`text-sm flex-1 min-w-0 truncate ${active ? 'text-primary font-semibold' : 'text-gray-600'}`}>
        {children}
      </span>
      {count != null && (
        <span className="text-xs text-gray-300 shrink-0">{count}</span>
      )}
    </button>
  );
}

export default function FilterSidebar({ filters, onChange, mobileOpen, onMobileClose }) {
  const update = (key, val) => onChange({ ...filters, [key]: val });

  const activeCount = [
    filters.category,
    filters.zone,
    filters.eventType,
    filters.verified,
    filters.minRating > 0,
    filters.maxPrice < 200000,
  ].filter(Boolean).length;

  const clearAll = () =>
    onChange({ category: '', zone: '', minRating: 0, maxPrice: 200000, eventType: '', verified: false, search: filters.search || '' });

  const content = (
    <div className="divide-y divide-gray-100">
      {/* ── Price range ── */}
      <Section title="Rango de Precio">
        <div className="px-1 pt-1">
          <input
            type="range"
            min="10000"
            max="200000"
            step="5000"
            value={filters.maxPrice || 200000}
            onChange={(e) => update('maxPrice', Number(e.target.value))}
            className="w-full mb-3"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">$10.000</span>
            <span className="text-xs font-bold text-primary bg-primary-light border border-primary/20 px-2.5 py-1 rounded-lg">
              hasta ${(filters.maxPrice || 200000).toLocaleString('es-UY')}
            </span>
            <span className="text-xs text-gray-400">$200k+</span>
          </div>
        </div>
      </Section>

      {/* ── Categories ── */}
      <Section title="Categorías">
        <div className="space-y-0.5">
          <CheckRow
            active={!filters.category}
            onClick={() => update('category', '')}
          >
            Todas las categorías
          </CheckRow>
          {CATEGORIES.map((cat) => (
            <CheckRow
              key={cat.id}
              active={filters.category === cat.id}
              onClick={() => update('category', filters.category === cat.id ? '' : cat.id)}
              count={cat.count}
            >
              <span className="flex items-center gap-2">
                <span className="text-base leading-none">{cat.icon}</span>
                <span>{cat.label}</span>
              </span>
            </CheckRow>
          ))}
        </div>
      </Section>

      {/* ── Rating ── */}
      <Section title="Calificación mínima">
        <div className="space-y-0.5">
          <CheckRow active={!filters.minRating} onClick={() => update('minRating', 0)}>
            Cualquier puntuación
          </CheckRow>
          {RATINGS.map((r) => (
            <CheckRow
              key={r}
              active={filters.minRating === r}
              onClick={() => update('minRating', filters.minRating === r ? 0 : r)}
            >
              <span className="flex items-center gap-2">
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i <= r ? 'text-yellow-400 fill-current' : 'text-gray-200'}
                    />
                  ))}
                </span>
                <span className={`text-xs ${filters.minRating === r ? 'text-primary font-semibold' : 'text-gray-500'}`}>
                  {r}.0 y más
                </span>
              </span>
            </CheckRow>
          ))}
        </div>
      </Section>

      {/* ── Zone ── */}
      <Section title="Zona">
        <div className="space-y-0.5">
          <button
            onClick={() => update('zone', '')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
              !filters.zone ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>Todas las zonas</span>
            {!filters.zone && <Check size={13} className="text-primary shrink-0" />}
          </button>
          {ZONES.map((z) => (
            <button
              key={z}
              onClick={() => update('zone', filters.zone === z ? '' : z)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                filters.zone === z ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{z}</span>
              {filters.zone === z && <Check size={13} className="text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Availability (date) ── */}
      <Section title="Disponibilidad" defaultOpen={false}>
        <div className="pt-1">
          <label className="block text-xs text-gray-500 mb-1.5">Fecha del evento</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary transition-colors bg-white"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </Section>

      {/* ── Verified toggle ── */}
      <div className="py-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={!!filters.verified}
              onChange={(e) => update('verified', e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                filters.verified ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                filters.verified ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 block">Solo verificados</span>
            <span className="text-xs text-gray-400">Identidad y documentación confirmada</span>
          </div>
        </label>
      </div>
    </div>
  );

  /* ── MOBILE DRAWER ── */
  if (typeof mobileOpen !== 'undefined') {
    return mobileOpen ? (
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onMobileClose} />
        <div className="relative w-80 max-w-[90vw] bg-white shadow-2xl flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-primary" />
              <span className="font-semibold text-gray-900 text-sm">Filtros</span>
              {activeCount > 0 && (
                <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </div>
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-1">{content}</div>
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={onMobileClose}
              className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
            >
              Ver resultados
            </button>
          </div>
        </div>
      </div>
    ) : null;
  }

  /* ── DESKTOP SIDEBAR ── */
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-primary" />
          <span className="font-semibold text-gray-900 text-sm">Filtros</span>
          {activeCount > 0 && (
            <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
      <div className="px-4">{content}</div>
    </div>
  );
}
