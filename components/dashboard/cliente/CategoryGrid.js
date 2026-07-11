'use client';

import CategoryCard from '@/components/CategoryCard';

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
          <CategoryCard key={c.id} category={c} />
        ))}
      </div>
    </section>
  );
}
