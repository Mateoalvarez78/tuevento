'use client';

import { useEffect, useState } from 'react';

/**
 * true si el usuario prefiere movimiento reducido (`prefers-reduced-motion`).
 * Usado por `Modal`/`Drawer` para desactivar la animación de entrada/salida.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
