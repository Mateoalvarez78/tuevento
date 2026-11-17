// Config de Vitest del frontend (ver docs/DECISIONS.md).
//
// Arrancó acotada a funciones puras. Se amplió para admitir tests de RENDER de
// componentes, que hacían falta para probar el formulario de contacto de punta a
// punta (que muestre éxito solo cuando el backend confirmó la persistencia es
// justamente lo que hay que poder demostrar).
//
// Dos cambios, los dos deliberadamente conservadores:
//
//  1. `esbuild.loader: 'jsx'` — este proyecto escribe JSX en archivos `.js`
//     (no `.jsx`), y Vite por defecto no parsea JSX en `.js`: sin esto, un test
//     que renderiza un componente falla con "Expression expected". El loader no
//     afecta a los archivos sin JSX: siguen siendo JS válido.
//
//  2. `environment: 'node'` SE MANTIENE como default, así los 25+ archivos de
//     test existentes no cambian de entorno ni de costo. Los que necesitan DOM
//     lo declaran por archivo con el docblock `// @vitest-environment jsdom`.
//     Es la opción de menor alcance: no hay un `environmentMatchGlobs` que
//     obligue a acertar un patrón de rutas, y cada archivo dice qué necesita.
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: {
    loader: 'jsx',
    include: /\.[jt]sx?$/,
    // `exclude: []` es imprescindible, no redundante: el plugin `vite:esbuild`
    // excluye `/\.js$/` POR DEFECTO, así que sin esto los `.js` quedan fuera del
    // transform aunque `include` los matchee, y Vite falla con "content contains
    // invalid JS syntax … name the file with the .jsx extension".
    exclude: [],
    // Runtime automático de JSX: los componentes no importan React
    // explícitamente (igual que en el resto del código de Next).
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      // Mismo alias que jsconfig.json (@/* -> ./*)
      '@': path.resolve(__dirname, '.'),
    },
  },
});
