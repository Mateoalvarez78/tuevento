'use client';

// Check "pagar el total de una vez" (DEC-7). Lo usan el carrito (último paso
// de la reserva) y Mis reservas antes del primer pago. Solo expresa la
// preferencia del cliente: el backend decide qué se cobra y cuánto.
const fmt = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

export default function PayInFullCheckbox({
  checked, onChange, total, deposit, disabled = false, className = '', id = 'pay-in-full', beforeAcceptance = false,
}) {
  const hasAmounts = Number(total) > 0 && Number(deposit) > 0;
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 rounded-xl border p-3 text-sm cursor-pointer transition-colors ${
        checked ? 'border-primary bg-primary-light/50' : 'border-gray-200 bg-white hover:border-primary/40'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span>
        <span className="font-semibold text-gray-900">Quiero pagar el total de una vez</span>
        <span className="block text-gray-500 mt-0.5">
          {hasAmounts
            ? `Pagás ${fmt(total)} en un solo pago en vez de la seña de ${fmt(deposit)} ahora y el saldo después.`
            : 'Pagás todo en un solo pago en vez de seña y saldo.'}
          {beforeAcceptance ? ' Se paga recién cuando el proveedor confirma la reserva.' : ''}
        </span>
      </span>
    </label>
  );
}
