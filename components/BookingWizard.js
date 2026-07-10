'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { bookingService } from '@/services/bookingService';
import { Check, CalendarDays, MapPin, Users, Package, User, MessageSquare, ClipboardList, CheckCircle } from 'lucide-react';
import PackageSelector from './PackageSelector';
import { safeFormatDate } from '@/lib/date';

const EVENT_TYPES = ['Cumpleaños', 'Casamiento', 'Empresarial', 'Infantil', 'Fiesta privada', 'Otro'];
const STEPS = [
  { label: 'Evento',    icon: CalendarDays },
  { label: 'Menú',     icon: Package },
  { label: 'Contacto', icon: User },
  { label: 'Resumen',  icon: ClipboardList },
];

export default function BookingWizard({ provider, initialPackageId }) {
  const router = useRouter();
  const { user, showToast } = useApp();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requestNumber, setRequestNumber] = useState('');

  const [eventData, setEventData] = useState({
    date: '', time: '', location: '', eventType: '', adults: '', children: '',
  });
  const [packageData, setPackageData] = useState({
    packageId: initialPackageId || provider.packages[1]?.id || provider.packages[0]?.id,
    extras: [],
  });
  const [contactData, setContactData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    message: '',
  });

  const selectedPkg = provider.packages.find((p) => p.packageId === packageData.packageId) || provider.packages.find((p) => p.id === packageData.packageId) || provider.packages[0];

  const toggleExtra = (id) => {
    setPackageData((prev) => ({
      ...prev,
      extras: prev.extras.includes(id) ? prev.extras.filter((e) => e !== id) : [...prev.extras, id],
    }));
  };

  const extrasTotal = provider.extras
    .filter((e) => packageData.extras.includes(e.id))
    .reduce((sum, e) => sum + e.price, 0);

  // Per-person calculation (mirrors the backend; backend remains authoritative).
  const adultsN = Number(eventData.adults) || 0;
  const childrenN = Number(eventData.children) || 0;
  const adultPrice = selectedPkg?.adultPrice ?? selectedPkg?.price ?? provider.priceFrom ?? 0;
  const childPrice = selectedPkg?.childPrice ?? 0;
  const hasChildPrice = !!selectedPkg?.hasChildPrice;
  const childAgeLimit = selectedPkg?.childAgeLimit ?? 14;
  // Per-person menus multiply by headcount; per-event menus (foto/DJ) are flat.
  const perPerson = selectedPkg ? selectedPkg.perPerson !== false : (provider.priceType === 'per_person');
  const subtotalAdults = perPerson ? adultsN * adultPrice : adultPrice;
  const subtotalChildren = perPerson ? childrenN * childPrice : 0;
  const totalEstimated = subtotalAdults + subtotalChildren + extrasTotal;

  const stepValid = () => {
    if (step === 0) return eventData.date && eventData.time && eventData.location && eventData.eventType && adultsN >= 1;
    if (step === 1) return provider.packages.length === 0 || !!packageData.packageId;
    if (step === 2) return contactData.name && contactData.phone && contactData.email;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) { showToast('Necesitás iniciar sesión para reservar', 'error'); router.push('/login'); return; }
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      // Send only the fields the backend needs; it derives subtotal, commission,
      // total, deposit and request_number server-side. Mapping to snake_case
      // happens in bookingService.create().
      const booking = await bookingService.create({
        serviceId:  provider.id,
        packageId:  packageData.packageId || undefined,
        adults:     adultsN,
        children:   childrenN,
        date:       eventData.date,
        time:       eventData.time,
        location:   eventData.location,
        eventType:  eventData.eventType,
        message:    contactData.message,
        extras:     packageData.extras.map((id) => ({ id, quantity: 1 })),
      });
      setRequestNumber(booking.requestNumber || '');
      setDone(true);
    } catch (err) {
      const msg = err?.message || 'No se pudo enviar la solicitud. Intentá de nuevo.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center text-center py-12 px-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Consulta enviada</h2>
        <p className="text-gray-500 mb-2">Tu número de solicitud es:</p>
        <div className="text-2xl font-bold text-primary mb-4">{requestNumber}</div>
        <p className="text-sm text-gray-500 max-w-sm mb-3">
          <strong>{provider.name}</strong> revisará la disponibilidad y te responderá en {provider.responseTime.replace('Responde en ', '')}.
          Te llegará un email de confirmación a <strong>{contactData.email}</strong>.
        </p>
        <p className="text-sm text-gray-500 max-w-sm mb-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          No se realizará ningún cobro hasta que el proveedor confirme tu reserva.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/dashboard/cliente/reservas')}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Ver mis reservas
          </button>
          <button
            onClick={() => router.push('/catalogo')}
            className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Seguir explorando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const state = i < step ? 'done' : i === step ? 'active' : 'inactive';
          return (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex flex-col items-center ${i === STEPS.length - 1 ? '' : 'flex-1'}`}>
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center mb-1 transition-all step-${state}`}>
                  {state === 'done' ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${state === 'active' ? 'text-primary' : state === 'done' ? 'text-green-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 0: Event data */}
      {step === 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Datos del evento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha *</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={eventData.date} onChange={(e) => setEventData({ ...eventData, date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora *</label>
              <input type="time" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={eventData.time} onChange={(e) => setEventData({ ...eventData, time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ubicación del evento *</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Ej: Salón Crystal, Av. 18 de Julio, Montevideo" value={eventData.location} onChange={(e) => setEventData({ ...eventData, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de evento *</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white" value={eventData.eventType} onChange={(e) => setEventData({ ...eventData, eventType: e.target.value })}>
              <option value="">Seleccioná...</option>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adultos *</label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" min="1" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Cantidad de adultos" value={eventData.adults} onChange={(e) => setEventData({ ...eventData, adults: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Niños <span className="text-gray-400 font-normal">(opcional)</span></label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" min="0" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Cantidad de niños" value={eventData.children} onChange={(e) => setEventData({ ...eventData, children: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Package */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Seleccioná un menú</h3>
          <PackageSelector packages={provider.packages} selectedId={packageData.packageId} onSelect={(id) => setPackageData({ ...packageData, packageId: id })} />

          {provider.extras.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Extras opcionales</h4>
              <div className="space-y-2">
                {provider.extras.map((ex) => (
                  <label key={ex.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${packageData.extras.includes(ex.id) ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={packageData.extras.includes(ex.id)} onChange={() => toggleExtra(ex.id)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm font-medium text-gray-800">{ex.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">+${ex.price.toLocaleString('es-UY')}{ex.priceUnit ? ` ${ex.priceUnit}` : ''}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Contact */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tus datos de contacto</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo *</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Tu nombre completo" value={contactData.name} onChange={(e) => setContactData({ ...contactData, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono *</label>
              <input type="tel" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="+598 9..." value={contactData.phone} onChange={(e) => setContactData({ ...contactData, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="tu@email.com" value={contactData.email} onChange={(e) => setContactData({ ...contactData, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensaje al proveedor</label>
            <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Contale los detalles de tu evento, requerimientos especiales, etc." value={contactData.message} onChange={(e) => setContactData({ ...contactData, message: e.target.value })} />
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de tu solicitud</h3>
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-sm mb-5">
            <div className="flex justify-between">
              <span className="text-gray-500">Proveedor</span>
              <span className="font-medium text-gray-900">{provider.name}</span>
            </div>
            {selectedPkg && (
              <div className="flex justify-between">
                <span className="text-gray-500">Menú</span>
                <span className="font-medium text-gray-900">{selectedPkg.name}</span>
              </div>
            )}
            {perPerson ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Adultos</span>
                  <span className="font-medium text-gray-900">{adultsN} × ${adultPrice.toLocaleString('es-UY')} = ${subtotalAdults.toLocaleString('es-UY')}</span>
                </div>
                {childrenN > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Niños (hasta {childAgeLimit} años)</span>
                    <span className="font-medium text-gray-900">
                      {hasChildPrice
                        ? `${childrenN} × $${childPrice.toLocaleString('es-UY')} = $${subtotalChildren.toLocaleString('es-UY')}`
                        : `${childrenN} (sin cargo en este menú)`}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Precio del servicio</span>
                  <span className="font-medium text-gray-900">${subtotalAdults.toLocaleString('es-UY')} <span className="text-xs text-gray-400">por evento</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Personas</span>
                  <span className="font-medium text-gray-900">{adultsN}{childrenN > 0 ? ` adultos + ${childrenN} niños` : ' personas'}</span>
                </div>
              </>
            )}
            {packageData.extras.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Extras</span>
                <span className="font-medium text-gray-900">+${extrasTotal.toLocaleString('es-UY')}</span>
              </div>
            )}
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha</span>
              <span className="font-medium text-gray-900">{safeFormatDate(eventData.date)} – {eventData.time}hs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo de evento</span>
              <span className="font-medium text-gray-900">{eventData.eventType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ubicación</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">{eventData.location}</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between text-base">
              <span className="font-semibold text-gray-800">Total estimado</span>
              <span className="font-bold text-primary">${totalEstimated.toLocaleString('es-UY')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Seña sugerida (30%)</span>
              <span className="font-semibold text-gray-800">${Math.round(totalEstimated * 0.3).toLocaleString('es-UY')}</span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            <strong>¿Cómo funciona?</strong> Tu solicitud llega al proveedor. Si acepta, te contactará para coordinar el pago de la seña y confirmar la reserva.
          </div>
          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="px-5 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!stepValid()}
            className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        )}
      </div>
    </div>
  );
}
