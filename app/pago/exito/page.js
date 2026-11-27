import { Suspense } from 'react';
import PaymentReturn from '@/components/payments/PaymentReturn';

// `success_url` del checkout de dLocal Go (DLOCAL_SUCCESS_URL en el backend).
export const metadata = {
  title: 'Confirmando tu pago',
  robots: { index: false, follow: false },
};

export default function PagoExitoPage() {
  return (
    <Suspense fallback={null}>
      <PaymentReturn />
    </Suspense>
  );
}
