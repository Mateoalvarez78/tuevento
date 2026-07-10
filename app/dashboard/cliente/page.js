'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { clientDashboardService } from '@/services/clientDashboardService';
import { providerService } from '@/services/providerService';
import ServiceCard from '@/components/ServiceCard';
import EmptyState from '@/components/EmptyState';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import ClientHero from '@/components/dashboard/cliente/ClientHero';
import ClientStats from '@/components/dashboard/cliente/ClientStats';
import NextEventCard from '@/components/dashboard/cliente/NextEventCard';
import EventOrganizer from '@/components/dashboard/cliente/EventOrganizer';
import CategoryGrid from '@/components/dashboard/cliente/CategoryGrid';
import SmartBuilderCTA from '@/components/dashboard/cliente/SmartBuilderCTA';
import { CalendarPlus, ArrowRight } from 'lucide-react';
import { safeFormatDate } from '@/lib/date';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

export default function ClienteDashboard() {
  const router = useRouter();
  const { user, favorites, logout, showToast } = useApp();
  const access = useRequireRole(['client']); // cliente (admin incluido); proveedor → su portal

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favProviders, setFavProviders] = useState([]);

  // Dashboard agregado (reservas + categorías + derivados)
  useEffect(() => {
    if (access !== 'ok') return;
    setLoading(true);
    setError(null);
    clientDashboardService.getDashboard({ favoritesCount: favorites.length })
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { setError(err?.message || 'No se pudo cargar tu panel'); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, favorites.length]);

  // Favoritos → objetos completos (patrón existente)
  useEffect(() => {
    if (!favorites.length) { setFavProviders([]); return; }
    Promise.all(favorites.slice(0, 6).map((id) => providerService.getById(id).catch(() => null)))
      .then((res) => setFavProviders(res.filter(Boolean)));
  }, [JSON.stringify(favorites)]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => { logout(); showToast('Sesión cerrada', 'info'); router.push('/'); };

  if (access === 'loading' || (access === 'ok' && loading)) {
    return (
      <div className="bg-surface min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          <div className="skeleton h-40 w-full rounded-3xl" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
          <div className="skeleton h-48 w-full rounded-3xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
        </div>
      </div>
    );
  }

  if (access === 'denied') {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="text-gray-400 text-sm">Verificando acceso…</div></div>;
  }

  if (access === 'unauth') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Necesitás iniciar sesión</h2>
          <p className="text-gray-500 text-sm mb-6">Ingresá a tu cuenta para organizar tu evento.</p>
          <Link href="/login" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">Ingresar</Link>
        </div>
      </div>
    );
  }

  const featured = (data?.allCategories || []).slice(0, 8);

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8">

        {/* 1 · Hero */}
        <ClientHero user={user} onLogout={handleLogout} />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
        )}

        {/* 2 · Próximo evento */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Tu próximo evento</h2>
          {data?.nextBooking ? (
            <NextEventCard booking={data.nextBooking} />
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="font-bold text-gray-800 mb-1">Aún no reservaste ningún servicio</h3>
              <p className="text-sm text-gray-500 mb-5">Comenzá explorando nuestro catálogo y armá tu evento ideal.</p>
              <Link href="/catalogo" className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm">
                <CalendarPlus size={16} /> Explorar servicios
              </Link>
            </div>
          )}
        </section>

        {/* 3 · Resumen */}
        {data && <ClientStats stats={data.stats} />}

        {/* 4 · Organizador del evento */}
        {data?.organizerCategories?.length > 0 && <EventOrganizer categories={data.organizerCategories} />}

        {/* 5 · Categorías destacadas */}
        <CategoryGrid title="Explorá por categoría" subtitle="Encontrá todo lo que tu evento necesita" categories={featured} />

        {/* 6 · Recomendaciones */}
        {data?.recommendedCategories?.length > 0 && (
          <CategoryGrid
            title="También podría interesarte"
            subtitle={data.stats.contractedServices > 0 ? 'Sugerencias para completar tu evento' : 'Las categorías más elegidas'}
            categories={data.recommendedCategories}
          />
        )}

        {/* 7 · Favoritos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Tus favoritos</h2>
            {favProviders.length > 0 && <Link href="/catalogo" className="text-sm font-semibold text-primary hover:underline">Explorar más</Link>}
          </div>
          {favProviders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {favProviders.map((p) => <ServiceCard key={p.id} provider={p} />)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState icon="❤️" title="Todavía no guardaste favoritos" description="Guardá los servicios que más te gusten para encontrarlos rápido." cta="Explorar servicios" ctaHref="/catalogo" />
            </div>
          )}
        </section>

        {/* 8 · Historial reciente */}
        {data?.recentBookings?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Historial reciente</h2>
              <Link href="/dashboard/cliente/reservas" className="text-sm font-semibold text-primary hover:underline">Ver todas</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {data.recentBookings.map((b) => (
                <Link key={b.id} href="/dashboard/cliente/reservas" className="group flex items-center gap-3 p-4 hover:bg-gray-50/60 transition-colors">
                  <img src={b.providerImage} alt={b.providerName} className="w-11 h-11 rounded-xl object-cover shrink-0 bg-gray-100" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{b.serviceTitle || b.providerName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {b.providerName}{b.date ? ` · ${safeFormatDate(b.date)}` : ''}
                    </p>
                  </div>
                  <ReservationStatusBadge status={b.displayStatus || b.status} />
                  <span className="text-sm font-semibold text-gray-800 hidden sm:block w-20 text-right">{money(b.totalEstimated)}</span>
                  <span className="text-gray-300 group-hover:text-primary transition-colors shrink-0" title="Ver detalle">
                    <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 9 · CTA futuro */}
        <SmartBuilderCTA />
      </div>
    </div>
  );
}
