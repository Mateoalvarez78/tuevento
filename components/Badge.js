'use client';

import AppIcon from '@/components/AppIcon';

// Variantes con nombre — casos genéricos (contador, etiqueta, estado simple).
const VARIANT_CLASSES = {
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  primary: 'bg-primary-light text-primary border-primary/20',
  success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-red-50 text-red-600 border-red-200',
  info:    'bg-blue-50 text-blue-600 border-blue-200',
};

const SIZE_CLASSES = {
  sm: 'px-2.5 py-0.5 text-xs gap-1.5',
  md: 'px-3 py-1.5 text-sm gap-1.5',
};

/**
 * Badge único para toda la app (estados de proveedor/servicio/reserva/pago,
 * contadores, etiquetas). `variant` cubre los casos genéricos; `bg`/`text`/
 * `border` permiten pasar clases Tailwind puntuales cuando el color depende
 * de una config existente por estado (ver ProviderStatusBadge/ServiceStatusBadge/
 * ReservationStatusBadge, que son wrappers finos sobre este componente).
 */
export default function Badge({
  variant = 'neutral',
  size = 'sm',
  icon,
  label,
  children,
  bg, text, border,
  className = '',
  ...rest
}) {
  const content = label ?? children;
  const tokenClasses = (bg || text || border)
    ? [bg, text, border].filter(Boolean).join(' ')
    : (VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral);

  const classes = [
    'inline-flex items-center rounded-full font-medium border shrink-0',
    SIZE_CLASSES[size] || SIZE_CLASSES.sm,
    tokenClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} aria-label={!content ? label : undefined} {...rest}>
      {icon && <AppIcon icon={icon} size={size === 'md' ? 14 : 12} className="shrink-0" aria-hidden="true" />}
      {content}
    </span>
  );
}
