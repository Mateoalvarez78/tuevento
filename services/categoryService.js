// ─── CATEGORY SERVICE ─────────────────────────────────────────────────────────
// Provides categories for dropdowns and filters.
// Swap for fetch('/api/categories') when backend is ready.

import { CATEGORIES } from '@/mocks/categories.mock';

export const categoryService = {
  /** Returns the full list of categories. */
  getAll() {
    return CATEGORIES;
  },

  /** Returns a single category by its id slug. */
  getById(id) {
    return CATEGORIES.find((c) => c.id === id) || null;
  },

  /** Returns a label string for a category id. */
  getLabel(id) {
    return CATEGORIES.find((c) => c.id === id)?.label || id;
  },
};
