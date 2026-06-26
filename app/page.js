import Link from 'next/link';
import { ArrowRight, Shield, Star, Zap, Users, CalendarCheck, HeartHandshake, Award, Search } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import CategoryCard from '@/components/CategoryCard';
import ServiceCard from '@/components/ServiceCard';
import { CATEGORIES, PROVIDERS } from '@/lib/mockData';

export const metadata = {
  title: 'TuEvento – Encontrá los mejores servicios para tu evento',
};

const STATS = [
  { value: '500+', label: 'Proveedores verificados' },
  { value: '15K+', label: 'Eventos realizados' },
  { value: '4.9★', label: 'Rating promedio' },
  { value: '48 hs', label: 'Tiempo de respuesta' },
];

const HOW_IT_WORKS = [
  { icon: Search, step: '01', title: 'Buscá el servicio', desc: 'Filtrá por categoría, zona, fecha y cantidad de invitados para encontrar lo que necesitás.' },
  { icon: Users, step: '02', title: 'Compará proveedores', desc: 'Revisá portfolios, paquetes, precios, reseñas y elegí el mejor para tu evento.' },
  { icon: CalendarCheck, step: '03', title: 'Consultá disponibilidad', desc: 'Completá el formulario con los datos de tu evento y enviá la solicitud.' },
  { icon: HeartHandshake, step: '04', title: 'Confirmá tu reserva', desc: 'El proveedor acepta, coordinan el pago y tu evento queda asegurado.' },
];

const TRUST = [
  { icon: Shield, title: 'Proveedores verificados', desc: 'Revisamos identidad, trayectoria y documentación de cada proveedor.' },
  { icon: Star, title: 'Reseñas reales', desc: 'Solo clientes que contrataron el servicio pueden dejar una reseña.' },
  { icon: Award, title: 'Garantía de calidad', desc: 'Si algo no sale como acordado, te ayudamos a resolverlo.' },
  { icon: Zap, title: 'Respuesta rápida', desc: 'La mayoría de los proveedores responden en menos de 2 horas.' },
];

export default function HomePage() {
  const featured = PROVIDERS.filter((p) => p.badges.includes('top') || p.badges.includes('popular')).slice(0, 4);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[620px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&q=80"
            alt="Evento"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              +500 proveedores disponibles en Argentina
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Tu evento perfecto{' '}
              <span className="gradient-text">comienza aquí</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed">
              Encontrá y reservá los mejores proveedores de servicios para eventos: catering, DJ, fotografía, decoración y mucho más.
            </p>
          </div>
          <SearchBar className="w-full max-w-4xl" />
          <div className="flex flex-wrap gap-2 mt-5">
            {['Catering', 'DJ', 'Fotografía', 'Decoración', 'Parrilla'].map((t) => (
              <Link key={t} href={`/catalogo?q=${t}`} className="text-sm text-white/80 border border-white/30 hover:border-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-all">
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-sm text-white/75">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Explorá por categoría</h2>
            <p className="text-gray-500 mt-1">Más de 12 tipos de servicios para tu evento</p>
          </div>
          <Link href="/catalogo" className="text-sm font-semibold text-primary hover:underline hidden sm:flex items-center gap-1">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* ── Featured providers ────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Proveedores destacados</h2>
            <p className="text-gray-500 mt-1">Los más reservados y mejor puntuados</p>
          </div>
          <Link href="/catalogo" className="text-sm font-semibold text-primary hover:underline hidden sm:flex items-center gap-1">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((p) => (
            <ServiceCard key={p.id} provider={p} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/catalogo" className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-colors">
            Ver todos los proveedores <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 bg-surface px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">¿Cómo funciona TuEvento?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">En 4 simples pasos, tu evento queda organizado con los mejores proveedores.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="absolute -top-3 left-6">
                    <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">{item.step}</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mb-4 mt-2">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Por qué elegir TuEvento</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Tu tranquilidad es nuestra prioridad en cada evento.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex flex-col items-start gap-3 p-5 rounded-2xl border border-gray-100 hover:border-primary/30 hover:bg-primary-light/30 transition-all">
                <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Provider CTA ──────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-5">🎉</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">¿Ofrecés servicios para eventos?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-base leading-relaxed">
            Unite a más de 500 proveedores verificados y conectá con miles de clientes que buscan tus servicios. Sin suscripción mensual para empezar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/registro?tipo=proveedor" className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-xl hover:bg-primary-dark transition-colors text-base">
              Publicar mi servicio gratis <ArrowRight size={18} />
            </Link>
            <Link href="/#como-funciona" className="inline-flex items-center justify-center gap-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 font-semibold px-8 py-4 rounded-xl transition-colors text-base">
              Cómo funciona
            </Link>
          </div>
          <div className="flex justify-center gap-8 mt-8">
            {[['✓', 'Gratis para empezar'], ['✓', 'Panel de gestión incluido'], ['✓', 'Soporte en español']].map(([check, text]) => (
              <div key={text} className="flex items-center gap-1.5 text-sm text-gray-400">
                <span className="text-green-400 font-bold">{check}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
