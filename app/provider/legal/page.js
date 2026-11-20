import { notFound } from 'next/navigation';
import { legalMetadata } from '@/components/legal/LegalDocument';
import LegalHub from '@/components/legal/LegalHub';
import { BRAND, LEGAL_PAGES_REACHABLE } from '@/lib/site';

export const metadata = legalMetadata({
  title: 'Centro legal para proveedores',
  description: `Condiciones para proveedores y política de privacidad de ${BRAND}.`,
  path: '/provider/legal',
});

// Centro legal de PROVEEDORES (portal proveedores.eventonow.com). Los documentos
// de clientes viven en /legal y no se enlazan desde acá.
export default function ProviderLegalHubPage() {
  if (!LEGAL_PAGES_REACHABLE) notFound();
  return <LegalHub space="proveedor" />;
}
