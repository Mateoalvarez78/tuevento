// ─── DESIGN TOKENS (JS) ────────────────────────────────────────────────────────
// Puente entre los tokens de `app/globals.css` (@theme) y componentes que
// necesitan resolverlos en JS (AppIcon, Button, Input). Los nombres coinciden
// 1:1 con las variables --color-* del theme, así que agregar un color acá y
// en globals.css es lo único necesario para sumar un token nuevo.

export const COLOR_TOKEN = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  neutral: 'text-neutral',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  disabled: 'text-disabled',
};

export const BG_COLOR_TOKEN = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  neutral: 'bg-neutral',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  disabled: 'bg-disabled',
};

export const BORDER_COLOR_TOKEN = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  neutral: 'border-neutral',
  success: 'border-success',
  warning: 'border-warning',
  danger: 'border-danger',
  info: 'border-info',
  disabled: 'border-disabled',
};

/** Clase de texto para un token de color nombrado. Devuelve '' si no es un token conocido. */
export function colorToken(color) {
  return COLOR_TOKEN[color] || '';
}
