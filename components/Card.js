'use client';

import Link from 'next/link';

const THEME_BASE = {
  light: 'bg-white border-gray-100',
  dark: 'bg-gray-900 border-gray-800',
};

const VARIANT_EXTRA = {
  default:     { light: 'shadow-sm', dark: '' },
  elevated:    { light: 'shadow-card', dark: '' },
  interactive: { light: 'shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer', dark: 'hover:border-gray-700 transition-colors cursor-pointer' },
  selected:    { light: 'border-primary ring-2 ring-primary/20 shadow-sm', dark: 'border-primary ring-2 ring-primary/20' },
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-10 text-center',
};

/**
 * Card único para toda la app. Centraliza radio/borde/sombra/hover que hoy
 * se repiten a mano en ~90 lugares (con drift real: shadow-sm vs shadow-card,
 * border-gray-700 vs border-gray-800, p-4/5/8/10/12/16 para el mismo caso).
 *
 * `variant`: default | interactive (hover elevado) | selected | elevated
 * `theme`: light (default) | dark (paneles admin/proveedor sobre fondo oscuro)
 * `padding`: none | sm | md | lg (lg = variante empty/error state, centrado)
 * `href`: envuelve en next/link (mismo patrón que Button); `as="article"` para
 * semántica de listado cuando no es un link.
 */
export default function Card({
  children,
  variant = 'default',
  theme = 'light',
  padding = 'md',
  as = 'div',
  href,
  className = '',
  ...rest
}) {
  const variantCls = (VARIANT_EXTRA[variant] || VARIANT_EXTRA.default)[theme] || '';
  const classes = [
    'rounded-2xl border',
    THEME_BASE[theme] || THEME_BASE.light,
    variantCls,
    PADDING_CLASSES[padding] || PADDING_CLASSES.md,
    className,
  ].filter(Boolean).join(' ');

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const As = as;
  return (
    <As className={classes} {...rest}>
      {children}
    </As>
  );
}
