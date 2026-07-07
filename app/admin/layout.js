'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { isAdminRole, homePathForRole } from '@/lib/roles';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin',            label: 'Overview',    icon: LayoutDashboard, exact: true },
  { href: '/admin/proveedores',label: 'Proveedores', icon: Users },
  { href: '/admin/servicios',  label: 'Servicios',   icon: Briefcase },
];

export default function AdminLayout({ children }) {
  const { user, authLoading, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // El login del admin vive bajo /admin pero NO debe pasar por el guard/shell.
  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginRoute || authLoading) return;
    if (!user) { router.replace('/admin/login'); return; }
    if (!isAdminRole(user.role)) router.replace(homePathForRole(user.role));
  }, [isLoginRoute, authLoading, user, router]);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Login del admin: se renderiza sin sidebar ni guard (chicken-and-egg).
  // (Va después de todos los hooks para no romper las reglas de hooks.)
  if (isLoginRoute) return children;

  if (authLoading || !user || !isAdminRole(user.role)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verificando acceso…</div>
      </div>
    );
  }

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-800 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">TE</span>
          </div>
          <span className="text-white font-semibold text-sm">Eventonow</span>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <ShieldCheck size={13} className="text-primary" />
          <span className="text-xs font-medium text-primary tracking-wide uppercase">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`}
            >
              <Icon size={16} className={active ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'} />
              {item.label}
              {active && <ChevronRight size={13} className="ml-auto text-primary/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-gray-800 shrink-0">
        <div className="flex items-center gap-3 px-3 mb-3">
          <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-700 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-200 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex-col">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full z-10">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors z-10"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-gray-900 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">TE</span>
            </div>
            <div>
              <span className="text-white font-semibold text-sm">Eventonow</span>
              <span className="text-primary text-xs font-medium ml-1.5">Admin</span>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Mobile bottom tab bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-medium transition-colors ${
                  active ? 'text-primary' : 'text-gray-500'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Page content — extra bottom padding for mobile tab bar */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
