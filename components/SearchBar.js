'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, CalendarDays, Users } from 'lucide-react';

// ── Ubicaciones de Uruguay ────────────────────────────────────────────────────
const UY_LOCATIONS = [
  // Departamentos
  { label: 'Montevideo',              sub: 'Departamento' },
  { label: 'Canelones',               sub: 'Departamento' },
  { label: 'Maldonado',               sub: 'Departamento' },
  { label: 'Colonia',                 sub: 'Departamento' },
  { label: 'Salto',                   sub: 'Departamento' },
  { label: 'Paysandú',               sub: 'Departamento' },
  { label: 'Rivera',                  sub: 'Departamento' },
  { label: 'Tacuarembó',             sub: 'Departamento' },
  { label: 'San José',               sub: 'Departamento' },
  { label: 'Rocha',                   sub: 'Departamento' },
  { label: 'Soriano',                 sub: 'Departamento' },
  { label: 'Durazno',                sub: 'Departamento' },
  { label: 'Florida',                 sub: 'Departamento' },
  { label: 'Lavalleja',              sub: 'Departamento' },
  { label: 'Artigas',                sub: 'Departamento' },
  { label: 'Río Negro',              sub: 'Departamento' },
  { label: 'Treinta y Tres',         sub: 'Departamento' },
  { label: 'Cerro Largo',            sub: 'Departamento' },
  { label: 'Flores',                 sub: 'Departamento' },
  // Ciudades / zonas
  { label: 'Punta del Este',         sub: 'Maldonado' },
  { label: 'Ciudad de la Costa',     sub: 'Canelones' },
  { label: 'Las Piedras',            sub: 'Canelones' },
  { label: 'Costa de Oro',           sub: 'Canelones' },
  { label: 'Atlántida',              sub: 'Canelones' },
  { label: 'Piriápolis',             sub: 'Maldonado' },
  { label: 'San Carlos',             sub: 'Maldonado' },
  { label: 'La Paloma',              sub: 'Rocha' },
  { label: 'Carmelo',                sub: 'Colonia' },
  { label: 'Colonia del Sacramento', sub: 'Colonia' },
  { label: 'Nueva Helvecia',         sub: 'Colonia' },
  { label: 'Minas',                  sub: 'Lavalleja' },
  { label: 'Fray Bentos',            sub: 'Río Negro' },
  { label: 'Mercedes',               sub: 'Soriano' },
  { label: 'Trinidad',               sub: 'Flores' },
  { label: 'Melo',                   sub: 'Cerro Largo' },
  // Barrios de Montevideo
  { label: 'Pocitos',                sub: 'Montevideo' },
  { label: 'Punta Carretas',         sub: 'Montevideo' },
  { label: 'Carrasco',               sub: 'Montevideo' },
  { label: 'Ciudad Vieja',           sub: 'Montevideo' },
  { label: 'Centro',                 sub: 'Montevideo' },
  { label: 'Cordón',                 sub: 'Montevideo' },
  { label: 'Palermo',                sub: 'Montevideo' },
  { label: 'Malvín',                 sub: 'Montevideo' },
  { label: 'Buceo',                  sub: 'Montevideo' },
  { label: 'Parque Batlle',          sub: 'Montevideo' },
  { label: 'La Blanqueada',          sub: 'Montevideo' },
  { label: 'Tres Cruces',            sub: 'Montevideo' },
  { label: 'Aguada',                 sub: 'Montevideo' },
  { label: 'Prado',                  sub: 'Montevideo' },
  { label: 'Unión',                  sub: 'Montevideo' },
  { label: 'Colón',                  sub: 'Montevideo' },
  { label: 'Sayago',                 sub: 'Montevideo' },
  { label: 'Cerrito',                sub: 'Montevideo' },
  { label: 'Jacinto Vera',           sub: 'Montevideo' },
];

function highlight(text, query) {
  if (!query || query.length < 2) return { __html: text };
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const html = text.replace(
    new RegExp(`(${safe})`, 'gi'),
    '<strong class="text-gray-900 font-semibold">$1</strong>',
  );
  return { __html: html };
}

export default function SearchBar({ className = '', variant = 'hero' }) {
  const router = useRouter();
  const [form, setForm]           = useState({ service: '', zone: '', date: '', guests: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const zoneRef = useRef(null);

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    function onClickOutside(e) {
      if (zoneRef.current && !zoneRef.current.contains(e.target)) {
        setShowDrop(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function onZoneChange(val) {
    setForm({ ...form, zone: val });
    setActiveIdx(-1);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }
    const q = val.trim().toLowerCase();
    const matches = UY_LOCATIONS.filter(
      (loc) =>
        loc.label.toLowerCase().includes(q) ||
        loc.sub.toLowerCase().includes(q)
    ).slice(0, 6);
    setSuggestions(matches);
    setShowDrop(matches.length > 0);
  }

  function selectSuggestion(loc) {
    const full = loc.sub && loc.sub !== 'Departamento' ? `${loc.label}, ${loc.sub}` : loc.label;
    setForm({ ...form, zone: full });
    setSuggestions([]);
    setShowDrop(false);
    setActiveIdx(-1);
  }

  function onZoneKeyDown(e) {
    if (!showDrop) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setShowDrop(false);
      setActiveIdx(-1);
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    setShowDrop(false);
    const params = new URLSearchParams();
    if (form.service) params.set('q', form.service);
    if (form.zone)    params.set('zona', form.zone);
    if (form.date)    params.set('fecha', form.date);
    if (form.guests)  params.set('invitados', form.guests);
    router.push(`/catalogo?${params.toString()}`);
  };

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSearch} className={`flex gap-2 ${className}`}>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Buscar servicios..."
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">
          Buscar
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSearch}
      className={`bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-1 ${className}`}
    >
      {/* Servicio */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors group">
        <Search size={18} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-gray-500 mb-0.5">¿Qué servicio necesitás?</label>
          <input
            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
            placeholder="Catering, DJ, Fotografía..."
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-gray-200 my-3" />

      {/* Zona — con dropdown de sugerencias */}
      <div ref={zoneRef} className="flex-1 relative flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
        <MapPin size={18} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-gray-500 mb-0.5">Zona / Ubicación</label>
          <input
            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
            placeholder="Montevideo, Canelones..."
            value={form.zone}
            onChange={(e) => onZoneChange(e.target.value)}
            onKeyDown={onZoneKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDrop(true)}
            autoComplete="off"
          />
        </div>

        {/* Dropdown de sugerencias */}
        {showDrop && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1.5">
              Ubicaciones en Uruguay
            </p>
            {suggestions.map((loc, i) => (
              <button
                key={`${loc.label}-${loc.sub}`}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(loc); }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === activeIdx ? 'bg-primary-light' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  i === activeIdx ? 'bg-primary/10' : 'bg-gray-100'
                }`}>
                  <MapPin size={13} className={i === activeIdx ? 'text-primary' : 'text-gray-400'} />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm leading-tight ${i === activeIdx ? 'text-primary' : 'text-gray-700'}`}
                    dangerouslySetInnerHTML={highlight(loc.label, form.zone)}
                  />
                  <p className="text-xs text-gray-400 mt-0.5">{loc.sub}</p>
                </div>
              </button>
            ))}
            <div className="h-2" />
          </div>
        )}
      </div>

      <div className="hidden md:block w-px bg-gray-200 my-3" />

      {/* Fecha */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
        <CalendarDays size={18} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-gray-500 mb-0.5">Fecha del evento</label>
          <input
            type="date"
            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-gray-200 my-3" />

      {/* Invitados */}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
        <Users size={18} className="text-primary shrink-0" />
        <div className="min-w-[80px]">
          <label className="block text-xs font-semibold text-gray-500 mb-0.5">Invitados</label>
          <input
            type="number"
            min="1"
            max="5000"
            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
            placeholder="¿Cuántos?"
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: e.target.value })}
          />
        </div>
      </div>

      {/* Buscar */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm whitespace-nowrap"
      >
        <Search size={18} />
        <span className="hidden sm:inline">Buscar</span>
      </button>
    </form>
  );
}
