import Link from 'next/link';
import { ArrowRight, Search, Users, CalendarCheck, Store, CheckCircle2 } from 'lucide-react';
import EventHero from '@/components/home/EventHero';
import CategoryCard from '@/components/CategoryCard';
import FeaturedProviders from '@/components/home/FeaturedProviders';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import { categoryService } from '@/services/categoryService';
import { BRAND, PROVIDER_CONTACT_MAILTO } from '@/lib/site';

export const metadata = {
  title: `${BRAND} — Marketplace de servicios para eventos en Uruguay`,
  description:
    'Marketplace uruguayo de servicios para eventos. Pedí disponibilidad a proveedores de catering, música, fotografía, decoración y más, y contratá cada servicio por separado.',
  alternates: { canonical: '/' },
};

// La barra de estadísticas ("500+ proveedores", "15K+ eventos", "4.9★",
// "2 hs de respuesta") se retiró: ninguno de esos números era verificable, y el
// catálogo real no los respalda. No se reemplazan por cifras reales todavía
// porque el catálogo está en transición a proveedores reales — una cifra que hay
// que mantener a mano vuelve a desactualizarse. Lo mismo con el badge
// "+500 proveedores verificados" que estaba en el hero.
//
// Los testimonios firmados por "María Pérez", "Ariel Ruiz" y "Flavia Soto" con
// avatares de i.pravatar.cc (un generador de retratos aleatorios) también se
// retiraron: estaban presentados como "Experiencias reales". Cuando existan
// reseñas reales, el módulo de reseñas ya está implementado y son esas las que
// corresponde mostrar, con consentimiento.

// Hechos del modelo comercial, verificables contra los Términos. No nombran
// ninguna pasarela: mientras el checkout no esté operativo y validado, decir
// "pagás con X" sería anunciar algo que todavía no funciona.
const PAYMENT_FACTS = [
  {
    title: 'Un pago por servicio',
    desc: 'Si contratás catering y fotografía, son dos reservas y dos pagos independientes, cada uno con su proveedor.',
  },
  {
    title: 'El precio que ves es el total',
    desc: 'No agregamos cargos al importe que figura en la reserva. Nuestra comisión la asume el proveedor, no vos.',
  },
  {
    title: 'Primero disponibilidad, después pago',
    desc: 'No se cobra nada hasta que el proveedor confirme tu fecha. Recién entonces la reserva queda disponible para pagar.',
  },
];

// Los tres pasos describen el flujo REAL, en el orden en que ocurre. El paso 3
// decía "El proveedor confirma, coordinan el pago" — que describía un pago
// coordinado fuera de la plataforma, lo contrario del modelo de checkout.
const HOW_IT_WORKS = [
  {
    Icon: Search,
    title: 'Buscá y pedí disponibilidad',
    desc: 'Filtrá por categoría, zona y fecha, y enviale tu solicitud al proveedor que te interese.',
  },
  {
    Icon: Users,
    title: 'El proveedor responde',
    desc: 'Confirma o rechaza la disponibilidad para tu fecha. Si confirma, la reserva queda pendiente de pago.',
  },
  {
    Icon: CalendarCheck,
    title: 'Pagás y queda confirmada',
    desc: 'Abonás el total del servicio dentro de la plataforma. La reserva queda confirmada cuando se acredita el pago.',
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
            {/* El badge "+500 proveedores verificados en Uruguay" se retiró: la
                cifra no era verificable. Describir qué es el sitio, sin número,
                es preferible a un número inventado. */}
            <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs sm:text-sm font-medium px-4 py-2 rounded-full mb-7">
              Marketplace de servicios para eventos · Uruguay
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Te ayudamos a organizar{' '}
              <span className="gradient-text">todo tu evento</span>,<br className="hidden sm:block" />
              de punta a punta.
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed">
              Contanos qué estás organizando y armamos hasta 3 propuestas completas con catering, DJ, fotografía, decoración y más — proveedores y precios reales.
            </p>
          </div>

          {/* Armar mi evento — ancho completo hasta max-w-5xl */}
          <EventHero className="w-full max-w-5xl" />

          {/* Camino secundario: explorar el marketplace por categoría */}
          <div className="flex flex-wrap items-center gap-2 mt-5 max-w-5xl">
            <span className="text-xs sm:text-sm text-white/50 mr-1">O contratá un solo servicio:</span>
            {quickTags.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalogo?categories=${cat.id}`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white/70 border border-white/20 hover:border-white/60 hover:bg-white/10 hover:text-white px-3.5 py-1.5 rounded-full transition-all"
              >
                <AppIcon icon={cat.icon} size={14} aria-hidden="true" />
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* La barra de estadísticas se retiró por completo — ver el comentario
          junto a HOW_IT_WORKS. Ninguna de las cuatro cifras era verificable. */}

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
              Ver todos <AppIcon icon={ArrowRight} size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2.5 sm:gap-3">
            {categories.slice(0, 8).map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
          <div className="flex justify-center mt-6 sm:hidden">
            <Button variant="outline" href="/catalogo">Ver todas las categorías</Button>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROVIDERS ─────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">Destacados</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Proveedores destacados</h2>
              <p className="text-gray-500 mt-1.5 text-sm">Algunos de los proveedores publicados en Eventonow</p>
            </div>
            <Link
              href="/catalogo"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Ver todos <AppIcon icon={ArrowRight} size={14} aria-hidden="true" />
            </Link>
          </div>

          <FeaturedProviders />

          <div className="flex justify-center mt-10">
            <Button variant="outline" href="/catalogo">
              Ver todos los proveedores <AppIcon icon={ArrowRight} size="button" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">Proceso</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">¿Cómo funciona {BRAND}?</h2>
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
                    <AppIcon icon={Icon} size={28} className="text-white" strokeWidth={2} aria-hidden="true" />
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

      {/* ── CÓMO SE CONTRATA Y SE PAGA ─────────────────────────────────── */}
      {/* Reemplaza la sección de testimonios inventados y su fila de badges
          ("VISA · Mastercard · Stripe · Norton Secured": Stripe no está
          integrado y Norton no existe). En su lugar, lo que un visitante —y un
          revisor— necesita entender de verdad: cómo se contrata, qué precio se
          ve y cuándo queda confirmada una reserva. Nada de esto afirma que un
          medio de pago concreto ya esté disponible. */}
      <section className="py-16 sm:py-20 bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Cómo se contrata y se paga
            </h2>
            <p className="text-white/70 text-sm max-w-xl mx-auto">
              Cada servicio se contrata y se abona por separado, directamente en {BRAND}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {PAYMENT_FACTS.map((fact) => (
              <div
                key={fact.title}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6"
              >
                <h3 className="text-white font-semibold text-base mb-2">{fact.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{fact.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROVIDER CTA ───────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5">
            <AppIcon icon={Store} size={32} strokeWidth={1.5} className="text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            ¿Ofrecés servicios para eventos?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {BRAND} es un marketplace curado: nuestro equipo evalúa y da de alta a cada
            proveedor. Contanos sobre tu negocio y te contactamos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button size="lg" className="shadow-lg shadow-primary/30" href={PROVIDER_CONTACT_MAILTO}>
              Quiero ser proveedor <AppIcon icon={ArrowRight} size="button" aria-hidden="true" />
            </Button>
            <Button variant="outline" theme="dark" size="lg" href="/#como-funciona">
              Cómo funciona
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-8">
            {['Gratis para empezar', 'Panel de gestión incluido', 'Soporte en español'].map((text) => (
              <div key={text} className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
                <AppIcon icon={CheckCircle2} size={15} className="text-green-500" aria-hidden="true" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
