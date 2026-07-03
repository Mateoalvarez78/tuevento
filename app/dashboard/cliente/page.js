'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { bookingService } from '@/services/bookingService';
import { providerService } from '@/services/providerService';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import ServiceCard from '@/components/ServiceCard';
import EmptyState from '@/components/EmptyState';
import { Calendar, Heart, Clock, User, MessageSquare, LogOut, MapPin, Star } from 'lucide-react';

const TABS = [
  { id: 'reservas',  label: 'Mis reservas', icon: Calendar      },
  { id: 'favoritos', label: 'Favoritos',     icon: Heart         },
  { id: 'mensajes',  label: 'Mensajes',      icon: MessageSquare },
  { id: 'perfil',    label: 'Mi perfil',     icon: User          },
];

export default function ClienteDashboard() {
  const router = useRouter();
  const { user, favorites, logout, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('reservas');
  const [statusFilter, setStatusFilter] = useState('all');

  const [reservations, setReservations] = useState([]);
  const [loadingRes, setLoadingRes] = useState(true);

  const [favoriteProviders, setFavoriteProviders] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Load bookings
  useEffect(() => {
    if (!user) return;
    setLoadingRes(true);
    bookingService.getByClient(user.id)
      .then((res) => { setReservations(res.data || []); setLoadingRes(false); })
      .catch(() => setLoadingRes(false));
  }, [user]);

  // Load full provider data for favorites
  useEffect(() => {
    if (!favorites.length) { setFavoriteProviders([]); return; }
    setLoadingFavs(true);
    Promise.all(favorites.map((id) => providerService.getById(id).catch(() => null)))
      .then((results) => { setFavoriteProviders(results.filter(Boolean)); setLoadingFavs(false); });
  }, [JSON.stringify(favorites)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Necesitás iniciar sesión</h2>
          <p className="text-gray-500 text-sm mb-6">Ingresá a tu cuenta para ver tus reservas y favoritos.</p>
          <Link href="/login" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">
            Ingresar
          </Link>
        </div>
      </div>
    );
  }

  const filteredReservations = statusFilter === 'all' ? reservations : reservations.filter((r) => r.status === statusFilter);

  return (
    <div className="bg-surface min-h-screen">
      {/* ── MOBILE: compact header + tab strip ── */}
      <div className="lg:hidden">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            <div>
              <div className="font-semibold text-sm text-gray-900 leading-tight">{user.name.split(' ')[0]}</div>
              <div className="text-xs text-gray-400">{reservations.length} reserva{reservations.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); showToast('Sesión cerrada', 'info'); router.push('/'); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
        {/* Horizontal scrollable tab strip */}
        <div className="bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide">
          <div className="flex px-2 py-1 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    active ? 'text-primary bg-primary-light' : 'text-gray-500'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.id === 'favoritos' && favorites.length > 0 && (
                    <span className="w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">{favorites.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex gap-6">
          {/* ── DESKTOP SIDEBAR ── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4">
              <div className="flex items-center gap-3 mb-4">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">{user.name}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div className="bg-surface rounded-xl p-2">
                  <div className="font-bold text-gray-900">{reservations.length}</div>
                  <div className="text-xs text-gray-500">Reservas</div>
                </div>
                <div className="bg-surface rounded-xl p-2">
                  <div className="font-bold text-gray-900">{favorites.length}</div>
                  <div className="text-xs text-gray-500">Favoritos</div>
                </div>
              </div>
            </div>

            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left ${activeTab === tab.id ? 'bg-primary-light text-primary border-r-2 border-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Icon size={17} />
                    {tab.label}
                    {tab.id === 'favoritos' && favorites.length > 0 && (
                      <span className="ml-auto bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{favorites.length}</span>
                    )}
                  </button>
                );
              })}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => { logout(); showToast('Sesión cerrada', 'info'); router.push('/'); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={17} />
                  Cerrar sesión
                </button>
              </div>
            </nav>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 min-w-0">

            {/* ── RESERVAS ── */}
            {activeTab === 'reservas' && (
              <div>
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900">Mis reservas</h2>
                  <Link href="/catalogo" className="text-sm font-semibold text-primary hover:underline">+ Nueva</Link>
                </div>

                {/* Status filter */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
                  {[['all', 'Todas'], ['pending', 'Pendientes'], ['confirmed', 'Confirmadas'], ['completed', 'Completadas'], ['rejected', 'Rechazadas']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setStatusFilter(val)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === val ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40'}`}
                    >
                      {label}
                      {val !== 'all' && (
                        <span className="ml-1.5 opacity-60">{reservations.filter((r) => r.status === val).length}</span>
                      )}
                    </button>
                  ))}
                </div>

                {loadingRes ? (
                  <div className="space-y-4">
                    {[1,2,3].map((i) => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}
                  </div>
                ) : filteredReservations.length === 0 ? (
                  <EmptyState icon="📋" title="Sin reservas" description="No tenés reservas en este estado." cta="Explorar servicios" ctaHref="/catalogo" />
                ) : (
                  <div className="space-y-4">
                    {filteredReservations.map((res) => (
                      <div key={res.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex gap-3 sm:gap-4 p-4">
                          <img src={res.providerImage} alt={res.providerName} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-xs text-primary font-medium">{res.providerCategory}</div>
                                <div className="font-bold text-gray-900 truncate">{res.providerName}</div>
                              </div>
                              <ReservationStatusBadge status={res.status} />
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-500 mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {res.date && new Date(res.date + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {res.time && ` – ${res.time}hs`}
                              </span>
                              {res.location && <span className="flex items-center gap-1"><MapPin size={11} /> {res.location}</span>}
                            </div>
                            <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                              <div className="text-sm font-semibold text-gray-800">
                                {res.packageName && `Paquete ${res.packageName} · `}${res.totalEstimated?.toLocaleString('es-UY')}
                              </div>
                              <span className="text-xs text-gray-400">#{res.requestNumber}</span>
                            </div>
                            {res.rejectionReason && (
                              <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
                                Motivo: {res.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>
                        {res.status === 'confirmed' && !res.depositPaid && (
                          <div className="border-t border-gray-100 px-4 py-3 bg-green-50 flex items-center justify-between">
                            <span className="text-xs text-green-700 font-medium">Seña pendiente: ${res.depositAmount?.toLocaleString('es-UY')}</span>
                            <button className="text-xs font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">Pagar seña</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── FAVORITOS ── */}
            {activeTab === 'favoritos' && (
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-5">Mis favoritos</h2>
                {loadingFavs ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[1,2].map((i) => <div key={i} className="skeleton h-48 w-full rounded-2xl" />)}
                  </div>
                ) : favoriteProviders.length === 0 ? (
                  <EmptyState icon="❤️" title="Sin favoritos" description="Guardá proveedores para encontrarlos rápidamente." cta="Explorar servicios" ctaHref="/catalogo" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {favoriteProviders.map((p) => (
                      <ServiceCard key={p.id} provider={p} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── MENSAJES ── */}
            {activeTab === 'mensajes' && (
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-5">Mensajes</h2>
                <div className="space-y-3">
                  {reservations.slice(0, 3).map((res) => (
                    <div key={res.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                      <img src={res.providerImage} alt={res.providerName} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{res.providerName}</div>
                        <div className="text-sm text-gray-500 truncate">{res.message || 'Sin mensajes aún.'}</div>
                      </div>
                      <ReservationStatusBadge status={res.status} />
                    </div>
                  ))}
                  {reservations.length === 0 && (
                    <EmptyState icon="💬" title="Sin mensajes" description="Cuando consultes un proveedor, verás los mensajes aquí." />
                  )}
                </div>
              </div>
            )}

            {/* ── PERFIL ── */}
            {activeTab === 'perfil' && (
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-5">Mi perfil</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <img src={user.avatar} alt={user.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover" />
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.createdAt && (
                        <div className="text-xs text-gray-400 mt-1">Miembro desde {new Date(user.createdAt).toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Nombre completo', value: user.name },
                      { label: 'Email',            value: user.email },
                      { label: 'Teléfono',         value: user.phone || 'No indicado' },
                      { label: 'Tipo de cuenta',   value: user.role === 'provider' ? 'Proveedor' : 'Cliente' },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                        <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50">{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-5 w-full sm:w-auto px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
                    Editar perfil
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
