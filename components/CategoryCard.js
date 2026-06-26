import Link from 'next/link';

export default function CategoryCard({ category, active = false }) {
  return (
    <Link
      href={`/catalogo?categoria=${category.id}`}
      className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none
        ${active
          ? 'border-primary bg-primary-light shadow-md'
          : 'border-gray-100 bg-white hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5'
        }`}
    >
      <span className="text-3xl leading-none">{category.icon}</span>
      <span className={`text-xs font-semibold text-center leading-tight ${active ? 'text-primary' : 'text-gray-700 group-hover:text-primary'}`}>
        {category.label}
      </span>
      {category.count && (
        <span className="text-xs text-gray-400">{category.count}</span>
      )}
    </Link>
  );
}
