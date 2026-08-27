'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { categoryService } from '@/services/categoryService';

/**
 * Subcategorías ACTIVAS de una categoría (el backend ya filtra
 * is_active=true para cualquier caller no-admin — ver
 * categories.controller.js#getSubcategories).
 *
 * `status`: 'idle' (sin categoryId) | 'loading' | 'success' | 'error'.
 *
 * A diferencia de useProviders.js/useMyProvider (que llaman `setLoading(true)`
 * de forma síncrona apenas arranca el efecto), acá `status` se DERIVA en
 * cada render comparando `categoryId` contra `result.categoryId` — nunca se
 * guarda como un setState aparte. Es a propósito: la regla de lint
 * `react-hooks/set-state-in-effect` (eslint-plugin-react-hooks 7.x)
 * flaguea cualquier setState alcanzable de forma SÍNCRONA (antes del primer
 * `await`/`.then()`) dentro de un efecto — incluso a través de una función
 * memoizada como `load`, tal como ya le pasa a useProviders.js/
 * useGoogleMapsScript.js/lib/useReducedMotion.js en este mismo repo (fallas
 * preexistentes, no corregidas ahí por estar fuera de alcance). Acá el
 * ÚNICO setState (`setResult`) vive dentro de los callbacks `.then()`/
 * `.catch()` de la promesa — code que el runtime de Promises invoca en un
 * microtask aparte, nunca de forma síncrona dentro del cuerpo del efecto —
 * así que no hay ningún setState directamente alcanzable desde useEffect, y
 * el comportamiento observable (idle/loading/success/error, sin fetch sin
 * categoryId, refetch al cambiar categoryId, reload(), sin respuestas
 * obsoletas) queda idéntico.
 *
 * `requestIdRef` descarta cualquier respuesta obsoleta: si `categoryId`
 * cambia o se llama `reload()` antes de que una petición anterior
 * resuelva, esa respuesta tardía nunca sobrescribe el resultado.
 */
export function useSubcategories(categoryId) {
  const [result, setResult] = useState(null); // { categoryId, subcategories, error } | null — último fetch resuelto
  const requestIdRef = useRef(0);

  const load = useCallback(() => {
    if (!categoryId) return Promise.resolve(); // nunca dispara la petición sin categoryId
    const requestId = ++requestIdRef.current;
    return categoryService.getSubcategories(categoryId).then(
      (data) => {
        if (requestId !== requestIdRef.current) return; // respuesta obsoleta — se descarta
        setResult({ categoryId, subcategories: data, error: null });
      },
      (err) => {
        if (requestId !== requestIdRef.current) return;
        setResult({ categoryId, subcategories: [], error: err });
      }
    );
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  const hasFreshResult = !!categoryId && result?.categoryId === categoryId;
  const status = !categoryId ? 'idle' : hasFreshResult ? (result.error ? 'error' : 'success') : 'loading';

  return {
    subcategories: hasFreshResult && !result.error ? result.subcategories : [],
    status,
    error: hasFreshResult ? result.error : null,
    reload: load,
  };
}
