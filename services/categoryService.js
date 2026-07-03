// ─── CATEGORY SERVICE ─────────────────────────────────────────────────────────
// Real API-backed category operations with local cache.

import { api } from './api';
import { CATEGORIES as MOCK_CATEGORIES } from '@/mocks/categories.mock';

// In-memory cache to avoid repeated requests within the session
let _cache = null;

function mapCategory(c) {
  return {
    id:    c.slug || c.id,
    label: c.name,
    icon:  c.emoji || '',
    count: 0,
    _raw: c,
  };
}

export const categoryService = {
  async getAll() {
    if (_cache) return _cache;
    try {
      const res = await api.get('/categories');
      _cache = (res.data || []).map(mapCategory);
      return _cache;
    } catch {
      // Fallback to mock categories if API unavailable
      return MOCK_CATEGORIES;
    }
  },

  async getById(id) {
    const all = await this.getAll();
    return all.find((c) => c.id === id) || null;
  },

  async getLabel(id) {
    const cat = await this.getById(id);
    return cat?.label || id;
  },

  /** Clears the cache (e.g. after admin creates a category) */
  clearCache() {
    _cache = null;
  },
};
