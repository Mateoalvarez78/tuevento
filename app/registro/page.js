'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { homePathForRole } from '@/lib/roles';
import { Eye, EyeOff, Mail, Lock, Phone, UserCircle } from 'lucide-react';

// Alta de cuenta de CLIENTE únicamente. Eventonow es un marketplace curado:
// los proveedores no se autoregistran, se dan de alta desde el panel de admin.
export default function RegistroPage() {
  const router = useRouter();
  const { register, showToast } = useApp();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.success) {
      showToast(`¡Cuenta creada! Bienvenido/a, ${result.user.name.split(' ')[0]}!`, 'success');
      router.push(homePathForRole(result.user.role));
    } else {
      showToast(result.error || 'No se pudo crear la cuenta', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden flex-col justify-between p-12">
        <img
          src="https://picsum.photos/seed/registro-bg/900/600"
          alt="Evento"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">TE</span>
            </div>
            <span className="font-bold text-2xl text-white">TuEvento</span>
          </Link>
        </div>
        <div className="relative z-10">
          <div className="grid grid-cols-1 gap-4">
            {[
              { emoji: '✓', text: 'Gratis para empezar' },
              { emoji: '✓', text: 'Acceso a miles de proveedores verificados' },
              { emoji: '✓', text: 'Gestión de reservas en un solo lugar' },
              { emoji: '✓', text: 'Soporte en español' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-white">
                <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold shrink-0">{item.emoji}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">TE</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">TuEvento</span>
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Crear cuenta gratis</h1>
            <p className="text-sm text-gray-500">Completá tus datos para registrarte.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre completo</label>
              <div className="relative">
                <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Tu nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="tu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="+598 9..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Al registrarte aceptás los{' '}
              <a href="#" className="text-primary hover:underline">Términos y condiciones</a>{' '}
              y la{' '}
              <a href="#" className="text-primary hover:underline">Política de privacidad</a>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">Ingresá</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
