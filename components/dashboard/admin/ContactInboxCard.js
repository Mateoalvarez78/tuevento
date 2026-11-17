'use client';

import Link from 'next/link';
import { Inbox, ArrowRight, CheckCircle2 } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { useAdminContactNewCount } from '@/hooks/useAdmin';

/**
 * Mensajes de contacto sin atender, en el overview del admin.
 *
 * Existe porque el contador sólo se veía DENTRO de /admin/contacto: había que
 * entrar a la bandeja para descubrir que había algo que leer. Acá y en el badge
 * del sidebar es donde un admin se entera sin buscarlo.
 *
 * Mismo lenguaje visual que AdminAlerts (tarjeta oscura, enlace «Revisar»).
 * Sin polling: se consulta al montar y se refresca con el evento
 * CONTACT_INBOX_CHANGED que dispara la página al cambiar un estado.
 */
export default function ContactInboxCard() {
  const { newCount, loading, error } = useAdminContactNewCount();

  // Cargando: espacio reservado del mismo alto, para que el overview no salte.
  if (loading) {
    return <div className="skeleton h-[72px] w-full rounded-2xl bg-gray-800" />;
  }

  // Un fallo del contador no puede romper el overview ni ocultar el acceso a la
  // bandeja: se degrada a un enlace simple, sin número inventado.
  if (error) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AppIcon icon={Inbox} size={18} className="text-gray-500 shrink-0" aria-hidden="true" />
          <span className="text-sm text-gray-400">
            No se pudo leer la bandeja de mensajes.
          </span>
        </div>
        <Link
          href="/admin/contacto"
          className="text-xs font-semibold text-primary hover:underline shrink-0 inline-flex items-center gap-1 whitespace-nowrap"
        >
          Abrir <AppIcon icon={ArrowRight} size={12} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  // Estado vacío: se muestra igual, en tono neutro. Saber que no hay nada
  // pendiente es información útil, y mantiene el acceso a la bandeja visible.
  if (newCount === 0) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AppIcon icon={CheckCircle2} size={18} className="text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="text-sm text-gray-300">
            No hay mensajes de contacto sin atender.
          </span>
        </div>
        <Link
          href="/admin/contacto"
          className="text-xs font-semibold text-primary hover:underline shrink-0 inline-flex items-center gap-1 whitespace-nowrap"
        >
          Ver bandeja <AppIcon icon={ArrowRight} size={12} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <AppIcon icon={Inbox} size={18} className="text-primary shrink-0" aria-hidden="true" />
        <span className="text-sm text-gray-200">
          <strong className="font-semibold text-white tabular-nums">{newCount}</strong>{' '}
          {newCount === 1 ? 'mensaje de contacto sin atender' : 'mensajes de contacto sin atender'}
        </span>
      </div>
      <Link
        href="/admin/contacto"
        className="text-xs font-semibold text-primary hover:underline shrink-0 inline-flex items-center gap-1 whitespace-nowrap"
      >
        Responder <AppIcon icon={ArrowRight} size={12} aria-hidden="true" />
      </Link>
    </div>
  );
}
