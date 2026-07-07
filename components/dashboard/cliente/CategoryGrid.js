'use client';

import Link from 'next/link';

// Grid de categorías con cards visuales grandes. Reutilizable para
// "categorías destacadas" y "recomendaciones".
export default function CategoryGrid({ title, subtitle, categories = [] }) {
  if (!categories.length) return null;
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/catalogo?categoria=${c.id}`}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 flex flex-col items-center justify-center gap-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40 transition-all min-h-[110px]"
          >
            <span className="text-4xl leading-none group-hover:scale-110 transition-transform">{c.icon}</span>
            <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">{c.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
