import { describe, test, expect, vi } from 'vitest';
import { activeCategories, loadHomeData, FEATURED_LIMIT, HOME_REVALIDATE_SECONDS } from '@/lib/homeData';
import fs from 'node:fs';
import path from 'node:path';

const cat = (id, count) => ({ id, slug: id, label: id, count });

describe('activeCategories', () => {
  test('oculta las categorías sin servicios activos', () => {
    expect(activeCategories([cat('dj', 2), cat('salon', 0), cat('catering', 1)]).map((c) => c.id))
      .toEqual(['dj', 'catering']);
  });
  test('tolera entradas raras', () => {
    expect(activeCategories(null)).toEqual([]);
    expect(activeCategories([null, { id: 'x' }, cat('y', '3')]).map((c) => c.id)).toEqual(['y']);
  });
});

describe('loadHomeData', () => {
  test('pasa timeout y revalidación a los services y filtra categorías vacías', async () => {
    const categoryService = { getWithCounts: vi.fn().mockResolvedValue([cat('dj', 1), cat('mozos', 0)]) };
    const providerService = { getFeaturedProviders: vi.fn().mockResolvedValue([{ providerId: 'p1' }, null]) };
    const data = await loadHomeData({ categoryService, providerService });
    expect(data.categories.map((c) => c.id)).toEqual(['dj']);
    expect(data.featured).toEqual([{ providerId: 'p1' }]);
    const [opts] = categoryService.getWithCounts.mock.calls[0];
    expect(opts.next).toEqual({ revalidate: HOME_REVALIDATE_SECONDS });
    expect(opts.signal).toBeInstanceOf(AbortSignal);
    expect(providerService.getFeaturedProviders.mock.calls[0][0]).toBe(FEATURED_LIMIT);
  });

  test('nunca lanza: lo que falla vuelve como null', async () => {
    const data = await loadHomeData({
      categoryService: { getWithCounts: vi.fn().mockRejectedValue(new Error('dormido')) },
      providerService: { getFeaturedProviders: vi.fn().mockRejectedValue(new Error('dormido')) },
    });
    expect(data).toEqual({ categories: null, featured: null });
  });

  test('el revalidate de app/page.js coincide con HOME_REVALIDATE_SECONDS', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '..', '..', 'app', 'page.js'), 'utf8');
    const m = src.match(/export const revalidate = (\d+);/);
    expect(m).not.toBeNull();
    expect(Number(m[1])).toBe(HOME_REVALIDATE_SECONDS);
  });
});

describe('getAll de categorías sin API no inventa conteos', () => {
  test('el fallback local devuelve count 0', async () => {
    vi.resetModules();
    vi.doMock('@/services/api', () => ({ api: { get: vi.fn().mockRejectedValue(new Error('x')) } }));
    const { categoryService } = await import('@/services/categoryService');
    const all = await categoryService.getAll();
    expect(all.length).toBeGreaterThan(0);
    all.forEach((c) => expect(c.count).toBe(0));
    vi.doUnmock('@/services/api');
    vi.resetModules();
  });
});
