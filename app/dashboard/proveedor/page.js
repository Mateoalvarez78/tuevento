'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { PROVIDER_STATS, PROVIDER_REQUESTS, PROVIDERS } from '@/lib/mockData';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import EmptyState from '@/components/EmptyState';
import { LayoutDashboard, ClipboardList, Calendar, Star, Package, Image, Settings, LogOut, Check, X, RefreshCw, Bell, TrendingUp, ChevronRight, MapPin } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'solicitudes', label: 'Solicitudes', icon: ClipboardList },
  { id: 'servicios', label: 'Mis servicios', icon: Package },
  { id: 'calendario', label: 'Calendario', icon: Calendar },
  { id: 'resenas', label: 'Reseñas', icon: Star },
  { id: 'perfil', label: 'Perfil proveedor', icon: Settings },
];

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

export default function ProveedorDashboard() {
  const router = useRouter();
  const { user, logout, showToast, updateReservationStatus } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState(PROVIDER_REQUESTS);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Necesitás iniciar sesión</h2>
          <p className="text-gray-500 text-sm mb-6">Ingresá a tu cuenta de proveedor para gestionar tu negocio.</p>
          <Link href="/login" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">Ingresar</Link>
        </div>
      </div>
    );
  }

  const providerData = PROVIDERS.find((p) => p.id === 'p1') || PROVIDERS[0];

  const handleAccept = (id) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'confirmed' } : r));
    showToast('Solicitud aceptada', 'success');
  };

  const handleReject = (id) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected', rejectionReason: rejectReason } : r));
    setRejectModal(null);
    setRejectReason('');
    showToast('Solicitud rechazada', 'info');
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            {/* Provider card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">{user.name}</div>
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Proveedor activo
                  </div>
                </div>
              </div>
              {pendingCount > 0 && (
                <div className="bg-primary-light border border-primary/20 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-primary font-semibold">
                  <Bell size={13} />
                  {pendingCount} solicitud{pendingCount > 1 ? 'es' : ''} nueva{pendingCount > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Nav */}
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
                    {tab.id === 'solicitudes' && pendingCount > 0 && (
                      <span className="ml-auto bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{pendingCount}</span>
                    )}
                  </button>
                );
              })}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={17} />
                  Cerrar sesión
                </button>
              </div>
            </nav>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* ── DASHBOARD ── */}
            {activeTab === 'dashboard' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-sm text-gray-500">Resumen de tu actividad</p>
                  </div>
                  <span className="text-xs text-gray-400">Últimos 30 días</span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <DashboardMetricCard title="Solicitudes nuevas" value={PROVIDER_STATS.newRequests} icon="📋" color="primary" trend={12} subtitle="vs. mes anterior" />
                  <DashboardMetricCard title="Reservas confirmadas" value={PROVIDER_STATS.confirmedBookings} icon="✅" color="green" trend={8} subtitle="este mes" />
                  <DashboardMetricCard title="Ingresos estimados" value={`$${(PROVIDER_STATS.estimatedRevenue / 1000).toFixed(0)}K`} icon="💰" color="blue" trend={22} subtitle="en proceso" />
                  <DashboardMetricCard title="Rating promedio" value={`${PROVIDER_STATS.avgRating}★`} icon="⭐" color="yellow" subtitle={`${PROVIDER_STATS.totalReviews} reseñas`} />
                </div>

                {/* Quick chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Reservas por mes</h3>
                    <TrendingUp size={18} className="text-green-500" />
                  </div>
                  <div className="flex items-end gap-2 h-24">
                    {PROVIDER_STATS.monthlyBookings.slice(0, 6).map((val, i) => {
                      const max = Math.max(...PROVIDER_STATS.monthlyBookings.slice(0, 6));
                      const height = `${Math.round((val / max) * 100)}%`;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-primary-light rounded-t-md relative" style={{ height: '80px' }}>
                            <div
                              className="absolute bottom-0 w-full bg-primary rounded-t-md transition-all"
                              style={{ height }}
                              title={`${val} reservas`}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{MONTHS[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent requests */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Solicitudes recientes</h3>
                    <button onClick={() => setActiveTab('solicitudes')} className="text-sm text-primary hover:underline">Ver todas</button>
                  </div>
                  <div className="space-y-3">
                    {requests.slice(0, 3).map((req) => (
                      <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/20 transition-colors">
                        <img src={req.clientAvatar} alt={req.clientName} className="w-9 h-9 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">{req.clientName}</div>
                          <div className="text-xs text-gray-500">{req.eventType} · {new Date(req.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</div>
                        </div>
                        <ReservationStatusBadge status={req.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SOLICITUDES ── */}
            {activeTab === 'solicitudes' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Solicitudes recibidas</h2>
                  <span className="text-sm text-gray-500">{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
                </div>
                {requests.length === 0 ? (
                  <EmptyState icon="📭" title="Sin solicitudes" description="Cuando un cliente te consulte, aparecerá aquí." />
                ) : (
                  <div className="space-y-4">
                    {requests.map((req) => (
                      <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <img src={req.clientAvatar} alt={req.clientName} className="w-10 h-10 rounded-full shrink-0" />
                              <div>
                                <div className="font-bold text-gray-900">{req.clientName}</div>
                                <div className="text-xs text-gray-500">#{req.requestNumber}</div>
                              </div>
                            </div>
                            <ReservationStatusBadge status={req.status} />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600 mb-3">
                            <div><span className="text-gray-400 block">Paquete</span><span className="font-medium text-gray-800">{req.package}</span></div>
                            <div><span className="text-gray-400 block">Tipo evento</span><span className="font-medium text-gray-800">{req.eventType}</span></div>
                            <div><span className="text-gray-400 block">Fecha</span><span className="font-medium text-gray-800">{new Date(req.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })} {req.time}</span></div>
                            <div><span className="text-gray-400 block">Invitados</span><span className="font-medium text-gray-800">{req.guests} personas</span></div>
                          </div>

                          <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                            <MapPin size={11} /> {req.location}
                          </div>

                          {req.message && (
                            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 italic mb-3">
                              "{req.message}"
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">${req.estimatedTotal?.toLocaleString('es-AR')}</span>
                            {req.status === 'pending' && (
                              <div className="flex gap-2">
                                <button onClick={() => setRejectModal(req.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                                  <X size={14} /> Rechazar
                                </button>
                                <button onClick={() => { setActiveTab('solicitudes'); showToast('Propondrías otro horario — funcionalidad próximamente', 'info'); }} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
                                  <RefreshCw size={14} /> Proponer horario
                                </button>
                                <button onClick={() => handleAccept(req.id)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors">
                                  <Check size={14} /> Aceptar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SERVICIOS ── */}
            {activeTab === 'servicios' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Mis servicios</h2>
                  <button className="text-sm font-semibold text-white bg-primary px-4 py-2 rounded-xl hover:bg-primary-dark transition-colors">+ Agregar servicio</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <img src={providerData.images[0]} alt={providerData.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-primary font-medium">{providerData.categoryLabel}</div>
                      <div className="font-bold text-gray-900">{providerData.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">desde ${providerData.priceFrom.toLocaleString('es-AR')} · {providerData.totalBookings}+ eventos</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/proveedor/${providerData.id}`} className="text-xs font-medium text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">Ver público</Link>
                      <button className="text-xs font-medium text-primary border border-primary/30 px-3 py-1.5 rounded-xl hover:bg-primary-light transition-colors">Editar</button>
                    </div>
                  </div>
                  {/* Packages */}
                  <div className="border-t border-gray-100 p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Paquetes</h4>
                    <div className="space-y-2">
                      {providerData.packages.map((pkg) => (
                        <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                          <div>
                            <span className="font-semibold text-gray-800">{pkg.name}</span>
                            {pkg.popular && <span className="ml-2 text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">Popular</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">${pkg.price.toLocaleString('es-AR')}</span>
                            <button className="text-xs text-primary hover:underline">Editar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CALENDARIO ── */}
            {activeTab === 'calendario' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-5">Calendario de disponibilidad</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📅</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Calendario interactivo</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                      Marcá tus días disponibles y bloqueá fechas en las que no podés trabajar. Próximamente disponible.
                    </p>
                    <div className="mt-6 grid grid-cols-7 gap-1 max-w-xs mx-auto text-xs">
                      {['D','L','M','X','J','V','S'].map((d) => (
                        <div key={d} className="text-center font-semibold text-gray-500 py-1">{d}</div>
                      ))}
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                        <button
                          key={day}
                          className={`aspect-square flex items-center justify-center rounded-lg text-xs transition-colors ${
                            [5,12,19,26].includes(day) ? 'bg-red-100 text-red-500 font-semibold' :
                            [8,15,22].includes(day) ? 'bg-green-100 text-green-700 font-semibold' :
                            'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Disponible</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Ocupado</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── RESEÑAS ── */}
            {activeTab === 'resenas' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Reseñas</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Star size={16} className="star-filled fill-current" />
                    <span className="font-bold">{PROVIDER_STATS.avgRating}</span>
                    <span className="text-gray-400">({PROVIDER_STATS.totalReviews})</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {providerData.reviews.map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <img src={r.avatar} alt={r.author} className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-900">{r.author}</span>
                            <span className="text-xs text-gray-400">{r.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((i) => <Star key={i} size={12} className={i <= r.rating ? 'star-filled fill-current' : 'star-empty'} />)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PERFIL PROVEEDOR ── */}
            {activeTab === 'perfil' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-5">Perfil del proveedor</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
                    <div>
                      <div className="text-xl font-bold text-gray-900">{user.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge-verified text-xs font-semibold px-2 py-0.5 rounded-full">✓ Verificado</span>
                        <span className="text-xs text-gray-400">{providerData.categoryLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Nombre del servicio', value: providerData.name },
                      { label: 'Categoría', value: providerData.categoryLabel },
                      { label: 'Zona de cobertura', value: providerData.zone },
                      { label: 'Tiempo de respuesta', value: providerData.responseTime },
                      { label: 'Email', value: user.email },
                      { label: 'Teléfono', value: providerData.owner.phone },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                        <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50">{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                    <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 min-h-[80px]">{providerData.description}</div>
                  </div>
                  <button className="mt-6 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
                    Guardar cambios
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="drawer-overlay" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Rechazar solicitud</h3>
            <p className="text-sm text-gray-500 mb-4">Indicá el motivo del rechazo para que el cliente lo sepa.</p>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none mb-4"
              placeholder="Ej: No tengo disponibilidad para esa fecha."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleReject(rejectModal)} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 text-sm transition-colors">
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
