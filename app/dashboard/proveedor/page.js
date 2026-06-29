'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { providerService } from '@/services/providerService';
import { serviceService } from '@/services/serviceService';
import { bookingService } from '@/services/bookingService';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import ServiceStatusBadge from '@/components/ServiceStatusBadge';
import ProviderStatusBadge from '@/components/ProviderStatusBadge';
import EmptyState from '@/components/EmptyState';
import {
  LayoutDashboard, ClipboardList, Calendar, Star, Package,
  Settings, LogOut, Check, X, Bell, TrendingUp, MapPin,
  Eye, Pause, Play, Trash2, AlertCircle,
} from 'lucide-react';

const TABS = [
  { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'solicitudes', label: 'Solicitudes',  icon: ClipboardList   },
  { id: 'servicios',   label: 'Listados',     icon: Package         },
  { id: 'calendario',  label: 'Calendario',   icon: Calendar        },
  { id: 'resenas',     label: 'Reseñas',      icon: Star            },
  { id: 'perfil',      label: 'Perfil',       icon: Settings        },
];

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

export default function ProveedorDashboard() {
  const router = useRouter();
  const { user, logout, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [providerData, setProviderData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [myServices, setMyServices] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const reload = () => {
    if (!user) return;
    const p = providerService.getByUserId(user.id);
    setProviderData(p);
    if (p) {
      setRequests(bookingService.getByProvider(p.id));
      setStats(bookingService.getProviderStats(p.id));
      setMyServices(serviceService.getByProvider(p.id));
    }
  };

  useEffect(() => { reload(); }, [user]);

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

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const accountStatus = providerData?.status || 'pending';
  const isApproved = accountStatus === 'approved';

  const handleAccept = (id) => {
    bookingService.updateStatus(id, 'confirmed');
    reload();
    showToast('Solicitud aceptada', 'success');
  };

  const handleReject = (id) => {
    bookingService.updateStatus(id, 'rejected', rejectReason);
    setRejectModal(null);
    setRejectReason('');
    reload();
    showToast('Solicitud rechazada', 'info');
  };

  const handleServiceAction = (serviceId, action) => {
    if (action === 'submit')  serviceService.submit(serviceId);
    if (action === 'pause')   serviceService.pause(serviceId);
    if (action === 'resume')  serviceService.resume(serviceId);
    if (action === 'remove') {
      serviceService.remove(serviceId);
      showToast('Listado eliminado', 'info');
    }
    reload();
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Status banner */}
      {accountStatus !== 'approved' && (
        <StatusBanner status={accountStatus} reason={providerData?.statusReason} />
      )}

      {/* ── MOBILE: compact header + tab strip ── */}
      <div className="lg:hidden">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            <div>
              <div className="font-semibold text-sm text-gray-900 leading-tight">{user.name}</div>
              <ProviderStatusBadge status={accountStatus} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && isApproved && (
              <button onClick={() => setActiveTab('solicitudes')} className="relative p-2">
                <Bell size={18} className="text-primary" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">{pendingCount}</span>
              </button>
            )}
            <button onClick={() => { logout(); router.push('/'); }} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
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
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors relative ${
                    active ? 'text-primary bg-primary-light' : 'text-gray-500'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.id === 'solicitudes' && pendingCount > 0 && (
                    <span className="w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">{pendingCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex gap-6">
          {/* ── DESKTOP SIDEBAR ── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">{user.name}</div>
                  <ProviderStatusBadge status={accountStatus} />
                </div>
              </div>
              {pendingCount > 0 && isApproved && (
                <div className="bg-primary-light border border-primary/20 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-primary font-semibold">
                  <Bell size={13} />
                  {pendingCount} solicitud{pendingCount > 1 ? 'es' : ''} nueva{pendingCount > 1 ? 's' : ''}
                </div>
              )}
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
                  <LogOut size={17} /> Cerrar sesión
                </button>
              </div>
            </nav>
          </aside>

          {/* ── CONTENT ── */}
          <main className="flex-1 min-w-0">

            {/* DASHBOARD */}
            {activeTab === 'dashboard' && stats && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg lg:text-xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-sm text-gray-500">Resumen de tu actividad</p>
                  </div>
                  <span className="text-xs text-gray-400 hidden sm:block">Últimos 30 días</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
                  <DashboardMetricCard title="Solicitudes nuevas" value={stats.newRequests} icon="📋" color="primary" trend={12} subtitle="vs. mes anterior" />
                  <DashboardMetricCard title="Reservas confirmadas" value={stats.confirmedBookings} icon="✅" color="green" trend={8} subtitle="este mes" />
                  <DashboardMetricCard title="Ingresos est." value={`$${(stats.estimatedRevenue / 1000).toFixed(0)}K`} icon="💰" color="blue" trend={22} subtitle="en proceso" />
                  <DashboardMetricCard title="Rating" value={`${stats.avgRating}★`} icon="⭐" color="yellow" subtitle={`${stats.totalReviews} reseñas`} />
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Reservas por mes</h3>
                    <TrendingUp size={18} className="text-green-500" />
                  </div>
                  <div className="flex items-end gap-1.5 sm:gap-2 h-20">
                    {stats.monthlyBookings.slice(0, 6).map((val, i) => {
                      const max = Math.max(...stats.monthlyBookings.slice(0, 6));
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-primary-light rounded-t-md relative" style={{ height: '64px' }}>
                            <div
                              className="absolute bottom-0 w-full bg-primary rounded-t-md transition-all"
                              style={{ height: `${Math.round((val / max) * 100)}%` }}
                              title={`${val} reservas`}
                            />
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-400">{MONTHS[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
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
                          <div className="text-xs text-gray-500">{req.eventType} · {new Date(req.date + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}</div>
                        </div>
                        <ReservationStatusBadge status={req.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SOLICITUDES */}
            {activeTab === 'solicitudes' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900">Solicitudes recibidas</h2>
                  <span className="text-sm text-gray-500">{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
                </div>
                {requests.length === 0 ? (
                  <EmptyState icon="📭" title="Sin solicitudes" description="Cuando un cliente te consulte, aparecerá aquí." />
                ) : (
                  <div className="space-y-4">
                    {requests.map((req) => (
                      <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-5">
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
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs text-gray-600 mb-3">
                            <div><span className="text-gray-400 block">Paquete</span><span className="font-medium text-gray-800">{req.package}</span></div>
                            <div><span className="text-gray-400 block">Tipo</span><span className="font-medium text-gray-800">{req.eventType}</span></div>
                            <div><span className="text-gray-400 block">Fecha</span><span className="font-medium text-gray-800">{new Date(req.date + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })} {req.time}</span></div>
                            <div><span className="text-gray-400 block">Invitados</span><span className="font-medium text-gray-800">{req.guests} pers.</span></div>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                            <MapPin size={11} /> {req.location}
                          </div>
                          {req.message && (
                            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 italic mb-3">"{req.message}"</div>
                          )}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900">${req.estimatedTotal?.toLocaleString('es-UY')}</span>
                            {req.status === 'pending' && (
                              <div className="flex gap-2">
                                <button onClick={() => setRejectModal(req.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                                  <X size={14} /> Rechazar
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

            {/* MIS LISTADOS */}
            {activeTab === 'servicios' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg lg:text-xl font-bold text-gray-900">Mis listados</h2>
                    <p className="text-sm text-gray-500">{myServices.length} servicio{myServices.length !== 1 ? 's' : ''}</p>
                  </div>
                  {isApproved && (
                    <button
                      onClick={() => {
                        if (!providerData) return;
                        serviceService.create({ providerId: providerData.id, providerName: providerData.name, title: 'Nuevo servicio (borrador)', category: providerData.category, priceType: 'per_event', priceFrom: 0 });
                        reload();
                        showToast('Borrador creado', 'success');
                      }}
                      className="text-sm font-semibold text-white bg-primary px-3 py-2 rounded-xl hover:bg-primary-dark transition-colors"
                    >
                      + Nuevo
                    </button>
                  )}
                </div>
                {myServices.length === 0 ? (
                  <EmptyState icon="📋" title="Sin listados" description="Creá tu primer servicio para aparecer en el catálogo." />
                ) : (
                  <div className="space-y-3">
                    {myServices.map((svc) => (
                      <div key={svc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="font-semibold text-gray-900 truncate">{svc.title}</span>
                              <ServiceStatusBadge status={svc.status} />
                            </div>
                            <div className="text-xs text-gray-500">
                              {svc.category} · desde ${svc.priceFrom?.toLocaleString('es-UY')} · {svc.views || 0} vistas · {svc.bookings || 0} reservas
                            </div>
                            {svc.statusReason && (
                              <div className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                                <AlertCircle size={11} /> {svc.statusReason}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {svc.status === 'active' && (
                              <Link href={`/proveedor/${providerData?.id}`} target="_blank" className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors" title="Ver público">
                                <Eye size={15} />
                              </Link>
                            )}
                            {svc.status === 'draft' && (
                              <button onClick={() => handleServiceAction(svc.id, 'submit')} className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
                                Publicar
                              </button>
                            )}
                            {svc.status === 'active' && (
                              <button onClick={() => handleServiceAction(svc.id, 'pause')} className="p-2 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-gray-50 transition-colors" title="Pausar">
                                <Pause size={15} />
                              </button>
                            )}
                            {svc.status === 'paused' && (
                              <button onClick={() => handleServiceAction(svc.id, 'resume')} className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-gray-50 transition-colors" title="Reactivar">
                                <Play size={15} />
                              </button>
                            )}
                            {(svc.status === 'draft' || svc.status === 'rejected') && (
                              <button onClick={() => handleServiceAction(svc.id, 'remove')} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors" title="Eliminar">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CALENDARIO */}
            {activeTab === 'calendario' && (
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-5">Calendario de disponibilidad</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center py-12">
                  <div className="text-5xl mb-4">📅</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Próximamente</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">Marcá tus días disponibles y bloqueá fechas en las que no podés trabajar.</p>
                </div>
              </div>
            )}

            {/* RESEÑAS */}
            {activeTab === 'resenas' && providerData && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900">Reseñas</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <span className="font-bold">{providerData.rating}</span>
                    <span className="text-gray-400">({providerData.reviewCount})</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {(providerData.reviews || []).map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <img src={r.avatar} alt={r.author} className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-900">{r.author}</span>
                            <span className="text-xs text-gray-400">{r.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((i) => <Star key={i} size={12} className={i <= r.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PERFIL */}
            {activeTab === 'perfil' && providerData && (
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-5">Perfil del proveedor</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <img src={user.avatar} alt={user.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover" />
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-gray-900">{user.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <ProviderStatusBadge status={accountStatus} />
                        <span className="text-xs text-gray-400">{providerData.categoryLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Nombre del servicio', value: providerData.name },
                      { label: 'Categoría',           value: providerData.categoryLabel },
                      { label: 'Zona de cobertura',   value: providerData.zone },
                      { label: 'Tiempo de respuesta', value: providerData.responseTime },
                      { label: 'Email',               value: user.email },
                      { label: 'Teléfono',            value: providerData.owner?.phone || providerData.phone || '—' },
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
                  <button className="mt-5 w-full sm:w-auto px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setRejectModal(null)} />
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
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors">Cancelar</button>
              <button onClick={() => handleReject(rejectModal)} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 text-sm transition-colors">Rechazar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBanner({ status, reason }) {
  const configs = {
    pending:   { bg: 'bg-amber-50 border-amber-200',  icon: '⏳', text: 'text-amber-800', msg: 'Tu cuenta está en revisión. El equipo de TuEvento la revisará en las próximas 24–48 hs.' },
    rejected:  { bg: 'bg-red-50 border-red-200',      icon: '✕',  text: 'text-red-800',   msg: 'Tu cuenta fue rechazada.' },
    suspended: { bg: 'bg-gray-100 border-gray-300',   icon: '⊘',  text: 'text-gray-700',  msg: 'Tu cuenta está suspendida.' },
  };
  const cfg = configs[status];
  if (!cfg) return null;
  return (
    <div className={`border-b ${cfg.bg} px-4 py-2.5`}>
      <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-2 text-sm flex-wrap">
        <span>{cfg.icon}</span>
        <span className={`font-medium ${cfg.text}`}>{cfg.msg}</span>
        {reason && <span className={`${cfg.text} opacity-70`}>— {reason}</span>}
      </div>
    </div>
  );
}
