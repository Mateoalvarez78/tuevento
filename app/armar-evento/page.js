'use client';

import { Bot, Sparkles, ArrowLeft, Search } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import PageHeader from '@/components/PageHeader';
import SmartPackagesGenerator from '@/components/smart-packages/SmartPackagesGenerator';
import { isSmartPackagesEnabled } from '@/lib/smartPackages';

// Feature flag: mientras esté apagada (o ausente), esta página sigue
// mostrando el placeholder "Próximamente" de siempre — ver docs/DECISIONS.md
// y docs/DEPLOYMENT.md (cómo habilitarla en local/Vercel).
const SMART_PACKAGES_ENABLED = isSmartPackagesEnabled(process.env.NEXT_PUBLIC_SMART_PACKAGES_ENABLED);

function ComingSoon() {
  return (
    <div className="bg-surface min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <AppIcon icon={Bot} size={30} className="text-primary" aria-hidden="true" />
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary-light px-2.5 py-1 rounded-full mb-3">
          <AppIcon icon={Sparkles} size={12} aria-hidden="true" /> Próximamente
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">Armá tu evento con ayuda inteligente</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-8">
          Muy pronto vas a poder contarnos qué evento querés organizar —por ejemplo, <span className="font-medium text-gray-700">“un cumpleaños para 50 personas”</span>— y Eventonow te va a armar la mejor combinación de proveedores, con presupuesto estimado incluido.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button icon={Search} href="/catalogo">Mientras tanto, explorá servicios</Button>
          <Button icon={ArrowLeft} variant="outline" href="/dashboard/cliente">Volver a mi panel</Button>
        </div>
      </div>
    </div>
  );
}

export default function ArmarEventoPage() {
  if (!SMART_PACKAGES_ENABLED) return <ComingSoon />;

  return (
    <div className="bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto mb-6">
        <PageHeader
          title="Armá tu evento"
          subtitle="Contanos los datos de tu evento y te armamos hasta 3 combinaciones de proveedores compatibles."
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SmartPackagesGenerator />
      </div>
    </div>
  );
}
