'use client';

// ─── MyEventContext ─────────────────────────────────────────────────────
// Wrapper JSX delgado sobre hooks/useMyEventState.js — toda la lógica real
// (auto-carga, mutaciones, manejo de 409, protección contra respuestas
// obsoletas) vive en ese hook puro y ya está cubierta por
// hooks/__tests__/useMyEventState.test.js. Este archivo solo conecta
// useApp() (sesión real) con useMyEventState() y expone el resultado vía
// Context — mismo patrón que lib/AppContext.js (Provider + hook `useX` que
// tira si se usa afuera del Provider).
//
// Por qué no tiene test de render propio: Vitest en este repo no puede
// importar archivos `.js` con JSX (ver docs/DECISIONS.md del repo de docs,
// "Vitest en el frontend: solo lógica pura, sin tests de render") — mismo
// motivo por el que ProposalCard/SmartPackagesGenerator tampoco lo tienen.
// No es una brecha nueva de esta tarea, es el límite ya aceptado del
// proyecto; toda la lógica que sí se puede aislar sin JSX está en el hook.
//
// Montado en app/layout.js, dentro de <AppProvider> (necesita useApp()) y
// envolviendo <ConditionalNav> (para que Home/header/catálogo/ficha/
// dashboard/mi-evento lo consuman con un solo Provider — ver informe de
// cierre de esta etapa para el razonamiento completo de dónde SÍ y dónde NO
// hace falta). No se agrega ningún guard de ruta acá: el propio hook ya
// decide internamente cuándo pedir el borrador (solo `role==='client'`
// autenticado) — montarlo globalmente es seguro incluso en /admin o
// /dashboard/proveedor, nunca dispara requests ahí.
//
// No crea un evento automáticamente, no guarda nada en localStorage/
// sessionStorage, no persiste el JWT ni ningún token de ubicación — todo
// eso ya lo maneja AppContext/services/api.js, este Provider no duplica
// nada de eso.

import { createContext, useContext } from 'react';
import { useApp } from './AppContext';
import { useMyEventState } from '../hooks/useMyEventState';

const MyEventContext = createContext(null);

export function MyEventProvider({ children }) {
  const { user, authLoading } = useApp();
  const state = useMyEventState(user, authLoading);
  return <MyEventContext.Provider value={state}>{children}</MyEventContext.Provider>;
}

export function useMyEvent() {
  const ctx = useContext(MyEventContext);
  if (!ctx) throw new Error('useMyEvent must be used inside MyEventProvider');
  return ctx;
}
