'use client';

const TITLE_CLASSES = {
  light: 'text-xl sm:text-2xl font-bold text-gray-900',
  dark: 'text-xl sm:text-2xl font-bold text-white',
};

const SUBTITLE_CLASSES = {
  light: 'text-sm text-gray-500 mt-0.5',
  dark: 'text-sm text-gray-400 mt-0.5',
};

/**
 * Encabezado de página único — reemplaza los 4+ tamaños/pesos de título
 * distintos que hoy conviven entre admin/proveedor/cliente (y, en el
 * proveedor, el título que directamente no se ve en mobile). `action` es un
 * slot libre a la derecha (botón, filtros, etc.).
 */
export default function PageHeader({ title, subtitle, action, theme = 'light', className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h1 className={TITLE_CLASSES[theme] || TITLE_CLASSES.light}>{title}</h1>
        {subtitle && <p className={SUBTITLE_CLASSES[theme] || SUBTITLE_CLASSES.light}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
