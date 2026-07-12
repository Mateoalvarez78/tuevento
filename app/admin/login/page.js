'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { homePathForRole, isAdminRole } from '@/lib/roles';
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, authLoading, login, showToast } = useApp();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ya logueado como admin → al panel
  useEffect(() => {
    if (authLoading || !user) return;
    if (isAdminRole(user.role)) router.replace('/admin');
  }, [authLoading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    if (isAdminRole(result.user.role)) {
      router.push('/admin');
    } else {
      // Cuenta no-admin en el portal interno → fuera
      setError('Esta cuenta no tiene acceso al panel interno.');
      showToast('Acceso restringido a administradores', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-3">
            <AppIcon icon={ShieldCheck} size={20} className="text-white" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-white">Panel interno Eventonow</h1>
          <p className="text-xs text-gray-500 mt-1">Acceso restringido a administradores</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <Input
                variant="dark" type="email" required autoComplete="email" icon={Mail}
                placeholder="admin@eventonow.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Contraseña</label>
              <div className="relative">
                <Input
                  variant="dark" type={showPass ? 'text' : 'password'} required autoComplete="current-password" icon={Lock}
                  className="pr-10"
                  placeholder="••••••••" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <Button
                  type="button" iconOnly size="sm" variant="ghost" theme="dark"
                  icon={showPass ? EyeOff : Eye}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 !text-gray-600 hover:!text-gray-400"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPass((v) => !v)}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">{error}</div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {loading ? 'Verificando…' : 'Ingresar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-6">Uso exclusivo del equipo de Eventonow</p>
      </div>
    </div>
  );
}
