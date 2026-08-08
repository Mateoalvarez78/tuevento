'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, CalendarHeart, ListChecks, Sparkles, RefreshCw, TriangleAlert, CheckCircle2 } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import EventStepForm from './EventStepForm';
import CategoriesStepForm from './CategoriesStepForm';
import EventSummary from './EventSummary';
import ProposalCard from './ProposalCard';
import { categoryService } from '@/services/categoryService';
import { smartPackagesService } from '@/services/smartPackagesService';
import { useAcceptProposal } from '@/hooks/useAcceptProposal';
import { useApp } from '@/lib/AppContext';
import { useMyEvent } from '@/lib/MyEventContext';
import {
  DEFAULT_PREFERENCE, PROFILE_ORDER, validateEventStep, validateCategoriesStep,
  buildSimulatePayload, hasNoResultsAtAll,
} from '@/lib/smartPackages';

const STEPS = [
  { label: 'Tu evento', icon: CalendarHeart },
  { label: 'Qué necesitás', icon: ListChecks },
  { label: 'Tus propuestas', icon: Sparkles },
];

export default function SmartPackagesGenerator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Prefill opcional desde el hero de la Home (?eventType=&eventDate=&adults=)
  // — solo se lee una vez, al montar; el usuario puede editar todo desde acá.
  const [eventData, setEventData] = useState(() => ({
    eventType: searchParams.get('eventType') || '',
    budget: '',
    adults: searchParams.get('adults') || '',
    children: '',
    eventDate: searchParams.get('eventDate') || '',
    location: null,
  }));
  const [categoriesData, setCategoriesData] = useState({ categoryIds: [], preference: DEFAULT_PREFERENCE });
  const [errors, setErrors] = useState({});

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectingProfile, setSelectingProfile] = useState(null);
  const resultsRef = useRef(null);

  const { user } = useApp();
  const { event: myEvent, status: myEventStatus, createEvent, importItems } = useMyEvent();
  const { acceptProposal, acceptStatus } = useAcceptProposal({
    user, event: myEvent, myEventStatus, createEvent, importItems, router,
  });

  useEffect(() => {
    categoryService.getAll()
      .then(setCategories)
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [status]);

  // Una vez que ya se mostró un error (tras un intento de avanzar), se
  // revalida en vivo con cada cambio — si no, un error quedaba "pegado" en
  // pantalla aunque el campo ya estuviera corregido, hasta el próximo submit.
  const updateEventData = (patch) => {
    setEventData((prev) => {
      const next = { ...prev, ...patch };
      if (Object.keys(errors).length) setErrors(validateEventStep(next));
      return next;
    });
  };
  const toggleCategory = (categoryId) => {
    setCategoriesData((prev) => {
      const next = {
        ...prev,
        categoryIds: prev.categoryIds.includes(categoryId)
          ? prev.categoryIds.filter((id) => id !== categoryId)
          : [...prev.categoryIds, categoryId],
      };
      if (Object.keys(errors).length) setErrors(validateCategoriesStep(next));
      return next;
    });
  };

  const runSimulation = async () => {
    setStatus('loading');
    setErrorMessage('');
    setStep(2);
    try {
      const payload = buildSimulatePayload({ ...eventData, ...categoriesData });
      const res = await smartPackagesService.simulate(payload);
      setResult(res);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err?.message || 'No pudimos generar tus propuestas. Intentá de nuevo.');
      setStatus('error');
    }
  };

  const handleNext = () => {
    if (step === 0) {
      const stepErrors = validateEventStep(eventData);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length) return;
      setStep(1);
      return;
    }
    if (step === 1) {
      const stepErrors = validateCategoriesStep(categoriesData);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length) return;
      runSimulation();
    }
  };

  const handleBack = () => {
    if (status === 'loading') return;
    setStep((s) => Math.max(0, s - 1));
  };

  const handleEditSearch = () => {
    setStatus('idle');
    setStep(0);
  };

  const handleSelect = async (proposal) => {
    setSelectingProfile(proposal.profile);
    try {
      const updatedEvent = await acceptProposal({
        eventData,
        profile: proposal.profile,
        categories: proposal.categories.map((c) => ({
          categoryId: c.categoryId, categoryName: c.categoryName,
          serviceId: c.serviceId, packageId: c.packageId,
        })),
      });
      // updatedEvent === null: no había sesión, acceptProposal ya redirigió
      // a /login — no hay nada más que hacer acá, el flujo se reanuda solo.
      // La propuesta se guarda entera o no se guarda nada (POST atómico), así
      // que cualquier resultado no nulo implica éxito completo.
      if (updatedEvent) {
        router.push('/mi-evento');
      }
    } catch {
      // el estado de error ya queda expuesto en acceptStatus — el banner de
      // abajo lo muestra, no hace falta nada más acá.
    } finally {
      setSelectingProfile(null);
    }
  };

  const totalGuests = (Number(eventData.adults) || 0) + (Number(eventData.children) || 0);
  const noResultsAtAll = useMemo(() => status === 'success' && hasNoResultsAtAll(result?.proposals), [status, result]);

  return (
    // Paso de resultados un poco más ancho que el formulario (max-w-6xl vs.
    // max-w-5xl): con 3 columnas lado a lado, el ancho del formulario dejaba
    // las cards apretadas en pantallas de escritorio medianas (~1024-1280px).
    <div className={step === 2 ? 'max-w-6xl mx-auto' : 'max-w-5xl mx-auto'}>
      {step < 2 && (
        <>
          {/* Indicador de pasos — mismo patrón visual que BookingWizard */}
          <div className="flex items-center mb-8 max-w-2xl mx-auto">
            {STEPS.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'active' : 'inactive';
              return (
                <div key={s.label} className="flex items-center flex-1">
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

          <div className="max-w-2xl mx-auto">
            {step === 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Contanos sobre tu evento</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Con estos datos calculamos qué proveedores reales son compatibles y cuánto costaría cada combinación.
                </p>
                <EventStepForm value={eventData} onChange={updateEventData} errors={errors} />
              </div>
            )}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">¿Qué necesitás para tu evento?</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Elegí una o más categorías. Vamos a armar una propuesta por cada una.
                </p>
                {categoriesLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-9 w-28 rounded-full skeleton" aria-hidden="true" />
                    ))}
                  </div>
                ) : (
                  <CategoriesStepForm
                    categories={categories}
                    selectedIds={categoriesData.categoryIds}
                    onToggleCategory={toggleCategory}
                    preference={categoriesData.preference}
                    onPreferenceChange={(preference) => setCategoriesData((prev) => ({ ...prev, preference }))}
                    errors={errors}
                  />
                )}
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <Button variant="outline" disabled={step === 0} onClick={handleBack}>Anterior</Button>
              <Button onClick={handleNext}>{step === 1 ? 'Ver propuestas' : 'Siguiente'}</Button>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <div ref={resultsRef}>
          {/* Resumen del evento, siempre visible y editable, incluso con resultados */}
          <EventSummary
            budget={eventData.budget}
            totalGuests={totalGuests}
            eventDate={eventData.eventDate}
            location={eventData.location}
            onEdit={handleEditSearch}
            editDisabled={status === 'loading'}
          />

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" aria-hidden="true" />
              <p className="text-gray-600 font-medium">Estamos armando tus mejores combinaciones…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <AppIcon icon={TriangleAlert} size={32} className="text-amber-500 mb-3" aria-hidden="true" />
              <p className="text-gray-800 font-semibold mb-1">No pudimos generar tus propuestas</p>
              <p className="text-sm text-gray-500 mb-5 max-w-sm">{errorMessage}</p>
              <div className="flex gap-3">
                <Button icon={RefreshCw} onClick={runSimulation}>Reintentar</Button>
                <Button variant="outline" onClick={handleEditSearch}>Editar búsqueda</Button>
              </div>
            </div>
          )}

          {status === 'success' && noResultsAtAll && (
            <EmptyState
              title="No encontramos combinaciones compatibles"
              description="Probá aumentar el presupuesto, cambiar la fecha, reducir la cantidad de invitados o elegir otras categorías."
              cta="Editar búsqueda"
              onCta={handleEditSearch}
            />
          )}

          {status === 'success' && !noResultsAtAll && (
            <>
              {acceptStatus === 'error' && (
                <div className="mb-5 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AppIcon icon={TriangleAlert} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {/* Todo o nada: si algún componente ya no estaba disponible, o
                      el evento cambió en otro lado (409), no se guardó nada de
                      esta propuesta — nunca queda a medio camino. */}
                  No pudimos guardar esta propuesta completa en tu evento (puede que algún servicio ya no esté disponible). No se guardó ningún cambio — probá de nuevo.
                </div>
              )}
              {acceptStatus === 'done' && (
                <div className="mb-5 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <AppIcon icon={CheckCircle2} size={16} className="shrink-0" aria-hidden="true" />
                  ¡Listo! Guardamos esta propuesta en tu evento. Redirigiendo…
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {PROFILE_ORDER.map((profile) => {
                  const proposal = result.proposals.find((p) => p.profile === profile);
                  return proposal ? (
                    <ProposalCard
                      key={profile}
                      proposal={proposal}
                      budget={Number(eventData.budget)}
                      onSelect={() => handleSelect(proposal)}
                      selecting={selectingProfile === profile}
                      disabled={selectingProfile != null}
                    />
                  ) : null;
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
