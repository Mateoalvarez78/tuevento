'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { homePathForRole } from '@/lib/roles';
import { safeInternalPath } from '@/lib/nextPath';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { BRAND, BRAND_MONOGRAM } from '@/lib/site';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      // Retorno poslogin: solo se respeta un `next` interno y seguro (nunca
      // una URL externa/protocol-relative — ver lib/nextPath.js). Si no hay
      // uno válido, mismo destino de siempre por rol.
      const next = safeInternalPath(searchParams.get('next'));
      router.push(next || homePathForRole(result.user.role));
    } else {
      setError(result.error);
    }
  };

  // Atajo de demo, SOLO para desarrollo. Antes estaba siempre visible en el
  // login productivo, con la credencial en el HTML: le decía a cualquier
  // visitante (incluido un revisor de la pasarela de pago) que esto es un
  // entorno de demostración y no un comercio en operación.
  //
  // La condición es falsa por defecto: `NEXT_PUBLIC_SHOW_DEMO_LOGIN` no está
  // definida en ningún entorno, así que hay que declararla explícitamente con
  // el literal 'true' para que el bloque aparezca. Se exige ADEMÁS que no sea
  // un build de producción, para que definirla por error en Vercel no alcance
  // para publicarla.
  const showDemoLogin =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === 'true';

  const fillDemo = () => setForm({ email: 'valentina@example.com', password: '123456' });

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
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-bold text-sm">{BRAND_MONOGRAM}</span>
            </div>
            <span className="font-bold text-2xl text-white">{BRAND}</span>
          </Link>
        </div>
        {/* Acá había un testimonio firmado por "Valentina López — Casamiento ·
            Mar del Plata", con avatar de i.pravatar.cc (generador de retratos
            aleatorios) y citando una ciudad argentina en un marketplace
            uruguayo. Se reemplaza por una descripción del servicio, que no
            necesita ser atribuida a nadie para ser cierta. */}
        <div className="relative z-10">
          <p className="text-white text-xl font-light leading-relaxed mb-3">
            Pedí disponibilidad, compará propuestas y contratá cada servicio de
            tu evento por separado.
          </p>
          <p className="text-white/60 text-sm">
            Catering, música, fotografía, decoración y más, en todo Uruguay.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-sm">{BRAND_MONOGRAM}</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">{BRAND}</span>
            </Link>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Entrá a {BRAND} y organizá tu evento</h1>
          <p className="text-gray-500 mb-6 text-sm">Ingresá con tu cuenta para buscar y contratar servicios.</p>

          {/* Demo: nunca en producción — ver showDemoLogin arriba. */}
          {showDemoLogin && (
            <div className="bg-primary-light border border-primary/20 rounded-2xl p-4 mb-6">
              <p className="text-xs font-semibold text-primary mb-2">Demo rápida (solo desarrollo):</p>
              <Button variant="outline" size="sm" className="w-full" onClick={fillDemo}>
                Completar cuenta de cliente demo
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <Input
                type="email"
                icon={Mail}
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Contraseña</label>
                {/* No existe recuperación automática de contraseña todavía, así
                    que este enlace apuntaba a `#` y no hacía nada. Hoy
                    recuperar el acceso se resuelve escribiéndonos, que es
                    exactamente lo que dice y hace ahora. */}
                <Link href="/contacto" className="text-xs text-primary hover:underline">
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  icon={Lock}
                  className="pr-10"
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <Button
                  type="button" iconOnly size="sm" variant="ghost"
                  icon={showPass ? EyeOff : Eye}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 !text-gray-400 hover:!text-gray-600"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPass((v) => !v)}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tenés cuenta?{' '}
            <Link
              href={searchParams.get('next') ? `/registro?next=${encodeURIComponent(searchParams.get('next'))}` : '/registro'}
              className="text-primary font-semibold hover:underline"
            >
              Registrate gratis
            </Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-2">
            ¿Sos proveedor?{' '}
            <Link href="/provider/login" className="text-gray-600 hover:underline">Ingresá a tu panel</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams() exige un límite <Suspense> (mismo patrón que
  // app/catalogo/page.js) para no romper el prerender estático.
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <LoginForm />
    </Suspense>
  );
}
