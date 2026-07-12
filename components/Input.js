'use client';

import { forwardRef } from 'react';
import AppIcon from '@/components/AppIcon';

const VARIANT_CLASSES = {
  light: {
    base: 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20',
    error: 'border-danger focus:border-danger focus:ring-danger/20',
  },
  dark: {
    base: 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-primary/60',
    error: 'border-danger focus:border-danger/60',
  },
};

/**
 * Input único para toda la app (texto/email/password/número/fecha/búsqueda).
 * `icon`: componente Lucide opcional, se muestra a la izquierda vía AppIcon.
 * `error`: string (se muestra debajo) o `true` (solo aplica el estilo de error).
 * `variant`: "light" (default, formularios públicos) | "dark" (paneles admin/proveedor).
 */
const Input = forwardRef(function Input(
  { icon, error, variant = 'light', className = '', wrapperClassName = '', ...rest },
  ref
) {
  const v = VARIANT_CLASSES[variant] || VARIANT_CLASSES.light;
  const classes = [
    'w-full border rounded-xl text-sm transition-colors duration-200 outline-none',
    icon ? 'pl-9 pr-3' : 'px-3',
    'py-2.5',
    error ? v.error : v.base,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={`relative ${wrapperClassName}`}>
      {icon && (
        <AppIcon
          icon={icon}
          size="input"
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${error ? 'text-danger' : 'text-gray-400'}`}
          aria-hidden="true"
        />
      )}
      <input ref={ref} className={classes} aria-invalid={!!error || undefined} {...rest} />
      {typeof error === 'string' && error && (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      )}
    </div>
  );
});

export default Input;
