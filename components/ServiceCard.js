'use client';

import Link from 'next/link';
import { Heart, Star, MapPin, CheckCircle, Zap, TrendingUp, Award } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

const BADGE_CONFIG = {
  verified: { label: 'Verificado', className: 'badge-verified', icon: CheckCircle },
  top:      { label: 'Top proveedor', className: 'badge-top', icon: Award },
  fast:     { label: 'Respuesta rápida', className: 'badge-fast', icon: Zap },
  popular:  { label: 'Más reservado', className: 'badge-popular', icon: TrendingUp },
};

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= Math.round(rating) ? 'star-filled fill-current' : 'star-empty'}
        />
      ))}
    </div>
  );
}

export default function ServiceCard({ provider, layout = 'grid' }) {
  const { toggleFavorite, isFavorite, user, showToast } = useApp();
  const fav = isFavorite(provider.id);

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { showToast('Iniciá sesión para guardar favoritos', 'info'); return; }
    toggleFavorite(provider.id);
    showToast(fav ? 'Eliminado de favoritos' : 'Guardado en favoritos', fav ? 'info' : 'success');
  };

  if (layout === 'list') {
    return (
      <Link href={`/proveedor/${provider.id}`} className="group block">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden flex gap-0">
          <div className="relative w-48 shrink-0">
            <img
              src={provider.images[0]}
              alt={provider.name}
              className="w-full h-full object-cover"
            />
            <button onClick={handleFav} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
              <Heart size={16} className={fav ? 'fill-primary text-primary' : 'text-gray-500'} />
            </button>
          </div>
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <span className="text-xs font-medium text-primary">{provider.categoryLabel}</span>
                  <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-primary transition-colors">
                    {provider.name}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500">desde</div>
                  <div className="font-bold text-gray-900">${provider.priceFrom.toLocaleString('es-AR')}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Stars rating={provider.rating} />
                <span className="text-sm font-semibold text-gray-800">{provider.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({provider.reviewCount} reseñas)</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{provider.description}</p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} />
                {provider.zone}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {provider.badges.slice(0, 2).map((b) => {
                  const cfg = BADGE_CONFIG[b];
                  if (!cfg) return null;
                  return (
                    <span key={b} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                      <cfg.icon size={11} />
                      {cfg.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/proveedor/${provider.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden h-52">
          <img
            src={provider.images[0]}
            alt={provider.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Favorite */}
          <button
            onClick={handleFav}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
          >
            <Heart size={17} className={fav ? 'fill-primary text-primary' : 'text-gray-500'} />
          </button>
          {/* Category pill */}
          <div className="absolute bottom-3 left-3">
            <span className="text-xs font-semibold text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              {provider.categoryLabel}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {provider.name}
            </h3>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <Stars rating={provider.rating} />
            <span className="text-sm font-semibold text-gray-800">{provider.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({provider.reviewCount})</span>
          </div>

          {/* Zone */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <MapPin size={12} />
            <span>{provider.zone}</span>
          </div>

          {/* Badges */}
          {provider.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {provider.badges.slice(0, 2).map((b) => {
                const cfg = BADGE_CONFIG[b];
                if (!cfg) return null;
                return (
                  <span key={b} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                    <cfg.icon size={10} />
                    {cfg.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Price + CTA */}
          <div className="mt-auto flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400">desde</span>
              <div className="font-bold text-gray-900">${provider.priceFrom.toLocaleString('es-AR')}</div>
            </div>
            <span className="text-xs font-semibold text-primary border border-primary/30 bg-primary-light px-3 py-1.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
              Ver detalle
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
