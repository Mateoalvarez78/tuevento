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
  // Callers overwhelmingly pass `onClose` as an inline arrow function
  // (`onClose={() => setX(null)}`), a fresh reference on every render of the
  // parent — including every keystroke in a form rendered inside the dialog.
  // Keeping `onClose` out of the effect below (and reading it through this
  // ref instead) means the focus-trap setup/teardown — which steals focus to
  // set up the trap — only runs on actual open/close transitions, never on
  // an unrelated parent re-render.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

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
        onCloseRef.current?.();
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
  }, [open]);

  return containerRef;
}
