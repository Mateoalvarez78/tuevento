'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, CalendarDays, Check, ChevronDown } from 'lucide-react';
import { categoryService } from '@/services/categoryService';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function SearchBar({ className = '' }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [catQuery, setCatQuery] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef(null);

  const [locationLabel, setLocationLabel] = useState('');
  const [place, setPlace] = useState(null); // objeto normalizado de LocationAutocomplete
  const [date, setDate] = useState('');

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Cierra el dropdown de categorías al hacer click afuera
  useEffect(() => {
    function onClickOutside(e) {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleCategory = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const selectedCategories = categories.filter((c) => selectedIds.includes(c.id));
  const filteredCategories = catQuery.trim()
    ? categories.filter((c) => c.label.toLowerCase().includes(catQuery.trim().toLowerCase()))
    : categories;

  const handleSearch = (e) => {
    e.preventDefault();
    setCatOpen(false);
    const params = new URLSearchParams();
    if (selectedIds.length) params.set('categories', selectedIds.join(','));
    if (locationLabel) params.set('location', locationLabel);
    if (place?.placeId) params.set('placeId', place.placeId);
    if (place?.lat != null) params.set('lat', String(place.lat));
    if (place?.lng != null) params.set('lng', String(place.lng));
    if (date) params.set('date', date);
    router.push(`/catalogo?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-1 ${className}`}
    >
      {/* Categorías — multiple select con chips */}
      <div ref={catRef} className="flex-1 relative">
        <button
          type="button"
          onClick={() => setCatOpen((v) => !v)}
          aria-expanded={catOpen}
          aria-haspopup="listbox"
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
        >
          <AppIcon icon={Search} size={18} className="text-primary shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-gray-500 mb-0.5">¿Qué servicio necesitás?</label>
            {selectedCategories.length === 0 ? (
              <span className="text-sm text-gray-400">Catering, DJ, Fotografía...</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedCategories.slice(0, 3).map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1 text-xs font-medium bg-primary-light text-primary px-2 py-0.5 rounded-full">
                    <AppIcon icon={c.icon} size={12} aria-hidden="true" /> {c.label}
                  </span>
                ))}
                {selectedCategories.length > 3 && (
                  <span className="text-xs font-medium text-gray-500 px-1">+{selectedCategories.length - 3}</span>
                )}
              </div>
            )}
          </div>
          <AppIcon icon={ChevronDown} size={14} className={`text-gray-400 shrink-0 transition-transform ${catOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {catOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <Input
                autoFocus
                icon={Search}
                placeholder="Buscar categoría..."
                className="bg-gray-50"
                value={catQuery}
                onChange={(e) => setCatQuery(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filteredCategories.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Sin resultados</p>
              ) : (
                filteredCategories.map((c) => {
                  const active = selectedIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="checkbox"
                      aria-checked={active}
                      onClick={() => toggleCategory(c.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-primary-light' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${active ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                        {active && <AppIcon icon={Check} size={11} className="text-white" aria-hidden="true" />}
                      </div>
                      <AppIcon icon={c.icon} size={16} className={active ? 'text-primary' : 'text-gray-500'} aria-hidden="true" />
                      <span className={`text-sm ${active ? 'text-primary font-semibold' : 'text-gray-700'}`}>{c.label}</span>
                    </button>
                  );
                })
              )}
            </div>
            {selectedIds.length > 0 && (
              <div className="p-2.5 border-t border-gray-100 flex items-center justify-between">
                <Button variant="ghost" size="sm" className="!text-gray-400 hover:!text-red-500" onClick={() => setSelectedIds([])}>
                  Limpiar
                </Button>
                <Button size="sm" onClick={() => setCatOpen(false)}>
                  Listo ({selectedIds.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:block w-px bg-gray-200 my-3" />

      {/* Ubicación — Google Places Autocomplete (con fallback si no hay API key) */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
        <AppIcon icon={MapPin} size={18} className="text-primary shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-gray-500 mb-0.5">Zona / Ubicación</label>
          <LocationAutocomplete
            value={locationLabel}
            onChange={setLocationLabel}
            onPlaceSelected={setPlace}
            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-gray-200 my-3" />

      {/* Fecha */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
        <AppIcon icon={CalendarDays} size={18} className="text-primary shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-gray-500 mb-0.5">Fecha del evento</label>
          <input
            type="date"
            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Buscar */}
      <Button type="submit" size="lg" icon={Search} className="whitespace-nowrap">
        <span className="hidden sm:inline">Buscar</span>
      </Button>
    </form>
  );
}
