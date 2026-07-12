import { ICON_SIZE } from '@/utils/icons';
import { colorToken } from '@/utils/designTokens';

/**
 * Único componente para renderizar íconos en toda la app.
 *
 * - `icon`: componente Lucide (función) **o** objeto de marca de `simple-icons`
 *   (`{ path, hex }`) — se detecta automáticamente cuál es.
 * - `size`: token nombrado de `ICON_SIZE` (ej. "card", "navbar") o un número.
 * - `color`: token nombrado (`primary`, `neutral`, `danger`, ...) — opcional.
 *   Si no se pasa, el ícono hereda `currentColor`/lo que traiga `className`
 *   (necesario para los casos con `group-hover:`, `fill-current`, opacidad
 *   condicional, etc. que ya existen en la app).
 * - `strokeWidth`: solo aplica a íconos Lucide (los de marca son `fill`).
 * - `className`: se combina con la clase de color resuelta, si la hay.
 * - resto de props (`aria-hidden`, `aria-label`, `onClick`, ...) pasan directo.
 */
export default function AppIcon({
  icon: Icon,
  size = 'button',
  color,
  strokeWidth,
  className = '',
  ...rest
}) {
  if (!Icon) return null;

  const resolvedSize = typeof size === 'number' ? size : (ICON_SIZE[size] || ICON_SIZE.button);
  const colorClass = color ? colorToken(color) : '';
  const mergedClassName = [colorClass, className].filter(Boolean).join(' ');

  // Ícono de marca (simple-icons): { title, hex, path }.
  if (typeof Icon === 'object' && Icon.path) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={resolvedSize}
        height={resolvedSize}
        fill="currentColor"
        className={mergedClassName}
        {...rest}
      >
        <path d={Icon.path} />
      </svg>
    );
  }

  // Ícono Lucide (componente).
  return (
    <Icon
      size={resolvedSize}
      strokeWidth={strokeWidth}
      className={mergedClassName}
      {...rest}
    />
  );
}
