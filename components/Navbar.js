'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/lib/AppContext';
import { Menu, X, Heart, Calendar, ChevronDown, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import AppIcon from '@/components/AppIcon';

const DROPDOWN_MOTION = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.15, ease: 'easeOut' },
};

const MOBILE_MENU_MOTION = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, favorites } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const links = [
    { href: '/catalogo', label: 'Explorar servicios' },
    { href: '/#como-funciona', label: 'Cómo funciona' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">TE</span>
            </div>
            <span className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors duration-200">
              Tu<span className="text-primary">Evento</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors duration-200 hover:text-primary ${
                  pathname === l.href ? 'text-primary' : 'text-gray-600'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/catalogo"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200"
            >
              Publicar mi servicio
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 hover:border-primary/40 hover:bg-primary-light transition-all duration-200"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-gray-800 max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <AppIcon
                    icon={ChevronDown}
                    size={14}
                    className={`text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        {...DROPDOWN_MOTION}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 origin-top-right"
                      >
                        <div className="px-4 py-2 border-b border-gray-100 mb-1">
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        {user.role === 'admin' ? (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          >
                            <AppIcon icon={ShieldCheck} size={16} aria-hidden="true" />
                            Panel Admin
                          </Link>
                        ) : (
                          <Link
                            href={user.role === 'provider' ? '/dashboard/proveedor' : '/dashboard/cliente'}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          >
                            <AppIcon icon={LayoutDashboard} size={16} aria-hidden="true" />
                            Mi panel
                          </Link>
                        )}
                        <Link
                          href="/dashboard/cliente"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <AppIcon icon={Calendar} size={16} aria-hidden="true" />
                          Mis reservas
                        </Link>
                        <Link
                          href="/dashboard/cliente#favoritos"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <AppIcon icon={Heart} size={16} aria-hidden="true" />
                          Favoritos
                          {favorites.length > 0 && (
                            <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                              {favorites.length}
                            </span>
                          )}
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors duration-200 w-full text-left"
                          >
                            <AppIcon icon={LogOut} size={16} aria-hidden="true" />
                            Cerrar sesión
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-primary px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-xl transition-colors duration-200 shadow-sm"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <AppIcon icon={mobileOpen ? X : Menu} size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div {...MOBILE_MENU_MOTION} className="md:hidden bg-white border-t border-gray-100 overflow-hidden">
            <div className="py-4 px-4 space-y-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2">
                      <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full" />
                      <div>
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href={user.role === 'admin' ? '/admin' : user.role === 'provider' ? '/dashboard/proveedor' : '/dashboard/cliente'}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                    >
                      {user.role === 'admin' ? 'Panel Admin' : 'Mi panel'}
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-danger hover:bg-danger/10 rounded-xl transition-colors duration-200"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-center px-4 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl transition-colors duration-200">Ingresar</Link>
                    <Link href="/registro" onClick={() => setMobileOpen(false)} className="block text-center px-4 py-3 text-sm font-semibold text-white bg-primary rounded-xl transition-colors duration-200">Registrarse</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
