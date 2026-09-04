'use client';

// Constructor de una opción: información, precio, qué incluye, adicionales y
// vista previa. Reemplaza al formulario plano anterior.
//
// Reutiliza los mismos helpers puros que ya validaba la fase de pricing
// (packagePricingField.js, packageSubcategoryField.js) — acá no se reimplementa
// ninguna regla de modalidad ni de subcategoría.
//
// Las inclusiones y los adicionales necesitan que la opción EXISTA para
// colgarse de ella, así que en alta se guarda primero la información básica y
// esas dos secciones se habilitan después. Es la misma razón por la que el
// backend las expone bajo /packages/:packageId.
import { useState, useEffect, useMemo } from 'react';
import {
  Info, DollarSign, ListChecks, PlusCircle, Eye, Plus, Trash2, X, Check, AlertCircle,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { serviceService } from '@/services/serviceService';
import { modifierService } from '@/services/modifierService';
import { useSubcategories } from '@/hooks/useSubcategories';
import {
  getSubcategoryFieldLabel, getSubcategoryHelpText, deriveSubcategoryFieldState,
  buildSubcategoryOptions, validateSubcategorySelection,
} from '@/lib/packageSubcategoryField';
import {
  PRICING_MODEL_LABELS, resolveEffectivePricingConfig, derivePricingFieldsForModel,
  validatePackagePricingForm, resolveInitialPricingModel, resolveUnitLabel,
  shouldShowGuestCapacityFields,
} from '@/lib/packagePricingField';
import { describeGroupRule, formatDelta, cheapestPaidAddon } from '@/lib/modifierSelection';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';

const SECCIONES = [
  { id: 'info', label: 'Información', icon: Info },
  { id: 'precio', label: 'Precio', icon: DollarSign },
  { id: 'incluye', label: 'Qué incluye', icon: ListChecks },
  { id: 'adicionales', label: 'Adicionales', icon: PlusCircle },
  { id: 'preview', label: 'Vista previa', icon: Eye },
];

// Cómo se cobra, explicado en la lengua del proveedor. No son los labels
// técnicos: acá se dice qué le pasa al cliente.
const EXPLICACION_MODALIDAD = {
  fixed_package: 'El cliente paga un precio total por todo lo incluido.',
  per_person: 'El precio se multiplica por la cantidad de invitados.',
  per_hour: 'El precio se multiplica por las horas contratadas.',
  per_unit: 'El precio se multiplica por la cantidad de unidades.',
  custom_quote: 'No se muestra precio. El cliente te contacta para pedir un presupuesto.',
};

const VACIA = {
  name: '', description: '', subcategoryId: '', pricingModel: null,
  adultPrice: '', childPrice: '', childAgeLimit: 14,
  minGuests: '', maxGuests: '',
  durationHours: '', allowsExtraHours: false, extraHourPrice: '', maxExtraHours: '',
  unitPrice: '', unitLabelSingular: '', unitLabelPlural: '', minUnits: '', maxUnits: '',
  hourlyPrice: '', defaultBillableHours: '',
  offersCeliacMenu: false, celiacUnitPrice: '', celiacDescription: '',
};

const moneda = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

export default function OptionBuilder({ service, option, onClose, onSaved }) {
  const { showToast } = useApp();
  const editando = !!option;

  const [seccion, setSeccion] = useState('info');
  const [form, setForm] = useState(VACIA);
  const [sucio, setSucio] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);

  // Id real de la opción: en alta aparece recién después del primer guardado.
  const [packageId, setPackageId] = useState(option?.id || null);

  const [inclusiones, setInclusiones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [extras, setExtras] = useState([]);
  const [cargandoExtras, setCargandoExtras] = useState(false);
  // El backend responde 404 en estos endpoints cuando la funcionalidad no
  // está habilitada. En ese caso las secciones no se muestran: ofrecer
  // botones que no van a funcionar es peor que no ofrecerlos.
  const [adicionalesDisponibles, setAdicionalesDisponibles] = useState(true);

  // ── Subcategoría ────────────────────────────────────────────────────────
  const { subcategories, status: subStatus, reload: recargarSubcategorias } =
    useSubcategories(service.packageOptionsEnabled ? service.categoryId : null);
  const { resolved: subResuelto, required: subRequerida, showField: mostrarSubcategoria } =
    deriveSubcategoryFieldState(subStatus, subcategories, service.packageOptionsEnabled, service.packageOptionRequired);
  const opcionesSubcategoria = buildSubcategoryOptions(subcategories, option?.subcategoryId || null, option?.subcategoryName || null);
  const etiquetaSubcategoria = getSubcategoryFieldLabel(service.packageOptionLabel);
  const ayudaSubcategoria = getSubcategoryHelpText(service.packageOptionHelpText);

  // ── Modalidad ───────────────────────────────────────────────────────────
  const configCategoria = {
    pricingAllowedModels: service.pricingAllowedModels,
    pricingDefaultModel: service.pricingDefaultModel,
    guestUsageMode: service.guestUsageMode,
    capacityBasis: service.capacityBasis,
    unitLabelSingular: service.categoryUnitLabelSingular,
    unitLabelPlural: service.categoryUnitLabelPlural,
    supportsDietaryRestrictions: service.supportsDietaryRestrictions,
  };
  const subSeleccionada = subcategories.find((s) => s.id === form.subcategoryId) || null;
  const configEfectiva = resolveEffectivePricingConfig(configCategoria, subSeleccionada);
  const modelo = form.pricingModel || configEfectiva.pricingDefaultModel;
  const campos = derivePricingFieldsForModel(modelo, configEfectiva.supportsDietaryRestrictions);
  const mostrarCapacidad = shouldShowGuestCapacityFields(modelo, configEfectiva.guestUsageMode);
  const unidadSingular = resolveUnitLabel({ singular: form.unitLabelSingular }, configEfectiva, false);
  const unidadPlural = resolveUnitLabel({ plural: form.unitLabelPlural }, configEfectiva, true);
  const modelosPermitidos = configEfectiva.pricingAllowedModels || [];

  // Cambiar de subcategoría recalcula lo permitido. Si el modelo actual deja
  // de estarlo, se avisa — nunca se pisa en silencio lo que el proveedor eligió.
  const modeloIncompatible = form.pricingModel && !modelosPermitidos.includes(form.pricingModel);

  // ── Carga inicial ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!option) {
      setForm({ ...VACIA, pricingModel: configCategoria.pricingDefaultModel || null });
      return;
    }
    const sub = subcategories.find((s) => s.id === (option.subcategoryId || null)) || null;
    const config = resolveEffectivePricingConfig(configCategoria, sub);
    setForm({
      name: option.name || '',
      description: option.description || '',
      subcategoryId: option.subcategoryId || '',
      pricingModel: resolveInitialPricingModel(option.pricingModel, config),
      adultPrice: option.adultPrice ?? '',
      childPrice: option.childPrice ?? '',
      childAgeLimit: option.childAgeLimit ?? 14,
      minGuests: option.minGuests ?? '',
      maxGuests: option.maxGuests ?? '',
      durationHours: option.durationHours ?? '',
      allowsExtraHours: !!option.allowsExtraHours,
      extraHourPrice: option.extraHourPrice ?? '',
      maxExtraHours: option.maxExtraHours ?? '',
      unitPrice: option.unitPrice ?? '',
      unitLabelSingular: option.unitLabelSingular || '',
      unitLabelPlural: option.unitLabelPlural || '',
      minUnits: option.minUnits ?? '',
      maxUnits: option.maxUnits ?? '',
      hourlyPrice: option.hourlyPrice ?? '',
      defaultBillableHours: option.defaultBillableHours ?? '',
      offersCeliacMenu: !!option.offersCeliacMenu,
      celiacUnitPrice: option.celiacUnitPrice ?? '',
      celiacDescription: option.celiacDescription || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option?.id, subcategories.length]);

  const cargarDetalle = async (id) => {
    if (!id) return;
    setCargandoExtras(true);
    try {
      const [inc, grp, ext] = await Promise.all([
        modifierService.getInclusions(service.id, id),
        modifierService.getGroups(service.id, id),
        modifierService.getExtras(service.id),
      ]);
      setInclusiones(inc);
      setGrupos(grp);
      setExtras(ext.filter((e) => e.isActive));
    } catch (err) {
      // 404 = la funcionalidad no está habilitada. No es un error del
      // proveedor, así que no se le muestra un toast: se ocultan las
      // secciones que dependen de ella.
      if (err?.status === 404) setAdicionalesDisponibles(false);
      else showToast(err?.message || 'No se pudieron cargar los adicionales', 'error');
    } finally {
      setCargandoExtras(false);
    }
  };

  // Las inclusiones y los grupos cuelgan de la opción: recién se pueden
  // cargar cuando existe su id.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarDetalle(packageId); }, [packageId]);

  // Si la sección abierta deja de estar disponible, se vuelve a Información
  // en vez de dejar el panel vacío.
  useEffect(() => {
    if (!adicionalesDisponibles && (seccion === 'incluye' || seccion === 'adicionales')) setSeccion('info');
  }, [adicionalesDisponibles, seccion]);

  const set = (campo, valor) => { setForm((f) => ({ ...f, [campo]: valor })); setSucio(true); };

  // ── Guardado de la información básica ───────────────────────────────────
  const validar = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Poné un nombre para esta opción';

    const subError = validateSubcategorySelection({
      resolved: subResuelto, required: subRequerida,
      subcategoryId: form.subcategoryId || null,
      validOptionIds: opcionesSubcategoria.map((o) => o.id),
    });
    if (subError) errs.subcategoryId = subError;

    const preciosError = validatePackagePricingForm(modelo, form, configEfectiva);
    Object.assign(errs, preciosError || {});
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const guardar = async () => {
    if (!validar()) {
      showToast('Revisá los campos marcados', 'error');
      return;
    }
    setGuardando(true);
    try {
      const payload = { ...form, subcategoryId: form.subcategoryId || null, pricingModel: modelo };
      const guardada = packageId
        ? await serviceService.updatePackage(service.id, packageId, payload)
        : await serviceService.createPackage(service.id, payload);
      if (!packageId) {
        setPackageId(guardada.id);
        if (adicionalesDisponibles) {
          showToast('Opción creada. Ahora podés agregar qué incluye y sus adicionales.', 'success');
          setSeccion('incluye');
        } else {
          showToast('Opción creada', 'success');
        }
      } else {
        showToast('Opción guardada', 'success');
      }
      setSucio(false);
      onSaved?.();
    } catch (err) {
      showToast(err?.message || 'No se pudo guardar la opción', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const cerrar = () => {
    if (sucio) { setConfirmarDescarte(true); return; }
    onClose();
  };

  // ── Inclusiones ─────────────────────────────────────────────────────────
  const [nuevaInclusion, setNuevaInclusion] = useState({ name: '', quantity: '' });

  const agregarInclusion = async () => {
    if (!nuevaInclusion.name.trim() || !packageId) return;
    try {
      const creada = await modifierService.createInclusion(service.id, packageId, nuevaInclusion);
      setInclusiones((l) => [...l, creada]);
      setNuevaInclusion({ name: '', quantity: '' });
    } catch (err) { showToast(err?.message || 'No se pudo agregar', 'error'); }
  };

  const quitarInclusion = async (id) => {
    try {
      await modifierService.deleteInclusion(service.id, packageId, id);
      setInclusiones((l) => l.filter((i) => i.id !== id));
    } catch (err) { showToast(err?.message || 'No se pudo eliminar', 'error'); }
  };

  // ── Adicionales ─────────────────────────────────────────────────────────
  const [nuevoGrupo, setNuevoGrupo] = useState(null);
  const [nuevoExtra, setNuevoExtra] = useState(null);

  const crearGrupo = async () => {
    if (!nuevoGrupo?.name?.trim()) return;
    try {
      const g = await modifierService.createGroup(service.id, packageId, {
        name: nuevoGrupo.name,
        description: nuevoGrupo.description,
        // Nace opcional siempre: un grupo obligatorio sin alternativas sería
        // imposible de satisfacer y el backend lo rechaza. El mínimo se sube
        // después de cargar los items.
        minSelections: 0,
        maxSelections: nuevoGrupo.maxSelections || null,
      });
      setGrupos((l) => [...l, g]);
      setNuevoGrupo(null);
    } catch (err) { showToast(err?.message || 'No se pudo crear el grupo', 'error'); }
  };

  const cambiarObligatoriedad = async (grupo, obligatorio) => {
    try {
      const actualizado = await modifierService.updateGroup(service.id, packageId, grupo.id, {
        minSelections: obligatorio ? 1 : 0,
      });
      setGrupos((l) => l.map((g) => (g.id === grupo.id ? { ...actualizado, items: grupo.items } : g)));
    } catch (err) {
      showToast(err?.message || 'No se pudo cambiar', 'error');
    }
  };

  const eliminarGrupo = async (grupoId) => {
    try {
      await modifierService.deleteGroup(service.id, packageId, grupoId);
      setGrupos((l) => l.filter((g) => g.id !== grupoId));
    } catch (err) { showToast(err?.message || 'No se pudo eliminar', 'error'); }
  };

  const agregarItem = async (grupo, extraId, priceDelta) => {
    try {
      const item = await modifierService.addItem(service.id, packageId, grupo.id, { extraId, priceDelta });
      const extra = extras.find((e) => e.id === extraId);
      setGrupos((l) => l.map((g) => (g.id === grupo.id
        ? { ...g, items: [...g.items, { ...item, name: extra?.name || '' }] } : g)));
    } catch (err) { showToast(err?.message || 'No se pudo agregar el adicional', 'error'); }
  };

  const quitarItem = async (grupo, itemId) => {
    try {
      await modifierService.removeItem(service.id, packageId, grupo.id, itemId);
      setGrupos((l) => l.map((g) => (g.id === grupo.id ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g)));
    } catch (err) { showToast(err?.message || 'No se pudo quitar', 'error'); }
  };

  const crearExtra = async () => {
    if (!nuevoExtra?.name?.trim()) return;
    try {
      const e = await modifierService.createExtra(service.id, nuevoExtra);
      setExtras((l) => [...l, e]);
      setNuevoExtra(null);
    } catch (err) { showToast(err?.message || 'No se pudo crear el adicional', 'error'); }
  };

  // ── Vista previa ────────────────────────────────────────────────────────
  const desde = useMemo(() => cheapestPaidAddon(grupos), [grupos]);
  const precioMostrado = modelo === 'custom_quote'
    ? 'A consultar'
    : moneda(form.adultPrice || form.unitPrice || form.hourlyPrice || 0);

  const titulo = editando ? 'Editar opción' : 'Nueva opción';

  return (
    <>
      <Modal
        open
        onClose={cerrar}
        size="lg"
        title={titulo}
        className="!max-w-[880px]"
        footer={(
          <div className="flex items-center justify-between w-full gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">
              {service.title} · {service.categoryName}
            </span>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={cerrar} disabled={guardando}>Cancelar</Button>
              <Button onClick={guardar} loading={guardando}>
                {packageId ? 'Guardar cambios' : 'Crear opción'}
              </Button>
            </div>
          </div>
        )}
      >
        <div className="flex flex-col sm:flex-row gap-5 min-h-[420px]">

          {/* Navegación de secciones */}
          <nav className="sm:w-44 shrink-0 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible -mx-1 px-1">
            {SECCIONES.filter((s) => adicionalesDisponibles || (s.id !== 'incluye' && s.id !== 'adicionales')).map((s) => {
              const bloqueada = !packageId && (s.id === 'incluye' || s.id === 'adicionales');
              const activa = seccion === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={bloqueada}
                  onClick={() => setSeccion(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors
                    ${activa ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-100'}
                    ${bloqueada ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={bloqueada ? 'Guardá la opción primero' : undefined}
                >
                  <AppIcon icon={s.icon} className="w-4 h-4" />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 min-w-0">

            {/* ── Información ─────────────────────────────────────────── */}
            {seccion === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre de la opción *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Ej: DJ + iluminación esencial"
                    error={errores.name}
                  />
                </div>

                {mostrarSubcategoria && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {etiquetaSubcategoria}{subRequerida ? ' *' : ''}
                    </label>
                    <select
                      value={form.subcategoryId || ''}
                      onChange={(e) => set('subcategoryId', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="">Sin especificar</option>
                      {opcionesSubcategoria.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    {ayudaSubcategoria && <p className="text-xs text-gray-500 mt-1">{ayudaSubcategoria}</p>}
                    {errores.subcategoryId && <p className="text-xs text-danger mt-1">{errores.subcategoryId}</p>}
                  </div>
                )}

                {/* Habilitadas pero la consulta falló: se dice, no se oculta. */}
                {service.packageOptionsEnabled && subStatus === 'error' && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/5 border border-danger/20">
                    <AppIcon icon={AlertCircle} className="w-4 h-4 text-danger mt-0.5 shrink-0" />
                    <div className="text-xs text-gray-700">
                      No se pudo cargar el tipo de opción.
                      <button type="button" onClick={recargarSubcategorias} className="ml-1 text-primary font-semibold underline">
                        Reintentar
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                    placeholder="Ej: DJ, sonido e iluminación para fiestas de hasta 100 personas."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── Precio ──────────────────────────────────────────────── */}
            {seccion === 'precio' && (
              <div className="space-y-4">
                {/* La modalidad SIEMPRE se muestra, aunque haya una sola. */}
                {modelosPermitidos.length <= 1 ? (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">
                      {PRICING_MODEL_LABELS[modelo] || modelo}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{EXPLICACION_MODALIDAD[modelo]}</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      ¿Cómo querés cobrar esta opción?
                    </label>
                    <div className="grid gap-2">
                      {modelosPermitidos.map((m) => (
                        <label
                          key={m}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                            ${modelo === m ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <input
                            type="radio"
                            name="pricing-model"
                            checked={modelo === m}
                            onChange={() => set('pricingModel', m)}
                            className="mt-0.5 accent-primary"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-gray-900">{PRICING_MODEL_LABELS[m] || m}</span>
                            <span className="block text-xs text-gray-600">{EXPLICACION_MODALIDAD[m]}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {modeloIncompatible && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
                    <AppIcon icon={AlertCircle} className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-700">
                      El tipo de opción que elegiste no admite{' '}
                      <span className="font-semibold">{PRICING_MODEL_LABELS[form.pricingModel]}</span>.
                      Elegí otra forma de cobro antes de guardar.
                    </p>
                  </div>
                )}

                {/* Campos por modalidad — derivados, nunca por if de slug. */}
                {campos.showAdultPrice && (
                  <CampoPrecio
                    label={modelo === 'per_person' ? 'Precio por adulto *' : 'Precio total *'}
                    value={form.adultPrice} onChange={(v) => set('adultPrice', v)} error={errores.adultPrice}
                  />
                )}
                {campos.showChildPrice && (
                  <CampoPrecio label="Precio por niño" value={form.childPrice}
                    onChange={(v) => set('childPrice', v)} error={errores.childPrice} />
                )}
                {campos.showUnitPrice && (
                  <>
                    <CampoPrecio label={`Precio por ${unidadSingular} *`} value={form.unitPrice}
                      onChange={(v) => set('unitPrice', v)} error={errores.unitPrice} />
                    <div className="grid grid-cols-2 gap-3">
                      <CampoNumero label={`Mínimo de ${unidadPlural}`} value={form.minUnits} onChange={(v) => set('minUnits', v)} />
                      <CampoNumero label={`Máximo de ${unidadPlural}`} value={form.maxUnits} onChange={(v) => set('maxUnits', v)} />
                    </div>
                  </>
                )}
                {campos.showHourlyPrice && (
                  <CampoPrecio label="Precio por hora *" value={form.hourlyPrice}
                    onChange={(v) => set('hourlyPrice', v)} error={errores.hourlyPrice} />
                )}
                {campos.showDurationHours && (
                  <CampoNumero label="Horas incluidas" value={form.durationHours}
                    onChange={(v) => set('durationHours', v)} error={errores.durationHours} />
                )}
                {mostrarCapacidad && (
                  <div className="grid grid-cols-2 gap-3">
                    <CampoNumero label="Mínimo de invitados" value={form.minGuests} onChange={(v) => set('minGuests', v)} />
                    <CampoNumero label="Máximo de invitados" value={form.maxGuests} onChange={(v) => set('maxGuests', v)} />
                  </div>
                )}
                {modelo === 'custom_quote' && (
                  <p className="text-xs text-gray-600 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    Esta opción no muestra precio. El cliente ve “A consultar” y te contacta para
                    pedir un presupuesto.
                  </p>
                )}
              </div>
            )}

            {/* ── Qué incluye ─────────────────────────────────────────── */}
            {seccion === 'incluye' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  Lo que el cliente recibe sin costo extra. Es informativo: no cambia el precio.
                </p>

                <div className="space-y-2">
                  {inclusiones.map((i) => (
                    <div key={i.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white">
                      <AppIcon icon={Check} className="w-4 h-4 text-success shrink-0" />
                      <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">
                        {i.quantity ? `${i.quantity} ${i.name}` : i.name}
                      </span>
                      <Button iconOnly icon={Trash2} variant="ghost" size="sm"
                        aria-label={`Quitar ${i.name}`} onClick={() => quitarInclusion(i.id)} />
                    </div>
                  ))}
                  {!inclusiones.length && !cargandoExtras && (
                    <p className="text-sm text-gray-500 py-3">Todavía no agregaste elementos.</p>
                  )}
                </div>

                <div className="flex gap-2 items-end pt-2 border-t border-gray-100">
                  <div className="w-20">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad</label>
                    <Input type="number" min="1" value={nuevaInclusion.quantity} placeholder="—"
                      onChange={(e) => setNuevaInclusion((n) => ({ ...n, quantity: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Elemento</label>
                    <Input value={nuevaInclusion.name} placeholder="Ej: Parlantes"
                      onChange={(e) => setNuevaInclusion((n) => ({ ...n, name: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarInclusion(); } }} />
                  </div>
                  <Button icon={Plus} onClick={agregarInclusion} disabled={!nuevaInclusion.name.trim()}>
                    Agregar
                  </Button>
                </div>
              </div>
            )}

            {/* ── Adicionales ─────────────────────────────────────────── */}
            {seccion === 'adicionales' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-600">
                  Agrupá lo que el cliente puede sumar. Un grupo obligatorio lo obliga a elegir una
                  alternativa; uno opcional puede saltearlo.
                </p>

                {grupos.map((g) => (
                  <div key={g.id} className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-start gap-2 p-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{g.name}</p>
                        <p className="text-xs text-gray-600">{describeGroupRule(g)}</p>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 shrink-0">
                        <input type="checkbox" checked={g.isRequired} className="accent-primary"
                          onChange={(e) => cambiarObligatoriedad(g, e.target.checked)} />
                        Obligatorio
                      </label>
                      <Button iconOnly icon={Trash2} variant="ghost" size="sm"
                        aria-label={`Eliminar ${g.name}`} onClick={() => eliminarGrupo(g.id)} />
                    </div>

                    <div className="p-3 space-y-2">
                      {g.items.map((it) => (
                        <div key={it.id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 min-w-0 truncate text-gray-800">{it.name}</span>
                          <span className={`text-xs font-semibold ${it.priceDelta === 0 ? 'text-success' : 'text-gray-700'}`}>
                            {formatDelta(it.priceDelta, moneda)}
                          </span>
                          <Button iconOnly icon={X} variant="ghost" size="sm"
                            aria-label={`Quitar ${it.name}`} onClick={() => quitarItem(g, it.id)} />
                        </div>
                      ))}
                      {!g.items.length && <p className="text-xs text-gray-500">Sin adicionales todavía.</p>}
                      <SelectorDeExtra extras={extras} grupo={g} onAdd={agregarItem} />
                    </div>
                  </div>
                ))}

                {nuevoGrupo ? (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <Input autoFocus value={nuevoGrupo.name} placeholder="Nombre del grupo. Ej: Iluminación adicional"
                      onChange={(e) => setNuevoGrupo((g) => ({ ...g, name: e.target.value }))} />
                    <div className="flex gap-2 items-end">
                      <div className="w-32">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Máximo a elegir</label>
                        <Input type="number" min="1" value={nuevoGrupo.maxSelections || ''} placeholder="Sin tope"
                          onChange={(e) => setNuevoGrupo((g) => ({ ...g, maxSelections: e.target.value }))} />
                      </div>
                      <Button onClick={crearGrupo} disabled={!nuevoGrupo.name.trim()}>Crear grupo</Button>
                      <Button variant="ghost" onClick={() => setNuevoGrupo(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" icon={Plus} onClick={() => setNuevoGrupo({ name: '', maxSelections: '' })}>
                    Nuevo grupo de adicionales
                  </Button>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Adicionales del servicio</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {extras.map((e) => (
                      <span key={e.id} className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                        {e.name}
                      </span>
                    ))}
                    {!extras.length && <span className="text-xs text-gray-500">Todavía no creaste ninguno.</span>}
                  </div>
                  {nuevoExtra ? (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input autoFocus value={nuevoExtra.name} placeholder="Ej: Máquina de humo"
                          onChange={(e) => setNuevoExtra((x) => ({ ...x, name: e.target.value }))} />
                      </div>
                      <Button onClick={crearExtra} disabled={!nuevoExtra.name.trim()}>Crear</Button>
                      <Button variant="ghost" onClick={() => setNuevoExtra(null)}>Cancelar</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" icon={Plus} onClick={() => setNuevoExtra({ name: '', price: 0 })}>
                      Crear adicional
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* ── Vista previa ────────────────────────────────────────── */}
            {seccion === 'preview' && (
              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <p className="text-xs text-gray-500 mb-3">Así lo va a ver el cliente:</p>

                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <h4 className="text-base font-bold text-gray-900">{form.name || 'Sin nombre'}</h4>
                  <span className="text-base font-bold text-primary whitespace-nowrap">{precioMostrado}</span>
                </div>

                {form.description && <p className="text-sm text-gray-600 mb-3">{form.description}</p>}

                {!!inclusiones.length && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Incluye:</p>
                    <ul className="space-y-0.5">
                      {inclusiones.map((i) => (
                        <li key={i.id} className="flex items-center gap-1.5 text-sm text-gray-700">
                          <AppIcon icon={Check} className="w-3.5 h-3.5 text-success shrink-0" />
                          {i.quantity ? `${i.quantity} ${i.name}` : i.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {desde != null && (
                  <p className="text-sm text-gray-600">Adicionales disponibles desde {moneda(desde)}</p>
                )}

                {grupos.some((g) => g.isRequired) && (
                  <p className="text-xs text-gray-500 mt-2">
                    El cliente va a tener que elegir en{' '}
                    {grupos.filter((g) => g.isRequired).map((g) => `“${g.name}”`).join(', ')}.
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  El total definitivo lo calcula Eventonow al momento de reservar.
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {confirmarDescarte && (
        <Modal
          open
          onClose={() => setConfirmarDescarte(false)}
          size="sm"
          title="¿Descartar los cambios?"
          footer={(
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setConfirmarDescarte(false)}>Seguir editando</Button>
              <Button variant="danger" onClick={onClose}>Descartar</Button>
            </div>
          )}
        >
          <p className="text-sm text-gray-600">
            Los cambios que hiciste en esta opción no se guardaron todavía.
          </p>
        </Modal>
      )}
    </>
  );
}

// ── Campos auxiliares ────────────────────────────────────────────────────────

function CampoPrecio({ label, value, onChange, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <Input type="number" min="0" step="1" value={value ?? ''} placeholder="0"
        onChange={(e) => onChange(e.target.value)} error={error} />
    </div>
  );
}

function CampoNumero({ label, value, onChange, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <Input type="number" min="0" value={value ?? ''} placeholder="—"
        onChange={(e) => onChange(e.target.value)} error={error} />
    </div>
  );
}

// Agregar un adicional al grupo. Los que ya están en OTRO grupo activo de esta
// misma opción no se ofrecen: el backend los rechaza para que no se cobren dos
// veces, así que la UI no debe invitar a esa configuración.
function SelectorDeExtra({ extras, grupo, onAdd }) {
  const [extraId, setExtraId] = useState('');
  const [delta, setDelta] = useState('');

  const yaEnGrupo = new Set(grupo.items.map((i) => i.extraId));
  const disponibles = extras.filter((e) => !yaEnGrupo.has(e.id));
  if (!disponibles.length) return null;

  const agregar = () => {
    if (!extraId) return;
    onAdd(grupo, extraId, delta === '' ? 0 : Number(delta));
    setExtraId(''); setDelta('');
  };

  return (
    <div className="flex gap-2 items-center pt-2 border-t border-gray-100">
      <select
        value={extraId}
        onChange={(e) => setExtraId(e.target.value)}
        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:border-primary"
      >
        <option value="">Agregar adicional…</option>
        {disponibles.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <div className="w-24">
        <Input type="number" min="0" value={delta} placeholder="Incluido"
          onChange={(e) => setDelta(e.target.value)} />
      </div>
      <Button size="sm" onClick={agregar} disabled={!extraId}>Agregar</Button>
    </div>
  );
}
