'use client';

import { useState } from 'react';

/**
 * Como useState, pero persiste en sessionStorage. Se usa para que filtros,
 * búsqueda y paginación de una sección del dashboard sobrevivan cuando la
 * página se desmonta al navegar a otra sección y volvés (el layout persiste,
 * pero cada ruta sigue siendo su propio componente de página).
 */
export function useSessionState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = sessionStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setAndPersist = (next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try { sessionStorage.setItem(key, JSON.stringify(resolved)); } catch { /* storage lleno/deshabilitado: no rompe la UI */ }
      return resolved;
    });
  };

  return [value, setAndPersist];
}
