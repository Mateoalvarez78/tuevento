'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LayoutGrid, List, SlidersHorizontal,
  ChevronDown, ChevronLeft, ChevronRight, Search, X,
  MapPin, Map, CalendarDays, PartyPopper, Star, CheckCircle2, DollarSign, SearchX,
} from 'lucide-react';
import FilterSidebar from '@/components/FilterSidebar';
import ServiceCard from '@/components/ServiceCard';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Chip from '@/components/Chip';
import { providerService } from '@/services/providerService';
import { categoryService } from '@/services/categoryService';
import { safeFormatDate } from '@/lib/date';

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
  const [pageItems, setPageItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  // "categories" (plural, multi, viene del buscador de la home) tiene prioridad
  // sobre "categoria" (singular, legacy — quick-pills del propio catálogo).
  const [filters, setFilters] = useState({
    category:  searchParams.get('categories') || searchParams.get('categoria') || '',
    zone:      searchParams.get('zona') || '',
    date:      searchParams.get('date') || searchParams.get('fecha') || '',
    location:  searchParams.get('location') || '',
    placeId:   searchParams.get('placeId') || '',
    lat:       searchParams.get('lat') || '',
    lng:       searchParams.get('lng') || '',
    minRating: 0,
    maxPrice:  200000,
    eventType: '',
    verified:  false,
    search:    searchParams.get('q') || '',
  });

  useEffect(() => { setPage(1); }, [filters, sort]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get('categories') || searchParams.get('categoria') || prev.category,
      search:   searchParams.get('q')          || prev.search,
      zone:     searchParams.get('zona')        || prev.zone,
      date:     searchParams.get('date') || searchParams.get('fecha') || prev.date,
      location: searchParams.get('location')    || prev.location,
      placeId:  searchParams.get('placeId')     || prev.placeId,
      lat:      searchParams.get('lat')         || prev.lat,
      lng:      searchParams.get('lng')         || prev.lng,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFilterChange = (f) => { setFilters(f); setPage(1); };

  const filtersKey = JSON.stringify({ ...filters, sort, page });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    providerService.getAll({ ...filters, sort, page, limit: PER_PAGE })
      .then((res) => {
        if (!cancelled) {
          setPageItems(res.data || []);
          const p = res.pagination || {};
          setTotalCount(p.total || 0);
          setTotalPages(Math.max(1, p.totalPages || 1));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  // filters.category puede traer varias, separadas por coma (ej. "catering,dj")
  const selectedCategoryIds = filters.category ? filters.category.split(',').filter(Boolean) : [];
  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id));
  const activeCategory = selectedCategories[0]; // usado solo para el ícono del título cuando hay una sola
  const pageTitle = selectedCategories.length === 1
    ? `Proveedores de ${selectedCategories[0].label}`
    : selectedCategories.length > 1
    ? `Proveedores de ${selectedCategories.length} categorías`
    : 'Todos los proveedores';

  const toggleCategory = (id) => {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((c) => c !== id)
      : [...selectedCategoryIds, id];
    handleFilterChange({ ...filters, category: next.join(',') });
  };

  const activeFilterCount = [
    filters.category, filters.zone, filters.date, filters.location, filters.eventType, filters.verified,
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
            <div className="relative flex-1">
              <Input
                icon={Search}
                className="bg-gray-50 focus:bg-white pr-9"
                placeholder="Buscar proveedores, servicios..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
              />
              {filters.search && (
                <Button
                  iconOnly icon={X} variant="ghost" size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 !text-gray-400 hover:!text-gray-600"
                  aria-label="Limpiar búsqueda"
                  onClick={() => handleFilterChange({ ...filters, search: '' })}
                />
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
                    <AppIcon icon={activeCategory.icon} size={24} className="text-gray-500" aria-hidden="true" />
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
                      <span className="font-semibold text-gray-800">{totalCount}</span>
                      {' '}resultado{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
                    </>
                  )}
                </p>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile filter button */}
                <Button
                  variant="outline"
                  className="lg:hidden !bg-white shadow-sm"
                  icon={SlidersHorizontal}
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

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
                    <AppIcon icon={ChevronDown} size={13} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
                  </div>
                </div>

                {/* Layout toggle */}
                <div className="hidden sm:flex border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setLayout('grid')}
                    title="Cuadrícula"
                    aria-pressed={layout === 'grid'}
                    aria-label="Ver en cuadrícula"
                    className={`p-2 transition-colors ${layout === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  >
                    <AppIcon icon={LayoutGrid} size={15} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    title="Lista"
                    aria-pressed={layout === 'list'}
                    aria-label="Ver en lista"
                    className={`p-2 transition-colors ${layout === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  >
                    <AppIcon icon={List} size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                {selectedCategories.map((cat) => (
                  <Chip key={cat.id} icon={cat.icon} onRemove={() => toggleCategory(cat.id)}>{cat.label}</Chip>
                ))}
                {filters.zone && (
                  <Chip icon={MapPin} onRemove={() => handleFilterChange({ ...filters, zone: '' })}>{filters.zone}</Chip>
                )}
                {filters.location && (
                  <Chip icon={Map} onRemove={() => handleFilterChange({ ...filters, location: '', placeId: '', lat: '', lng: '' })}>{filters.location}</Chip>
                )}
                {filters.date && (
                  <Chip icon={CalendarDays} onRemove={() => handleFilterChange({ ...filters, date: '' })}>{safeFormatDate(filters.date)}</Chip>
                )}
                {filters.eventType && (
                  <Chip icon={PartyPopper} onRemove={() => handleFilterChange({ ...filters, eventType: '' })}>{filters.eventType}</Chip>
                )}
                {filters.minRating > 0 && (
                  <Chip icon={Star} onRemove={() => handleFilterChange({ ...filters, minRating: 0 })}>{`${filters.minRating}.0+`}</Chip>
                )}
                {filters.verified && (
                  <Chip icon={CheckCircle2} onRemove={() => handleFilterChange({ ...filters, verified: false })}>Verificados</Chip>
                )}
                {filters.maxPrice < 200000 && (
                  <Chip icon={DollarSign} onRemove={() => handleFilterChange({ ...filters, maxPrice: 200000 })}>
                    {`hasta $${(filters.maxPrice / 1000).toFixed(0)}k`}
                  </Chip>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="!text-gray-400 hover:!text-red-500"
                  onClick={() => handleFilterChange({ category: '', zone: '', date: '', location: '', placeId: '', lat: '', lng: '', minRating: 0, maxPrice: 200000, eventType: '', verified: false, search: filters.search })}
                >
                  Limpiar todos
                </Button>
              </div>
            )}

            {/* Nota informativa: la fecha no filtra resultados todavía, solo se usa para pre-completar la reserva */}
            {filters.date && (
              <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4">
                Buscando proveedores disponibles para consultar el <strong>{safeFormatDate(filters.date)}</strong>. Vas a confirmar la fecha exacta al reservar.
              </div>
            )}

            {/* Category quick-pills (only when no category selected) */}
            {selectedCategories.length === 0 && !loading && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-5">
                {categories.slice(0, 10).map((cat) => (
                  <Chip key={cat.id} icon={cat.icon} onClick={() => toggleCategory(cat.id)} className="shadow-sm shrink-0">
                    {cat.label}
                  </Chip>
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
            ) : pageItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <EmptyState
                  icon={SearchX}
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
                    <Button
                      iconOnly icon={ChevronLeft} variant="outline" size="sm"
                      aria-label="Página anterior"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    />

                    {pageRange(page, totalPages).map((p, i) =>
                      p === '…' ? (
                        <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          aria-current={page === p ? 'page' : undefined}
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

                    <Button
                      iconOnly icon={ChevronRight} variant="outline" size="sm"
                      aria-label="Página siguiente"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    />
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

function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '…', total];
  if (current >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}
