// ─── DATOS DE LA HOME (servidor, ISR) ────────────────────────────────────────
//
// La home se genera en el servidor y se regenera cada HOME_REVALIDATE_SECONDS
// (ISR). Así un visitante —o un revisor externo— recibe categorías y
// destacados ya en el HTML, aunque el backend en Render esté dormido en ese
// momento: se sirve la última versión buena mientras se regenera.
//
// Las llamadas pasan por services/*.js como en el resto del sitio; acá solo se
// orquesta y se decide qué mostrar:
//   · categorías: solo las que tienen servicios activos (count > 0). Si la API
//     falla, `null` → la home oculta la sección (nunca muestra conteos
//     inventados).
//   · destacados: el array real (puede ser vacío → la home oculta la sección).
//     Si la API falla, `null` → el componente los pide desde el navegador, con
//     estado de carga y botón de reintento.
import { categoryService } from '@/services/categoryService';
import { providerService } from '@/services/providerService';

/** Segundos entre regeneraciones de la home. Literal en app/page.js (Next exige un valor estático). */
export const HOME_REVALIDATE_SECONDS = 300;

/**
 * Tiempo máximo de espera por llamada al generar la página. Un backend dormido
 * tarda más que esto en despertar: preferimos generar sin ese dato (y
 * completarlo en el navegador) antes que colgar la generación.
 */
export const HOME_FETCH_TIMEOUT_MS = 10000;

export const FEATURED_LIMIT = 8;

/** Categorías con al menos un servicio activo, en el orden del backend. */
export function activeCategories(list) {
  return (Array.isArray(list) ? list : []).filter((c) => Number(c?.count) > 0);
}

function serverFetchOptions() {
  return {
    signal: AbortSignal.timeout(HOME_FETCH_TIMEOUT_MS),
    next: { revalidate: HOME_REVALIDATE_SECONDS },
  };
}

/**
 * Carga categorías y destacados en paralelo. Nunca lanza: cada dato que falla
 * vuelve como `null` y la página decide.
 */
export async function loadHomeData(deps = { categoryService, providerService }) {
  const [cats, featured] = await Promise.allSettled([
    deps.categoryService.getWithCounts(serverFetchOptions()),
    deps.providerService.getFeaturedProviders(FEATURED_LIMIT, serverFetchOptions()),
  ]);
  return {
    categories: cats.status === 'fulfilled' ? activeCategories(cats.value) : null,
    featured: featured.status === 'fulfilled' ? (featured.value || []).filter(Boolean) : null,
  };
}
