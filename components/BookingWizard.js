'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { bookingService } from '@/services/bookingService';
import { availabilityService } from '@/services/availabilityService';
import { Check, CalendarDays, Users, Package, User, ClipboardList, CheckCircle, AlertTriangle } from 'lucide-react';
import PackageSelector from './PackageSelector';
import {
  describeGroupRule, groupInputType, formatDelta, isItemSelected, toggleItem,
  canSelectMore, validateSelection, modifiersSubtotal, toModifierPayload, defaultSelection,
} from '@/lib/modifierSelection';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LocationPicker from '@/components/LocationPicker';
import { safeFormatDate, addHoursToTime, todayStr } from '@/lib/date';
import { shouldShowGuestCapacityFields, isModelCheckoutEnabled, getPricingModelLabel } from '@/lib/packagePricingField';
import { pricingCapabilitiesService } from '@/services/pricingCapabilitiesService';
import {
  getInitialUnits, getInitialBillableHours, validateUnitsSelection,
  validateBillableHoursSelection, formatHoursLabel,
} from '@/lib/packageQuantityField';

const EVENT_TYPES = ['Cumpleaños', 'Casamiento', 'Empresarial', 'Infantil', 'Fiesta privada', 'Otro'];
const STEPS = [
  { label: 'Evento',    icon: CalendarDays },
  { label: 'Menú',     icon: Package },
  { label: 'Contacto', icon: User },
  { label: 'Resumen',  icon: ClipboardList },
];

// Traduce el error de POST /bookings a un mensaje accionable. `err` es un
// ApiError (services/api.js) con status/code/reasonCode, o un error de red
// genérico (sin status) si ni siquiera llegó a responder el backend.
function describeBookingError(err) {
  if (!err?.status) {
    return err?.name === 'AbortError'
      ? 'La solicitud tardó demasiado. Probá de nuevo.'
      : 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
  }
  if (err.status === 400 && (err.code === 'INVALID_LOCATION_TOKEN' || err.code === 'LOCATION_TOKEN_EXPIRED')) {
    return 'La dirección seleccionada ya no es válida. Volvé a elegirla en el paso "Evento".';
  }
  if (err.status === 400) return err.message || 'Revisá los datos del formulario e intentá de nuevo.';
  if (err.status === 401) return 'Tu sesión expiró. Iniciá sesión de nuevo para continuar.';
  if (err.status === 403) return 'Tu cuenta no tiene permiso para realizar esta acción.';
  if (err.status === 409) return err.message || 'La disponibilidad cambió mientras completabas el formulario. Elegí otra fecha u horario.';
  if (err.status === 429) return 'Hiciste demasiadas solicitudes seguidas. Esperá un momento y volvé a intentar.';
  if (err.status >= 500) return 'Tuvimos un problema para procesar tu solicitud. Intentá de nuevo en unos minutos.';
  return err.message || 'No se pudo enviar la solicitud. Intentá de nuevo.';
}

export default function BookingWizard({ provider, initialPackageId }) {
  const router = useRouter();
  const { user, showToast } = useApp();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  // Capacidades de pricing del backend — única fuente de verdad sobre qué
  // modelos se pueden contratar hoy. `null` mientras no se resolvió: los
  // modelos que dependen de un flag quedan bloqueados hasta saberlo, los que
  // no dependen de ninguno (per_person/fixed_package) nunca se bloquean.
  const [pricingCapabilities, setPricingCapabilities] = useState(null);

  const [eventData, setEventData] = useState({
    date: '', time: '', eventType: '', adults: '', children: '',
    // Celíacos: SUBCONJUNTO de adultos (nunca una categoría aparte) — el
    // checkbox controla si se muestra/usa el campo de cantidad.
    wantsCeliac: false, celiacs: '',
    // Solo se acepta una dirección validada por Google Places — nunca un
    // texto libre. Shape: { formattedAddress, placeId, lat, lng, city,
    // department, addressComplement, accessNotes, source } | null.
    location: null,
  });
  const [packageData, setPackageData] = useState({
    packageId: initialPackageId || provider.packages[1]?.id || provider.packages[0]?.id,
    extras: [],
    // Adicionales agrupados: [{ groupId, itemId }]. Sin cantidad — en el MVP
    // cada item se elige o no se elige.
    modifiers: [],
    extraHours: 0,
    units: 1,
    // Horas CONTRATADAS (per_hour). `null` = todavía no se resolvió el
    // paquete; el efecto de abajo la preselecciona con la duración de
    // referencia. Nunca se confunde con extraHours, que son horas
    // ADICIONALES sobre las ya incluidas en un fixed_package.
    billableHours: null,
  });
  const [contactData, setContactData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    message: '',
  });

  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const selectedPkg = provider.packages.find((p) => p.packageId === packageData.packageId) || provider.packages.find((p) => p.id === packageData.packageId) || provider.packages[0];
  const isDurationPkgForAvailability = !!selectedPkg?.isDurationPackage;
  const hasCeliacOption = !!selectedPkg?.offersCeliacMenu;
  const isPerUnit = !!selectedPkg?.isPerUnit;
  const isPerHour = !!selectedPkg?.isPerHour;
  const isCustomQuote = !!selectedPkg?.isCustomQuote;
  // ¿Corresponde pedir adultos/niños en absoluto? Mismo criterio EXACTO que
  // el backend (pricing-schema.js#shouldValidateGuestCapacity) — nunca
  // hardcodeado por categoría/slug: una categoría 'unused' (ej. fotografía)
  // no pide invitados salvo que el paquete elegido sea per_person igual
  // (caso Barra, puede variar por paquete).
  const showGuestFields = shouldShowGuestCapacityFields(selectedPkg?.pricingModel, provider.guestUsageMode);

  // ¿Este paquete se puede contratar HOY por el flujo normal? Depende de los
  // flags del backend (per_unit/per_hour) y de que este canal lo soporte —
  // nunca de una copia local de esa configuración.
  const checkoutEnabled = !selectedPkg
    || isModelCheckoutEnabled(selectedPkg.pricingModel, pricingCapabilities);

  // Capacidades: una sola consulta al montar. Si falla, `pricingCapabilities`
  // queda en null y el guard es el más restrictivo — nunca se habilita un
  // modelo por no haber podido preguntar.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => pricingCapabilitiesService.get())
      .then((caps) => { if (!cancelled) setPricingCapabilities(caps); })
      .catch(() => { /* silencioso: el guard ya asume lo restrictivo */ });
    return () => { cancelled = true; };
  }, []);

  // Al cambiar de paquete se re-preseleccionan cantidad y horas contratadas
  // con los valores del paquete NUEVO — nunca se arrastra la cantidad del
  // anterior, que puede violar su mínimo/paso (ej. pasar de un castillo
  // suelto a cupcakes por docena dejaría "1 cupcake", una cantidad que ese
  // proveedor no vende).
  useEffect(() => {
    if (!selectedPkg) return;
    setPackageData((prev) => ({
      ...prev,
      units: getInitialUnits(selectedPkg),
      billableHours: getInitialBillableHours(selectedPkg),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPkg?.id]);

  // Si el menú/paquete elegido cambia y deja de ofrecer la opción celíaca,
  // se limpia el checkbox y la cantidad — nunca queda un conteo celíaco
  // "huérfano" de un paquete que ya no aplica.
  useEffect(() => {
    if (!hasCeliacOption && (eventData.wantsCeliac || eventData.celiacs !== '')) {
      setEventData((prev) => ({ ...prev, wantsCeliac: false, celiacs: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCeliacOption]);

  // Consulta de disponibilidad pública (Etapa 7): solo informativa — el
  // backend siempre vuelve a validar al crear la reserva. Manda packageId/
  // extraHours para que el backend considere la duración real del paquete
  // elegido (si es de duración fija) en vez de la genérica del servicio.
  useEffect(() => {
    if (!eventData.date) { setAvailability(null); return; }
    let cancelled = false;
    setCheckingAvailability(true);
    const guestCount = (Number(eventData.adults) || 0) + (Number(eventData.children) || 0);
    availabilityService.getPublicAvailability(provider.id, {
      date: eventData.date,
      time: eventData.time || undefined,
      guestCount: guestCount || undefined,
      packageId: packageData.packageId || undefined,
      extraHours: isDurationPkgForAvailability ? packageData.extraHours || undefined : undefined,
    })
      .then((res) => { if (!cancelled) setAvailability(res); })
      .catch(() => { if (!cancelled) setAvailability(null); })
      .finally(() => { if (!cancelled) setCheckingAvailability(false); });
    return () => { cancelled = true; };
  }, [provider.id, eventData.date, eventData.time, eventData.adults, eventData.children, packageData.packageId, packageData.extraHours, isDurationPkgForAvailability]);

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

  // Celíacos: SUBCONJUNTO de adultos (nunca aditivo) — el precio celíaco
  // reemplaza (nunca suma sobre) el precio adulto normal para esas personas.
  // Nunca se clampea en silencio: si la cantidad supera a los adultos, se
  // invalida el paso (ver stepValid) en vez de recalcular con un valor
  // corregido.
  const celiacUnitPrice = selectedPkg?.celiacUnitPrice ?? 0;
  const rawCeliacsN = Number(eventData.celiacs) || 0;
  const celiacsError = hasCeliacOption && eventData.wantsCeliac && (rawCeliacsN < 0 || rawCeliacsN > adultsN)
    ? 'La cantidad de personas con menú celíaco no puede superar la cantidad de adultos'
    : null;
  const celiacsN = hasCeliacOption && eventData.wantsCeliac && !celiacsError ? rawCeliacsN : 0;
  const standardAdultsN = adultsN - celiacsN;

  // per_unit/custom_quote nunca participan de la rama adulto/niño — su
  // subtotal se resuelve aparte (subtotalUnits) o no existe (custom_quote).
  const subtotalAdults = (isPerUnit || isCustomQuote) ? 0 : (perPerson ? standardAdultsN * adultPrice : adultPrice);
  const subtotalCeliacs = perPerson ? celiacsN * celiacUnitPrice : 0;
  const subtotalChildren = perPerson ? childrenN * childPrice : 0;

  // Cantidad de unidades (castillos/tortas/pizzas por unidad) — acotada al
  // mínimo/máximo declarado por el paquete, mismo criterio de default (1)
  // que calculateQuote en el backend.
  const minUnits = selectedPkg?.minUnits || 1;
  const maxUnitsAllowed = selectedPkg?.maxUnits || null;
  const unitStep = selectedPkg?.unitStep && selectedPkg.unitStep > 1 ? selectedPkg.unitStep : 1;
  const unitsN = isPerUnit ? (Number(packageData.units) || minUnits) : 0;
  const unitPrice = selectedPkg?.unitPrice || 0;
  const unitLabelSingular = selectedPkg?.unitLabelSingular || 'unidad';
  const unitLabelPlural = selectedPkg?.unitLabelPlural || 'unidades';
  const subtotalUnits = isPerUnit ? unitsN * unitPrice : 0;
  // Se VALIDA, nunca se clampea: si la cantidad no respeta mínimo/máximo/
  // paso, el paso queda inválido y se muestra el motivo — cobrar una
  // cantidad distinta de la elegida sería peor que frenar el avance.
  const unitsCheck = isPerUnit ? validateUnitsSelection(unitsN, selectedPkg || {}) : { valid: true };
  const unitsError = unitsCheck.valid ? null : unitsCheck.message;

  // Horas CONTRATADAS (per_hour) — tarifa real por hora. Otro eje que las
  // horas extra de un fixed_package: nunca se suman entre sí.
  const hourlyPrice = selectedPkg?.hourlyPrice || 0;
  const billableHoursN = isPerHour ? Number(packageData.billableHours) : 0;
  const billableHoursCheck = isPerHour
    ? validateBillableHoursSelection(billableHoursN)
    : { valid: true };
  const billableHoursError = billableHoursCheck.valid ? null : billableHoursCheck.message;
  const subtotalHours = isPerHour && billableHoursCheck.valid ? billableHoursN * hourlyPrice : 0;

  // Adicionales agrupados: suma de los price_delta elegidos. PROVISIONAL —
  // el total que se cobra lo calcula el backend y se revalida al reservar.
  const grupos = selectedPkg?.modifierGroups || [];
  const modifiersTotal = modifiersSubtotal(grupos, packageData.modifiers);
  const modifierProblemas = validateSelection(grupos, packageData.modifiers);

  // Paquete de duración fija (ej. salón de fiestas): precio fijo + horas extra.
  const isDurationPkg = !!selectedPkg?.isDurationPackage;
  const maxExtraHours = selectedPkg?.maxExtraHours || 0;
  const extraHoursN = isDurationPkg ? Math.min(Math.max(0, Number(packageData.extraHours) || 0), maxExtraHours) : 0;
  const extraHourPrice = selectedPkg?.extraHourPrice || 0;
  const extraHoursAmount = extraHoursN * extraHourPrice;
  const estimatedEnd = isDurationPkg && eventData.time && selectedPkg?.durationHours
    ? addHoursToTime(eventData.time, Number(selectedPkg.durationHours) + extraHoursN)
    : null;

  // Nunca $0 para un paquete de presupuesto personalizado — `null` es la
  // señal explícita (mismo criterio que calculateQuote en el backend).
  const totalEstimated = isCustomQuote ? null : (subtotalAdults + subtotalCeliacs + subtotalChildren + subtotalUnits + subtotalHours + extrasTotal + extraHoursAmount + modifiersTotal);

  const stepValid = () => {
    if (step === 0) {
      // locationToken: sin esto POST /bookings rechaza la ubicación entera
      // (ver docs/SECURITY.md) — no alcanza con tener lat/lng en pantalla,
      // tiene que venir de una selección real contra el backend. La
      // expiración del token (30 min) se revisa recién en handleSubmit, no
      // acá: acá se evalúa durante el render y llamar Date.now() ahí lo
      // volvería impuro (regla del React Compiler de Next.js 16).
      const hasValidLocation = !!(
        eventData.location &&
        eventData.location.formattedAddress &&
        typeof eventData.location.lat === 'number' && Number.isFinite(eventData.location.lat) &&
        typeof eventData.location.lng === 'number' && Number.isFinite(eventData.location.lng) &&
        eventData.location.locationToken
      );
      // Adultos solo es obligatorio si esta categoría/paquete efectivamente
      // usa la cantidad de invitados (nunca hardcodeado — ver showGuestFields).
      const guestsOk = !showGuestFields || adultsN >= 1;
      return eventData.date && eventData.time && hasValidLocation && eventData.eventType && guestsOk && !celiacsError;
    }
    // custom_quote nunca puede confirmarse desde acá — no hay un monto que
    // el backend pueda aceptar (rechazaría con 400 CUSTOM_QUOTE_REQUIRED).
    // El proveedor debe contactarse directamente (ver aviso en el paso 1).
    // No se puede avanzar con un paquete que el backend va a rechazar:
    // custom_quote nunca es checkout directo, y per_unit/per_hour solo si su
    // flag está encendido y este canal los soporta.
    if (step === 1) {
      // Un grupo obligatorio sin elegir hace que el backend rechace la
      // reserva: el botón no debe invitar a ese rechazo.
      return provider.packages.length === 0
        || (!!packageData.packageId && !isCustomQuote && checkoutEnabled && !unitsError
            && !billableHoursError && modifierProblemas.length === 0);
    }
    if (step === 2) return contactData.name && contactData.phone && contactData.email;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) { showToast('Necesitás iniciar sesión para reservar', 'error'); router.push('/login'); return; }
    if (submitting) return;

    // El location_token dura 30 minutos (ver docs/SECURITY.md) — si el
    // cliente se quedó completando los pasos siguientes más tiempo que eso,
    // mejor pedirle que vuelva a elegir la dirección acá mismo que dejar que
    // el backend lo rechace con un 400 genérico.
    const tokenExpired = eventData.location?.tokenExpiresAt
      && new Date(eventData.location.tokenExpiresAt).getTime() <= Date.now();
    if (!eventData.location?.locationToken || tokenExpired) {
      setError('La dirección seleccionada expiró. Volvé al paso "Evento" y elegila de nuevo.');
      setStep(0);
      return;
    }

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
        celiacs:    celiacsN,
        extraHours: isDurationPkg ? extraHoursN : undefined,
        units:      isPerUnit ? unitsN : undefined,
        billableHours: isPerHour ? billableHoursN : undefined,
        date:       eventData.date,
        time:       eventData.time,
        eventType:  eventData.eventType,
        message:    contactData.message,
        extras:     packageData.extras.map((id) => ({ id, quantity: 1 })),
        // Solo ids: el backend resuelve el precio y revalida min/max,
        // obligatorios y doble cobro dentro de la misma transacción.
        modifierSelections: toModifierPayload(packageData.modifiers),
        // Ubicación del evento: solo llega acá si stepValid() ya confirmó
        // que viene de una selección real de Google Places con un
        // location_token vigente.
        locationDetails: {
          formattedAddress: eventData.location.formattedAddress,
          placeId:          eventData.location.placeId,
          lat:              eventData.location.lat,
          lng:              eventData.location.lng,
          city:             eventData.location.city,
          department:       eventData.location.department,
          addressComplement: eventData.location.addressComplement || undefined,
          accessNotes:       eventData.location.accessNotes || undefined,
          source:            eventData.location.source || 'google_places',
          locationToken:     eventData.location.locationToken,
          tokenExpiresAt:    eventData.location.tokenExpiresAt,
        },
      });
      setRequestNumber(booking.requestNumber || '');
      setDone(true);
    } catch (err) {
      const msg = describeBookingError(err);
      setError(msg);
      showToast(msg, 'error');
      // 409 (disponibilidad cambió) y errores de ubicación (token vencido/
      // inválido) dejan al cliente elegir de nuevo desde el paso "Evento" —
      // el resto de los datos del formulario se conserva (nunca se resetea
      // el wizard en un error recuperable).
      if (err?.status === 409 || err?.code === 'INVALID_LOCATION_TOKEN' || err?.code === 'LOCATION_TOKEN_EXPIRED') {
        setStep(0);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center text-center py-12 px-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <AppIcon icon={CheckCircle} size={40} className="text-green-500" aria-hidden="true" />
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
          <Button onClick={() => router.push('/dashboard/cliente/reservas')}>Ver mis reservas</Button>
          <Button variant="outline" onClick={() => router.push('/catalogo')}>Seguir explorando</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : 'inactive';
          return (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex flex-col items-center ${i === STEPS.length - 1 ? '' : 'flex-1'}`}>
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center mb-1 transition-all step-${state}`}>
                  <AppIcon icon={state === 'done' ? Check : s.icon} size={16} aria-hidden="true" />
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
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={eventData.date} onChange={(e) => setEventData({ ...eventData, date: e.target.value })} min={todayStr()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora *</label>
              <input type="time" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={eventData.time} onChange={(e) => setEventData({ ...eventData, time: e.target.value })} />
            </div>
          </div>

          {eventData.date && !checkingAvailability && availability && !availability.available && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AppIcon icon={AlertTriangle} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{availability.reasonMessage || 'El proveedor no tiene disponibilidad para esta fecha.'}</p>
            </div>
          )}
          {eventData.date && !checkingAvailability && availability?.available && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <AppIcon icon={Check} size={12} aria-hidden="true" /> Fecha disponible según la agenda del proveedor.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">¿Dónde se realizará el evento? *</label>
            <p className="text-xs text-gray-400 mb-1.5">La dirección exacta solo la ve el proveedor que aceptes.</p>
            <LocationPicker value={eventData.location} onChange={(location) => setEventData({ ...eventData, location })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de evento *</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white" value={eventData.eventType} onChange={(e) => setEventData({ ...eventData, eventType: e.target.value })}>
              <option value="">Seleccioná...</option>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {showGuestFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adultos *</label>
                <Input type="number" min="1" icon={Users} placeholder="Cantidad de adultos" value={eventData.adults} onChange={(e) => setEventData({ ...eventData, adults: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Niños <span className="text-gray-400 font-normal">(opcional)</span></label>
                <Input type="number" min="0" icon={Users} placeholder="Cantidad de niños" value={eventData.children} onChange={(e) => setEventData({ ...eventData, children: e.target.value })} />
              </div>
            </div>
          )}

          {hasCeliacOption && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/30"
                  checked={eventData.wantsCeliac}
                  onChange={(e) => setEventData({ ...eventData, wantsCeliac: e.target.checked, celiacs: e.target.checked ? eventData.celiacs : '' })} />
                Agregar personas con menú celíaco
              </label>
              {eventData.wantsCeliac && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cantidad de adultos que requieren menú celíaco</label>
                    <Input type="number" min="0" icon={Users} placeholder="Ej: 5" value={eventData.celiacs} onChange={(e) => setEventData({ ...eventData, celiacs: e.target.value })} />
                  </div>
                  <p className="text-xs text-gray-500">Estas personas ya deben estar incluidas en la cantidad de adultos.</p>
                  {selectedPkg?.celiacDescription && (
                    <p className="text-xs text-gray-500">{selectedPkg.celiacDescription}</p>
                  )}
                  {celiacsError && (
                    <p className="text-xs text-red-600">{celiacsError}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Package */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Seleccioná un paquete</h3>
          <PackageSelector packages={provider.packages} selectedId={packageData.packageId} onSelect={(id) => {
              const elegida = provider.packages.find((p) => p.id === id);
              setPackageData({
                ...packageData, packageId: id, extraHours: 0, units: 1, extras: [],
                // Un grupo obligatorio de cupo 1 arranca con su primera
                // alternativa marcada: el cliente ve un precio coherente en
                // vez de un error apenas elige la opción.
                modifiers: defaultSelection(elegida?.modifierGroups),
              });
            }} />

          {isDurationPkg && selectedPkg?.allowsExtraHours && (
            <div className="mt-6 p-4 rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Horas extra</h4>
                  <p className="text-xs text-gray-500">
                    ${Number(extraHourPrice).toLocaleString('es-UY')} por hora · máximo {maxExtraHours}hs
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPackageData({ ...packageData, extraHours: Math.max(0, extraHoursN - 1) })}
                    disabled={extraHoursN === 0}
                    aria-label="Restar hora extra"
                    className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 font-bold hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold text-gray-900">{extraHoursN}</span>
                  <button
                    type="button"
                    onClick={() => setPackageData({ ...packageData, extraHours: Math.min(maxExtraHours, extraHoursN + 1) })}
                    disabled={extraHoursN >= maxExtraHours}
                    aria-label="Sumar hora extra"
                    className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 font-bold hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              {estimatedEnd && (
                <p className="text-xs text-gray-500 mt-2">
                  Fin estimado: {estimatedEnd.time}hs{estimatedEnd.dayOffset > 0 ? ' (día siguiente)' : ''}
                </p>
              )}
            </div>
          )}

          {isPerUnit && (
            <div className="mt-6 p-4 rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 capitalize">Cantidad de {unitLabelPlural}</h4>
                  <p className="text-xs text-gray-500">
                    ${Number(unitPrice).toLocaleString('es-UY')} por {unitLabelSingular}
                    {minUnits > 1 ? ` · mínimo ${minUnits}` : ''}
                    {maxUnitsAllowed ? ` · máximo ${maxUnitsAllowed}` : ''}
                    {unitStep > 1 ? ` · de a ${unitStep}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPackageData({ ...packageData, units: Math.max(minUnits, unitsN - unitStep) })}
                    disabled={unitsN - unitStep < minUnits}
                    aria-label={`Restar ${unitLabelSingular}`}
                    className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 font-bold hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold text-gray-900">{unitsN}</span>
                  <button
                    type="button"
                    onClick={() => setPackageData({ ...packageData, units: unitsN + unitStep })}
                    disabled={!!maxUnitsAllowed && unitsN + unitStep > maxUnitsAllowed}
                    aria-label={`Sumar ${unitLabelSingular}`}
                    className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 font-bold hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              {unitsError && (
                <p className="mt-3 text-xs text-red-600">{unitsError}</p>
              )}
            </div>
          )}

          {/* Horas CONTRATADAS (per_hour) — tarifa real por hora. NO se
              muestra junto a las horas extra de un fixed_package: son ejes
              distintos y ofrecerlos juntos sugiere que se suman. */}
          {isPerHour && (
            <div className="mt-6 p-4 rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Horas contratadas</h4>
                  <p className="text-xs text-gray-500">
                    ${Number(hourlyPrice).toLocaleString('es-UY')} por hora
                    {selectedPkg?.defaultBillableHours ? ` · sugerido ${formatHoursLabel(selectedPkg.defaultBillableHours)}` : ''}
                  </p>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    aria-label="Horas contratadas"
                    value={packageData.billableHours ?? ''}
                    onChange={(e) => setPackageData({ ...packageData, billableHours: e.target.value })}
                  />
                </div>
              </div>
              {billableHoursError && (
                <p className="mt-3 text-xs text-red-600">{billableHoursError}</p>
              )}
            </div>
          )}

          {isCustomQuote && (
            <div className="mt-6 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AppIcon icon={AlertTriangle} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>Este paquete requiere presupuesto personalizado. Contactá al proveedor directamente para cotizarlo — no se puede reservar automáticamente desde acá.</p>
            </div>
          )}

          {/* Modelo todavía no habilitado para contratar (per_unit/per_hour
              con su flag apagado, o no soportado por este canal). Se avisa
              acá en vez de dejar avanzar y que el backend rechace al final. */}
          {!isCustomQuote && !checkoutEnabled && (
            <div className="mt-6 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AppIcon icon={AlertTriangle} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                Este paquete se cobra {getPricingModelLabel(selectedPkg?.pricingModel).toLowerCase()} y todavía
                no se puede reservar en línea. Contactá al proveedor para coordinarlo.
              </p>
            </div>
          )}

          {grupos.length > 0 && (
            <div className="mt-6 space-y-5">
              {grupos.map((g) => {
                const tipo = groupInputType(g);
                const elegidos = packageData.modifiers.filter((m) => m.groupId === g.id).length;
                const problema = modifierProblemas.find((p) => p.groupId === g.id);
                return (
                  <div key={g.id}>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-800">{g.name}</h4>
                      <span className={`text-xs ${g.isRequired ? 'text-primary font-semibold' : 'text-gray-500'}`}>
                        {describeGroupRule(g)}
                      </span>
                    </div>
                    {g.description && <p className="text-xs text-gray-500 mb-2">{g.description}</p>}

                    <div className="space-y-2">
                      {g.items.map((it) => {
                        const marcado = isItemSelected(packageData.modifiers, g.id, it.id);
                        // Al llegar al tope, lo no marcado se deshabilita —
                        // la misma regla que valida el backend.
                        const tope = !marcado && !canSelectMore(packageData.modifiers, g);
                        return (
                          <label
                            key={it.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              marcado ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-gray-300'
                            } ${tope ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type={tipo}
                                name={`grupo-${g.id}`}
                                checked={marcado}
                                disabled={tope}
                                onChange={() => setPackageData((prev) => ({
                                  ...prev, modifiers: toggleItem(prev.modifiers, g, it.id),
                                }))}
                                className="w-4 h-4 accent-primary shrink-0"
                              />
                              <span className="text-sm font-medium text-gray-800 truncate">{it.name}</span>
                            </div>
                            <span className={`text-sm font-semibold shrink-0 ${it.priceDelta === 0 ? 'text-success' : 'text-gray-900'}`}>
                              {formatDelta(it.priceDelta, (n) => `$${n.toLocaleString('es-UY')}`)}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {problema && elegidos === 0 && (
                      <p className="text-xs text-danger mt-1.5">{problema.message}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

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
            <Input placeholder="Tu nombre completo" value={contactData.name} onChange={(e) => setContactData({ ...contactData, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono *</label>
              <Input type="tel" placeholder="+598 9..." value={contactData.phone} onChange={(e) => setContactData({ ...contactData, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <Input type="email" placeholder="tu@email.com" value={contactData.email} onChange={(e) => setContactData({ ...contactData, email: e.target.value })} />
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
                <span className="text-gray-500">Paquete</span>
                <span className="font-medium text-gray-900">{selectedPkg.name}</span>
              </div>
            )}
            {isPerUnit ? (
              <div className="flex justify-between">
                <span className="text-gray-500 capitalize">{unitLabelPlural}</span>
                <span className="font-medium text-gray-900">{unitsN} × ${unitPrice.toLocaleString('es-UY')} = ${subtotalUnits.toLocaleString('es-UY')}</span>
              </div>
            ) : isPerHour ? (
              <div className="flex justify-between">
                <span className="text-gray-500">Horas contratadas</span>
                <span className="font-medium text-gray-900">
                  {formatHoursLabel(billableHoursN)} × ${hourlyPrice.toLocaleString('es-UY')} = ${subtotalHours.toLocaleString('es-UY')}
                </span>
              </div>
            ) : isDurationPkg ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duración</span>
                  <span className="font-medium text-gray-900">
                    {selectedPkg.durationHours}hs · ${subtotalAdults.toLocaleString('es-UY')}
                  </span>
                </div>
                {extraHoursN > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Horas extra</span>
                    <span className="font-medium text-gray-900">
                      {extraHoursN} × ${extraHourPrice.toLocaleString('es-UY')} = ${extraHoursAmount.toLocaleString('es-UY')}
                    </span>
                  </div>
                )}
                {estimatedEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fin estimado</span>
                    <span className="font-medium text-gray-900">{estimatedEnd.time}hs{estimatedEnd.dayOffset > 0 ? ' (día sig.)' : ''}</span>
                  </div>
                )}
              </>
            ) : perPerson ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">{celiacsN > 0 ? 'Adultos — menú estándar' : 'Adultos'}</span>
                  <span className="font-medium text-gray-900">{standardAdultsN} × ${adultPrice.toLocaleString('es-UY')} = ${subtotalAdults.toLocaleString('es-UY')}</span>
                </div>
                {celiacsN > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Adultos — menú celíaco</span>
                    <span className="font-medium text-gray-900">{celiacsN} × ${celiacUnitPrice.toLocaleString('es-UY')} = ${subtotalCeliacs.toLocaleString('es-UY')}</span>
                  </div>
                )}
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
            {/* Una variante "Incluido" también se lista: el cliente la eligió
                y tiene que verla, aunque sume $0. */}
            {packageData.modifiers.length > 0 && grupos.map((g) => g.items
              .filter((it) => isItemSelected(packageData.modifiers, g.id, it.id))
              .map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span className="text-gray-500 truncate mr-2">{it.name}</span>
                  <span className="font-medium text-gray-900 shrink-0">
                    {formatDelta(it.priceDelta, (n) => `$${n.toLocaleString('es-UY')}`)}
                  </span>
                </div>
              )))}
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
              <span className="font-medium text-gray-900 text-right max-w-[60%]">
                {eventData.location?.formattedAddress}
                {eventData.location?.addressComplement ? `, ${eventData.location.addressComplement}` : ''}
              </span>
            </div>
            <div className="h-px bg-gray-200" />
            {totalEstimated != null ? (
              <>
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-gray-800">Total estimado</span>
                  <span className="font-bold text-primary">${totalEstimated.toLocaleString('es-UY')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Seña sugerida (30%)</span>
                  <span className="font-semibold text-gray-800">${Math.round(totalEstimated * 0.3).toLocaleString('es-UY')}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-base">
                <span className="font-semibold text-gray-800">Total estimado</span>
                <span className="font-bold text-gray-500">Presupuesto personalizado</span>
              </div>
            )}
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
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Anterior
        </Button>
        {step < 3 ? (
          <Button disabled={!stepValid()} onClick={() => setStep((s) => s + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button loading={submitting} onClick={handleSubmit}>
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        )}
      </div>
    </div>
  );
}
