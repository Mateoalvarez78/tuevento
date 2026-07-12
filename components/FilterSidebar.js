'use client';

import { useState, useEffect, useId } from 'react';
import { SlidersHorizontal, ChevronDown, Check, Star } from 'lucide-react';
import { categoryService } from '@/services/categoryService';
import { ZONES } from '@/utils/constants';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Drawer from '@/components/Drawer';

const RATINGS = [5, 4, 3];

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex items-center justify-between w-full py-3.5 group"
      >
        <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
          {title}
        </span>
        <AppIcon
          icon={ChevronDown}
          size={15}
          className={`text-gray-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          aria-hidden="true"
        />
      </button>
      {open && <div id={contentId} className="pb-4">{children}</div>}
    </div>
  );
}

function CheckRow({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      role="checkbox"
      aria-checked={active}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors text-left group ${
        active ? 'bg-primary-light' : 'hover:bg-gray-50'
      }`}
    >
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          active ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary/50'
        }`}
      >
        {active && <AppIcon icon={Check} size={10} className="text-white" aria-hidden="true" />}
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
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  const update = (key, val) => onChange({ ...filters, [key]: val });

  // filters.category puede traer varias, separadas por coma (ej. "catering,dj")
  const selectedCategoryIds = filters.category ? filters.category.split(',').filter(Boolean) : [];
  const toggleCategory = (id) => {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((c) => c !== id)
      : [...selectedCategoryIds, id];
    update('category', next.join(','));
  };

  const activeCount = [
    filters.category,
    filters.zone,
    filters.date,
    filters.location,
    filters.eventType,
    filters.verified,
    filters.minRating > 0,
    filters.maxPrice < 200000,
  ].filter(Boolean).length;

  const clearAll = () =>
    onChange({
      category: '', zone: '', date: '', location: '', placeId: '', lat: '', lng: '',
      minRating: 0, maxPrice: 200000, eventType: '', verified: false, search: filters.search || '',
    });

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
            active={selectedCategoryIds.length === 0}
            onClick={() => update('category', '')}
          >
            Todas las categorías
          </CheckRow>
          {categories.map((cat) => (
            <CheckRow
              key={cat.id}
              active={selectedCategoryIds.includes(cat.id)}
              onClick={() => toggleCategory(cat.id)}
            >
              <span className="flex items-center gap-2">
                <AppIcon icon={cat.icon} size={16} className="text-gray-500" aria-hidden="true" />
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
                    <AppIcon
                      key={i}
                      icon={Star}
                      size={12}
                      className={i <= r ? 'text-yellow-400 fill-current' : 'text-gray-200'}
                      aria-hidden="true"
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
            role="checkbox"
            aria-checked={!filters.zone}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
              !filters.zone ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>Todas las zonas</span>
            {!filters.zone && <AppIcon icon={Check} size={13} className="text-primary shrink-0" aria-hidden="true" />}
          </button>
          {ZONES.map((z) => (
            <button
              key={z}
              onClick={() => update('zone', filters.zone === z ? '' : z)}
              role="checkbox"
              aria-checked={filters.zone === z}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                filters.zone === z ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{z}</span>
              {filters.zone === z && <AppIcon icon={Check} size={13} className="text-primary shrink-0" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Fecha del evento (informativa: hoy no filtra resultados, ver nota en catálogo) ── */}
      <Section title="Fecha del evento" defaultOpen={false}>
        <div className="pt-1">
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary transition-colors bg-white"
            value={filters.date || ''}
            onChange={(e) => update('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-[11px] text-gray-400 mt-1.5">Se usa para pre-completar tu reserva, no filtra los resultados.</p>
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
    return (
      <Drawer
        open={mobileOpen}
        onClose={onMobileClose}
        width="max-w-[90vw] w-80"
        title={
          <span className="flex items-center gap-2">
            <AppIcon icon={SlidersHorizontal} size={16} className="text-primary" aria-hidden="true" />
            Filtros
            {activeCount > 0 && (
              <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </span>
        }
        footer={
          <>
            {activeCount > 0 && (
              <Button variant="outline" className="flex-1" onClick={clearAll}>Limpiar</Button>
            )}
            <Button className="flex-1" onClick={onMobileClose}>Ver resultados</Button>
          </>
        }
      >
        {content}
      </Drawer>
    );
  }

  /* ── DESKTOP SIDEBAR ── */
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppIcon icon={SlidersHorizontal} size={15} className="text-primary" aria-hidden="true" />
          <span className="font-semibold text-gray-900 text-sm">Filtros</span>
          {activeCount > 0 && (
            <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="!text-red-500 hover:!text-red-700" onClick={clearAll}>
            Limpiar
          </Button>
        )}
      </div>
      <div className="px-4">{content}</div>
    </div>
  );
}
