'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { homePathForRole, isAdminRole, ROLES } from '@/lib/roles';
import { Eye, EyeOff, Mail, Lock, BarChart3, CalendarDays, Wallet, Store } from 'lucide-react';

export default function ProviderLoginPage() {
  const router = useRouter();
  const { user, authLoading, login, showToast } = useApp();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ya logueado como proveedor/admin → a su panel
  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role === ROLES.PROVIDER || isAdminRole(user.role)) {
      router.replace(homePathForRole(user.role));
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    const role = result.user.role;
    if (role === ROLES.PROVIDER || isAdminRole(role)) {
      showToast(`¡Hola, ${result.user.name.split(' ')[0]}!`, 'success');
    } else {
      showToast('Esta cuenta es de cliente. Te llevamos a tu panel.', 'info');
    }
    router.push(homePathForRole(role));
  };

  const fillDemo = () => setForm({ email: 'mateo@example.com', password: '123456' });

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel — professional / SaaS */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-900 to-primary/30">
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-bold text-2xl text-white">Eventonow</span>
            <span className="text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-md ml-1">PRO</span>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="text-white text-3xl font-extrabold leading-tight mb-6">
            Gestioná tu negocio de eventos en un solo lugar.
          </h2>
          <div className="space-y-4">
            {[
              { icon: Store,       text: 'Publicá y administrá tus servicios y menús' },
              { icon: CalendarDays,text: 'Reservas y calendario centralizados' },
              { icon: Wallet,      text: 'Ingresos, comisiones y estado de pagos' },
              { icon: BarChart3,   text: 'Métricas de rendimiento de tu negocio' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-3 text-slate-200">
                  <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-primary" />
                  </span>
                  <span className="text-sm">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative z-10 text-xs text-slate-500">Portal exclusivo para proveedores de Eventonow</div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">Eventonow</span>
            </Link>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary-light px-2.5 py-1 rounded-full mb-3">
            <Store size={12} /> Portal de proveedores
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Ingresá a tu panel de proveedor</h1>
          <p className="text-gray-500 mb-6 text-sm">Gestioná tus servicios, reservas e ingresos.</p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
            <p className="text-xs font-semibold text-slate-600 mb-2">Demo:</p>
            <button onClick={fillDemo} className="w-full text-xs font-medium text-slate-700 border border-slate-300 py-2 rounded-xl hover:bg-slate-100 transition-colors">
              Completar credenciales de proveedor demo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required autoComplete="email"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="tu@negocio.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Contraseña</label>
                <a href="#" className="text-xs text-primary hover:underline">¿La olvidaste?</a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Tu contraseña" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors shadow-sm">
              {loading ? 'Ingresando...' : 'Ingresar al panel'}
            </button>
          </form>

          <div className="mt-6 space-y-1.5 text-center text-sm">
            <p className="text-gray-500">
              ¿Todavía no sos proveedor?{' '}
              <Link href="/proveedor/registro" className="text-primary font-semibold hover:underline">Registrá tu negocio</Link>
            </p>
            <p className="text-gray-400 text-xs">
              ¿Buscás contratar servicios?{' '}
              <Link href="/login" className="text-gray-600 hover:underline">Ingreso de clientes</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
