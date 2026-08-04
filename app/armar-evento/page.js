'use client';

import { Suspense } from 'react';
import { Bot, ArrowLeft, Search } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import PageHeader from '@/components/PageHeader';
import SmartPackagesGenerator from '@/components/smart-packages/SmartPackagesGenerator';
import { isSmartPackagesEnabled } from '@/lib/smartPackages';

// Feature flag: se mantiene como palanca de rollback (apagarla en Vercel/
// Render sin deploy si algo falla en producción) — ya NO es un gate de
// "función todavía no lista": el generador usa proveedores/cotizaciones/
// disponibilidad reales desde esta etapa (ver informe de cierre). Mientras
// esté apagada, se muestra un estado neutro de "no disponible", nunca la
// copia anterior de "Próximamente" (dejó de ser cierta).
const SMART_PACKAGES_ENABLED = isSmartPackagesEnabled(process.env.NEXT_PUBLIC_SMART_PACKAGES_ENABLED);

function TemporarilyUnavailable() {
  return (
    <div className="bg-surface min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <AppIcon icon={Bot} size={30} className="text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">El armador de eventos no está disponible en este momento</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-8">
          Podés seguir explorando servicios y armando tu evento manualmente desde el catálogo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button icon={Search} href="/catalogo">Explorar servicios</Button>
          <Button icon={ArrowLeft} variant="outline" href="/dashboard/cliente">Volver a mi panel</Button>
        </div>
      </div>
    </div>
  );
}

export default function ArmarEventoPage() {
  if (!SMART_PACKAGES_ENABLED) return <TemporarilyUnavailable />;

  return (
    <div className="bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto mb-6">
        <PageHeader
          title="Armá tu evento"
          subtitle="Contanos los datos de tu evento y te armamos hasta 3 combinaciones de proveedores compatibles."
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <Suspense fallback={<div className="h-64 skeleton rounded-2xl" aria-hidden="true" />}>
          <SmartPackagesGenerator />
        </Suspense>
      </div>
    </div>
  );
}
