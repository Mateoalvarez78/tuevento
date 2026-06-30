'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LayoutGrid, List, SlidersHorizontal,
  ChevronDown, ChevronLeft, ChevronRight, Search, X,
} from 'lucide-react';
import FilterSidebar from '@/components/FilterSidebar';
import ServiceCard from '@/components/ServiceCard';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import { providerService } from '@/services/providerService';
import { CATEGORIES } from '@/lib/mockData';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Más populares' },
  { value: 'rating',      label: 'Mejor puntuados' },
  { value: 'price_asc',   label: 'Menor precio' },
  { value: 'most_booked', label: 'Más reservados' },
];

const PER_PAGE = 9;

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>}>
      <CatalogoContent />
    </Suspense>
  );
}

function CatalogoContent() {
  const searchParams = useSearchParams();
  const [layout, setLayout] = useState('grid');
  const [sort, setSort] = useState('recommended');
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    category:  searchParams.get('categoria') || '',
    zone:      searchParams.get('zona') || '',
    minRating: 0,
    maxPrice:  200000,
    eventType: '',
    verified:  false,
    search:    searchParams.get('q') || '',
  });

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => { setPage(1); }, [filters, sort]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get('categoria') || prev.category,
      search:   searchParams.get('q')          || prev.search,
      zone:     searchParams.get('zona')        || prev.zone,
    }));
  }, [searchParams]);

  const handleFilterChange = (f) => { setFilters(f); setPage(1); };

  const allResults = useMemo(() => {
    let r = providerService.getAll(filters);
    if (sort === 'rating')      r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === 'price_asc')   r = [...r].sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === 'most_booked') r = [...r].sort((a, b) => b.totalBookings - a.totalBookings);
    return r;
  }, [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(allResults.length / PER_PAGE));
  const pageItems  = allResults.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const activeCategory = CATEGORIES.find((c) => c.id === filters.category);
  const pageTitle = activeCategory
    ? `Proveedores de ${activeCategory.label}`
    : 'Todos los proveedores';

  const activeFilterCount = [
    filters.category, filters.zone, filters.eventType, filters.verified,
    filters.minRating > 0, filters.maxPrice < 200000,
  ].filter(Boolean).length;

  return (
    <div className="bg-surface min-h-screen">

      {/* ── TOP SEARCH STRIP ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            {/* Breadcrumb */}
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
              <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
              <span className="text-gray-300">›</span>
              <Link href="/catalogo" className="hover:text-primary transition-colors">Catálogo</Link>
              {activeCategory && (
                <>
                  <span className="text-gray-300">›</span>
                  <span className="text-gray-700 font-medium">{activeCategory.label}</span>
                </>
              )}
            </nav>
            <div className="hidden sm:block w-px h-4 bg-gray-200 shrink-0" />
            {/* Search input */}
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all"
                placeholder="Buscar proveedores, servicios..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
              />
              {filters.search && (
                <button
                  onClick={() => handleFilterChange({ ...filters, search: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">

          {/* ── DESKTOP SIDEBAR ── */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <div className="sticky top-32">
              <FilterSidebar filters={filters} onChange={handleFilterChange} />
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 min-w-0">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 leading-tight">
                  {activeCategory && (
                    <span className="text-2xl leading-none">{activeCategory.icon}</span>
                  )}
                  {pageTitle}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {loading ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-gray-200 skeleton" />
                      Buscando...
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-800">{allResults.length}</span>
                      {' '}resultado{allResults.length !== 1 ? 's' : ''} encontrado{allResults.length !== 1 ? 's' : ''}
                    </>
                  )}
                </p>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary/40 hover:bg-white bg-white transition-colors shadow-sm"
                >
                  <SlidersHorizontal size={15} />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                  <span className="text-xs text-gray-400 hidden sm:block whitespace-nowrap">Ordenar por:</span>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="appearance-none bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer pr-5"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Layout toggle */}
                <div className="hidden sm:flex border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setLayout('grid')}
                    title="Cuadrícula"
                    className={`p-2 transition-colors ${layout === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    title="Lista"
                    className={`p-2 transition-colors ${layout === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.category && (
                  <Chip
                    label={`${activeCategory?.icon || ''} ${activeCategory?.label || filters.category}`}
                    onRemove={() => handleFilterChange({ ...filters, category: '' })}
                  />
                )}
                {filters.zone && (
                  <Chip label={`📍 ${filters.zone}`} onRemove={() => handleFilterChange({ ...filters, zone: '' })} />
                )}
                {filters.eventType && (
                  <Chip label={`🎉 ${filters.eventType}`} onRemove={() => handleFilterChange({ ...filters, eventType: '' })} />
                )}
                {filters.minRating > 0 && (
                  <Chip label={`⭐ ${filters.minRating}.0+`} onRemove={() => handleFilterChange({ ...filters, minRating: 0 })} />
                )}
                {filters.verified && (
                  <Chip label="✓ Verificados" onRemove={() => handleFilterChange({ ...filters, verified: false })} />
                )}
                {filters.maxPrice < 200000 && (
                  <Chip
                    label={`💰 hasta $${(filters.maxPrice / 1000).toFixed(0)}k`}
                    onRemove={() => handleFilterChange({ ...filters, maxPrice: 200000 })}
                  />
                )}
                <button
                  onClick={() => handleFilterChange({ category: '', zone: '', minRating: 0, maxPrice: 200000, eventType: '', verified: false, search: filters.search })}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 font-medium"
                >
                  Limpiar todos
                </button>
              </div>
            )}

            {/* Category quick-pills (only when no category selected) */}
            {!filters.category && !loading && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-5">
                {CATEGORIES.slice(0, 10).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleFilterChange({ ...filters, category: cat.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-primary/40 hover:text-primary hover:bg-primary-light transition-all whitespace-nowrap shrink-0 shadow-sm"
                  >
                    <span className="text-sm leading-none">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── RESULTS ── */}
            {loading ? (
              <div className={layout === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'space-y-4'}
              >
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : allResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <EmptyState
                  icon="🔍"
                  title="Sin resultados"
                  description="No encontramos proveedores con esos filtros. Probá ajustarlos o explorar sin filtros."
                  cta="Ver todos los proveedores"
                  ctaHref="/catalogo"
                />
              </div>
            ) : (
              <>
                <div className={layout === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                  : 'space-y-4'}
                >
                  {pageItems.map((p) => (
                    <ServiceCard key={p.id} provider={p} layout={layout} />
                  ))}
                </div>

                {/* ── PAGINATION ── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-10 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-primary/40 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {pageRange(page, totalPages).map((p, i) =>
                      p === '…' ? (
                        <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                            page === p
                              ? 'bg-primary text-white shadow-sm shadow-primary/30'
                              : 'border border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-primary/40 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filters drawer */}
      <FilterSidebar
        filters={filters}
        onChange={handleFilterChange}
        mobileOpen={mobileFiltersOpen}
        onMobileClose={() => setMobileFiltersOpen(false)}
      />
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-primary-light text-primary text-xs font-medium rounded-full border border-primary/20">
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors"
      >
        <X size={9} strokeWidth={2.5} />
      </button>
    </span>
  );
}

function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '…', total];
  if (current >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}
