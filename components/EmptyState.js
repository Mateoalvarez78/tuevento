import Link from 'next/link';
import { SearchX } from 'lucide-react';

const BTN = 'px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm';

export default function EmptyState({ title, description, cta, ctaHref, onCta, icon: Icon = SearchX }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-5">
        <Icon size={28} strokeWidth={1.5} className="text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title || 'Sin resultados'}</h3>
      <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
        {description || 'No encontramos resultados para tu búsqueda. Intentá con otros filtros.'}
      </p>
      {cta && onCta && (
        <button onClick={onCta} className={BTN}>{cta}</button>
      )}
      {cta && ctaHref && !onCta && (
        <Link href={ctaHref} className={BTN}>{cta}</Link>
      )}
    </div>
  );
}
