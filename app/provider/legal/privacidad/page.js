import { notFound } from 'next/navigation';
import { legalMetadata } from '@/components/legal/LegalDocument';
import PrivacyPolicy from '@/components/legal/PrivacyPolicy';
import { BRAND, LEGAL_PAGES_REACHABLE } from '@/lib/site';

export const metadata = legalMetadata({
  title: 'Política de privacidad',
  description: `Cómo ${BRAND} trata los datos personales de clientes y proveedores: qué se recoge, para qué, con quién se comparte y cómo ejercer tus derechos.`,
  path: '/provider/legal/privacidad',
});

// Política de privacidad — área PROVEEDORES. Mismo contenido que /privacidad
// (components/legal/PrivacyPolicy.js); se publica también acá porque el proxy
// solo sirve /provider/* en el host de proveedores.
export default function ProviderPrivacidadPage() {
  if (!LEGAL_PAGES_REACHABLE) notFound();
  return <PrivacyPolicy space="proveedor" />;
}
