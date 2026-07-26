// @vitest-environment jsdom
//
// Regresión: MenuManager (y cualquier otro consumidor de Modal/Drawer) pasa
// `onClose` como una arrow function inline (`onClose={() => !saving &&
// onClose()}`) — una referencia NUEVA en cada render del padre. Como `form`
// vive en el mismo componente, cada tecla tipeada en un input re-renderiza
// el padre y crea un `onClose` nuevo.
//
// El efecto de foco-trap en useDialog.js tenía `onClose` en su dependency
// array. Cada `onClose` nuevo re-disparaba el efecto completo: el cleanup
// devolvía el foco al elemento previo al modal, y el re-run forzaba el foco
// al primer elemento enfocable del diálogo — nunca al input donde el
// usuario estaba escribiendo. Resultado: el input pierde foco después de
// cada carácter.
//
// Este test monta el HOOK REAL (useDialog.js, sin mock) contra un DOM real
// (jsdom) con un input real, y reproduce exactamente ese patrón — un
// `onClose` con identidad nueva en cada "render" — sin necesitar montar
// MenuManager.js completo: Vitest en este repo no puede importar archivos
// `.js` con JSX (ver docs/DECISIONS.md, "Vitest en el frontend: solo lógica
// pura, sin tests de render") por una limitación ya diagnosticada de
// vite-node/SSR con esa combinación de extensión. `useDialog.js` no tiene
// JSX — es un hook puro — así que se puede importar y probar directamente,
// montando una "vista" mínima vía React.createElement (nunca JSX) para
// tener un árbol DOM real con foco real.
import { describe, test, expect, vi, afterEach } from 'vitest';
import { createElement } from 'react';
import { act, render, cleanup } from '@testing-library/react';
import { useDialog } from '../useDialog';

afterEach(cleanup);

// Orden de foco calcado del real: en MenuManager, el botón X del header (o
// "Volver a la lista") precede al input "Nombre del paquete" en el DOM —
// por eso "refocar items[0]" visiblemente le saca el foco al input: items[0]
// es el botón, no el input. Un dialog con el input como único/primer
// enfocable no habría reproducido el bug (ver primer intento de este test).
function TestDialog({ open, onClose }) {
  const containerRef = useDialog(open, onClose);
  return createElement(
    'div',
    { ref: containerRef },
    createElement('button', { type: 'button', 'data-testid': 'close-button' }, 'Cerrar'),
    createElement('input', { 'data-testid': 'name-input' }),
    createElement('input', { 'data-testid': 'other-input' }),
  );
}

describe('useDialog — el foco no se roba cuando onClose cambia de identidad en cada render del padre', () => {
  test('escribir carácter a carácter (onClose nuevo en cada render) nunca le saca el foco al input', () => {
    const { getByTestId, rerender } = render(createElement(TestDialog, { open: true, onClose: () => {} }));

    const nameInput = getByTestId('name-input');
    act(() => { nameInput.focus(); });
    expect(document.activeElement).toBe(nameInput);

    // Simula exactamente el patrón real de MenuManager: cada "tecla" vuelve
    // a renderizar el padre con un `onClose` de identidad nueva (misma
    // forma que `onClose={() => !saving && onClose()}` recreándose en cada
    // `setForm`), sin que el usuario haya tocado el foco explícitamente.
    const keystrokeCount = 'Menú celíaco completo'.length;
    for (let i = 0; i < keystrokeCount; i += 1) {
      act(() => {
        rerender(createElement(TestDialog, { open: true, onClose: () => {} }));
      });
    }

    expect(document.activeElement).toBe(nameInput);
  });

  test('Escape sigue funcionando después de que onClose cambió de identidad (no queda un closure viejo)', () => {
    const onCloseFirst = vi.fn();
    const onCloseLatest = vi.fn();
    const { rerender } = render(createElement(TestDialog, { open: true, onClose: onCloseFirst }));

    act(() => { rerender(createElement(TestDialog, { open: true, onClose: onCloseLatest })); });

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onCloseLatest).toHaveBeenCalledTimes(1);
    expect(onCloseFirst).not.toHaveBeenCalled();
  });

  test('abrir el diálogo sigue enfocando el primer elemento enfocable (el fix no rompe el foco inicial)', () => {
    const { getByTestId } = render(createElement(TestDialog, { open: true, onClose: () => {} }));
    expect(document.activeElement).toBe(getByTestId('close-button'));
  });

  test('cerrar (open=false) sigue restaurando el foco al elemento previamente enfocado', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    act(() => { trigger.focus(); });
    expect(document.activeElement).toBe(trigger);

    const { rerender } = render(createElement(TestDialog, { open: true, onClose: () => {} }));
    expect(document.activeElement).not.toBe(trigger);

    act(() => { rerender(createElement(TestDialog, { open: false, onClose: () => {} })); });
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
