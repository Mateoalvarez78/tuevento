import Link from 'next/link';
import AppIcon from '@/components/AppIcon';

export default function CategoryCard({ category, active = false }) {
  return (
    <Link
      href={`/catalogo?categoria=${category.id}`}
      className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-200 cursor-pointer select-none
        ${active
          ? 'border-primary bg-primary-light shadow-md'
          : 'border-gray-100 bg-white hover:border-primary hover:shadow-lg hover:-translate-y-0.5'
        }`}
    >
      {category.icon && (
        <AppIcon
          icon={category.icon}
          size={32}
          strokeWidth={1.75}
          aria-hidden="true"
          className={active ? 'text-primary' : 'text-gray-500 group-hover:text-primary transition-colors'}
        />
      )}
      <span className={`text-sm font-semibold text-center leading-tight ${active ? 'text-primary' : 'text-gray-700 group-hover:text-primary'} transition-colors`}>
        {category.label}
      </span>
      {category.count > 0 && (
        <span className={`text-xs ${active ? 'text-primary/70' : 'text-gray-400'}`}>
          {category.count} servicio{category.count !== 1 ? 's' : ''}
        </span>
      )}
    </Link>
  );
}
