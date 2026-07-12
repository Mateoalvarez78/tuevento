'use client';

import { Sparkles, Search, LogOut, Wand2 } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';

export default function ClientHero({ user, onLogout }) {
  const first = (user?.name || '').split(' ')[0] || '';
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-dark text-white p-6 sm:p-8 shadow-sm">
      {/* Decorative blobs */}
      <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10" />
      <div className="absolute right-24 -bottom-10 w-32 h-32 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full mb-3">
            <AppIcon icon={Sparkles} size={12} aria-hidden="true" /> Tu espacio en Eventonow
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">¡Hola, {first}! 👋</h1>
          <p className="text-white/85 mt-1 text-sm sm:text-base max-w-md">
            Todo listo para organizar un evento inolvidable.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Button icon={Search} className="!bg-white !text-primary hover:!bg-white/90 shadow-sm" href="/catalogo">
              Explorar servicios
            </Button>
            <Button icon={Wand2} className="!bg-white/15 !text-white hover:!bg-white/25" href="/armar-evento">
              Armar mi evento
            </Button>
          </div>
        </div>

        {user && (
          <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
            <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full ring-2 ring-white/40 object-cover" />
            <button onClick={onLogout} className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors">
              <AppIcon icon={LogOut} size={12} aria-hidden="true" /> Salir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
