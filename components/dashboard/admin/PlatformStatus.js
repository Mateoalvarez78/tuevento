'use client';

// Indicadores de estado. Verde = OK, ámbar = requiere atención.
// Como el dashboard cargó datos, DB y API se consideran operativas.
export default function PlatformStatus({ stats }) {
  const items = [
    { ok: true, label: 'Plataforma operativa' },
    { ok: true, label: 'Base de datos conectada' },
    { ok: true, label: 'API disponible' },
    { ok: stats.providers.pending === 0, label: stats.providers.pending > 0 ? `${stats.providers.pending} proveedores pendientes` : 'Proveedores al día' },
    { ok: true, label: `${stats.bookings.total} reservas registradas` },
    { ok: stats.services.active > 0, label: `${stats.services.active} servicios publicados` },
  ];
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Estado de la plataforma</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${it.ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-sm text-gray-300">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
