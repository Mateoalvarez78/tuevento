'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, showToast } = useApp();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      showToast(`¡Bienvenido/a, ${result.user.name.split(' ')[0]}!`, 'success');
      const dest =
        result.user.role === 'admin'    ? '/admin' :
        result.user.role === 'provider' ? '/dashboard/proveedor' :
                                          '/dashboard/cliente';
      router.push(dest);
    } else {
      setError(result.error);
    }
  };

  const loginDemo = (role) => {
    const map = {
      client:   { email: 'valentina@example.com', password: '123456'   },
      provider: { email: 'mateo@example.com',      password: '123456'   },
      admin:    { email: 'admin@eventonow.com',    password: 'Admin123!' },
    };
    setForm(map[role] || map.client);
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden flex-col justify-between p-12">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611c71ddc95b?w=900&q=80"
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
          <blockquote className="text-white text-xl font-light italic leading-relaxed mb-6">
            "Encontré el catering perfecto para mi casamiento en menos de 10 minutos."
          </blockquote>
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/48?img=47" alt="Valentina" className="w-12 h-12 rounded-full ring-2 ring-white/30" />
            <div>
              <p className="text-white font-semibold">Valentina López</p>
              <p className="text-white/60 text-sm">Casamiento – Mar del Plata</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">TE</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">TuEvento</span>
            </Link>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Bienvenido/a de nuevo</h1>
          <p className="text-gray-500 mb-6 text-sm">Ingresá con tu cuenta para continuar.</p>

          {/* Demo buttons */}
          <div className="bg-primary-light border border-primary/20 rounded-2xl p-4 mb-6">
            <p className="text-xs font-semibold text-primary mb-2">Demo rápida:</p>
            <div className="flex gap-2">
              <button onClick={() => loginDemo('client')} className="flex-1 text-xs font-medium text-primary border border-primary/30 py-2 rounded-xl hover:bg-primary hover:text-white transition-colors">
                Ingresar como cliente
              </button>
              <button onClick={() => loginDemo('provider')} className="flex-1 text-xs font-medium text-primary border border-primary/30 py-2 rounded-xl hover:bg-primary hover:text-white transition-colors">
                Ingresar como proveedor
              </button>
              <button onClick={() => loginDemo('admin')} className="flex-1 text-xs font-medium text-primary border border-primary/30 py-2 rounded-xl hover:bg-primary hover:text-white transition-colors">
                Ingresar como admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Contraseña</label>
                <a href="#" className="text-xs text-primary hover:underline">¿La olvidaste?</a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tenés cuenta?{' '}
            <Link href="/registro" className="text-primary font-semibold hover:underline">Registrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
