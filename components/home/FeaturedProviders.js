'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import ServiceCard from '@/components/ServiceCard';
import SkeletonCard from '@/components/SkeletonCard';
import { providerService } from '@/services/providerService';

// Si la carga en el navegador tarda más que esto, se avisa que puede demorar
// (el backend puede estar arrancando) en lugar de dejar esqueletos mudos.
const SLOW_MS = 6000;

/**
 * Sección "Proveedores destacados" de la home pública. Datos reales.
 *
 * `initialProviders` viene del servidor (app/page.js → lib/homeData.js):
 *   · array con proveedores → se renderizan directo, sin pedir nada.
 *   · array vacío           → NO se renderiza la sección (nada de "muy pronto").
 *   · null                  → el servidor no pudo obtenerlos: se piden desde el
 *                             navegador, con carga, aviso de demora y reintento.
 *
 * La sección completa (título incluido) vive acá para poder ocultarla entera.
 */
export default function FeaturedProviders({ initialProviders = null, limit = 8 }) {
  const [providers, setProviders] = useState(initialProviders);
  const [status, setStatus] = useState(initialProviders ? 'ready' : 'loading');
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (initialProviders) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => { if (!cancelled) setSlow(true); }, SLOW_MS);
    providerService.getFeaturedProviders(limit)
      .then((data) => { if (!cancelled) { setProviders(data || []); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); })
      .finally(() => clearTimeout(timer));
    return () => { cancelled = true; clearTimeout(timer); };
  }, [initialProviders, limit, attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setSlow(false);
    setAttempt((n) => n + 1);
  }, []);

  if (status === 'ready' && (!providers || providers.length === 0)) return null;

  return (
    <section className="py-14 sm:py-16 bg-surface" aria-labelledby="destacados-titulo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">Destacados</p>
            <h2 id="destacados-titulo" className="text-2xl sm:text-3xl font-bold text-gray-900">Proveedores destacados</h2>
            <p className="text-gray-500 mt-1.5 text-sm">Algunos de los proveedores publicados en Eventonow</p>
          </div>
        </div>

        {status === 'loading' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-busy="true">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            {slow && (
              <p className="text-center text-sm text-gray-500 mt-6" role="status">
                Está tardando más de lo normal. Seguimos cargando los proveedores…
              </p>
            )}
          </>
        )}

        {status === 'error' && (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100" role="status">
            <p className="text-sm text-gray-600 mb-4">No pudimos cargar los proveedores destacados en este momento.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={retry}>
                <AppIcon icon={RefreshCw} size="button" aria-hidden="true" /> Reintentar
              </Button>
              <Button href="/catalogo">Ver el catálogo</Button>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {providers.map((p) => <ServiceCard key={p.providerId} provider={p} />)}
            </div>
            <div className="flex justify-center mt-10">
              <Button variant="outline" href="/catalogo">
                Ver todos los proveedores <AppIcon icon={ArrowRight} size="button" aria-hidden="true" />
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
