import { Suspense } from 'react';
import PaymentReturn from '@/components/payments/PaymentReturn';

// `back_url` del checkout de dLocal Go (DLOCAL_BACK_URL en el backend).
// Igual consulta al backend: si el pago se aprobó, gana el estado real.
export const metadata = {
  title: 'Pago no completado',
  robots: { index: false, follow: false },
};

export default function PagoCanceladoPage() {
  return (
    <Suspense fallback={null}>
      <PaymentReturn cancelled />
    </Suspense>
  );
}
