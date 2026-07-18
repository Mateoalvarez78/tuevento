// Config mínima de Vitest — primer framework de test del frontend (ver
// docs/DECISIONS.md). Acotado a funciones puras (lib/smartPackages.js) —
// ahí mismo se explica por qué no incluye tests de render de componentes.
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
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
