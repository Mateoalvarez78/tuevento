'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, List, SlidersHorizontal, ChevronDown } from 'lucide-react';
import FilterSidebar from '@/components/FilterSidebar';
import ServiceCard from '@/components/ServiceCard';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import SearchBar from '@/components/SearchBar';
import { PROVIDERS, filterProviders } from '@/lib/mockData';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recomendados' },
  { value: 'rating', label: 'Mejor puntuados' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'most_booked', label: 'Más reservados' },
];

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: searchParams.get('categoria') || '',
    zone: searchParams.get('zona') || '',
    minRating: 0,
    maxPrice: 200000,
    eventType: '',
    verified: false,
    search: searchParams.get('q') || '',
  });

  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, [filters]);

  // Update filters when URL changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get('categoria') || prev.category,
      search: searchParams.get('q') || prev.search,
      zone: searchParams.get('zona') || prev.zone,
    }));
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = filterProviders(filters);
    if (sort === 'rating') result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sort === 'price_asc') result = [...result].sort((a, b) => a.priceFrom - b.priceFrom);
    else if (sort === 'most_booked') result = [...result].sort((a, b) => b.totalBookings - a.totalBookings);
    return result;
  }, [filters, sort]);

  const activeFilterCount = [
    filters.category, filters.zone, filters.eventType, filters.verified,
    filters.minRating > 0, filters.maxPrice < 200000,
  ].filter(Boolean).length;

  return (
    <div className="bg-surface min-h-screen">
      {/* Search bar top */}
      <div className="bg-white border-b border-gray-100 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SearchBar variant="inline" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <FilterSidebar filters={filters} onChange={setFilters} />
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <div className="flex items-center gap-3">
                {/* Mobile filter btn */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary/40 transition-colors bg-white"
                >
                  <SlidersHorizontal size={16} />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <p className="text-sm text-gray-500">
                  {loading ? 'Buscando...' : (
                    <><span className="font-semibold text-gray-800">{filtered.length}</span> resultado{filtered.length !== 1 ? 's' : ''}</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Layout toggle */}
                <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setLayout('grid')}
                    className={`p-2 transition-colors ${layout === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    className={`p-2 transition-colors ${layout === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.category && (
                  <FilterChip label={`Categoría: ${filters.category}`} onRemove={() => setFilters({ ...filters, category: '' })} />
                )}
                {filters.zone && (
                  <FilterChip label={`Zona: ${filters.zone}`} onRemove={() => setFilters({ ...filters, zone: '' })} />
                )}
                {filters.eventType && (
                  <FilterChip label={`Evento: ${filters.eventType}`} onRemove={() => setFilters({ ...filters, eventType: '' })} />
                )}
                {filters.minRating > 0 && (
                  <FilterChip label={`Rating: ${filters.minRating}+`} onRemove={() => setFilters({ ...filters, minRating: 0 })} />
                )}
                {filters.verified && (
                  <FilterChip label="Solo verificados" onRemove={() => setFilters({ ...filters, verified: false })} />
                )}
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4'}>
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="Sin resultados"
                description="No encontramos proveedores con esos filtros. Probá ajustarlos o explorar sin filtros."
                cta="Ver todos los proveedores"
                ctaHref="/catalogo"
              />
            ) : (
              <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4'}>
                {filtered.map((p) => (
                  <ServiceCard key={p.id} provider={p} layout={layout} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filters drawer */}
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        mobileOpen={mobileFiltersOpen}
        onMobileClose={() => setMobileFiltersOpen(false)}
      />
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 bg-primary-light text-primary text-xs font-medium rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-primary-dark ml-0.5">✕</button>
    </span>
  );
}
