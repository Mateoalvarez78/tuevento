// Clases compartidas por las 7 tablas del proyecto (antes: 3 tipografías de
// encabezado distintas y 3 opacidades de hover distintas para el mismo caso).
// No es un DataTable genérico — cada tabla sigue armando su propio <table>,
// esto solo centraliza las clases repetidas.

export const TABLE_HEAD_CLS = {
  light: 'text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100',
  dark: 'text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-800',
};

export const TABLE_ROW_HOVER_CLS = {
  light: 'hover:bg-gray-50/70 transition-colors',
  dark: 'hover:bg-gray-800/40 transition-colors',
};
