'use client';

import { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES } from '@/lib/mockData';

const ZONES = ['Montevideo', 'Canelones', 'Maldonado', 'Interior del país'];
const EVENT_TYPES = ['Cumpleaños', 'Casamiento', 'Empresarial', 'Infantil', 'Fiesta privada'];
const RATINGS = [5, 4, 3];

export default function FilterSidebar({ filters, onChange, mobileOpen, onMobileClose }) {
  const update = (key, val) => onChange({ ...filters, [key]: val });

  const content = (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Categoría</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => update('category', '')}
            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${!filters.category ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Todas las categorías
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => update('category', cat.id)}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center gap-2 ${filters.category === cat.id ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>{cat.icon}</span>
              <span className="flex-1">{cat.label}</span>
              <span className="text-xs text-gray-400">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Price range */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Precio máximo por persona</h4>
        <input
          type="range"
          min="10000"
          max="200000"
          step="5000"
          value={filters.maxPrice || 200000}
          onChange={(e) => update('maxPrice', Number(e.target.value))}
          className="w-full mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>$10.000</span>
          <span className="font-semibold text-primary">${(filters.maxPrice || 200000).toLocaleString('es-UY')}</span>
          <span>$200.000+</span>
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Zone */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Zona</h4>
        <div className="space-y-1.5">
          <button onClick={() => update('zone', '')} className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${!filters.zone ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            Todas las zonas
          </button>
          {ZONES.map((z) => (
            <button
              key={z}
              onClick={() => update('zone', z)}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${filters.zone === z ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Rating */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Rating mínimo</h4>
        <div className="space-y-1.5">
          <button onClick={() => update('minRating', 0)} className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${!filters.minRating ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            Cualquier rating
          </button>
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => update('minRating', r)}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center gap-1 ${filters.minRating === r ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {'⭐'.repeat(r)} {r}.0+
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Event type */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Tipo de evento</h4>
        <div className="space-y-1.5">
          <button onClick={() => update('eventType', '')} className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${!filters.eventType ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            Todos los eventos
          </button>
          {EVENT_TYPES.map((et) => (
            <button
              key={et}
              onClick={() => update('eventType', et)}
              className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${filters.eventType === et ? 'bg-primary-light text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {et}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Verified */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={!!filters.verified}
            onChange={(e) => update('verified', e.target.checked)}
            className="sr-only"
          />
          <div className={`w-10 h-5 rounded-full transition-colors ${filters.verified ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${filters.verified ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">Solo verificados</span>
      </label>

      {/* Clear filters */}
      <button
        onClick={() => onChange({ category: '', zone: '', minRating: 0, maxPrice: 200000, eventType: '', verified: false })}
        className="w-full text-sm text-red-500 hover:text-red-700 font-medium py-2 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
      >
        Limpiar filtros
      </button>
    </div>
  );

  // Mobile drawer
  if (typeof mobileOpen !== 'undefined') {
    return (
      <>
        {mobileOpen && (
          <div className="fixed inset-0 z-40">
            <div className="drawer-overlay" onClick={onMobileClose} />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <SlidersHorizontal size={18} className="text-primary" />
                  Filtros
                </div>
                <button onClick={onMobileClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">{content}</div>
              <div className="px-5 py-4 border-t border-gray-100">
                <button onClick={onMobileClose} className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors">
                  Ver resultados
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
        <SlidersHorizontal size={18} className="text-primary" />
        <h3 className="font-semibold text-gray-900">Filtros</h3>
      </div>
      {content}
    </div>
  );
}
