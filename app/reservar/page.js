'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { providerService } from '@/services/providerService';
import BookingWizard from '@/components/BookingWizard';
import EmptyState from '@/components/EmptyState';
import { Star, MapPin, PackageX } from 'lucide-react';

export default function ReservarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>}>
      <ReservarContent />
    </Suspense>
  );
}

function ReservarContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('providerId') || searchParams.get('serviceId');
  const initialPackageId = searchParams.get('packageId') || undefined;

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(!!serviceId);

  useEffect(() => {
    if (!serviceId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    providerService.getById(serviceId)
      .then((p) => { if (!cancelled) { setProvider(p); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [serviceId]);

  if (loading) {
    return (
      <div className="bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="skeleton h-24 w-full rounded-2xl" />
          <div className="skeleton h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <EmptyState
        icon={PackageX}
        title="Proveedor no encontrado"
        description="El proveedor seleccionado no existe."
        cta="Ver catálogo"
        ctaHref="/catalogo"
      />
    );
  }

  return (
    <div className="bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Provider mini card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4 mb-8">
          <img
            src={provider.images?.[0]}
            alt={provider.name}
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-primary mb-0.5">{provider.categoryLabel}</div>
            <div className="font-bold text-gray-900 truncate">{provider.name}</div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Star size={11} className="star-filled fill-current" /> {(provider.rating || 0).toFixed(1)}</span>
              {provider.zone && <span className="flex items-center gap-1"><MapPin size={11} /> {provider.zone}</span>}
            </div>
          </div>
          <a href={`/proveedor/${provider.id}`} className="text-xs text-primary hover:underline shrink-0">Ver perfil</a>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h1 className="text-xl font-extrabold text-gray-900 mb-1">Solicitar disponibilidad</h1>
          <p className="text-sm text-gray-500 mb-8">Completá los datos de tu evento y enviá la solicitud al proveedor.</p>
          <BookingWizard provider={provider} initialPackageId={initialPackageId} />
        </div>
      </div>
    </div>
  );
}
