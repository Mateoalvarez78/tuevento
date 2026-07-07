'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store } from 'lucide-react';
import ServiceCard from '@/components/ServiceCard';
import SkeletonCard from '@/components/SkeletonCard';
import { providerService } from '@/services/providerService';

// Sección "Proveedores top del mes" de la home pública. Datos reales.
export default function FeaturedProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    providerService.getFeaturedProviders(8)
      .then((data) => { if (!cancelled) { setProviders(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  // Error discreto: no romper la home, solo un aviso suave.
  if (error) {
    return (
      <div className="text-center py-10 text-sm text-gray-400">
        No pudimos cargar los proveedores destacados en este momento.
      </div>
    );
  }

  if (!providers.length) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-3">
          <Store size={22} className="text-primary" />
        </div>
        <h3 className="font-bold text-gray-800">Muy pronto, proveedores destacados</h3>
        <p className="text-sm text-gray-500 mt-1 mb-5 max-w-sm mx-auto">
          Estamos sumando proveedores verificados en Uruguay. Mientras tanto, explorá el catálogo.
        </p>
        <Link href="/catalogo" className="inline-block bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm">
          Explorar servicios
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {providers.map((p) => <ServiceCard key={p.providerId} provider={p} />)}
    </div>
  );
}
