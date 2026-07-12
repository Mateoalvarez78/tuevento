'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Clock, CheckCircle, Zap, TrendingUp, Award, Sparkles, Star } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { assetUrl } from '@/services/api';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import RatingStars from '@/components/RatingStars';
import { getCategoryIcon } from '@/utils/icons';

// Portada del servicio: resuelve /uploads/... contra el backend; fallback por
// categoría; fade-in suave una vez que la imagen carga (sin tocar la
// resolución de Cloudinary/assetUrl, solo la presentación).
function Cover({ provider, className }) {
  const [loaded, setLoaded] = useState(false);
  const raw = provider.images?.[0];
  const src = raw ? assetUrl(raw) : null;
  if (src) {
    return (
      <img
        src={src}
        alt={provider.name}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  const CategoryIcon = getCategoryIcon(provider.category);
  return (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-primary-light to-gray-100`}>
      <AppIcon icon={CategoryIcon} size={48} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
    </div>
  );
}

export const BADGE_CONFIG = {
  verified: { label: 'Verificado', className: 'badge-verified', icon: CheckCircle },
  top:      { label: 'Top proveedor', className: 'badge-top', icon: Award },
  fast:     { label: 'Respuesta rápida', className: 'badge-fast', icon: Zap },
  popular:  { label: 'Más reservado', className: 'badge-popular', icon: TrendingUp },
};

// Pill compacto para mostrar sobre la imagen: rating o "Nuevo" si no hay reseñas.
function RatingPill({ provider }) {
  if (provider.reviewCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
        <AppIcon icon={Star} size={12} className="fill-current text-warning" aria-hidden="true" />
        {provider.rating.toFixed(1)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
      <AppIcon icon={Sparkles} size={12} aria-hidden="true" />
      Nuevo
    </span>
  );
}

// Detalle de rating para el cuerpo de la card (número + cantidad de reseñas).
function RatingDetail({ provider }) {
  if (provider.reviewCount > 0) {
    return (
      <>
        <RatingStars rating={provider.rating} size={13} />
        <span className="text-sm font-semibold text-gray-800">{provider.rating.toFixed(1)}</span>
        <span className="text-xs text-gray-400">({provider.reviewCount})</span>
      </>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">
      <AppIcon icon={Sparkles} size={11} aria-hidden="true" /> Nuevo
    </span>
  );
}

function Badges({ provider, iconSize }) {
  if (!provider.badges?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {provider.badges.slice(0, 2).map((b) => {
        const cfg = BADGE_CONFIG[b];
        if (!cfg) return null;
        return (
          <span key={b} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
            <AppIcon icon={cfg.icon} size={iconSize} aria-hidden="true" />
            {cfg.label}
          </span>
        );
      })}
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

  const favLabel = fav ? 'Quitar de favoritos' : 'Guardar en favoritos';

  if (layout === 'list') {
    return (
      <Link href={`/proveedor/${provider.id}`} className="group block">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex gap-0">
          <div className="relative w-48 shrink-0 bg-gray-100 overflow-hidden">
            <Cover provider={provider} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
            <button
              onClick={handleFav}
              aria-label={favLabel}
              aria-pressed={fav}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            >
              <AppIcon icon={Heart} size={16} className={fav ? 'fill-primary text-primary' : 'text-gray-500'} aria-hidden="true" />
            </button>
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full truncate">
                {provider.categoryLabel}
              </span>
              <RatingPill provider={provider} />
            </div>
          </div>
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  {provider.businessName && (
                    <span className="text-xs text-gray-400 truncate block">{provider.businessName}</span>
                  )}
                  <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-primary transition-colors truncate">
                    {provider.name}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500">desde</div>
                  <div className="font-bold text-gray-900">${provider.priceFrom.toLocaleString('es-UY')}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <RatingDetail provider={provider} />
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{provider.description}</p>
            </div>
            <div className="flex items-center justify-between mt-3 gap-2">
              <div className="flex items-center gap-3 text-xs text-gray-500 min-w-0">
                <span className="flex items-center gap-1 shrink-0">
                  <AppIcon icon={MapPin} size={12} aria-hidden="true" />
                  {provider.zone}
                </span>
                {provider.responseTime && (
                  <span className="hidden sm:flex items-center gap-1 truncate">
                    <AppIcon icon={Clock} size={12} aria-hidden="true" />
                    {provider.responseTime}
                  </span>
                )}
              </div>
              <Badges provider={provider} iconSize={11} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/proveedor/${provider.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden h-60 bg-gray-100">
          <Cover provider={provider} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          {/* Overlay con degradado suave para que el rating/categoría se lean sobre cualquier foto */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

          {/* Favorite */}
          <button
            onClick={handleFav}
            aria-label={favLabel}
            aria-pressed={fav}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
          >
            <AppIcon icon={Heart} size={17} className={fav ? 'fill-primary text-primary' : 'text-gray-500'} aria-hidden="true" />
          </button>

          {/* Categoría + rating, sobre el degradado */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full truncate">
              {provider.categoryLabel}
            </span>
            <RatingPill provider={provider} />
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          {provider.businessName && (
            <span className="text-xs text-gray-400 truncate mb-0.5">{provider.businessName}</span>
          )}
          <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {provider.name}
          </h3>

          {/* Rating detallado */}
          <div className="flex items-center gap-1.5 mb-2">
            <RatingDetail provider={provider} />
          </div>

          {/* Zona + tiempo de respuesta */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <AppIcon icon={MapPin} size={12} aria-hidden="true" />
              {provider.zone}
            </span>
            {provider.responseTime && (
              <span className="flex items-center gap-1 truncate">
                <AppIcon icon={Clock} size={12} aria-hidden="true" />
                {provider.responseTime}
              </span>
            )}
          </div>

          {/* Badges */}
          {provider.badges?.length > 0 && (
            <div className="mb-3">
              <Badges provider={provider} iconSize={10} />
            </div>
          )}

          {/* Price + CTA */}
          <div className="mt-auto flex items-center justify-between gap-2">
            <div>
              <span className="text-xs text-gray-400">desde</span>
              <div className="font-bold text-gray-900">${provider.priceFrom.toLocaleString('es-UY')}</div>
            </div>
            <Button as="span" variant="outline" size="sm" className="pointer-events-none group-hover:bg-primary group-hover:text-white">
              Ver detalle
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
