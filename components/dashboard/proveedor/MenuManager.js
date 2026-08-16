'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft, Clock } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { serviceService } from '@/services/serviceService';
import { useSubcategories } from '@/hooks/useSubcategories';
import {
  getSubcategoryFieldLabel, getSubcategoryHelpText, deriveSubcategoryFieldState,
  buildSubcategoryOptions, validateSubcategorySelection,
} from '@/lib/packageSubcategoryField';
import {
  PRICING_MODEL_LABELS, resolveEffectivePricingConfig, derivePricingFieldsForModel,
  validatePackagePricingForm, resolveInitialPricingModel, resolveUnitLabel, shouldShowGuestCapacityFields,
} from '@/lib/packagePricingField';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';

const EMPTY = {
  pricingModel: '', // se completa al abrir el form según el default resuelto de categoría/subcategoría
  name: '', description: '', adultPrice: '', childPrice: '',
  childAgeLimit: 14, minGuests: '', maxGuests: '',
  durationHours: '', allowsExtraHours: false, extraHourPrice: '', maxExtraHours: '',
  offersCeliacMenu: false, celiacUnitPrice: '', celiacDescription: '',
  unitPrice: '', unitLabelSingular: '', unitLabelPlural: '', minUnits: '', maxUnits: '',
  subcategoryId: '',
};
// Subcategoría persistida ORIGINAL del paquete en edición (id + name tal
// cual venían del backend al abrir el form) — separada de `form.subcategoryId`
// a propósito: `buildSubcategoryOptions` necesita el valor ORIGINAL para
// poder seguir ofreciendo la opción histórica aunque el usuario ya haya
// tocado el <select> durante esta sesión de edición (ver MenuManager más
// abajo). Nunca se resetea desde un useEffect que dependa de la carga de
// subcategorías — así nunca se pierde la selección ya hecha por el usuario.
const NO_ORIGINAL_SUBCATEGORY = { id: null, name: null };

const money = (n) => `$${Number(n).toLocaleString('es-UY')}`;

export default function MenuManager({ service, onClose, onChanged }) {
  const { showToast } = useApp();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);      // null = lista; objeto = form
  const [editingId, setEditingId] = useState(null);
  // Subcategoría original del paquete en edición (no cambia con el <select>
  // del usuario) — ver comentario de NO_ORIGINAL_SUBCATEGORY arriba.
  const [originalSubcategory, setOriginalSubcategory] = useState(NO_ORIGINAL_SUBCATEGORY);

  // Configuración administrable del catálogo (Admin > Configuración del
  // catálogo) — 100% data-driven, nunca por categoryId/slug hardcodeado acá.
  // Solo se consulta el catálogo de subcategorías si la categoría lo tiene
  // habilitado: `useSubcategories` nunca dispara la petición con un id
  // "falsy", así que pasarle `null` cuando está deshabilitada reusa esa
  // misma guarda en vez de agregar una condición nueva.
  const { subcategories, status: subStatus, reload: reloadSubcategories } =
    useSubcategories(service.packageOptionsEnabled ? service.categoryId : null);
  // Única traducción de subStatus + config -> banderas del formulario (misma
  // función que testea packageSubcategoryField.test.js) — nunca repetida a mano acá.
  const { resolved: subcategoryResolved, required: subcategoryRequired, showField: showSubcategoryField } =
    deriveSubcategoryFieldState(subStatus, subcategories, service.packageOptionsEnabled, service.packageOptionRequired);
  const subcategoryOptions = buildSubcategoryOptions(subcategories, originalSubcategory.id, originalSubcategory.name);
  const subcategoryFieldLabel = getSubcategoryFieldLabel(service.packageOptionLabel);
  const subcategoryHelpText = getSubcategoryHelpText(service.packageOptionHelpText);

  // ── Modelo comercial declarativo (reemplaza isSalon/isCatering) ──────────
  // Config de CATEGORÍA resuelta desde el service (ver serviceService.js#mapService,
  // solo getMyServices trae estas 7 columnas). La subcategoría seleccionada
  // en el <select> de arriba puede sobrescribirla — resuelto en vivo, cada
  // render, nunca vía efecto.
  const categoryPricingConfig = {
    pricingAllowedModels: service.pricingAllowedModels,
    pricingDefaultModel: service.pricingDefaultModel,
    guestUsageMode: service.guestUsageMode,
    capacityBasis: service.capacityBasis,
    unitLabelSingular: service.categoryUnitLabelSingular,
    unitLabelPlural: service.categoryUnitLabelPlural,
    supportsDietaryRestrictions: service.supportsDietaryRestrictions,
  };
  const selectedSubcategory = form ? subcategories.find((s) => s.id === form.subcategoryId) || null : null;
  const effectiveConfig = resolveEffectivePricingConfig(categoryPricingConfig, selectedSubcategory);
  const pricingModel = form?.pricingModel || effectiveConfig.pricingDefaultModel;
  const pricingFields = derivePricingFieldsForModel(pricingModel, effectiveConfig.supportsDietaryRestrictions);
  const showGuestCapacityFields = shouldShowGuestCapacityFields(pricingModel, effectiveConfig.guestUsageMode);
  const unitLabelSingular = resolveUnitLabel({ singular: form?.unitLabelSingular }, effectiveConfig, false);
  const unitLabelPlural = resolveUnitLabel({ plural: form?.unitLabelPlural }, effectiveConfig, true);

  const load = async () => {
    setLoading(true);
    try {
      setMenus(await serviceService.getPackages(service.id));
    } catch (err) {
      showToast(err?.message || 'No se pudieron cargar los menús', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [service.id]);

  const openCreate = () => {
    setEditingId(null);
    setOriginalSubcategory(NO_ORIGINAL_SUBCATEGORY);
    setForm({ ...EMPTY, pricingModel: categoryPricingConfig.pricingDefaultModel });
  };
  const openEdit = (m) => {
    setEditingId(m.id);
    setOriginalSubcategory({ id: m.subcategoryId || null, name: m.subcategoryName || null });
    const sub = subcategories.find((s) => s.id === (m.subcategoryId || null)) || null;
    const config = resolveEffectivePricingConfig(categoryPricingConfig, sub);
    setForm({
      pricingModel: resolveInitialPricingModel(m.pricingModel, config),
      name: m.name, description: m.description || '',
      adultPrice: m.adultPrice, childPrice: m.childPrice ?? '',
      childAgeLimit: m.childAgeLimit ?? 14,
      minGuests: m.minGuests ?? '', maxGuests: m.maxGuests ?? '',
      durationHours: m.durationHours ?? '',
      allowsExtraHours: !!m.allowsExtraHours,
      extraHourPrice: m.extraHourPrice ?? '',
      maxExtraHours: m.maxExtraHours ?? '',
      offersCeliacMenu: !!m.offersCeliacMenu,
      celiacUnitPrice: m.celiacUnitPrice ?? '',
      celiacDescription: m.celiacDescription || '',
      unitPrice: m.unitPrice ?? '',
      unitLabelSingular: m.unitLabelSingular || '',
      unitLabelPlural: m.unitLabelPlural || '',
      minUnits: m.minUnits ?? '', maxUnits: m.maxUnits ?? '',
      subcategoryId: m.subcategoryId || '',
    });
  };

  // Cambiar de subcategoría puede cambiar el modelo EFECTIVO permitido (ej.
  // pasar a "Cupcakes y popcakes", que solo admite per_unit) — si el modelo
  // ya elegido deja de estar entre los permitidos, se recalcula al nuevo
  // default; si sigue siendo válido, se respeta la elección del proveedor.
  // Puramente event-driven (nunca un efecto) — mismo criterio que el resto
  // del formulario para no disparar react-hooks/set-state-in-effect.
  const onSubcategoryChange = (subcategoryId) => {
    const sub = subcategories.find((s) => s.id === subcategoryId) || null;
    const config = resolveEffectivePricingConfig(categoryPricingConfig, sub);
    setForm((f) => {
      const stillValid = (config.pricingAllowedModels || []).includes(f.pricingModel);
      return { ...f, subcategoryId, pricingModel: stillValid ? f.pricingModel : config.pricingDefaultModel };
    });
  };

  const notifyChanged = () => { if (typeof onChanged === 'function') onChanged(); };

  const save = async () => {
    if (!form.name.trim()) { showToast('Ingresá un nombre para el paquete', 'error'); return; }
    // Fase B.1 — nunca confunde un error de red/carga en curso con "esta
    // categoría no tiene subcategorías": bloquea el guardado si todavía no
    // se pudo confirmar el catálogo, y exige elegir una opción válida
    // (activa, o la histórica que el paquete ya tenía) si la categoría sí
    // las tiene.
    const subValidation = validateSubcategorySelection({
      resolved: subcategoryResolved,
      required: subcategoryRequired,
      subcategoryId: form.subcategoryId,
      validOptionIds: subcategoryOptions.map((o) => o.value),
    });
    if (!subValidation.valid) { showToast(subValidation.message, 'error'); return; }

    const pricingValidation = validatePackagePricingForm(pricingModel, form, effectiveConfig);
    if (!pricingValidation.valid) { showToast(pricingValidation.message, 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        pricingModel,
        name: form.name.trim(),
        description: form.description.trim(),
        adultPrice: pricingFields.showAdultPrice ? Number(form.adultPrice) : null,
        childPrice: pricingFields.showChildPrice && form.childPrice !== '' ? Number(form.childPrice) : null,
        childAgeLimit: pricingFields.showChildPrice ? (Number(form.childAgeLimit) || 14) : null,
        minGuests: showGuestCapacityFields && form.minGuests !== '' ? Number(form.minGuests) : null,
        maxGuests: showGuestCapacityFields && form.maxGuests !== '' ? Number(form.maxGuests) : null,
        durationHours: pricingFields.showDuration ? Number(form.durationHours) : null,
        allowsExtraHours: pricingFields.showExtraHours ? form.allowsExtraHours : false,
        extraHourPrice: pricingFields.showExtraHours && form.allowsExtraHours ? Number(form.extraHourPrice) : null,
        maxExtraHours: pricingFields.showExtraHours && form.allowsExtraHours ? Number(form.maxExtraHours) : null,
        // Desmarcar el checkbox limpia precio/descripción — nunca queda un
        // precio celíaco "huérfano" configurado con la opción desactivada.
        offersCeliacMenu: pricingFields.showCeliac && form.offersCeliacMenu,
        celiacUnitPrice: pricingFields.showCeliac && form.offersCeliacMenu ? Number(form.celiacUnitPrice) : null,
        celiacDescription: pricingFields.showCeliac && form.offersCeliacMenu ? form.celiacDescription.trim() : null,
        unitPrice: pricingFields.showUnitPrice ? Number(form.unitPrice) : null,
        unitLabelSingular: pricingFields.showUnitFields ? (form.unitLabelSingular.trim() || null) : null,
        unitLabelPlural: pricingFields.showUnitFields ? (form.unitLabelPlural.trim() || null) : null,
        minUnits: pricingFields.showUnitFields && form.minUnits !== '' ? Number(form.minUnits) : null,
        maxUnits: pricingFields.showUnitFields && form.maxUnits !== '' ? Number(form.maxUnits) : null,
      };
      // Fase B.1 — solo viaja si la categoría efectivamente tiene
      // subcategorías activas (`subcategoryRequired`); para el resto de las
      // categorías la clave queda `undefined` y toMenuBody la omite del
      // todo, sin tocar el payload que ya funcionaba.
      if (subcategoryRequired) payload.subcategoryId = form.subcategoryId;
      if (editingId) await serviceService.updatePackage(service.id, editingId, payload);
      else await serviceService.createPackage(service.id, payload);
      setForm(null); setEditingId(null);
      await load();
      notifyChanged();
      showToast(editingId ? 'Paquete actualizado' : 'Paquete creado', 'success');
    } catch (err) {
      showToast(err?.message || 'No se pudo guardar el paquete', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (m) => {
    try {
      await serviceService.setPackageStatus(service.id, m.id, !m.isActive);
      await load();
      notifyChanged();
    } catch (err) {
      showToast(err?.message || 'No se pudo cambiar el estado', 'error');
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`¿Eliminar el paquete "${m.name}"? Las reservas anteriores no se ven afectadas.`)) return;
    try {
      await serviceService.deletePackage(service.id, m.id);
      await load();
      notifyChanged();
      showToast('Paquete eliminado', 'info');
    } catch (err) {
      showToast(err?.message || 'No se pudo eliminar el paquete', 'error');
    }
  };

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title="Paquetes"
    >
      <p className="text-xs text-gray-500 truncate -mt-4 mb-4">{service.title}</p>
      {/* ── FORM VIEW ── */}
          {form ? (
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowLeft}
                className="!px-0 !py-1 text-gray-500 hover:text-gray-700 mb-1"
                onClick={() => { setForm(null); setEditingId(null); }}
              >
                Volver a la lista
              </Button>
              <h4 className="font-bold text-gray-900">{editingId ? 'Editar paquete' : 'Nuevo paquete'}</h4>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del paquete *</label>
                <Input
                  placeholder="Ej: Pizza party"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Fase B.1 — clasificación por subcategoría. Genérico: se
                  muestra para CUALQUIER categoría con subcategorías activas
                  (hoy Catering y Repostería y dulces), nunca hardcodeado por
                  slug. Oculto por completo (sin exigir nada) para una
                  categoría sin subcategorías confirmada. */}
              {showSubcategoryField && (
                <div>
                  <label htmlFor="package-subcategory" className="block text-xs font-semibold text-gray-600 mb-1">
                    {subcategoryFieldLabel}{subcategoryRequired ? ' *' : ''}
                  </label>
                  {subStatus === 'loading' ? (
                    <div className="skeleton h-10.5 w-full rounded-xl" />
                  ) : subStatus === 'error' ? (
                    <div className="flex items-center gap-2 text-xs text-danger">
                      <span>No se pudieron cargar las opciones.</span>
                      <Button variant="ghost" size="sm" onClick={reloadSubcategories}>Reintentar</Button>
                    </div>
                  ) : (
                    <>
                      <select
                        id="package-subcategory"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                        value={form.subcategoryId}
                        onChange={(e) => onSubcategoryChange(e.target.value)}
                      >
                        <option value="">Seleccioná...</option>
                        {subcategoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      {subcategoryHelpText && <p className="text-xs text-gray-500 mt-1">{subcategoryHelpText}</p>}
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Qué incluye este paquete" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Modelo de precio — solo se muestra un selector si la
                  categoría/subcategoría efectiva permite más de uno; con un
                  único modelo permitido, se aplica en silencio (mismo
                  criterio que showSubcategoryField: no mostrar una elección
                  que no es una elección real). */}
              {effectiveConfig.pricingAllowedModels.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Modelo de precio *</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                    value={pricingModel}
                    onChange={(e) => setForm({ ...form, pricingModel: e.target.value })}
                  >
                    {effectiveConfig.pricingAllowedModels.map((model) => (
                      <option key={model} value={model}>{PRICING_MODEL_LABELS[model]}</option>
                    ))}
                  </select>
                </div>
              )}

              {pricingFields.showDuration && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Precio del paquete *</label>
                      <Input type="number" min="0" placeholder="0" value={form.adultPrice}
                        onChange={(e) => setForm({ ...form, adultPrice: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Duración (horas) *</label>
                      <Input type="number" min="0.5" step="0.5" icon={Clock} placeholder="Ej: 5" value={form.durationHours}
                        onChange={(e) => setForm({ ...form, durationHours: e.target.value })} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 -mt-1">
                    Definí cuánto cuesta este bloque de horas. El cliente podrá agregar horas extra si habilitás esa opción.
                  </p>
                  <label className="flex items-center gap-2 text-sm text-gray-700 pt-1">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/30"
                      checked={form.allowsExtraHours}
                      onChange={(e) => setForm({ ...form, allowsExtraHours: e.target.checked })} />
                    Permitir horas extra
                  </label>
                  {form.allowsExtraHours && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Precio hora extra *</label>
                        <Input type="number" min="0" placeholder="0" value={form.extraHourPrice}
                          onChange={(e) => setForm({ ...form, extraHourPrice: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Máximo de horas extra *</label>
                        <Input type="number" min="1" placeholder="Ej: 2" value={form.maxExtraHours}
                          onChange={(e) => setForm({ ...form, maxExtraHours: e.target.value })} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {pricingFields.showAdultPrice && !pricingFields.showDuration && !pricingFields.showChildPrice && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Precio del paquete *</label>
                  <Input type="number" min="0" placeholder="0" value={form.adultPrice}
                    onChange={(e) => setForm({ ...form, adultPrice: e.target.value })} />
                </div>
              )}

              {pricingFields.showChildPrice && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Precio adulto * (por persona)</label>
                      <Input type="number" min="0" placeholder="0" value={form.adultPrice}
                        onChange={(e) => setForm({ ...form, adultPrice: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Precio niño <span className="text-gray-400 font-normal">(opcional)</span></label>
                      <Input type="number" min="0" placeholder="Sin cargo" value={form.childPrice}
                        onChange={(e) => setForm({ ...form, childPrice: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Edad niño (máx.)</label>
                    <Input type="number" min="0" value={form.childAgeLimit}
                      onChange={(e) => setForm({ ...form, childAgeLimit: e.target.value })} />
                  </div>
                  {pricingFields.showCeliac && (
                    <>
                      <label className="flex items-center gap-2 text-sm text-gray-700 pt-1">
                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/30"
                          checked={form.offersCeliacMenu}
                          onChange={(e) => setForm({ ...form, offersCeliacMenu: e.target.checked })} />
                        ¿Ofrece menú para celíacos?
                      </label>
                      {form.offersCeliacMenu && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Precio por persona del menú celíaco *</label>
                            <Input type="number" min="0" placeholder="0" value={form.celiacUnitPrice}
                              onChange={(e) => setForm({ ...form, celiacUnitPrice: e.target.value })} />
                            <p className="text-xs text-gray-500 mt-1">
                              Precio COMPLETO del menú celíaco (reemplaza al precio adulto normal para esas personas, no es un recargo). Ej: si el menú normal cuesta $350 y el celíaco $500, cargá $500 acá.
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción de la opción celíaca</label>
                            <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                              placeholder="Detallá qué incluye el menú y las medidas adoptadas para su preparación."
                              value={form.celiacDescription}
                              onChange={(e) => setForm({ ...form, celiacDescription: e.target.value })} />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {pricingFields.showUnitFields && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Precio por {unitLabelSingular} *</label>
                      <Input type="number" min="0" placeholder="0" value={form.unitPrice}
                        onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Etiqueta de unidad <span className="text-gray-400 font-normal">(opcional)</span></label>
                      <Input placeholder={unitLabelSingular} value={form.unitLabelSingular}
                        onChange={(e) => setForm({ ...form, unitLabelSingular: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Mín. de {unitLabelPlural} <span className="text-gray-400 font-normal">(opcional)</span></label>
                      <Input type="number" min="0" placeholder="—" value={form.minUnits}
                        onChange={(e) => setForm({ ...form, minUnits: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Máx. de {unitLabelPlural} <span className="text-gray-400 font-normal">(opcional)</span></label>
                      <Input type="number" min="0" placeholder="—" value={form.maxUnits}
                        onChange={(e) => setForm({ ...form, maxUnits: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {pricingModel === 'custom_quote' && (
                <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3">
                  Este paquete no tiene un precio automático: el cliente va a ver &quot;Presupuesto personalizado&quot; y va a tener que contactarte directamente para cotizar.
                </p>
              )}

              {showGuestCapacityFields && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mín. invitados <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <Input type="number" min="0" placeholder="—" value={form.minGuests}
                      onChange={(e) => setForm({ ...form, minGuests: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Máx. invitados <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <Input type="number" min="0" placeholder="—" value={form.maxGuests}
                      onChange={(e) => setForm({ ...form, maxGuests: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" disabled={saving}
                  onClick={() => { setForm(null); setEditingId(null); }}>
                  Cancelar
                </Button>
                <Button className="flex-1" loading={saving} onClick={save}>
                  {editingId ? 'Guardar cambios' : 'Crear paquete'}
                </Button>
              </div>
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <>
              <Button variant="outline" className="w-full mb-4 border-2 border-dashed border-primary/30 text-primary hover:bg-primary-light"
                icon={Plus} onClick={openCreate}>
                Agregar paquete
              </Button>

              {loading ? (
                <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}</div>
              ) : menus.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  Todavía no tenés paquetes. Creá el primero para que los clientes puedan elegir.
                </div>
              ) : (
                <div className="space-y-2">
                  {menus.map((m) => (
                    <div key={m.id} className={`border rounded-xl p-3 ${m.isActive ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-70'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                            {!m.isActive && <span className="text-[10px] font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">Inactivo</span>}
                          </div>
                          {m.pricingModel === 'custom_quote' ? (
                            <div className="text-xs text-gray-600 mt-0.5">Presupuesto personalizado</div>
                          ) : m.pricingModel === 'per_unit' ? (
                            <div className="text-xs text-gray-600 mt-0.5">
                              {money(m.unitPrice)} por {m.unitLabelSingular || m.subcategoryUnitLabelSingular || 'unidad'}
                              {(m.minUnits || m.maxUnits) ? ` · ${m.minUnits ? `mín. ${m.minUnits}` : ''}${m.minUnits && m.maxUnits ? ' · ' : ''}${m.maxUnits ? `máx. ${m.maxUnits}` : ''}` : ''}
                            </div>
                          ) : m.isDurationPackage ? (
                            <>
                              <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                <AppIcon icon={Clock} size={12} aria-hidden="true" />
                                {m.durationHours}hs · <span className="font-semibold">{money(m.adultPrice)}</span>
                              </div>
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                {m.allowsExtraHours
                                  ? `Hora extra ${money(m.extraHourPrice)} · máx. ${m.maxExtraHours}hs`
                                  : 'No permite horas extra'}
                                {m.maxGuests ? ` · capacidad máx. ${m.maxGuests}` : ''}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-xs text-gray-600 mt-0.5">
                                Adulto <span className="font-semibold">{money(m.adultPrice)}</span>
                                {m.childPrice != null ? <> · Niño (hasta {m.childAgeLimit}) <span className="font-semibold">{money(m.childPrice)}</span></> : ' · sin precio niño'}
                                {m.offersCeliacMenu && m.celiacUnitPrice != null ? <> · Celíaco <span className="font-semibold">{money(m.celiacUnitPrice)}</span></> : ''}
                              </div>
                              {(m.minGuests || m.maxGuests) && (
                                <div className="text-[11px] text-gray-400 mt-0.5">
                                  {m.minGuests ? `mín. ${m.minGuests}` : ''}{m.minGuests && m.maxGuests ? ' · ' : ''}{m.maxGuests ? `máx. ${m.maxGuests}` : ''} invitados
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button iconOnly icon={m.isActive ? Eye : EyeOff} variant="ghost" size="sm"
                            aria-label={m.isActive ? 'Desactivar' : 'Activar'} title={m.isActive ? 'Desactivar' : 'Activar'}
                            onClick={() => toggle(m)} />
                          <Button iconOnly icon={Pencil} variant="ghost" size="sm"
                            aria-label="Editar" title="Editar" onClick={() => openEdit(m)} />
                          <Button iconOnly icon={Trash2} variant="ghost" size="sm"
                            aria-label="Eliminar" title="Eliminar" className="hover:text-danger"
                            onClick={() => remove(m)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
    </Modal>
  );
}
