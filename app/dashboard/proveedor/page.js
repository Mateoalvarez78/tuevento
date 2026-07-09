"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Star,
  Package,
  Settings,
  LogOut,
  Check,
  X,
  Bell,
  MapPin,
  Eye,
  Pause,
  Play,
  Trash2,
  AlertCircle,
  ChevronRight,
  Home,
  BadgeCheck,
  BarChart3,
} from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { useRequireRole } from "@/hooks/useRequireRole";
import { providerService } from "@/services/providerService";
import { serviceService } from "@/services/serviceService";
import { bookingService } from "@/services/bookingService";
import { categoryService } from "@/services/categoryService";
import ProviderStatusBadge from "@/components/ProviderStatusBadge";
import ReservationStatusBadge from "@/components/ReservationStatusBadge";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";
import EmptyState from "@/components/EmptyState";

import ProviderOverview from "@/components/dashboard/proveedor/ProviderOverview";
import { FullCalendarView } from "@/components/dashboard/proveedor/DashCalendar";
import { ReviewsSection } from "@/components/dashboard/proveedor/DashWidgets";
import DashCommissions from "@/components/dashboard/proveedor/DashCommissions";
import MenuManager from "@/components/dashboard/proveedor/MenuManager";
import ServiceImageManager from "@/components/dashboard/proveedor/ServiceImageManager";
import { assetUrl } from "@/services/api";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "solicitudes", label: "Solicitudes", icon: ClipboardList },
  { id: "servicios", label: "Servicios", icon: Package },
  { id: "calendario", label: "Calendario", icon: Calendar },
  { id: "resenas", label: "Reseñas", icon: Star },
  { id: "comisiones", label: "Finanzas", icon: BarChart3 },
  { id: "perfil", label: "Perfil", icon: Settings },
];

// Completitud de perfil calculada en base a los campos reales cargados por el proveedor.
function computeProfileCompleteness(p) {
  if (!p) return 0;
  const checks = [
    Boolean(p.description),
    Boolean(p.categoryLabel),
    Array.isArray(p.zones) && p.zones.length > 0,
    Boolean(p.phone),
    Boolean(p.logo_url),
    Boolean(p.whatsapp || p.instagram || p.website),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

const TAB_TITLE = {
  dashboard: "Dashboard",
  solicitudes: "Solicitudes",
  servicios: "Mis Servicios",
  calendario: "Calendario",
  resenas: "Reseñas",
  comisiones: "Finanzas y Comisiones",
  perfil: "Mi Perfil",
};

export default function ProveedorDashboard() {
  const router = useRouter();
  const { user, logout, showToast } = useApp();
  const access = useRequireRole(["provider"]); // solo proveedores (admin incluido)
  const [activeTab, setActiveTab] = useState("dashboard");
  const [providerData, setProviderData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // "Nuevo servicio" modal
  const [newServiceOpen, setNewServiceOpen] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newService, setNewService] = useState({
    title: "",
    category_id: "",
    description: "",
    price_type: "per_person",
    price_from: "",
  });

  // Gestión de menús de un servicio
  const [menuService, setMenuService] = useState(null);
  // Gestión de fotos de un servicio
  const [imageService, setImageService] = useState(null);

  useEffect(() => {
    categoryService
      .getAll()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const reload = async () => {
    if (!user) return;
    try {
      const p = await providerService.getByUserId(user.id);
      setProviderData(p);
      if (p) {
        const [bRes, sRes] = await Promise.all([
          bookingService.getByProvider(p.id, { limit: 50 }),
          serviceService.getByProvider(p.id),
        ]);
        setRequests(bRes.data || []);
        setMyServices(sRes || []);
      }
    } catch (_) {
      // ignore — user sees empty state
    }
  };

  useEffect(() => {
    reload();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rol equivocado (ej. cliente) → useRequireRole ya lo está redirigiendo a su home.
  if (access === "loading" || access === "denied") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verificando acceso…</div>
      </div>
    );
  }

  if (access === "unauth") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Necesitás iniciar sesión
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Ingresá a tu cuenta de proveedor para gestionar tu negocio.
          </p>
          <Link
            href="/provider/login"
            className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Ingresar
          </Link>
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const accountStatus = providerData?.status || "pending";
  const isApproved = accountStatus === "approved";
  const displayName = providerData?.name || "Tu negocio";
  const ownerName = user?.name || "Proveedor";
  const profileComplete = computeProfileCompleteness(providerData);
  const totalBookings = providerData?.totalBookings || 0;

  const logDev = (label, err) => {
    if (process.env.NODE_ENV !== "production")
      console.error(`[dashboard proveedor] ${label}:`, err);
  };

  const handleAccept = async (id) => {
    try {
      await bookingService.updateStatus(id, "accepted");
      await reload();
      showToast("Solicitud aceptada", "success");
    } catch (err) {
      logDev("aceptar reserva", err);
      showToast(err?.message || "No se pudo aceptar la solicitud", "error");
    }
  };

  const handleReject = async (id) => {
    try {
      await bookingService.updateStatus(id, "rejected", rejectReason);
      setRejectModal(null);
      setRejectReason("");
      await reload();
      showToast("Solicitud rechazada", "info");
    } catch (err) {
      logDev("rechazar reserva", err);
      showToast(err?.message || "No se pudo rechazar la solicitud", "error");
    }
  };

  const handleServiceAction = async (serviceId, action) => {
    try {
      if (action === "submit") await serviceService.submit(serviceId);
      if (action === "pause") await serviceService.pause(serviceId);
      if (action === "resume") await serviceService.resume(serviceId);
      if (action === "remove") {
        await serviceService.remove(serviceId);
        showToast("Listado eliminado", "info");
      }
      await reload();
    } catch (err) {
      logDev(`servicio:${action}`, err);
      showToast(err?.message || "No se pudo completar la acción", "error");
    }
  };

  const openNewService = () => {
    const match = categories.find((c) => c.id === providerData?.category);
    setNewService({
      title: "",
      category_id: match?.categoryId || "",
      description: "",
      price_type: "per_person",
      price_from: "",
    });
    setNewServiceOpen(true);
  };

  const handleCreateService = async () => {
    if (!newService.title.trim()) {
      showToast("Ingresá un título", "error");
      return;
    }
    if (!newService.category_id) {
      showToast("Elegí una categoría", "error");
      return;
    }
    const price = Number(newService.price_from);
    if (!Number.isFinite(price) || price < 0) {
      showToast("Ingresá un precio base válido", "error");
      return;
    }
    setSavingService(true);
    try {
      await serviceService.create({
        category_id: newService.category_id,
        title: newService.title.trim(),
        description: newService.description.trim(),
        price_type: newService.price_type,
        price_from: price,
      });
      setNewServiceOpen(false);
      await reload();
      showToast("Servicio creado como borrador", "success");
    } catch (err) {
      logDev("crear servicio", err);
      showToast(err?.message || "No se pudo crear el servicio", "error");
    } finally {
      setSavingService(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ─── FIXED SIDEBAR (desktop) ─── */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col fixed left-0 top-0 h-screen z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
              T
            </div>
            <span className="font-bold text-gray-900 text-lg">Eventonow</span>
          </Link>
        </div>

        {/* Provider card */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={ownerName}
                  className="w-11 h-11 rounded-xl object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-tight truncate">
                {ownerName}
              </p>
              <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">
                {displayName}
              </p>
              {providerData?.rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star size={10} className="text-yellow-400 fill-current" />
                  <span className="text-[11px] font-semibold text-gray-700">
                    {providerData.rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ({providerData.reviewCount})
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Profile completion */}
          <div className="mt-3 px-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-gray-400 font-medium">
                Perfil completo
              </span>
              <span className="text-[11px] font-bold text-primary">
                {profileComplete}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${profileComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 text-left group ${
                  active
                    ? "bg-primary-light text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  size={16}
                  className={
                    active
                      ? "text-primary"
                      : "text-gray-400 group-hover:text-gray-600"
                  }
                />
                <span className="flex-1">{tab.label}</span>
                {tab.id === "solicitudes" && pendingCount > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                    {pendingCount}
                  </span>
                )}
                {active && (
                  <ChevronRight size={13} className="text-primary/50" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick stats strip */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-base font-bold text-gray-900">{totalBookings}</p>
              <p className="text-[10px] text-gray-400 leading-tight">
                Reservas
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-base font-bold text-gray-900">
                {providerData?.rating > 0 ? providerData.rating.toFixed(1) : "—"}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight">
                Calificación
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-3 py-3 border-t border-gray-100">
          <Link
            href="/"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Home size={15} className="text-gray-400" />
            Ir al inicio
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-0.5"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ─── MAIN WRAPPER ─── */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* STICKY HEADER */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sticky px-4 lg:px-6 py-3 flex items-center gap-3">
          {/* Mobile: provider name */}
          <div className="lg:hidden flex items-center gap-2 flex-1 min-w-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
                {ownerName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-sm text-gray-900 truncate">
              {displayName}
            </span>
          </div>

          {/* Desktop: page title */}
          <h1 className="hidden lg:block text-base font-bold text-gray-900 flex-1">
            {TAB_TITLE[activeTab]}
          </h1>

          {/* Notification bell */}
          {pendingCount > 0 && isApproved && (
            <button
              onClick={() => setActiveTab("solicitudes")}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title={`${pendingCount} solicitudes pendientes`}
            >
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            </button>
          )}

          {/* Provider badge (desktop) */}
          <div className="hidden lg:flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
                {ownerName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-tight">
                {ownerName}
              </p>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <BadgeCheck size={10} className="text-primary" /> {isApproved ? "Verificado" : "Proveedor"}
              </p>
            </div>
          </div>
        </header>

        {/* Account status banner */}
        {accountStatus !== "approved" && (
          <StatusBanner
            status={accountStatus}
            reason={providerData?.statusReason}
          />
        )}

        {/* ─── PAGE CONTENT ─── */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-8">
          {/* ── DASHBOARD ── */}
          {activeTab === "dashboard" && (
            <ProviderOverview
              provider={providerData}
              services={myServices}
              onCreateService={openNewService}
              onGoToTab={setActiveTab}
            />
          )}

          {/* ── SOLICITUDES ── */}
          {activeTab === "solicitudes" && (
            <div>
              <p className="text-sm text-gray-500 mb-5">
                {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
              </p>
              {requests.length === 0 ? (
                <EmptyState
                  icon="📭"
                  title="Sin solicitudes"
                  description="Cuando un cliente te consulte, aparecerá aquí."
                />
              ) : (
                <div className="space-y-4">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            {req.clientAvatar ? (
                              <img
                                src={req.clientAvatar}
                                alt={req.clientName}
                                className="w-10 h-10 rounded-full shrink-0 object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                                {(req.clientName || "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900">
                                {req.clientName}
                              </div>
                              <div className="text-xs text-gray-500">
                                #{req.requestNumber}
                              </div>
                            </div>
                          </div>
                          <ReservationStatusBadge status={req.status} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs text-gray-600 mb-3">
                          <div>
                            <span className="text-gray-400 block">Menú</span>
                            <span className="font-medium text-gray-800">
                              {req.packageName || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Tipo</span>
                            <span className="font-medium text-gray-800">
                              {req.eventType}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Fecha</span>
                            <span className="font-medium text-gray-800">
                              {new Date(
                                req.date + "T00:00:00",
                              ).toLocaleDateString("es-UY", {
                                day: "2-digit",
                                month: "short",
                              })}{" "}
                              {req.time}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">
                              Personas
                            </span>
                            <span className="font-medium text-gray-800">
                              {req.adults != null
                                ? `${req.adults} ad.${req.children ? ` + ${req.children} niños` : ""}`
                                : `${req.guests} pers.`}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                          <MapPin size={11} /> {req.location}
                        </div>
                        {req.message && (
                          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 italic mb-3">
                            "{req.message}"
                          </div>
                        )}
                        {/* Financial breakdown: total, Eventonow commission (8%), provider net */}
                        <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 rounded-xl p-3">
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase tracking-wide">
                              Total
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              ${req.totalEstimated?.toLocaleString("es-UY")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase tracking-wide">
                              Comisión (8%)
                            </span>
                            <span className="text-sm font-semibold text-amber-600">
                              -${req.commissionAmount?.toLocaleString("es-UY")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase tracking-wide">
                              Tu neto
                            </span>
                            <span className="text-sm font-bold text-emerald-600">
                              ${req.providerNet?.toLocaleString("es-UY")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {req.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setRejectModal(req.id)}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                              >
                                <X size={14} /> Rechazar
                              </button>
                              <button
                                onClick={() => handleAccept(req.id)}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
                              >
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
          {activeTab === "servicios" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">
                  {myServices.length} servicio
                  {myServices.length !== 1 ? "s" : ""}
                </p>
                {isApproved && (
                  <button
                    onClick={openNewService}
                    className="text-sm font-semibold text-white bg-primary px-3 py-2 rounded-xl hover:bg-primary-dark transition-colors"
                  >
                    + Nuevo servicio
                  </button>
                )}
              </div>
              {myServices.length === 0 ? (
                <EmptyState
                  icon="📋"
                  title="Sin servicios"
                  description="Creá tu primer servicio para aparecer en el catálogo."
                />
              ) : (
                <div className="space-y-3">
                  {myServices.map((svc) => (
                    <div
                      key={svc.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                            {svc.primaryImage ? (
                              <img src={assetUrl(svc.primaryImage)} alt={svc.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl leading-none">{svc.categoryEmoji || "📦"}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-semibold text-gray-900 truncate">
                              {svc.title}
                            </span>
                            <ServiceStatusBadge status={svc.status} />
                            {!svc.primaryImage && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                Sin fotos
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {svc.category} · desde $
                            {svc.priceFrom?.toLocaleString("es-UY")} ·{" "}
                            {svc.views || 0} vistas · {svc.bookings || 0}{" "}
                            reservas
                          </div>
                          {svc.statusReason && (
                            <div className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                              <AlertCircle size={11} /> {svc.statusReason}
                            </div>
                          )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setImageService(svc)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors"
                            title="Administrar fotos"
                          >
                            Fotos
                          </button>
                          <button
                            onClick={() => setMenuService(svc)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors"
                            title="Administrar menús"
                          >
                            Menús
                          </button>
                          {svc.status === "active" && (
                            <Link
                              href={`/proveedor/${providerData?.id}`}
                              target="_blank"
                              className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                              title="Ver público"
                            >
                              <Eye size={15} />
                            </Link>
                          )}
                          {svc.status === "draft" && (
                            <button
                              onClick={() =>
                                handleServiceAction(svc.id, "submit")
                              }
                              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                            >
                              Publicar
                            </button>
                          )}
                          {svc.status === "active" && (
                            <button
                              onClick={() =>
                                handleServiceAction(svc.id, "pause")
                              }
                              className="p-2 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Pausar"
                            >
                              <Pause size={15} />
                            </button>
                          )}
                          {svc.status === "paused" && (
                            <button
                              onClick={() =>
                                handleServiceAction(svc.id, "resume")
                              }
                              className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Reactivar"
                            >
                              <Play size={15} />
                            </button>
                          )}
                          {(svc.status === "draft" ||
                            svc.status === "rejected") && (
                            <button
                              onClick={() =>
                                handleServiceAction(svc.id, "remove")
                              }
                              className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Eliminar"
                            >
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

          {/* ── CALENDARIO ── */}
          {activeTab === "calendario" && <FullCalendarView bookings={requests} />}

          {/* ── RESEÑAS ── */}
          {activeTab === "resenas" && <ReviewsSection provider={providerData} />}

          {/* ── FINANZAS / COMISIONES ── */}
          {activeTab === "comisiones" && <DashCommissions />}

          {/* ── PERFIL ── */}
          {activeTab === "perfil" && providerData && (
            <div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover"
                  />
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900">
                      {user.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <ProviderStatusBadge status={accountStatus} />
                      <span className="text-xs text-gray-400">
                        {providerData.categoryLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Nombre del servicio", value: providerData.name },
                    { label: "Categoría", value: providerData.categoryLabel },
                    { label: "Zona de cobertura", value: providerData.zone },
                    {
                      label: "Tiempo de respuesta",
                      value: providerData.responseTime,
                    },
                    { label: "Email", value: user.email },
                    {
                      label: "Teléfono",
                      value:
                        providerData.owner?.phone || providerData.phone || "—",
                    },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        {f.label}
                      </label>
                      <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50">
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Descripción
                  </label>
                  <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 min-h-[80px]">
                    {providerData.description}
                  </div>
                </div>
                <button className="mt-5 w-full sm:w-auto px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
                  Guardar cambios
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-1 py-1">
        <div className="flex items-center justify-around">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 min-w-[48px] relative rounded-xl transition-colors ${
                  active ? "text-primary" : "text-gray-400"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
                )}
                <Icon size={20} />
                <span className="text-[9px] font-semibold leading-tight">
                  {tab.label}
                </span>
                {tab.id === "solicitudes" && pendingCount > 0 && (
                  <span className="absolute top-1 right-1.5 w-3.5 h-3.5 bg-primary text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setRejectModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Rechazar solicitud
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Indicá el motivo del rechazo para que el cliente lo sepa.
            </p>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none mb-4"
              placeholder="Ej: No tengo disponibilidad para esa fecha."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReject(rejectModal)}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 text-sm transition-colors"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nuevo servicio modal */}
      {newServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !savingService && setNewServiceOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Nuevo servicio
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Se crea como <span className="font-medium">borrador</span>.
              Después podrás publicarlo desde tu lista de servicios.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Título *
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Ej: Catering para casamientos"
                  value={newService.title}
                  onChange={(e) =>
                    setNewService({ ...newService, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Categoría *
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={newService.category_id}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="">Seleccioná...</option>
                  {categories.map((c) => (
                    <option
                      key={c.categoryId || c.id}
                      value={c.categoryId || ""}
                    >
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Contá brevemente qué ofrecés"
                  value={newService.description}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Tipo de precio
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={newService.price_type}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        price_type: e.target.value,
                      })
                    }
                  >
                    <option value="per_person">Por persona</option>
                    <option value="per_event">Por evento</option>
                    <option value="per_hour">Por hora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Precio base *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="0"
                    value={newService.price_from}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        price_from: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Podrás cargar menús (adulto/niño), extras e imágenes más
                adelante.
              </p>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setNewServiceOpen(false)}
                disabled={savingService}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateService}
                disabled={savingService}
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark text-sm transition-colors disabled:opacity-50"
              >
                {savingService ? "Creando..." : "Crear servicio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Administrar menús de un servicio */}
      {menuService && (
        <MenuManager
          service={menuService}
          onClose={() => setMenuService(null)}
          onChanged={reload}
        />
      )}

      {/* Administrar fotos de un servicio */}
      {imageService && (
        <ServiceImageManager
          service={imageService}
          onClose={() => setImageService(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}

function StatusBanner({ status, reason }) {
  const configs = {
    pending: {
      bg: "bg-amber-50 border-amber-200",
      icon: "⏳",
      text: "text-amber-800",
      msg: "Tu cuenta está en revisión. El equipo de Eventonow la revisará en las próximas 24–48 hs.",
    },
    rejected: {
      bg: "bg-red-50 border-red-200",
      icon: "✕",
      text: "text-red-800",
      msg: "Tu cuenta fue rechazada.",
    },
    suspended: {
      bg: "bg-gray-100 border-gray-300",
      icon: "⊘",
      text: "text-gray-700",
      msg: "Tu cuenta está suspendida.",
    },
  };
  const cfg = configs[status];
  if (!cfg) return null;
  return (
    <div className={`border-b ${cfg.bg} px-4 lg:px-6 py-2.5`}>
      <div className="flex items-start sm:items-center gap-2 text-sm flex-wrap">
        <span>{cfg.icon}</span>
        <span className={`font-medium ${cfg.text}`}>{cfg.msg}</span>
        {reason && <span className={`${cfg.text} opacity-70`}>— {reason}</span>}
      </div>
    </div>
  );
}
