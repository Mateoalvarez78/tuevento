// ─── ENLACES AL CATÁLOGO ──────────────────────────────────────────────────────
//
// Contrato ESTABLE del filtro de categoría: `/catalogo?categories=<slug>`, que
// el catálogo traduce a `GET /services?category=<slug>` (c.slug = ANY($1) en
// el backend). Siempre el SLUG, nunca el UUID: el UUID cambia entre bases.
//
// Existe porque dos componentes armaban la URL a mano con el parámetro viejo
// `?categoria=<id>` mientras el resto usaba `?categories=<slug>`.

/**
 * Slug de una categoría tal como la devuelve categoryService (`slug`, o `id`,
 * que en el contrato público ya ES el slug). Devuelve null si no hay ninguno.
 */
export function categorySlug(category) {
  const slug = category?.slug || category?.id;
  return typeof slug === 'string' && slug.trim() ? slug.trim() : null;
}

/** `/catalogo?categories=<slug>`, o `/catalogo` si la categoría no tiene slug. */
export function catalogCategoryHref(category) {
  const slug = categorySlug(category);
  return slug ? `/catalogo?categories=${encodeURIComponent(slug)}` : '/catalogo';
}
