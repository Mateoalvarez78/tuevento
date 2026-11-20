import { notFound } from 'next/navigation';
import { legalMetadata } from '@/components/legal/LegalDocument';
import LegalHub from '@/components/legal/LegalHub';
import { BRAND, LEGAL_PAGES_REACHABLE } from '@/lib/site';

export const metadata = legalMetadata({
  title: 'Centro legal',
  description: `Términos, cancelaciones y privacidad para clientes de ${BRAND}, en un solo lugar.`,
  path: '/legal',
});

// Centro legal de CLIENTES. Los documentos de proveedores viven en
// /provider/legal (portal de proveedores) y no se enlazan desde acá.
export default function LegalHubPage() {
  if (!LEGAL_PAGES_REACHABLE) notFound();
  return <LegalHub space="cliente" />;
}
