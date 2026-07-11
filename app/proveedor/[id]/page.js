'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CheckCircle, Clock, CalendarDays, Heart, Share2, ChevronDown, ChevronUp, PackageX, Star } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { providerService } from '@/services/providerService';
import { reviewService } from '@/services/reviewService';
import ProviderGallery from '@/components/ProviderGallery';
import PackageSelector from '@/components/PackageSelector';
import ReviewCard from '@/components/ReviewCard';
import RatingStars from '@/components/RatingStars';
import EmptyState from '@/components/EmptyState';
import { BADGE_CONFIG } from '@/components/ServiceCard';

const REVIEWS_PAGE_SIZE = 6;

function RatingDistribution({ distribution, total }) {
  return (
    <div className="space-y-1.5 mb-6">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution?.[star] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-10 flex items-center gap-0.5 text-gray-500 font-medium shrink-0">{star} <Star size={11} aria-hidden="true" /></span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-9 text-gray-400 text-right shrink-0">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="skeleton h-4 w-48 rounded mb-4" />
        <div className="skeleton h-72 w-full rounded-2xl mb-8" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div className="skeleton h-8 w-2/3 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
          </div>
          <div className="lg:w-80 shrink-0">
            <div className="skeleton h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { toggleFavorite, isFavorite, user, showToast } = useApp();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPagination, setReviewsPagination] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    providerService.getById(id)
      .then((p) => {
        if (!cancelled) {
          setProvider(p);
          if (p?.packages?.length > 0) {
            setSelectedPackageId(p.packages[1]?.id || p.packages[0]?.id);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  // Reseñas reales del servicio (endpoint separado, paginado + distribución).
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setReviewsLoading(true);
    reviewService.getForService(id, { page: reviewsPage, limit: REVIEWS_PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setReviews((prev) => (reviewsPage === 1 ? res.data : [...prev, ...res.data]));
        setReviewsPagination(res.pagination);
        setDistribution(res.distribution);
        setReviewsLoading(false);
      })
      .catch(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [id, reviewsPage]);

  if (loading) return <LoadingSkeleton />;

  if (!provider) {
    return (
      <EmptyState
        icon={PackageX}
        title="Proveedor no encontrado"
        description="El proveedor que buscás no existe o fue dado de baja."
        cta="Ver catálogo"
        ctaHref="/catalogo"
      />
    );
  }

  const fav = isFavorite(provider.id);
  const selectedPkg = provider.packages?.find((p) => p.id === selectedPackageId) || provider.packages?.[0];

  const handleFav = () => {
    if (!user) { showToast('Iniciá sesión para guardar favoritos', 'info'); return; }
    toggleFavorite(provider.id);
    showToast(fav ? 'Eliminado de favoritos' : '¡Guardado en favoritos!', fav ? 'info' : 'success');
  };

  const handleConsultar = () => {
    const qs = new URLSearchParams({
      providerId: provider.id,
      packageId:  selectedPackageId || '',
    });
    router.push(`/reservar?${qs.toString()}`);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4">
          <a href="/catalogo" className="hover:text-primary transition-colors">Catálogo</a>
          <span className="mx-2">›</span>
          <span className="text-gray-400">{provider.categoryLabel}</span>
          <span className="mx-2">›</span>
          <span className="text-gray-800 font-medium">{provider.name}</span>
        </nav>

        {/* Gallery */}
        <ProviderGallery images={provider.images} name={provider.name} categorySlug={provider.category} />

        <div className="mt-8 flex flex-col lg:flex-row gap-8">
          {/* Left: Details */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-semibold text-primary">{provider.categoryLabel}</span>
                  {(provider.badges || []).map((b) => {
                    const cfg = BADGE_CONFIG[b];
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    return (
                      <span key={b} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.className}`}>
                        <Icon size={12} aria-hidden="true" /> {cfg.label}
                      </span>
                    );
                  })}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{provider.name}</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleFav} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${fav ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-gray-600 hover:border-primary/40'}`}>
                  <Heart size={16} className={fav ? 'fill-primary' : ''} />
                  <span className="hidden sm:inline">{fav ? 'Guardado' : 'Guardar'}</span>
                </button>
                <button onClick={() => { navigator.share?.({ title: provider.name, url: window.location.href }) || showToast('Enlace copiado', 'success'); }} className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:border-primary/40 transition-all">
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Rating + info */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <RatingStars rating={provider.rating} />
                <span className="font-bold text-gray-900">{(provider.rating || 0).toFixed(1)}</span>
                <span className="text-sm text-gray-500">({provider.reviewCount} reseñas)</span>
              </div>
              {provider.zone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin size={14} />
                  {provider.zone}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock size={14} />
                {provider.responseTime}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <CalendarDays size={14} />
                {provider.totalBookings}+ eventos realizados
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Sobre el proveedor</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                {descExpanded ? provider.longDescription : provider.description}
              </p>
              {provider.longDescription && provider.longDescription !== provider.description && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-2 text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  {descExpanded ? <><ChevronUp size={14} /> Ver menos</> : <><ChevronDown size={14} /> Leer más</>}
                </button>
              )}
            </div>

            {/* Packages */}
            {provider.packages?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Menús disponibles</h2>
                <PackageSelector
                  packages={provider.packages}
                  selectedId={selectedPackageId}
                  onSelect={setSelectedPackageId}
                />
              </div>
            )}

            {/* Extras */}
            {provider.extras?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Extras disponibles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {provider.extras.map((ex) => (
                    <div key={ex.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <span className="text-sm text-gray-700">{ex.name}</span>
                      <span className="text-sm font-semibold text-gray-900">+${ex.price.toLocaleString('es-UY')}{ex.priceUnit ? ` ${ex.priceUnit}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zones */}
            {provider.zones?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Zonas de cobertura</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.zones.map((z) => (
                    <span key={z} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                      <MapPin size={12} /> {z}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Event types */}
            {provider.eventTypes?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Tipos de eventos</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.eventTypes.map((t) => (
                    <span key={t} className="px-3 py-1.5 bg-primary-light text-primary text-sm font-medium rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation */}
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
              <h3 className="text-sm font-bold text-yellow-800 mb-1">Política de cancelación</h3>
              <p className="text-sm text-yellow-700">{provider.cancellationPolicy}</p>
            </div>

            {/* FAQ */}
            {provider.faq?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Preguntas frecuentes</h2>
                <div className="space-y-2">
                  {provider.faq.map((item, i) => (
                    <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors text-left"
                      >
                        {item.q}
                        {openFaq === i ? <ChevronUp size={16} className="text-primary shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                      </button>
                      {openFaq === i && (
                        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Opiniones de clientes ({provider.reviewCount})</h2>
                <div className="flex items-center gap-2">
                  <RatingStars rating={provider.rating} size={16} />
                  <span className="font-bold text-gray-900">{(provider.rating || 0).toFixed(1)}</span>
                </div>
              </div>

              {provider.reviewCount > 0 && (
                <RatingDistribution distribution={distribution} total={provider.reviewCount} />
              )}

              {reviewsLoading && reviews.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
                </div>
              ) : reviews.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {reviews.map((r) => (
                      <ReviewCard key={r.id} review={r} />
                    ))}
                  </div>
                  {reviewsPagination?.hasNext && (
                    <div className="flex justify-center mt-5">
                      <button
                        onClick={() => setReviewsPage((p) => p + 1)}
                        disabled={reviewsLoading}
                        className="text-sm font-semibold text-primary border border-primary/30 px-5 py-2.5 rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50"
                      >
                        {reviewsLoading ? 'Cargando...' : 'Ver más reseñas'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">Aún no hay reseñas para este proveedor.</p>
              )}
            </div>
          </div>

          {/* Right: Sticky booking card (desktop) */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
              {selectedPkg ? (
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-0.5">Precio desde</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">${selectedPkg.price.toLocaleString('es-UY')}</span>
                    {selectedPkg.priceUnit && <span className="text-sm text-gray-500">{selectedPkg.priceUnit}</span>}
                  </div>
                  <div className="text-xs text-green-600 font-medium mt-1">Menú {selectedPkg.name} seleccionado</div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-0.5">Precio desde</div>
                  <div className="text-3xl font-extrabold text-gray-900">${(provider.priceFrom || 0).toLocaleString('es-UY')}</div>
                </div>
              )}

              <button
                onClick={handleConsultar}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-colors mb-3 text-sm"
              >
                Consultar disponibilidad
              </button>
              <button
                onClick={handleFav}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${fav ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-gray-600 hover:border-primary/40'}`}
              >
                <Heart size={16} className={fav ? 'fill-primary' : ''} />
                {fav ? 'Guardado en favoritos' : 'Guardar en favoritos'}
              </button>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <CheckCircle size={14} className="text-green-500" />
                  Sin cobros hasta que el proveedor confirme
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle size={14} className="text-green-500" />
                  {provider.responseTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA fixed bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-3 shadow-sticky z-30">
        <div>
          <div className="text-xs text-gray-400">desde</div>
          <div className="font-extrabold text-gray-900">${(selectedPkg?.price || provider.priceFrom || 0).toLocaleString('es-UY')}</div>
        </div>
        <button
          onClick={() => router.push(`/reservar?providerId=${provider.id}&packageId=${selectedPackageId || ''}`)}
          className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
        >
          Consultar disponibilidad
        </button>
        <button onClick={handleFav} className="p-3 rounded-xl border border-gray-200">
          <Heart size={18} className={fav ? 'fill-primary text-primary' : 'text-gray-500'} />
        </button>
      </div>
      <div className="lg:hidden h-20" />
    </div>
  );
}
