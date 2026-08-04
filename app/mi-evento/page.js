'use client';

// ─── /mi-evento ─────────────────────────────────────────────────────────
// Pantalla canónica de administración del borrador (client_events). Fuente
// única de verdad: useMyEvent() (hooks/useMyEventState.js, Fase A) — esta
// página nunca guarda su propia copia del evento, nunca recalcula precios,
// nunca crea un borrador solo por visitarse (ver useMyEventState: el
// auto-load es siempre GET /me/events/active, jamás un POST).

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin, Users, Wallet, RefreshCw, Plus, Lock, PartyPopper, Pencil, TriangleAlert } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useMyEvent } from '@/lib/MyEventContext';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import AppIcon from '@/components/AppIcon';
import EmptyState from '@/components/EmptyState';
import MyEventItemCard from '@/components/my-event/MyEventItemCard';
import EditGeneralDataModal from '@/components/my-event/EditGeneralDataModal';
import ChangeServiceModal from '@/components/my-event/ChangeServiceModal';
import { formatCurrency } from '@/utils/formatters';
import { safeFormatDate } from '@/lib/date';
import { classifyMyEventError } from '@/services/myEventService';

function computeTotal(items) {
  return (items || [])
    .filter((i) => i.validity_status === 'valid')
    .reduce((sum, i) => sum + (i.quote_snapshot?.amounts?.estimated_total || 0), 0);
}

export default function MiEventoPage() {
  const access = useRequireRole(['client']);
  const {
    event, status, loadError, conflict, dismissConflict, lastOperation,
    createEvent, updateEvent, removeItem, replaceItem, revalidateEvent,
    mutatingKeys,
  } = useMyEvent();

  const [editOpen, setEditOpen] = useState(false);
  const [changeItem, setChangeItem] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    setCreateError('');
    try {
      await createEvent({});
    } catch (err) {
      setCreateError(classifyMyEventError(err).message || 'No pudimos crear tu evento. Intentá de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevalidate = async () => {
    if (!event || mutatingKeys.includes('revalidateEvent')) return;
    try {
      await revalidateEvent(event.version);
    } catch {
      // el resultado (éxito/error) ya queda reflejado en lastOperation/conflict
    }
  };

  // ── Carga inicial (auth restaurándose o GET /me/events/active en vuelo) ──
  if (access === 'loading' || status === 'idle' || status === 'loading') {
    return (
      <div className="bg-surface min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="skeleton h-24 w-full rounded-2xl" aria-hidden="true" />
          <div className="skeleton h-28 w-full rounded-2xl" aria-hidden="true" />
          <div className="skeleton h-28 w-full rounded-2xl" aria-hidden="true" />
        </div>
      </div>
    );
  }

  // ── Sin sesión ──────────────────────────────────────────────────────────
  if (access === 'unauth') {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
            <AppIcon icon={Lock} size={26} className="text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Necesitás iniciar sesión</h1>
          <p className="text-sm text-gray-500 mb-6">Ingresá para ver y administrar tu evento.</p>
          <Button href="/login?next=%2Fmi-evento" className="w-full">Ingresar</Button>
        </div>
      </div>
    );
  }

  if (access === 'denied') return null; // useRequireRole ya redirige

  // ── Error de red/técnico cargando el borrador ───────────────────────────
  if (status === 'error') {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-sm w-full text-center">
          <AppIcon icon={TriangleAlert} size={32} className="text-amber-500 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">No pudimos cargar tu evento</h1>
          <p className="text-sm text-gray-500 mb-6">{classifyMyEventError(loadError).message}</p>
          <Button variant="outline" href="/mi-evento">Reintentar</Button>
        </div>
      </div>
    );
  }

  // ── Sin borrador activo ──────────────────────────────────────────────────
  if (!event) {
    return (
      <div className="bg-surface min-h-screen">
        <EmptyState
          icon={PartyPopper}
          title="Todavía no armaste tu evento"
          description="Contanos qué necesitás y te ayudamos a organizarlo — o empezá agregando servicios uno por uno desde el catálogo."
        />
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto px-4 pb-16">
          <Button icon={PartyPopper} href="/armar-evento">Armar mi evento</Button>
          <Button variant="outline" onClick={handleCreate} loading={creating}>Crear borrador vacío</Button>
        </div>
        {createError && <p className="text-center text-sm text-red-600 mt-3">{createError}</p>}
      </div>
    );
  }

  // ── Evento activo ────────────────────────────────────────────────────────
  const total = computeTotal(event.items);
  const invalidCount = (event.items || []).filter((i) => i.validity_status !== 'valid').length;
  const revalidating = mutatingKeys.includes('revalidateEvent');

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Mi evento" subtitle="Administrá los servicios de tu evento y confirmá que todo siga disponible." />

        {conflict && (
          <div className="mb-5 flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AppIcon icon={TriangleAlert} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p>{conflict.message}</p>
              {!conflict.refreshed && (
                <p className="mt-1 text-amber-700">Además, no pudimos actualizar la información automáticamente — recargá la página.</p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={dismissConflict}>Entendido</Button>
          </div>
        )}

        {/* Resumen del evento */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{event.event_type || 'Tu evento'}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                <span className="flex items-center gap-1"><AppIcon icon={CalendarDays} size={14} aria-hidden="true" />{event.event_date ? safeFormatDate(event.event_date) : 'Sin fecha'}</span>
                <span className="flex items-center gap-1"><AppIcon icon={Users} size={14} aria-hidden="true" />{event.adults_count + event.children_count} invitados</span>
                {event.budget_approx != null && (
                  <span className="flex items-center gap-1"><AppIcon icon={Wallet} size={14} aria-hidden="true" />{formatCurrency(event.budget_approx)}</span>
                )}
                {event.location_formatted_address || event.location_zone ? (
                  <span className="flex items-center gap-1"><AppIcon icon={MapPin} size={14} aria-hidden="true" />{event.location_formatted_address || event.location_zone}</span>
                ) : null}
              </div>
            </div>
            <Button size="sm" variant="outline" icon={Pencil} onClick={() => setEditOpen(true)}>Editar</Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(total)}</p>
              <p className="text-xs text-gray-500">
                Total estimado ({event.items.length} componente{event.items.length === 1 ? '' : 's'}
                {invalidCount > 0 ? `, ${invalidCount} sin disponibilidad` : ''})
              </p>
              {event.last_revalidated_at && (
                <p className="text-xs text-gray-400 mt-0.5">Última revalidación: {safeFormatDate(event.last_revalidated_at)}</p>
              )}
            </div>
            <Button size="sm" icon={RefreshCw} loading={revalidating} onClick={handleRevalidate}>
              Revalidar
            </Button>
          </div>
          {lastOperation?.type === 'revalidateEvent' && lastOperation.status === 'success' && lastOperation.summary && (
            <p className="mt-2 text-xs text-gray-500">
              Revalidado: {lastOperation.summary.changed_count} cambio{lastOperation.summary.changed_count === 1 ? '' : 's'} detectado{lastOperation.summary.changed_count === 1 ? '' : 's'}.
            </p>
          )}
          {mutatingKeys.includes('revalidateEvent') === false && lastOperation?.type === 'revalidateEvent' && lastOperation.status === 'error' && (
            <p className="mt-2 text-xs text-red-600">{classifyMyEventError(lastOperation.error).message}</p>
          )}
        </div>

        {/* Componentes */}
        {event.items.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Todavía no agregaste servicios"
            description="Explorá el catálogo y agregá servicios a tu evento."
            cta="Explorar catálogo"
            ctaHref="/catalogo"
          />
        ) : (
          <div className="space-y-3">
            {event.items.map((item) => (
              <MyEventItemCard
                key={item.id}
                event={event}
                item={item}
                onRemove={removeItem}
                onOpenChange={setChangeItem}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <Link href="/catalogo" className="text-sm font-semibold text-primary hover:underline">
            Seguir explorando servicios
          </Link>
        </div>
      </div>

      <EditGeneralDataModal open={editOpen} onClose={() => setEditOpen(false)} event={event} onSave={updateEvent} />
      <ChangeServiceModal open={!!changeItem} onClose={() => setChangeItem(null)} event={event} item={changeItem} onReplace={replaceItem} />
    </div>
  );
}
