'use client';

import { useState } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, AlertTriangle, Layers,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { adminService } from '@/services/adminService';
import { useAdminCategories, useAdminSubcategories } from '@/hooks/useAdminCatalog';
import {
  slugify, reorderIds, describeDeleteBlock, categoryUsageCounts, subcategoryUsageCounts,
  validateCategoryForm, validateSubcategoryForm, needsActiveOptionsWarning,
  describePricingSchema, describeConfigChangeWarning,
} from '@/lib/catalogAdmin';
import {
  PRICING_MODELS, PRICING_MODEL_LABELS, GUEST_USAGE_MODES, GUEST_USAGE_MODE_LABELS,
  CAPACITY_BASIS_VALUES, CAPACITY_BASIS_LABELS,
} from '@/lib/packagePricingField';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { TABLE_HEAD_CLS, TABLE_ROW_HOVER_CLS } from '@/components/Table';

const inputCls = 'w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60';
const labelCls = 'block text-xs font-semibold text-gray-400 mb-1.5';
const checkboxCls = 'rounded border-gray-700 bg-gray-950 text-primary focus:ring-primary/30';

// ── Formulario de categoría (crear/editar) ──────────────────────────────────
function CategoryFormModal({ category, onClose, onSaved }) {
  const { showToast } = useApp();
  const isCreate = !category;
  const [form, setForm] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    emoji: category?.emoji || '',
    description: category?.description || '',
    isActive: category?.isActive ?? true,
    packageOptionsEnabled: category?.packageOptionsEnabled || false,
    packageOptionRequired: category?.packageOptionRequired ?? true,
    packageOptionLabel: category?.packageOptionLabel || '',
    packageOptionHelpText: category?.packageOptionHelpText || '',
    // Modelo comercial declarativo (reemplaza el hardcode isSalon/isCatering
    // que tenía MenuManager.js) — ver lib/packagePricingField.js.
    pricingAllowedModels: category?.pricingAllowedModels || ['per_person'],
    pricingDefaultModel: category?.pricingDefaultModel || 'per_person',
    guestUsageMode: category?.guestUsageMode || 'price',
    capacityBasis: category?.capacityBasis || 'total_guests',
    unitLabelSingular: category?.unitLabelSingular || '',
    unitLabelPlural: category?.unitLabelPlural || '',
    supportsDietaryRestrictions: category?.supportsDietaryRestrictions || false,
  });
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);

  const setName = (name) => {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  // Tildar/destildar un modelo — si el default queda fuera del nuevo
  // conjunto, cae al primero que quede (nunca deja un default inválido).
  const togglePricingModel = (model) => {
    setForm((f) => {
      const has = f.pricingAllowedModels.includes(model);
      const next = has ? f.pricingAllowedModels.filter((m) => m !== model) : [...f.pricingAllowedModels, model];
      const nextDefault = next.includes(f.pricingDefaultModel) ? f.pricingDefaultModel : (next[0] || f.pricingDefaultModel);
      return { ...f, pricingAllowedModels: next, pricingDefaultModel: nextDefault };
    });
  };

  const previewLines = describePricingSchema(form);
  const changeWarning = !isCreate ? describeConfigChangeWarning(category, form, category.serviceCount) : null;

  const save = async () => {
    const validation = validateCategoryForm(form, { isCreate });
    if (!validation.valid) { showToast(validation.message, 'error'); return; }
    setSaving(true);
    try {
      const saved = isCreate
        ? await adminService.categories.create(form)
        : await adminService.categories.update(category.id, form);
      showToast(isCreate ? 'Categoría creada' : 'Categoría actualizada', 'success');
      onSaved(saved);
    } catch (err) {
      showToast(err?.message || 'No se pudo guardar la categoría', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      theme="dark"
      title={isCreate ? 'Nueva categoría' : 'Editar categoría'}
      footer={
        <>
          <Button variant="ghost" theme="dark" className="ml-auto" disabled={saving} onClick={onClose}>Cancelar</Button>
          <Button loading={saving} onClick={save}>{isCreate ? 'Crear' : 'Guardar cambios'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Nombre *</label>
          <Input variant="dark" value={form.name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Comida mexicana" />
        </div>
        <div>
          <label className={labelCls}>
            Slug {isCreate ? '*' : ''}
            {!isCreate && <span className="text-gray-500 font-normal ml-1">(no editable — puede estar en uso en URLs/filtros)</span>}
          </label>
          <Input
            variant="dark" value={form.slug} disabled={!isCreate}
            onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
            placeholder="comida-mexicana" className={!isCreate ? 'opacity-60' : ''}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Emoji <span className="text-gray-500 font-normal">(opcional)</span></label>
            <Input variant="dark" value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🌮" maxLength={10} />
          </div>
          {!isCreate && (
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" className={checkboxCls} checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Categoría activa
              </label>
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>Descripción <span className="text-gray-500 font-normal">(opcional)</span></label>
          <textarea
            className={`${inputCls} resize-none`} rows={2} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="border-t border-gray-800 pt-4">
          <label className="flex items-center gap-2 text-sm text-gray-200 font-medium mb-3">
            <input type="checkbox" className={checkboxCls} checked={form.packageOptionsEnabled}
              onChange={(e) => setForm((f) => ({ ...f, packageOptionsEnabled: e.target.checked }))} />
            Esta categoría clasifica sus paquetes por subcategoría
          </label>
          <p className="text-xs text-gray-500 -mt-2 mb-3">
            Habilitá esto para que el proveedor vea un selector de &quot;tipo de menú/opción&quot; al crear un paquete en esta categoría.
          </p>
          {form.packageOptionsEnabled && (
            <div className="space-y-3 pl-1">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" className={checkboxCls} checked={form.packageOptionRequired}
                  onChange={(e) => setForm((f) => ({ ...f, packageOptionRequired: e.target.checked }))} />
                Selección obligatoria
              </label>
              <div>
                <label className={labelCls}>Nombre del campo <span className="text-gray-500 font-normal">(el proveedor lo ve como label)</span></label>
                <Input variant="dark" value={form.packageOptionLabel}
                  onChange={(e) => setForm((f) => ({ ...f, packageOptionLabel: e.target.value }))}
                  placeholder="Tipo de menú / opción" />
              </div>
              <div>
                <label className={labelCls}>Ayuda breve <span className="text-gray-500 font-normal">(opcional)</span></label>
                <textarea
                  className={`${inputCls} resize-none`} rows={2} value={form.packageOptionHelpText}
                  onChange={(e) => setForm((f) => ({ ...f, packageOptionHelpText: e.target.value }))}
                  placeholder="Elegí el tipo de propuesta que mejor representa este paquete."
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 pt-4">
          <label className={labelCls}>Modelos de precio permitidos *</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {PRICING_MODELS.map((model) => (
              <label key={model} className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox" className={checkboxCls} checked={form.pricingAllowedModels.includes(model)}
                  onChange={() => togglePricingModel(model)}
                />
                {PRICING_MODEL_LABELS[model]}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelCls}>Modelo predeterminado</label>
              <select
                className={inputCls} value={form.pricingDefaultModel}
                onChange={(e) => setForm((f) => ({ ...f, pricingDefaultModel: e.target.value }))}
              >
                {form.pricingAllowedModels.map((model) => (
                  <option key={model} value={model}>{PRICING_MODEL_LABELS[model]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Uso de la cantidad de invitados</label>
              <select
                className={inputCls} value={form.guestUsageMode}
                onChange={(e) => setForm((f) => ({ ...f, guestUsageMode: e.target.value }))}
              >
                {GUEST_USAGE_MODES.map((mode) => (
                  <option key={mode} value={mode}>{GUEST_USAGE_MODE_LABELS[mode]}</option>
                ))}
              </select>
            </div>
          </div>

          {form.guestUsageMode === 'capacity' && (
            <div className="mb-3">
              <label className={labelCls}>Base de capacidad</label>
              <select
                className={inputCls} value={form.capacityBasis}
                onChange={(e) => setForm((f) => ({ ...f, capacityBasis: e.target.value }))}
              >
                {CAPACITY_BASIS_VALUES.map((basis) => (
                  <option key={basis} value={basis}>{CAPACITY_BASIS_LABELS[basis]}</option>
                ))}
              </select>
            </div>
          )}

          {form.pricingAllowedModels.includes('per_unit') && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>Unidad — singular</label>
                <Input variant="dark" value={form.unitLabelSingular}
                  onChange={(e) => setForm((f) => ({ ...f, unitLabelSingular: e.target.value }))} placeholder="castillo" />
              </div>
              <div>
                <label className={labelCls}>Unidad — plural</label>
                <Input variant="dark" value={form.unitLabelPlural}
                  onChange={(e) => setForm((f) => ({ ...f, unitLabelPlural: e.target.value }))} placeholder="castillos" />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-300 mb-3">
            <input type="checkbox" className={checkboxCls} checked={form.supportsDietaryRestrictions}
              onChange={(e) => setForm((f) => ({ ...f, supportsDietaryRestrictions: e.target.checked }))} />
            Admite restricciones alimentarias (menú celíaco)
          </label>

          {previewLines.length > 0 && (
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-400 space-y-1">
              <p className="text-gray-300 font-medium mb-1">Vista previa para el proveedor</p>
              {previewLines.map((line) => <p key={line}>{line}</p>)}
            </div>
          )}

          {changeWarning && (
            <div className="mt-3 flex items-start gap-2 bg-amber-500/10 text-amber-400 text-xs rounded-xl p-3">
              <AppIcon icon={AlertTriangle} size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{changeWarning}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Formulario de subcategoría (crear/editar) ───────────────────────────────
function SubcategoryFormModal({ category, subcategory, onClose, onSaved }) {
  const { showToast } = useApp();
  const isCreate = !subcategory;
  const [form, setForm] = useState({
    categoryId: category.id,
    name: subcategory?.name || '',
    slug: subcategory?.slug || '',
    description: subcategory?.description || '',
    isActive: subcategory?.isActive ?? true,
    pricingAllowedModels: subcategory?.pricingAllowedModels || null,
    pricingDefaultModel: subcategory?.pricingDefaultModel || null,
    guestUsageMode: subcategory?.guestUsageMode ?? null,
    capacityBasis: subcategory?.capacityBasis ?? null,
    unitLabelSingular: subcategory?.unitLabelSingular ?? null,
    unitLabelPlural: subcategory?.unitLabelPlural ?? null,
    supportsDietaryRestrictions: subcategory?.supportsDietaryRestrictions ?? null,
  });
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  // Un solo toggle para TODO el bloque de pricing — "hereda de la categoría"
  // (todos los 7 campos en null) vs. "personalizada" (valores propios,
  // arrancando desde los de la categoría como base editable). Precedencia
  // real subcategoría>categoría vive en el backend/pricing-schema.js — acá
  // solo se decide si esta subcategoría manda algo distinto de null. Arranca
  // tildado si YA había cualquier override (modelo O solo etiqueta de
  // unidad, ej. "Tortas personalizadas" solo sobrescribe la etiqueta).
  const [customizesPricing, setCustomizesPricing] = useState(!!(
    subcategory?.pricingAllowedModels || subcategory?.guestUsageMode || subcategory?.capacityBasis
    || subcategory?.unitLabelSingular || subcategory?.unitLabelPlural || subcategory?.supportsDietaryRestrictions != null
  ));

  const setName = (name) => {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  const togglePricingModel = (model) => {
    setForm((f) => {
      const current = f.pricingAllowedModels || [];
      const has = current.includes(model);
      const next = has ? current.filter((m) => m !== model) : [...current, model];
      const nextDefault = next.includes(f.pricingDefaultModel) ? f.pricingDefaultModel : (next[0] || null);
      return { ...f, pricingAllowedModels: next, pricingDefaultModel: nextDefault };
    });
  };

  const toggleCustomizesPricing = (checked) => {
    setCustomizesPricing(checked);
    setForm((f) => (checked
      ? {
        ...f,
        pricingAllowedModels: f.pricingAllowedModels || category.pricingAllowedModels || ['per_person'],
        pricingDefaultModel: f.pricingDefaultModel || category.pricingDefaultModel || 'per_person',
        guestUsageMode: f.guestUsageMode ?? category.guestUsageMode ?? 'price',
        capacityBasis: f.capacityBasis ?? category.capacityBasis ?? 'total_guests',
        supportsDietaryRestrictions: f.supportsDietaryRestrictions ?? category.supportsDietaryRestrictions ?? false,
      }
      : {
        ...f,
        pricingAllowedModels: null, pricingDefaultModel: null, guestUsageMode: null,
        capacityBasis: null, unitLabelSingular: null, unitLabelPlural: null, supportsDietaryRestrictions: null,
      }));
  };

  const effectivePreviewConfig = customizesPricing
    ? form
    : { ...category, pricingAllowedModels: category.pricingAllowedModels, pricingDefaultModel: category.pricingDefaultModel };
  const previewLines = describePricingSchema(effectivePreviewConfig);

  const save = async () => {
    const validation = validateSubcategoryForm(form, { isCreate });
    if (!validation.valid) { showToast(validation.message, 'error'); return; }
    setSaving(true);
    try {
      const saved = isCreate
        ? await adminService.categories.createSubcategory(form)
        : await adminService.categories.updateSubcategory(subcategory.id, form);
      showToast(isCreate ? 'Subcategoría creada' : 'Subcategoría actualizada', 'success');
      onSaved(saved);
    } catch (err) {
      showToast(err?.message || 'No se pudo guardar la subcategoría', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      theme="dark"
      size="sm"
      title={isCreate ? 'Nueva subcategoría' : 'Editar subcategoría'}
      footer={
        <>
          <Button variant="ghost" theme="dark" className="ml-auto" disabled={saving} onClick={onClose}>Cancelar</Button>
          <Button loading={saving} onClick={save}>{isCreate ? 'Crear' : 'Guardar cambios'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-500">Categoría: <span className="text-gray-300 font-medium">{category.name}</span></p>
        <div>
          <label className={labelCls}>Nombre *</label>
          <Input variant="dark" value={form.name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Comida mexicana" />
        </div>
        <div>
          <label className={labelCls}>
            Slug {isCreate ? '*' : ''}
            {!isCreate && <span className="text-gray-500 font-normal ml-1">(no editable)</span>}
          </label>
          <Input
            variant="dark" value={form.slug} disabled={!isCreate}
            onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
            placeholder="comida-mexicana" className={!isCreate ? 'opacity-60' : ''}
          />
        </div>
        <div>
          <label className={labelCls}>Descripción <span className="text-gray-500 font-normal">(opcional)</span></label>
          <textarea
            className={`${inputCls} resize-none`} rows={2} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        {!isCreate && (
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" className={checkboxCls} checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            Subcategoría activa
          </label>
        )}

        <div className="border-t border-gray-800 pt-4">
          <label className="flex items-center gap-2 text-sm text-gray-200 font-medium mb-1">
            <input type="checkbox" className={checkboxCls} checked={customizesPricing}
              onChange={(e) => toggleCustomizesPricing(e.target.checked)} />
            Personalizar el modelo de precio para esta subcategoría
          </label>
          <p className="text-xs text-gray-500 mb-3">
            {customizesPricing
              ? 'Esta subcategoría sobrescribe la configuración de precio de la categoría.'
              : `Hereda la configuración de "${category.name}".`}
          </p>

          {customizesPricing && (
            <>
              <label className={labelCls}>Modelos de precio permitidos *</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {PRICING_MODELS.map((model) => (
                  <label key={model} className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox" className={checkboxCls} checked={(form.pricingAllowedModels || []).includes(model)}
                      onChange={() => togglePricingModel(model)}
                    />
                    {PRICING_MODEL_LABELS[model]}
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>Modelo predeterminado</label>
                  <select
                    className={inputCls} value={form.pricingDefaultModel || ''}
                    onChange={(e) => setForm((f) => ({ ...f, pricingDefaultModel: e.target.value }))}
                  >
                    {(form.pricingAllowedModels || []).map((model) => (
                      <option key={model} value={model}>{PRICING_MODEL_LABELS[model]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Uso de invitados</label>
                  <select
                    className={inputCls} value={form.guestUsageMode || ''}
                    onChange={(e) => setForm((f) => ({ ...f, guestUsageMode: e.target.value }))}
                  >
                    {GUEST_USAGE_MODES.map((mode) => (
                      <option key={mode} value={mode}>{GUEST_USAGE_MODE_LABELS[mode]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {(customizesPricing ? (form.pricingAllowedModels || []) : category.pricingAllowedModels || []).includes('per_unit') && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelCls}>Unidad — singular <span className="text-gray-500 font-normal">(opcional)</span></label>
                <Input variant="dark" value={form.unitLabelSingular || ''}
                  onChange={(e) => setForm((f) => ({ ...f, unitLabelSingular: e.target.value || null }))} placeholder="torta" />
              </div>
              <div>
                <label className={labelCls}>Unidad — plural <span className="text-gray-500 font-normal">(opcional)</span></label>
                <Input variant="dark" value={form.unitLabelPlural || ''}
                  onChange={(e) => setForm((f) => ({ ...f, unitLabelPlural: e.target.value || null }))} placeholder="tortas" />
              </div>
            </div>
          )}

          {previewLines.length > 0 && (
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-400 space-y-1">
              <p className="text-gray-300 font-medium mb-1">Vista previa para el proveedor</p>
              {previewLines.map((line) => <p key={line}>{line}</p>)}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function AdminCatalogoPage() {
  const { showToast } = useApp();
  const { categories, status: catStatus, error: catError, reload: reloadCategories } = useAdminCategories();
  const catLoading = catStatus === 'loading';
  const [busyId, setBusyId] = useState(null);

  // Selección DERIVADA en vez de sincronizada por efecto: si el admin nunca
  // eligió nada, o su elección anterior ya no existe en la lista (borrada/
  // recargada), cae al primer resultado — sin ningún useEffect que llame
  // setState (eso es lo que dispara react-hooks/set-state-in-effect, ver
  // hooks/useAdminCatalog.js). `selectedIdOverride` solo se toca desde
  // manejadores de evento (click de fila, guardado de un modal), nunca desde
  // un efecto.
  const [selectedIdOverride, setSelectedIdOverride] = useState(null);
  const selectedId = (selectedIdOverride && categories.some((c) => c.id === selectedIdOverride))
    ? selectedIdOverride
    : (categories[0]?.id || null);

  const { subcategories, status: subStatus, error: subError, reload: reloadSubcategories } = useAdminSubcategories(selectedId);
  const subLoading = subStatus === 'loading';
  const [subBusyId, setSubBusyId] = useState(null);

  const [categoryModal, setCategoryModal] = useState(null); // null | 'create' | category
  const [subcategoryModal, setSubcategoryModal] = useState(null); // null | 'create' | subcategory

  const selected = categories.find((c) => c.id === selectedId) || null;

  // ── Categorías ─────────────────────────────────────────────────────────
  const toggleCategoryActive = async (category) => {
    setBusyId(category.id);
    try {
      await adminService.categories.update(category.id, { isActive: !category.isActive });
      showToast(category.isActive ? 'Categoría desactivada' : 'Categoría activada', 'success');
      await reloadCategories();
    } catch (err) {
      showToast(err?.message || 'No se pudo cambiar el estado', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const removeCategory = async (category) => {
    const blockMessage = describeDeleteBlock(categoryUsageCounts(category));
    const confirmMessage = blockMessage
      ? `${blockMessage}\n\n¿Igual querés intentar eliminarla? (el servidor la va a rechazar si de verdad está en uso)`
      : `¿Eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`;
    if (!window.confirm(confirmMessage)) return;
    setBusyId(category.id);
    try {
      await adminService.categories.remove(category.id);
      showToast('Categoría eliminada', 'info');
      await reloadCategories();
    } catch (err) {
      showToast(err?.message || 'No se pudo eliminar la categoría', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const moveCategory = async (index, direction) => {
    const ids = categories.map((c) => c.id);
    const nextIds = reorderIds(ids, index, direction);
    if (nextIds === ids) return; // ya estaba en el borde
    setBusyId(ids[index]);
    try {
      await adminService.categories.reorder(nextIds);
      await reloadCategories();
    } catch (err) {
      showToast(err?.message || 'No se pudo reordenar', 'error');
    } finally {
      setBusyId(null);
    }
  };

  // ── Subcategorías ──────────────────────────────────────────────────────
  const toggleSubcategoryActive = async (sub) => {
    setSubBusyId(sub.id);
    try {
      await adminService.categories.updateSubcategory(sub.id, { isActive: !sub.isActive });
      showToast(sub.isActive ? 'Subcategoría desactivada' : 'Subcategoría activada', 'success');
      await Promise.all([reloadSubcategories(), reloadCategories()]);
    } catch (err) {
      showToast(err?.message || 'No se pudo cambiar el estado', 'error');
    } finally {
      setSubBusyId(null);
    }
  };

  const removeSubcategory = async (sub) => {
    const blockMessage = describeDeleteBlock(subcategoryUsageCounts(sub));
    const confirmMessage = blockMessage
      ? `${blockMessage}\n\n¿Igual querés intentar eliminarla? (el servidor la va a rechazar si de verdad está en uso)`
      : `¿Eliminar "${sub.name}"? Esta acción no se puede deshacer.`;
    if (!window.confirm(confirmMessage)) return;
    setSubBusyId(sub.id);
    try {
      await adminService.categories.removeSubcategory(sub.id);
      showToast('Subcategoría eliminada', 'info');
      await Promise.all([reloadSubcategories(), reloadCategories()]);
    } catch (err) {
      showToast(err?.message || 'No se pudo eliminar la subcategoría', 'error');
    } finally {
      setSubBusyId(null);
    }
  };

  const moveSubcategory = async (index, direction) => {
    const ids = subcategories.map((s) => s.id);
    const nextIds = reorderIds(ids, index, direction);
    if (nextIds === ids) return;
    setSubBusyId(ids[index]);
    try {
      await adminService.categories.reorderSubcategories(selectedId, nextIds);
      await reloadSubcategories();
    } catch (err) {
      showToast(err?.message || 'No se pudo reordenar', 'error');
    } finally {
      setSubBusyId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        theme="dark" title="Configuración del catálogo"
        subtitle="Categorías y subcategorías de servicios — cambios visibles al instante, sin desplegar código."
        className="mb-6"
        action={<Button icon={Plus} onClick={() => setCategoryModal('create')}>Nueva categoría</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* ── Columna: categorías ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {catLoading ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-xl bg-gray-800" />)}</div>
          ) : catError ? (
            <div className="p-8 text-center">
              <AppIcon icon={AlertTriangle} size={24} className="mx-auto text-amber-400 mb-2" aria-hidden="true" />
              <p className="text-gray-300 text-sm mb-3">{catError?.message || 'No pudimos cargar las categorías'}</p>
              <Button size="sm" onClick={reloadCategories}>Reintentar</Button>
            </div>
          ) : categories.length === 0 ? (
            <EmptyState icon={Layers} title="Sin categorías" description="Creá la primera categoría para empezar." />
          ) : (
            <ul className="divide-y divide-gray-800">
              {categories.map((c, index) => (
                <li
                  key={c.id}
                  className={`px-4 py-3 cursor-pointer ${TABLE_ROW_HOVER_CLS.dark} ${selectedId === c.id ? 'bg-gray-800/60' : ''}`}
                  onClick={() => setSelectedIdOverride(c.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg shrink-0">{c.emoji || '📁'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-gray-100 text-sm font-medium truncate">{c.name}</span>
                        {!c.isActive && <span className="text-[10px] font-semibold text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded shrink-0">Inactiva</span>}
                        {needsActiveOptionsWarning(c) && (
                          <span title="Tiene la clasificación habilitada pero ninguna subcategoría activa" className="shrink-0">
                            <AppIcon icon={AlertTriangle} size={12} className="text-amber-400" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {c.slug} · {c.serviceCount} servicio{c.serviceCount === 1 ? '' : 's'} · {c.subcategoryActiveCount} opcion{c.subcategoryActiveCount === 1 ? '' : 'es'}
                      </p>
                    </div>
                    <div className="flex flex-col shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button type="button" disabled={index === 0 || busyId === c.id} onClick={() => moveCategory(index, 'up')}
                        className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Subir">
                        <AppIcon icon={ChevronUp} size={14} aria-hidden="true" />
                      </button>
                      <button type="button" disabled={index === categories.length - 1 || busyId === c.id} onClick={() => moveCategory(index, 'down')}
                        className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Bajar">
                        <AppIcon icon={ChevronDown} size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Panel: detalle de la categoría seleccionada ── */}
        <div className="space-y-5">
          {!selected ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center text-gray-500 text-sm">
              Elegí una categoría para ver sus subcategorías.
            </div>
          ) : (
            <>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <span>{selected.emoji || '📁'}</span> {selected.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      /{selected.slug} · {selected.serviceCount} servicios · {selected.providerCount} proveedores
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" theme="dark" icon={selected.isActive ? EyeOff : Eye}
                      loading={busyId === selected.id} onClick={() => toggleCategoryActive(selected)}>
                      {selected.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" variant="outline" theme="dark" icon={Pencil} onClick={() => setCategoryModal(selected)}>Editar</Button>
                    <Button size="sm" variant="danger" icon={Trash2} loading={busyId === selected.id} onClick={() => removeCategory(selected)}>Eliminar</Button>
                  </div>
                </div>
                {selected.description && <p className="text-sm text-gray-400 mt-2">{selected.description}</p>}

                <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full font-medium ${selected.packageOptionsEnabled ? 'bg-primary/15 text-primary' : 'bg-gray-800 text-gray-500'}`}>
                    Campo de opción: {selected.packageOptionsEnabled ? 'habilitado' : 'deshabilitado'}
                  </span>
                  {selected.packageOptionsEnabled && (
                    <span className="px-2 py-1 rounded-full font-medium bg-gray-800 text-gray-400">
                      {`${selected.packageOptionRequired ? 'Obligatorio' : 'Opcional'} · "${selected.packageOptionLabel || 'Tipo de servicio / opción'}"`}
                    </span>
                  )}
                  {needsActiveOptionsWarning(selected) && (
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full font-medium bg-amber-500/10 text-amber-400">
                      <AppIcon icon={AlertTriangle} size={12} aria-hidden="true" />
                      Habilitado pero sin subcategorías activas — el proveedor no va a ver el campo todavía.
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                  <h4 className="text-white font-semibold text-sm">Subcategorías</h4>
                  <Button size="sm" icon={Plus} onClick={() => setSubcategoryModal('create')}>Nueva subcategoría</Button>
                </div>

                {subLoading ? (
                  <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 w-full rounded-lg bg-gray-800" />)}</div>
                ) : subError ? (
                  <div className="p-8 text-center">
                    <AppIcon icon={AlertTriangle} size={22} className="mx-auto text-amber-400 mb-2" aria-hidden="true" />
                    <p className="text-gray-300 text-sm mb-3">{subError?.message || 'No pudimos cargar las subcategorías'}</p>
                    <Button size="sm" onClick={reloadSubcategories}>Reintentar</Button>
                  </div>
                ) : subcategories.length === 0 ? (
                  <EmptyState icon={Layers} title="Sin subcategorías" description='Creá la primera con "Nueva subcategoría".' />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-140">
                      <thead>
                        <tr className={TABLE_HEAD_CLS.dark}>
                          <th className="text-left px-5 py-3 font-medium">Nombre</th>
                          <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Slug</th>
                          <th className="text-left px-4 py-3 font-medium">Paquetes</th>
                          <th className="text-left px-4 py-3 font-medium">Estado</th>
                          <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {subcategories.map((s, index) => (
                          <tr key={s.id} className={TABLE_ROW_HOVER_CLS.dark}>
                            <td className="px-5 py-3 text-gray-100">{s.name}</td>
                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{s.slug}</td>
                            <td className="px-4 py-3 text-gray-400">{s.packagesCount}</td>
                            <td className="px-4 py-3">
                              {s.isActive
                                ? <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Activa</span>
                                : <span className="text-[10px] font-semibold text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Inactiva</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" disabled={index === 0 || subBusyId === s.id} onClick={() => moveSubcategory(index, 'up')}
                                  className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed p-1" aria-label="Subir">
                                  <AppIcon icon={ChevronUp} size={14} aria-hidden="true" />
                                </button>
                                <button type="button" disabled={index === subcategories.length - 1 || subBusyId === s.id} onClick={() => moveSubcategory(index, 'down')}
                                  className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed p-1" aria-label="Bajar">
                                  <AppIcon icon={ChevronDown} size={14} aria-hidden="true" />
                                </button>
                                <Button iconOnly icon={s.isActive ? EyeOff : Eye} variant="ghost" theme="dark" size="sm"
                                  aria-label={s.isActive ? 'Desactivar' : 'Activar'} title={s.isActive ? 'Desactivar' : 'Activar'}
                                  loading={subBusyId === s.id} onClick={() => toggleSubcategoryActive(s)} />
                                <Button iconOnly icon={Pencil} variant="ghost" theme="dark" size="sm"
                                  aria-label="Editar" title="Editar" onClick={() => setSubcategoryModal(s)} />
                                <Button iconOnly icon={Trash2} variant="ghost" theme="dark" size="sm"
                                  aria-label="Eliminar" title="Eliminar" className="hover:text-danger!"
                                  loading={subBusyId === s.id} onClick={() => removeSubcategory(s)} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {categoryModal && (
        <CategoryFormModal
          category={categoryModal === 'create' ? null : categoryModal}
          onClose={() => setCategoryModal(null)}
          onSaved={async (saved) => { setCategoryModal(null); await reloadCategories(); setSelectedIdOverride(saved.id); }}
        />
      )}

      {subcategoryModal && selected && (
        <SubcategoryFormModal
          category={selected}
          subcategory={subcategoryModal === 'create' ? null : subcategoryModal}
          onClose={() => setSubcategoryModal(null)}
          onSaved={async () => { setSubcategoryModal(null); await Promise.all([reloadSubcategories(), reloadCategories()]); }}
        />
      )}
    </div>
  );
}
