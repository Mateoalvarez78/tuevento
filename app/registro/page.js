'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { homePathForRole } from '@/lib/roles';
import { safeInternalPath } from '@/lib/nextPath';
import { Eye, EyeOff, Mail, Lock, Phone, UserCircle, Check } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { BRAND, BRAND_MONOGRAM, LEGAL_PAGES_REACHABLE } from '@/lib/site';

// Alta de cuenta de CLIENTE únicamente. Eventonow es un marketplace curado:
// los proveedores no se autoregistran, se dan de alta desde el panel de admin.
function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
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
      const next = safeInternalPath(nextParam);
      router.push(next || homePathForRole(result.user.role));
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
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-bold text-sm">{BRAND_MONOGRAM}</span>
            </div>
            <span className="font-bold text-2xl text-white">{BRAND}</span>
          </Link>
        </div>
        <div className="relative z-10">
          <div className="grid grid-cols-1 gap-4">
            {[
              // "Acceso a miles de proveedores verificados" se cambió: el
              // número no era verificable (ver app/page.js). El resto de las
              // afirmaciones sí son ciertas y comprobables en el producto.
              'Crear tu cuenta es gratis',
              'Proveedores dados de alta y revisados por nuestro equipo',
              'Tus reservas y solicitudes en un solo lugar',
              'Soporte en español',
            ].map((text) => (
              <div key={text} className="flex items-center gap-3 text-white">
                <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <AppIcon icon={Check} size={13} strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="text-sm">{text}</span>
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
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-sm">{BRAND_MONOGRAM}</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">{BRAND}</span>
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Crear cuenta gratis</h1>
            <p className="text-sm text-gray-500">Completá tus datos para registrarte.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre completo</label>
              <Input icon={UserCircle} placeholder="Tu nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <Input type="email" icon={Mail} placeholder="tu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
              <Input type="tel" icon={Phone} placeholder="+598 9..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'} icon={Lock} className="pr-10"
                  placeholder="Mínimo 6 caracteres" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="new-password"
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

            {/* Los dos enlaces apuntaban a `#`: se aceptaban documentos que no
                existían. Ahora llevan a las páginas reales.
                NOTA: esto sigue siendo un aviso, NO una aceptación registrada.
                Guardar qué versión de los Términos aceptó cada usuario exige
                decidir dónde se versiona el documento y agregar columnas a
                `users` — queda documentado como pendiente, no improvisado acá. */}
            {/* Los enlaces solo aparecen si las páginas realmente se sirven
                (misma compuerta que decide su 404 y su presencia en el footer).
                Con la compuerta cerrada en producción, enlazarlos daría dos
                enlaces rotos en el formulario de registro. */}
            <p className="text-xs text-gray-400">
              {LEGAL_PAGES_REACHABLE ? (
                <>
                  Al registrarte aceptás los{' '}
                  <Link href="/terminos" className="text-primary hover:underline">Términos y condiciones</Link>{' '}
                  y la{' '}
                  <Link href="/privacidad" className="text-primary hover:underline">Política de privacidad</Link>.
                </>
              ) : (
                <>Al registrarte aceptás los términos de uso de {BRAND}.</>
              )}
            </p>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link
              href={nextParam ? `/login?next=${encodeURIComponent(nextParam)}` : '/login'}
              className="text-primary font-semibold hover:underline"
            >
              Ingresá
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <RegistroForm />
    </Suspense>
  );
}
