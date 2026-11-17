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
  Star,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Layers,
  Inbox,
} from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Drawer from '@/components/Drawer';
import { BRAND, BRAND_MONOGRAM } from '@/lib/site';
import { useAdminContactNewCount } from '@/hooks/useAdmin';

const NAV_ITEMS = [
  { href: '/admin',            label: 'Overview',    icon: LayoutDashboard, exact: true },
  { href: '/admin/proveedores',label: 'Proveedores', icon: Users },
  { href: '/admin/servicios',  label: 'Servicios',   icon: Briefcase },
  { href: '/admin/catalogo',   label: 'Catálogo',    icon: Layers },
  { href: '/admin/resenas',    label: 'Reseñas',     icon: Star },
  // `badge` nombra el contador que corresponde a este ítem. Antes el enlace no
  // mostraba nada, así que un mensaje nuevo solo se descubría entrando a la
  // página: nadie se enteraba de que había llegado.
  { href: '/admin/contacto',   label: 'Mensajes',    icon: Inbox, badge: 'contactNew' },
];

export default function AdminLayout({ children }) {
  const { user, authLoading, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { newCount: contactNewCount } = useAdminContactNewCount();

  // El login del admin vive bajo /admin pero NO debe pasar por el guard/shell.
  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginRoute || authLoading) return;
    if (!user) { router.replace('/admin/login'); return; }
    if (!isAdminRole(user.role)) router.replace(homePathForRole(user.role));
  }, [isLoginRoute, authLoading, user, router]);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

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

  // Contador por nombre de badge. Si falla la consulta queda en 0 y el sidebar
  // se renderiza igual: un error del contador nunca puede romper el layout.
  const badgeCounts = { contactNew: contactNewCount };

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-800 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
            <span className="text-white font-bold text-xs">{BRAND_MONOGRAM}</span>
          </div>
          <span className="text-white font-semibold text-sm">{BRAND}</span>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <AppIcon icon={ShieldCheck} size={13} className="text-primary" aria-hidden="true" />
          <span className="text-xs font-medium text-primary tracking-wide uppercase">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
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
              <AppIcon icon={item.icon} size={16} className={active ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'} aria-hidden="true" />
              {item.label}
              {/* Badge de pendientes. El texto accesible dice qué significa el
                  número: un «3» suelto no se entiende con lector de pantalla. */}
              {item.badge && badgeCounts[item.badge] > 0 && (
                <span className="ml-auto bg-primary text-white text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none tabular-nums">
                  {badgeCounts[item.badge]}
                  <span className="sr-only"> sin atender</span>
                </span>
              )}
              {active && !(item.badge && badgeCounts[item.badge] > 0) && (
                <AppIcon icon={ChevronRight} size={13} className="ml-auto text-primary/60" aria-hidden="true" />
              )}
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
        <Button
          variant="ghost"
          theme="dark"
          icon={LogOut}
          className="w-full !justify-start !text-gray-400 hover:!text-red-400 hover:!bg-red-400/10"
          onClick={() => { logout(); router.push('/'); }}
        >
          Cerrar sesión
        </Button>
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
      <div className="lg:hidden">
        <Drawer open={open} onClose={() => setOpen(false)} theme="dark" side="left" width="max-w-64" bodyClassName="flex-1 flex flex-col overflow-y-auto">
          <div className="relative flex-1 flex flex-col">
            <Button
              iconOnly icon={X} variant="ghost" theme="dark" size="sm"
              className="absolute top-3 right-3 z-10"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
            />
            <SidebarContent />
          </div>
        </Drawer>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-gray-900 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-bold text-xs">{BRAND_MONOGRAM}</span>
            </div>
            <div>
              <span className="text-white font-semibold text-sm">{BRAND}</span>
              <span className="text-primary text-xs font-medium ml-1.5">Admin</span>
            </div>
          </div>
          <Button
            iconOnly icon={Menu} variant="ghost" theme="dark"
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
          />
        </header>

        {/* Mobile bottom tab bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-medium transition-colors ${
                  active ? 'text-primary' : 'text-gray-500'
                }`}
              >
                <AppIcon icon={item.icon} size={20} aria-hidden="true" />
                {/* Mismo contador en la barra inferior de mobile: el admin usa
                    esta superficie, no el sidebar, en pantalla chica. */}
                {item.badge && badgeCounts[item.badge] > 0 && (
                  <span className="absolute top-1 right-1/2 translate-x-4 bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none tabular-nums">
                    {badgeCounts[item.badge]}
                    <span className="sr-only"> sin atender</span>
                  </span>
                )}
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
