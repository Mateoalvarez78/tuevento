'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento compartido por `Modal` y `Drawer`: cierre con Escape,
 * focus-trap (Tab no se escapa del diálogo), bloqueo de scroll del body
 * mientras está abierto, y restauración del foco al elemento que lo abrió.
 * Devuelve el ref que hay que poner en el contenedor del diálogo.
 */
export function useDialog(open, onClose) {
  const containerRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const getFocusable = () => {
      const container = containerRef.current;
      return container ? Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)) : [];
    };

    const items = getFocusable();
    (items[0] || containerRef.current)?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  return containerRef;
}
