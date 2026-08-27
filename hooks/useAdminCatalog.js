'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '@/services/adminService';

/**
 * Categorías completas (activas + inactivas, con contadores de uso) para
 * Admin > Configuración del catálogo.
 *
 * Mismo patrón "derivado, sin setState síncrono dentro del efecto" que
 * hooks/useSubcategories.js — deliberadamente DISTINTO del que ya usan
 * useAdminServices/useAdminReviews (hooks/useAdmin.js: `setLoading(true)`
 * síncrono al arrancar el efecto), que fallan
 * `react-hooks/set-state-in-effect`. No se repite ese patrón acá aunque ya
 * exista en el repo — ver hooks/useSubcategories.js para el detalle
 * completo de por qué la regla lo flaguea y cómo este otro lo evita: el
 * único `setResult` vive dentro de los callbacks `.then()`/`.catch()`,
 * nunca de forma síncrona en el cuerpo de `useEffect`.
 */
export function useAdminCategories() {
  const [result, setResult] = useState(null); // { categories, error } | null
  const requestIdRef = useRef(0);

  const load = useCallback(() => {
    const requestId = ++requestIdRef.current;
    return adminService.categories.getAll().then(
      (rows) => {
        if (requestId !== requestIdRef.current) return; // respuesta obsoleta
        setResult({ categories: rows, error: null });
      },
      (err) => {
        if (requestId !== requestIdRef.current) return;
        setResult({ categories: [], error: err });
      }
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  const status = !result ? 'loading' : result.error ? 'error' : 'success';
  return { categories: result?.categories || [], status, error: result?.error || null, reload: load };
}

/**
 * Subcategorías (activas + inactivas, con `packagesCount`) de UNA
 * categoría — mismo criterio de useSubcategories.js: nunca dispara la
 * petición sin `categoryId`, descarta respuestas obsoletas por
 * `requestId`, status derivado en vez de un setState aparte.
 */
export function useAdminSubcategories(categoryId) {
  const [result, setResult] = useState(null); // { categoryId, subcategories, error } | null
  const requestIdRef = useRef(0);

  const load = useCallback(() => {
    if (!categoryId) return Promise.resolve();
    const requestId = ++requestIdRef.current;
    return adminService.categories.getSubcategories(categoryId).then(
      (rows) => {
        if (requestId !== requestIdRef.current) return;
        setResult({ categoryId, subcategories: rows, error: null });
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
