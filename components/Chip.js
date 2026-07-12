'use client';

import { X } from 'lucide-react';
import AppIcon from '@/components/AppIcon';

/**
 * Chip único para filtros/categorías/tags/pills seleccionables — distinto de
 * `Badge` (que es una etiqueta de solo lectura de un estado). `Chip` es
 * interactivo: normal/hover/selected/disabled, ícono opcional, remoción
 * opcional (X).
 */
export default function Chip({
  children,
  selected = false,
  disabled = false,
  icon,
  onRemove,
  onClick,
  className = '',
  ...rest
}) {
  const classes = [
    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors duration-200 shrink-0',
    disabled
      ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400 bg-gray-50'
      : selected
        ? 'border-primary bg-primary-light text-primary'
        : 'border-gray-200 text-gray-600 bg-white hover:border-primary/40 hover:bg-primary-light/40',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={classes}
      {...rest}
    >
      {icon && <AppIcon icon={icon} size={14} aria-hidden="true" />}
      {children}
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Quitar"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onRemove(); } }}
          className="ml-0.5 -mr-1 rounded-full hover:bg-black/10 p-0.5"
        >
          <AppIcon icon={X} size={12} aria-hidden="true" />
        </span>
      )}
    </button>
  );
}
