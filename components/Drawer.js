'use client';

import { useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Button from '@/components/Button';
import { useDialog } from '@/lib/useDialog';
import { useReducedMotion } from '@/lib/useReducedMotion';

const THEME_CLASSES = {
  light: 'bg-white text-gray-900',
  dark: 'bg-gray-900 border-l border-gray-800 text-white',
};

const THEME_CLASSES_LEFT = {
  light: 'bg-white text-gray-900',
  dark: 'bg-gray-900 border-r border-gray-800 text-white',
};

/**
 * Drawer único para toda la app (paneles de detalle deslizantes y menús de
 * navegación mobile). Misma base de accesibilidad que `Modal` (Escape,
 * focus-trap, scroll-lock, `role="dialog"`), pero deslizando desde un costado.
 *
 * `side`: right (default, drawers de contenido) | left (navegación mobile)
 * `width`: ancho máximo del panel (Tailwind, ej. "max-w-md")
 */
export default function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  theme = 'light',
  side = 'right',
  width = 'max-w-md',
  bodyClassName = 'flex-1 overflow-y-auto p-6',
  className = '',
}) {
  const containerRef = useDialog(open, onClose);
  const reduced = useReducedMotion();
  const titleId = useId();
  const isLeft = side === 'left';
  const themeCls = (isLeft ? THEME_CLASSES_LEFT : THEME_CLASSES)[theme] || THEME_CLASSES.light;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
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
            className={`relative z-10 w-full ${width} h-full flex flex-col shadow-xl outline-none ${themeCls} ${className} ${isLeft ? '' : 'ml-auto'}`}
            initial={{ x: reduced ? 0 : (isLeft ? '-100%' : '100%') }}
            animate={{ x: 0 }}
            exit={{ x: reduced ? 0 : (isLeft ? '-100%' : '100%') }}
            transition={{ duration: reduced ? 0 : 0.22, ease: 'easeOut' }}
          >
            {title && (
              <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                <h3 id={titleId} className="text-lg font-bold truncate">{title}</h3>
                <Button iconOnly icon={X} variant="ghost" size="sm" theme={theme} aria-label="Cerrar" onClick={onClose} />
              </div>
            )}
            <div className={bodyClassName}>{children}</div>
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
