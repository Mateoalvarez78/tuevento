'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import AppIcon from '@/components/AppIcon';

/**
 * Estrellas de calificación reutilizables.
 * Modo lectura (default): pinta `rating` estrellas llenas.
 * Modo interactivo (`interactive`): permite elegir 1-5 con hover, para el
 * formulario de "Calificar servicio".
 */
export default function RatingStars({ rating = 0, size = 14, interactive = false, onChange, className = '' }) {
  const [hover, setHover] = useState(0);

  if (!interactive) {
    return (
      <div className={`flex items-center gap-0.5 ${className}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <AppIcon key={i} icon={Star} size={size} aria-hidden="true" className={i <= Math.round(rating) ? 'star-filled fill-current' : 'star-empty'} />
        ))}
      </div>
    );
  }

  const active = hover || rating;
  return (
    <div className={`flex items-center gap-1 ${className}`} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange?.(i)}
          className="p-0.5 transition-transform hover:scale-110"
          aria-label={`${i} estrellas`}
        >
          <AppIcon icon={Star} size={size} aria-hidden="true" className={i <= active ? 'text-yellow-400 fill-current' : 'text-gray-200'} />
        </button>
      ))}
    </div>
  );
}
