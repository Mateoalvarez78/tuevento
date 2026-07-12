'use client';

import { useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Button from '@/components/Button';
import { useDialog } from '@/lib/useDialog';
import { useReducedMotion } from '@/lib/useReducedMotion';

const THEME_CLASSES = {
  light: 'bg-white text-gray-900',
  dark: 'bg-gray-900 border border-gray-800 text-white',
};

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * Modal único para toda la app. Resuelve, en un solo lugar, lo que hoy falta
 * en cada modal hand-rolled: overlay, cierre con Escape, focus-trap, bloqueo
 * de scroll del body, `role="dialog"`/`aria-modal`, y animación de entrada/
 * salida que respeta `prefers-reduced-motion`.
 *
 * `theme`: light (default) | dark (paneles admin)
 * `size`: sm | md | lg — ancho máximo del contenido
 * `footer`: nodo opcional, se renderiza pegado abajo (acciones del modal)
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  theme = 'light',
  size = 'md',
  className = '',
}) {
  const containerRef = useDialog(open, onClose);
  const reduced = useReducedMotion();
  const titleId = useId();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          />
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className={`relative z-10 w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} rounded-2xl shadow-xl max-h-[90vh] flex flex-col outline-none ${THEME_CLASSES[theme] || THEME_CLASSES.light} ${className}`}
            initial={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 8 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: 'easeOut' }}
          >
            {title && (
              <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                <h3 id={titleId} className="text-lg font-bold truncate">{title}</h3>
                <Button iconOnly icon={X} variant="ghost" size="sm" theme={theme} aria-label="Cerrar" onClick={onClose} />
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer && (
              <div className={`px-6 py-4 border-t flex gap-2 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
