'use client';

import { paymentTermsLines } from '@/lib/payments';

// Condiciones de cobro que el cliente ve ANTES de reservar: pago único por el
// total, plazo para pagar y si se puede en cuotas (payment_terms del backend).
// Si el backend no las manda, no se muestra nada: nunca se inventan plazos ni
// cantidades de cuotas en el frontend.
export default function PaymentTermsNotice({ terms, title = 'Cómo se paga', className = '' }) {
  const lines = paymentTermsLines(terms);
  if (!lines) return null;
  return (
    <div className={`p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-900 ${className}`}>
      <h3 className="font-bold mb-1">{title}</h3>
      <ul className="list-disc pl-5 space-y-0.5">
        {lines.map((l) => <li key={l}>{l}</li>)}
      </ul>
    </div>
  );
}
