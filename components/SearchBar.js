'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, CalendarDays, Users } from 'lucide-react';

export default function SearchBar({ className = '', variant = 'hero' }) {
  const router = useRouter();
  const [form, setForm] = useState({ service: '', zone: '', date: '', guests: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.service) params.set('q', form.service);
    if (form.zone) params.set('zona', form.zone);
    if (form.date) params.set('fecha', form.date);
    if (form.guests) params.set('invitados', form.guests);
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
      {/* Service */}
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

      {/* Zone */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
        <MapPin size={18} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-gray-500 mb-0.5">Zona / Ubicación</label>
          <input
            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
            placeholder="CABA, GBA Norte..."
            value={form.zone}
            onChange={(e) => setForm({ ...form, zone: e.target.value })}
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-gray-200 my-3" />

      {/* Date */}
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

      {/* Guests */}
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

      {/* Submit */}
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
