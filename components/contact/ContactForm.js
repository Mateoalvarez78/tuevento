'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { contactService, CONTACT_LIMITS } from '@/services/contactService';
import { LEGAL_PAGES_REACHABLE } from '@/lib/site';

// Los mismos límites que valida el backend (contact.routes.js) y que impone el
// CHECK de la migración 025. Validar acá da feedback inmediato; la decisión
// sigue siendo del servidor.
const { nameMax, emailMax, subjectMax, messageMin, messageMax } = CONTACT_LIMITS;

const EMPTY = { name: '', email: '', subject: '', message: '', honeypot: '' };

// Validación de formato mínima y deliberadamente permisiva: alcanza para no
// molestar al usuario con un viaje al servidor por un error obvio. La
// verificación real es la del backend — nunca se asume que esto es suficiente.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mensaje de error de un campo. Único nodo que muestra el texto, con id estable
 * para que el control lo referencie por `aria-describedby`. Sin mensaje no
 * renderiza nada (no deja un hueco vacío en el layout).
 */
function FieldError({ id, message }) {
  if (!message) return null;
  return <p id={id} className="mt-1.5 text-xs text-danger">{message}</p>;
}

function validate(form) {
  const errors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const message = form.message.trim();

  if (!name) errors.name = 'Escribí tu nombre.';
  else if (name.length > nameMax) errors.name = `Máximo ${nameMax} caracteres.`;

  if (!email) errors.email = 'Escribí tu correo para que podamos responderte.';
  else if (email.length > emailMax) errors.email = `Máximo ${emailMax} caracteres.`;
  else if (!EMAIL_SHAPE.test(email)) errors.email = 'Revisá el correo: falta el @ o el dominio.';

  if (!message) errors.message = 'Contanos en qué te podemos ayudar.';
  else if (message.length < messageMin) errors.message = `Contanos un poco más: al menos ${messageMin} caracteres.`;
  else if (message.length > messageMax) errors.message = `Máximo ${messageMax} caracteres.`;

  if (form.subject.trim().length > subjectMax) errors.subject = `Máximo ${subjectMax} caracteres.`;

  return errors;
}

export default function ContactForm() {
  // `useId` da ids estables entre servidor y cliente — necesarios para que cada
  // <label htmlFor> apunte a su control sin colisionar si el formulario se
  // montara dos veces en la misma página.
  const uid = useId();
  const id = (field) => `${uid}-${field}`;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  // 'idle' | 'sending' | 'sent' | 'error' — un solo estado, no tres booleanos
  // que puedan contradecirse entre sí.
  const [status, setStatus] = useState('idle');
  const [serverError, setServerError] = useState('');

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    // Limpia el error del campo en cuanto se lo edita, en lugar de dejarlo
    // hasta el próximo submit.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const found = validate(form);
    if (Object.keys(found).length) {
      setErrors(found);
      setStatus('idle');
      return;
    }

    setErrors({});
    setStatus('sending');
    try {
      await contactService.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        honeypot: form.honeypot,
      });
      // Solo acá se muestra éxito: `submit` resuelve únicamente si el backend
      // respondió 2xx, o sea si el mensaje quedó guardado. Nunca se marca como
      // enviado de forma optimista.
      setStatus('sent');
      setForm(EMPTY);
    } catch (err) {
      setStatus('error');
      // Si el backend devolvió errores por campo (400 de express-validator),
      // se marcan los campos en lugar de mostrar solo un cartel genérico.
      if (err.fieldErrors) {
        const mapped = {};
        err.fieldErrors.forEach((fe) => { if (fe.field) mapped[fe.field] = fe.message; });
        if (Object.keys(mapped).length) setErrors(mapped);
      }
      setServerError(
        err.status === 429
          ? err.message
          : err.message || 'No pudimos enviar tu mensaje. Probá de nuevo en un momento.'
      );
    }
  };

  // ── Éxito ────────────────────────────────────────────────────────────────
  if (status === 'sent') {
    return (
      <div
        className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-8"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <AppIcon icon={CheckCircle2} size={22} className="text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1.5">Recibimos tu mensaje</h2>
            <p className="text-sm text-gray-600 mb-4">
              Queda registrado y lo vamos a leer. Te respondemos al correo que nos dejaste.
            </p>
            <Button variant="outline" size="sm" onClick={() => setStatus('idle')}>
              Enviar otro mensaje
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sending = status === 'sending';

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
      {/* Región de resultado. `aria-live` acá y no en cada campo: un lector de
          pantalla anuncia el fallo del envío sin tener que recorrer el form. */}
      <div aria-live="polite" role="alert">
        {status === 'error' && serverError && (
          <div className="flex items-start gap-2.5 mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AppIcon icon={AlertCircle} size={17} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* A <Input> se le pasa `error` como BOOLEANO, no como string: con un
            string el propio Input renderiza el texto debajo, y como acá además
            hace falta un nodo con id estable para `aria-describedby`, el mensaje
            terminaba duplicado en el DOM (y anunciado dos veces por un lector de
            pantalla). Con el booleano, Input aporta solo el estilo de error y el
            texto lo renderiza <FieldError> una única vez. */}

        {/* Nombre */}
        <div>
          <label htmlFor={id('name')} className="block text-sm font-semibold text-gray-700 mb-1.5">
            Nombre <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <Input
            id={id('name')}
            name="name"
            value={form.name}
            onChange={set('name')}
            maxLength={nameMax}
            autoComplete="name"
            required
            error={!!errors.name}
            aria-describedby={errors.name ? id('name-error') : undefined}
          />
          <FieldError id={id('name-error')} message={errors.name} />
        </div>

        {/* Correo */}
        <div>
          <label htmlFor={id('email')} className="block text-sm font-semibold text-gray-700 mb-1.5">
            Correo electrónico <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <Input
            id={id('email')}
            name="email"
            type="email"
            value={form.email}
            onChange={set('email')}
            maxLength={emailMax}
            autoComplete="email"
            required
            error={!!errors.email}
            aria-describedby={errors.email ? id('email-error') : undefined}
          />
          <FieldError id={id('email-error')} message={errors.email} />
        </div>

        {/* Asunto — opcional. Se pide porque permite triar la bandeja sin
            obligar a nadie a clasificar su consulta. NO se pide teléfono. */}
        <div>
          <label htmlFor={id('subject')} className="block text-sm font-semibold text-gray-700 mb-1.5">
            Asunto <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <Input
            id={id('subject')}
            name="subject"
            value={form.subject}
            onChange={set('subject')}
            maxLength={subjectMax}
            error={!!errors.subject}
            aria-describedby={errors.subject ? id('subject-error') : undefined}
          />
          <FieldError id={id('subject-error')} message={errors.subject} />
        </div>

        {/* Mensaje */}
        <div>
          <label htmlFor={id('message')} className="block text-sm font-semibold text-gray-700 mb-1.5">
            Mensaje <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <textarea
            id={id('message')}
            name="message"
            rows={6}
            value={form.message}
            onChange={set('message')}
            maxLength={messageMax}
            required
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={`${id('message-count')}${errors.message ? ` ${id('message-error')}` : ''}`}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 outline-none resize-y ${
              errors.message
                ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
            }`}
          />
          <div className="flex items-start justify-between gap-3 mt-1.5">
            {/* Único nodo con el texto del error, referenciado por
                aria-describedby del textarea. */}
            {errors.message ? (
              <p id={id('message-error')} className="text-xs text-danger">{errors.message}</p>
            ) : (
              <span />
            )}
            <span id={id('message-count')} className="text-xs text-gray-400 shrink-0">
              {form.message.length} / {messageMax}
            </span>
          </div>
        </div>

        {/* Honeypot. Oculto para la vista Y para lectores de pantalla
            (aria-hidden + tabIndex -1), pero NO con display:none: algunos bots
            ignoran los campos con display:none y así no caerían en la trampa.
            Se saca del flujo con position absolute fuera de pantalla. Un humano
            nunca lo completa; un bot que rellena todo el formulario, sí — y ese
            envío se descarta en el backend sin escribir fila. */}
        <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
          <label htmlFor={id('website')}>No completar este campo</label>
          <input
            id={id('website')}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.honeypot}
            onChange={set('honeypot')}
          />
        </div>

        <div className="pt-1">
          <Button type="submit" size="lg" className="w-full sm:w-auto" icon={Send} loading={sending} disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar mensaje'}
          </Button>
        </div>

        {/* El enlace a Privacidad solo se muestra si la página se sirve de
            verdad. En la práctica van siempre juntos —el formulario y las
            legales comparten compuerta (ver PUBLIC_CONTACT_READY)—, pero el
            condicional evita que una futura separación de las dos deje acá un
            enlace roto en la frase que explica el tratamiento de datos. */}
        <p className="text-xs text-gray-500 leading-relaxed">
          Usamos tus datos únicamente para responderte esta consulta.
          {LEGAL_PAGES_REACHABLE && (
            <>
              {' '}Podés leer cómo los tratamos en nuestra{' '}
              <Link href="/privacidad" className="text-primary hover:underline">
                Política de privacidad
              </Link>.
            </>
          )}
        </p>
      </div>
    </form>
  );
}
