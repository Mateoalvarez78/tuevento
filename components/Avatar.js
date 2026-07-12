'use client';

import { useState } from 'react';

const SIZE_CLASSES = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
};

const SHAPE_CLASSES = {
  circle: 'rounded-full',
  square: 'rounded-xl',
};

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/**
 * Avatar único para toda la app (foto de persona o logo de negocio).
 * `shape`: circle (default, personas) | square (logos de proveedor/negocio) —
 * son casos legítimamente distintos, no se fuerza una sola forma.
 * `src` ausente o con error de carga → cae a iniciales de `name`.
 */
export default function Avatar({
  src,
  name,
  size = 'md',
  shape = 'circle',
  loading = false,
  className = '',
  ...rest
}) {
  const [errored, setErrored] = useState(false);
  const sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const shapeCls = SHAPE_CLASSES[shape] || SHAPE_CLASSES.circle;
  const classes = ['shrink-0 overflow-hidden', sizeCls, shapeCls, className].filter(Boolean).join(' ');

  if (loading) {
    return <div className={`skeleton ${classes}`} aria-hidden="true" />;
  }

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={`${classes} object-cover`}
        onError={() => setErrored(true)}
        {...rest}
      />
    );
  }

  return (
    <div
      className={`${classes} flex items-center justify-center bg-gray-100 text-gray-500 font-semibold`}
      role="img"
      aria-label={name || 'Avatar'}
      {...rest}
    >
      {initials(name)}
    </div>
  );
}
