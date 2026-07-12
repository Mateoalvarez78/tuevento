'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import AppIcon from '@/components/AppIcon';

const SIZE_CLASSES = {
  sm: 'px-4 py-2 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3 text-base gap-2',
};

const ICON_ONLY_SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
};

// variant → { light, dark } — "dark" cubre los paneles admin/proveedor
// (fondo oscuro), donde hoy cada formulario repite su propio className.
const VARIANT_CLASSES = {
  primary: {
    light: 'bg-primary text-white hover:bg-primary-dark',
    dark: 'bg-primary text-white hover:bg-primary-dark',
  },
  outline: {
    light: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    dark: 'border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white',
  },
  ghost: {
    light: 'text-gray-600 hover:bg-gray-100',
    dark: 'text-gray-300 hover:bg-gray-800',
  },
  danger: {
    light: 'bg-danger text-white hover:bg-danger-dark',
    dark: 'bg-danger text-white hover:bg-danger-dark',
  },
  success: {
    light: 'bg-emerald-600 text-white hover:bg-emerald-700',
    dark: 'bg-emerald-600 text-white hover:bg-emerald-700',
  },
  warning: {
    light: 'bg-amber-500 text-white hover:bg-amber-600',
    dark: 'bg-amber-500 text-white hover:bg-amber-600',
  },
};

/**
 * Botón único para toda la app. Renderiza `<button>` o, con `href`, un
 * `next/link` estilizado igual (muchos "botones" hoy son links con className
 * de botón repetida a mano).
 *
 * `variant`: primary | outline | ghost | danger | success | warning
 * `size`: sm | md | lg
 * `theme`: light (default, superficie clara) | dark (paneles admin/proveedor)
 * `iconOnly`: true para botones circulares solo-ícono (requiere `aria-label`)
 * `loading`: reemplaza el ícono/contenido por un spinner y marca `aria-busy`
 * `as="span"`: versión puramente decorativa (mismo look, sin interacción) —
 * para CTAs visuales dentro de una card que ya es un `<Link>` completo, donde
 * anidar otro elemento interactivo sería HTML inválido.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  theme = 'light',
  icon,
  iconPosition = 'left',
  iconOnly = false,
  loading = false,
  disabled = false,
  href,
  as,
  className = '',
  type = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading;
  const variantCls = VARIANT_CLASSES[variant]?.[theme] || VARIANT_CLASSES.primary.light;
  const sizeCls = iconOnly ? ICON_ONLY_SIZE_CLASSES[size] : SIZE_CLASSES[size];
  const shapeCls = iconOnly ? 'rounded-full justify-center' : 'rounded-xl';

  const classes = [
    'inline-flex items-center font-semibold transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    shapeCls,
    sizeCls,
    variantCls,
    className,
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {loading ? (
        <AppIcon icon={Loader2} size={iconOnly ? size : 'button'} className="animate-spin" aria-hidden="true" />
      ) : (
        icon && iconPosition === 'left' && <AppIcon icon={icon} size={iconOnly ? size : 'button'} aria-hidden="true" />
      )}
      {!iconOnly && children}
      {!loading && icon && iconPosition === 'right' && !iconOnly && (
        <AppIcon icon={icon} size="button" aria-hidden="true" />
      )}
    </>
  );

  if (as === 'span') {
    return <span className={classes} {...rest}>{content}</span>;
  }

  if (href && !isDisabled) {
    return (
      <Link href={href} className={classes} aria-busy={loading || undefined} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} disabled={isDisabled} className={classes} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
