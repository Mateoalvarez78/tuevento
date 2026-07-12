'use client';

import { Info } from 'lucide-react';
import AppIcon from '@/components/AppIcon';

/**
 * Tooltip de ícono de información — accesible por mouse (hover) y teclado
 * (focus). Extraído de `MetricCard.js`, que tenía una copia casi idéntica
 * duplicada en `DashCommissions.js`. No es un sistema genérico "envolvé
 * cualquier cosa": es específicamente el patrón de ícono-info + texto que ya
 * existía en dos lugares reales.
 */
export default function Tooltip({ text, iconSize = 13 }) {
  if (!text) return null;
  return (
    <div className="group relative inline-flex">
      <AppIcon
        icon={Info}
        size={iconSize}
        className="text-gray-300 hover:text-gray-400 cursor-default transition-colors"
        tabIndex={0}
        aria-label={text}
      />
      <div
        role="tooltip"
        className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 text-white text-xs leading-relaxed px-3 py-2.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-50"
      >
        {text}
        <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}
