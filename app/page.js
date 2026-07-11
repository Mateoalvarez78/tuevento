import Link from 'next/link';
import { ArrowRight, Star, Search, Users, CalendarCheck, Store, CheckCircle2 } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import CategoryCard from '@/components/CategoryCard';
import FeaturedProviders from '@/components/home/FeaturedProviders';
import { categoryService } from '@/services/categoryService';

export const metadata = {
  title: 'TuEvento – Encontrá los mejores servicios para tu evento en Uruguay',
  description: 'El marketplace líder de Uruguay para contratar proveedores de eventos. Catering, DJ, fotografía, decoración y más.',
};

const STATS = [
  { value: '500+', label: 'Proveedores' },
  { value: '15K+', label: 'Eventos' },
  { value: '4.9★', label: 'Rating' },
  { value: '2 hs', label: 'Respuesta' },
];

const HOW_IT_WORKS = [
  {
    Icon: Search,
    title: 'Buscá y descubrí',
    desc: 'Filtrá por categoría, zona y fecha para encontrar el proveedor ideal para tu evento.',
  },
  {
    Icon: Users,
    title: 'Compará y consultá',
    desc: 'Revisá portfolios, paquetes y reseñas reales. Enviá tu solicitud en segundos.',
  },
  {
    Icon: CalendarCheck,
    title: 'Reservá y disfrutá',
    desc: 'El proveedor confirma, coordinan el pago y tu evento queda asegurado.',
  },
];

const TESTIMONIALS = [
  {
    stars: 5,
    text: 'Encontré el DJ perfecto para mi casamiento en menos de una hora. El proceso fue increíblemente sencillo y el proveedor respondió enseguida.',
    name: 'María Pérez',
    role: 'Boda · Montevideo',
    avatar: 'https://i.pravatar.cc/40?img=47',
  },
  {
    stars: 5,
    text: 'Organizamos un evento corporativo para 200 personas. TuEvento nos conectó con un catering espectacular. Todo salió perfecto.',
    name: 'Ariel Ruiz',
    role: 'Evento Corporativo · Canelones',
    avatar: 'https://i.pravatar.cc/40?img=51',
  },
  {
    stars: 5,
    text: 'Los proveedores están muy bien filtrados y verificados. Quedé muy conforme con la fotógrafa que contraté para el cumple de mi hija.',
    name: 'Flavia Soto',
    role: 'Cumpleaños · Maldonado',
    avatar: 'https://i.pravatar.cc/40?img=43',
  },
];

export default async function HomePage() {
  const categories = await categoryService.getAll();
  const quickTags = categories.slice(0, 6);

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-[620px] sm:min-h-[700px] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=80"
            alt="Evento"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950/95 via-gray-900/75 to-gray-800/30" />
          {/* Decorative glow */}
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          {/* Headline block — ancho restringido para legibilidad */}
          <div className="max-w-3xl mb-10">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs sm:text-sm font-medium px-4 py-2 rounded-full mb-7">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              +500 proveedores verificados en Uruguay
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Crea eventos{' '}
              <span className="gradient-text">inolvidables</span>,<br className="hidden sm:block" />
              sin complicaciones.
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed">
              Conectá con los mejores proveedores de Uruguay: catering, DJ, fotografía, decoración y mucho más.
            </p>
          </div>

          {/* Search — ancho completo hasta max-w-5xl */}
          <SearchBar className="w-full max-w-5xl" />

          {/* Quick tags */}
          <div className="flex flex-wrap gap-2 mt-5 max-w-5xl">
            {quickTags.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalogo?categories=${cat.id}`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white/70 border border-white/20 hover:border-white/60 hover:bg-white/10 hover:text-white px-3.5 py-1.5 rounded-full transition-all"
              >
                <cat.icon size={14} aria-hidden="true" />
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      <section className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 divide-x divide-white/20">
            {STATS.map((s) => (
              <div key={s.label} className="text-center py-1 sm:py-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs sm:text-sm text-white/70 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ─────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">Categorías</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Explorá por tipo de servicio</h2>
            </div>
            <Link
              href="/catalogo"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2.5 sm:gap-3">
            {categories.slice(0, 8).map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
          <div className="flex justify-center mt-6 sm:hidden">
            <Link
              href="/catalogo"
              className="text-sm font-semibold text-primary border border-primary/30 px-5 py-2.5 rounded-xl hover:bg-primary-light transition-colors"
            >
              Ver todas las categorías
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROVIDERS ─────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">Destacados</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Proveedores top del mes</h2>
              <p className="text-gray-500 mt-1.5 text-sm">Los más reservados y mejor puntuados de Uruguay</p>
            </div>
            <Link
              href="/catalogo"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>

          <FeaturedProviders />

          <div className="flex justify-center mt-10">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-7 py-3 rounded-xl hover:bg-primary hover:text-white transition-colors text-sm"
            >
              Ver todos los proveedores <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">Proceso</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">¿Cómo funciona TuEvento?</h2>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">
              Tres simples pasos para que tu evento sea perfecto.
            </p>
          </div>

          {/* Steps — desktop: row with connector lines; mobile: vertical */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-4">
            {HOW_IT_WORKS.map(({ Icon, title, desc }, i) => (
              <div key={title} className="relative flex flex-col items-center text-center">
                {/* Left connector (desktop) */}
                {i > 0 && (
                  <div className="hidden sm:block absolute top-10 right-[calc(50%+44px)] w-[calc(100%-88px)] h-0.5 bg-gradient-to-l from-primary/40 via-primary/20 to-transparent" />
                )}
                {/* Right connector (desktop) */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute top-10 left-[calc(50%+44px)] w-[calc(100%-88px)] h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
                )}

                {/* Circle + step number */}
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
                    <Icon size={28} className="text-white" strokeWidth={2} />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white border-2 border-primary rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-extrabold text-primary leading-none">{i + 1}</span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[240px] sm:max-w-none">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              La confianza de miles de organizadores
            </h2>
            <p className="text-white/70 text-sm">Experiencias reales de quienes confiaron en TuEvento</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-12">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-white/90 text-sm leading-relaxed flex-1 mb-5 italic">
                  "{t.text}"
                </p>
                {/* Author */}
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30"
                  />
                  <div>
                    <div className="text-white font-semibold text-sm leading-tight">{t.name}</div>
                    <div className="text-white/60 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment logos */}
          <div className="border-t border-white/20 pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-10">
            <span className="text-white/50 text-xs font-semibold uppercase tracking-wider w-full sm:w-auto text-center">
              Pagos seguros con
            </span>
            {['VISA', 'Mastercard', 'Stripe', 'Norton Secured'].map((logo) => (
              <span key={logo} className="text-white/80 font-bold text-sm sm:text-base tracking-wide">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROVIDER CTA ───────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5">
            <Store size={32} strokeWidth={1.5} className="text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            ¿Ofrecés servicios para eventos?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Eventonow es un marketplace curado: nuestro equipo evalúa y da de alta a cada
            proveedor. Contanos sobre tu negocio y te contactamos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <a
              href="mailto:hola@eventonow.com?subject=Quiero%20ser%20proveedor"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 rounded-xl transition-colors text-sm sm:text-base shadow-lg shadow-primary/30"
            >
              Quiero ser proveedor <ArrowRight size={18} />
            </a>
            <Link
              href="/#como-funciona"
              className="inline-flex items-center justify-center gap-2 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-semibold px-8 py-4 rounded-xl transition-colors text-sm sm:text-base"
            >
              Cómo funciona
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-8">
            {['Gratis para empezar', 'Panel de gestión incluido', 'Soporte en español'].map((text) => (
              <div key={text} className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
                <CheckCircle2 size={15} className="text-green-500" aria-hidden="true" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
