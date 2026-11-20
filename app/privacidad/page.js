import { notFound } from 'next/navigation';
import { legalMetadata } from '@/components/legal/LegalDocument';
import PrivacyPolicy from '@/components/legal/PrivacyPolicy';
import { BRAND, LEGAL_PAGES_REACHABLE } from '@/lib/site';

export const metadata = legalMetadata({
  title: 'Política de privacidad',
  description: `Cómo ${BRAND} trata los datos personales de clientes y proveedores: qué se recoge, para qué, con quién se comparte y cómo ejercer tus derechos.`,
  path: '/privacidad',
});

// Política de privacidad — área CLIENTES. El contenido vive en
// components/legal/PrivacyPolicy.js y es el mismo que ven los proveedores en
// /provider/legal/privacidad.
export default function PrivacidadPage() {
  if (!LEGAL_PAGES_REACHABLE) notFound();
  return <PrivacyPolicy space="cliente" />;
}
