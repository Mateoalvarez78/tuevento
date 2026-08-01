'use client';

// Proveedor 360° (Fase A) — listado real, paginado y filtrado en backend
// (antes: traía todos los proveedores y filtraba en el navegador). Mismo
// patrón que app/admin/reservas/page.js: fetch debounced + filtersKey +
// sincronización de filtros con la URL.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus, AlertTriangle } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { categoryService } from '@/services/categoryService';
import ProviderKpis from '@/components/dashboard/admin/proveedores/ProviderKpis';
import ProviderFilters from '@/components/dashboard/admin/proveedores/ProviderFilters';
import ProvidersTable from '@/components/dashboard/admin/proveedores/ProvidersTable';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import PageHeader from '@/components/PageHeader';

const DEFAULT_FILTERS = {
  search: '', status: '', verified: '', city: '', category: '',
  hasPublishedServices: '', dateFrom: '', dateTo: '', hasBookings: '', minRating: '',
  sort: 'recent', page: 1, limit: 20,
};

// Solo estas claves viven en la URL (page/limit no ensucian el link para compartir).
const URL_FILTER_KEYS = ['search', 'status', 'verified', 'city', 'category', 'hasPublishedServices', 'dateFrom', 'dateTo', 'hasBookings', 'minRating', 'sort'];

export default function AdminProveedoresPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() => {
    const initial = { ...DEFAULT_FILTERS };
    URL_FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) initial[key] = value;
    });
    return initial;
  });
  const [result, setResult] = useState({ data: [], pagination: null });
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => { categoryService.getAll().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => {
    adminService.providers.getSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, []);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  // Sincroniza los filtros activos con la URL (deep-linkeable, sin ensuciar
  // con page/limit) — misma idea que el `?status=` que ya lee `reservas`, acá
  // extendida a ida y vuelta para todos los filtros.
  useEffect(() => {
    const qs = new URLSearchParams();
    URL_FILTER_KEYS.forEach((key) => {
      const value = filters[key];
      if (value && value !== DEFAULT_FILTERS[key]) qs.set(key, value);
    });
    const next = qs.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      adminService.providers.getAll(filters)
        .then((res) => { if (!cancelled) { setResult(res); setLoading(false); } })
        .catch((err) => { if (!cancelled) { setError(err?.message || 'No se pudieron cargar los proveedores'); setLoading(false); } });
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const handlePage = useCallback((p) => setFilters((f) => ({ ...f, page: p })), []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <PageHeader
        theme="dark"
        title="Proveedores"
        subtitle={result.pagination ? `${result.pagination.total} en total` : undefined}
        action={<Button icon={Plus} href="/admin/proveedores/nuevo">Nuevo proveedor</Button>}
      />

      <ProviderKpis summary={summary} loading={summaryLoading} />

      <ProviderFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {error ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
          <AppIcon icon={AlertTriangle} size={28} className="mx-auto text-amber-400 mb-3" aria-hidden="true" />
          <p className="text-gray-200 font-medium mb-1">No pudimos cargar los proveedores</p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <Button onClick={() => setFilters({ ...filters })}>Reintentar</Button>
        </div>
      ) : (
        <ProvidersTable
          providers={result.data}
          loading={loading}
          pagination={result.pagination}
          onPage={handlePage}
        />
      )}
    </div>
  );
}
