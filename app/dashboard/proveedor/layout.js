'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, Package, Calendar, Star, BarChart3, Settings,
  LogOut, Bell, ChevronRight, Home, BadgeCheck,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { providerService } from '@/services/providerService';
import { providerDashboardService } from '@/services/providerDashboardService';

const NAV_ITEMS = [
  { href: '/dashboard/proveedor',            label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/proveedor/reservas',   label: 'Reservas',  icon: ClipboardList },
  { href: '/dashboard/proveedor/servicios',  label: 'Servicios', icon: Package },
  { href: '/dashboard/proveedor/calendario', label: 'Calendario',icon: Calendar },
  { href: '/dashboard/proveedor/resenas',    label: 'Reseñas',   icon: Star },
  { href: '/dashboard/proveedor/finanzas',   label: 'Finanzas',  icon: BarChart3 },
  { href: '/dashboard/proveedor/perfil',     label: 'Perfil',    icon: Settings },
];

const TAB_TITLE = {
  '/dashboard/proveedor': 'Dashboard',
  '/dashboard/proveedor/reservas': 'Reservas',
  '/dashboard/proveedor/servicios': 'Mis servicios',
  '/dashboard/proveedor/calendario': 'Calendario',
  '/dashboard/proveedor/resenas': 'Reseñas',
  '/dashboard/proveedor/finanzas': 'Finanzas y comisiones',
  '/dashboard/proveedor/perfil': 'Mi perfil',
};

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

// ─── Contexto: datos "de chrome" compartidos por todas las secciones ──────────
// Evita que cada página vuelva a pedir el perfil del proveedor: lo pide una
// sola vez el layout (que vive montado durante toda la navegación) y lo expone
// acá. Cada página sigue pidiendo SU propio contenido (servicios, reservas...).
const ProviderDashboardContext = createContext(null);

export function useProviderDashboard() {
  const ctx = useContext(ProviderDashboardContext);
  if (!ctx) throw new Error('useProviderDashboard debe usarse dentro de /dashboard/proveedor');
  return ctx;
}

export default function ProviderDashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useApp();
  const access = useRequireRole(['provider']);

  const [providerData, setProviderData] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [open, setOpen] = useState(false); // drawer mobile

  const reloadProviderData = useCallback(async () => {
    if (!user) return;
    try {
      const p = await providerService.getByUserId(user.id);
      setProviderData(p);
      const dash = await providerDashboardService.getDashboard().catch(() => null);
      setPendingCount(dash?.bookings?.pending || 0);
    } catch (_) {
      // el shell no bloquea la navegación por esto — cada página maneja sus propios errores
    }
  }, [user]);

  useEffect(() => { reloadProviderData(); }, [reloadProviderData]);

  // Cierra el drawer mobile al navegar
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (access === 'loading' || access === 'denied') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verificando acceso…</div>
      </div>
    );
  }

  if (access === 'unauth') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Necesitás iniciar sesión</h2>
          <p className="text-gray-500 text-sm mb-6">Ingresá a tu cuenta de proveedor para gestionar tu negocio.</p>
          <Link href="/provider/login" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">
            Ingresar
          </Link>
        </div>
      </div>
    );
  }

  const accountStatus = providerData?.status || 'active';
  const isAccountActive = accountStatus === 'active';
  const displayName = providerData?.name || 'Tu negocio';
  const ownerName = user?.name || 'Proveedor';
  const profileComplete = computeProfileCompleteness(providerData);
  const totalBookings = providerData?.totalBookings || 0;
  const isNavActive = (item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
  const pageTitle = TAB_TITLE[pathname] || 'Dashboard';

  const SidebarNav = () => (
    <nav className="flex-1 overflow-y-auto px-3 py-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 text-left group ${
              active ? 'bg-primary-light text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon size={16} className={active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'} />
            <span className="flex-1">{item.label}</span>
            {item.href === '/dashboard/proveedor/reservas' && pendingCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                {pendingCount}
              </span>
            )}
            {active && <ChevronRight size={13} className="text-primary/50" />}
          </Link>
        );
      })}
    </nav>
  );

  const ProviderCard = () => (
    <div className="px-4 pt-4 pb-3 border-b border-gray-100">
      <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
        <div className="relative shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt={ownerName} className="w-11 h-11 rounded-xl object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
              {ownerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">{ownerName}</p>
          <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">{displayName}</p>
          {providerData?.rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star size={10} className="text-yellow-400 fill-current" />
              <span className="text-[11px] font-semibold text-gray-700">{providerData.rating.toFixed(1)}</span>
              <span className="text-[10px] text-gray-400">({providerData.reviewCount})</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 px-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-gray-400 font-medium">Perfil completo</span>
          <span className="text-[11px] font-bold text-primary">{profileComplete}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${profileComplete}%` }} />
        </div>
      </div>
    </div>
  );

  return (
    <ProviderDashboardContext.Provider value={{ providerData, user, reloadProviderData, isAccountActive, accountStatus }}>
      <div className="flex min-h-screen bg-gray-50">
        {/* ─── SIDEBAR (desktop) ─── */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col fixed left-0 top-0 h-screen z-40">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">T</div>
              <span className="font-bold text-gray-900 text-lg">Eventonow</span>
            </Link>
          </div>
          <ProviderCard />
          <SidebarNav />
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-base font-bold text-gray-900">{totalBookings}</p>
                <p className="text-[10px] text-gray-400 leading-tight">Reservas</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-base font-bold text-gray-900">{providerData?.rating > 0 ? providerData.rating.toFixed(1) : '—'}</p>
                <p className="text-[10px] text-gray-400 leading-tight">Calificación</p>
              </div>
            </div>
          </div>
          <div className="px-3 py-3 border-t border-gray-100">
            <Link href="/" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <Home size={15} className="text-gray-400" /> Ir al inicio
            </Link>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-0.5"
            >
              <LogOut size={15} /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ─── Mobile drawer ─── */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <aside className="relative w-72 bg-white flex flex-col h-full z-10 shadow-2xl">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">T</div>
                <span className="font-bold text-gray-900 text-lg">Eventonow</span>
              </div>
              <ProviderCard />
              <SidebarNav />
              <div className="px-3 py-3 border-t border-gray-100">
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} /> Cerrar sesión
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* ─── MAIN WRAPPER ─── */}
        <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sticky px-4 lg:px-6 py-3 flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            <span className="lg:hidden font-bold text-sm text-gray-900 truncate flex-1">{displayName}</span>

            <h1 className="hidden lg:block text-base font-bold text-gray-900 flex-1">{pageTitle}</h1>

            {pendingCount > 0 && isAccountActive && (
              <button
                onClick={() => router.push('/dashboard/proveedor/reservas')}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                title={`${pendingCount} reservas pendientes`}
              >
                <Bell size={18} className="text-gray-500" />
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-tight">{ownerName}</p>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <BadgeCheck size={10} className="text-primary" /> {isAccountActive ? 'Verificado' : 'Proveedor'}
                </p>
              </div>
            </div>
          </header>

          {accountStatus !== 'active' && <StatusBanner status={accountStatus} reason={providerData?.statusReason} />}

          <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* ─── MOBILE BOTTOM NAV ─── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-1 py-1">
          <div className="flex items-center justify-around">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-2 min-w-[48px] relative rounded-xl transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}
                >
                  {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />}
                  <Icon size={20} />
                  <span className="text-[9px] font-semibold leading-tight">{item.label}</span>
                  {item.href === '/dashboard/proveedor/reservas' && pendingCount > 0 && (
                    <span className="absolute top-1 right-1.5 w-3.5 h-3.5 bg-primary text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </ProviderDashboardContext.Provider>
  );
}

function StatusBanner({ status, reason }) {
  const configs = {
    suspended: { bg: 'bg-amber-50 border-amber-200', icon: '⊘', text: 'text-amber-800', msg: 'Tu cuenta está suspendida temporalmente.' },
    inactive: { bg: 'bg-gray-100 border-gray-300', icon: '✕', text: 'text-gray-700', msg: 'Tu cuenta fue desactivada por Eventonow.' },
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
