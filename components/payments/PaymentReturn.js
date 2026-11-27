'use client';

// Pantalla de retorno del checkout de dLocal Go.
//
// NUNCA confía en la URL: `?intent=` solo dice qué intento consultar. El
// estado sale de POST /payments/intents/:id/sync, que hace que el backend lea
// el pago en dLocal (GET /v1/payments/:id). Se consulta cada 2 s hasta 30 s;
// si sigue pendiente, se le avisa al cliente que lo confirmamos por mail.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, XCircle, ShieldAlert, Loader2 } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import { paymentService } from '@/services/paymentService';
import { returnState } from '@/lib/payments';

const POLL_MS = 2000;
const MAX_POLLS = 15;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VIEW = {
  checking:   { icon: Loader2,      tone: 'text-gray-400',    title: 'Estamos confirmando tu pago…', body: 'Esto puede tardar unos segundos. No cierres esta pestaña.' },
  paid:       { icon: CheckCircle2, tone: 'text-emerald-600', title: '¡Pago confirmado!', body: 'Ya registramos tu pago. Te llegará la confirmación por correo.' },
  processing: { icon: Clock,        tone: 'text-amber-500',   title: 'Tu pago está en proceso', body: 'El medio de pago todavía no lo confirmó. Te avisamos apenas se acredite: no hace falta que pagues de nuevo.' },
  failed:     { icon: XCircle,      tone: 'text-red-600',     title: 'El pago no se completó', body: 'No se realizó ningún cobro. Podés volver a intentarlo desde tus reservas.' },
  review:     { icon: ShieldAlert,  tone: 'text-amber-500',   title: 'Estamos revisando tu pago', body: 'Hubo una diferencia que nuestro equipo tiene que revisar. Te contactamos a la brevedad: no vuelvas a pagar.' },
  invalid:    { icon: XCircle,      tone: 'text-gray-400',    title: 'No encontramos este pago', body: 'Revisá el estado de tus pagos en tus reservas.' },
};

export default function PaymentReturn({ cancelled = false }) {
  const params = useSearchParams();
  const intentId = params.get('intent');
  const validId = Boolean(intentId && UUID_RE.test(intentId));
  const [state, setState] = useState(() => {
    if (!validId) return 'invalid';
    return cancelled ? 'failed' : 'checking';
  });

  useEffect(() => {
    if (!validId) return undefined;
    let alive = true;
    let polls = 0;
    let timer;

    const tick = async () => {
      polls += 1;
      let next;
      try {
        next = returnState(await paymentService.syncIntent(intentId));
      } catch (e) {
        next = e?.status === 404 ? 'invalid' : 'processing';
      }
      if (!alive) return;
      // Volver con "cancelar" no prueba nada: si el pago igual se aprobó, gana el backend.
      if (cancelled && next === 'processing') next = 'failed';
      setState(next);
      if (next === 'processing' && !cancelled && polls < MAX_POLLS) timer = setTimeout(tick, POLL_MS);
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, [intentId, validId, cancelled]);

  const v = VIEW[state] || VIEW.checking;
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-surface">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-8 text-center" role="status" aria-live="polite">
        <AppIcon
          icon={v.icon}
          size={44}
          strokeWidth={1.5}
          className={`${v.tone} mx-auto mb-4 ${state === 'checking' ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{v.title}</h1>
        <p className="text-sm text-gray-500 mb-6">{v.body}</p>
        <Button href="/dashboard/cliente/reservas" className="w-full">Ir a mis reservas</Button>
      </div>
    </div>
  );
}
