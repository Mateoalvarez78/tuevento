'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft, Clock } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { serviceService } from '@/services/serviceService';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';

const SALON_SLUG = 'salon-de-fiestas';

const EMPTY = {
  name: '', description: '', adultPrice: '', childPrice: '',
  childAgeLimit: 14, minGuests: '', maxGuests: '',
  durationHours: '', allowsExtraHours: false, extraHourPrice: '', maxExtraHours: '',
};

const money = (n) => `$${Number(n).toLocaleString('es-UY')}`;

export default function MenuManager({ service, onClose, onChanged }) {
  const { showToast } = useApp();
  const isSalon = service.category === SALON_SLUG;
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);      // null = lista; objeto = form
  const [editingId, setEditingId] = useState(null);

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

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY }); };
  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({
      name: m.name, description: m.description || '',
      adultPrice: m.adultPrice, childPrice: m.childPrice ?? '',
      childAgeLimit: m.childAgeLimit ?? 14,
      minGuests: m.minGuests ?? '', maxGuests: m.maxGuests ?? '',
      durationHours: m.durationHours ?? '',
      allowsExtraHours: !!m.allowsExtraHours,
      extraHourPrice: m.extraHourPrice ?? '',
      maxExtraHours: m.maxExtraHours ?? '',
    });
  };

  const notifyChanged = () => { if (typeof onChanged === 'function') onChanged(); };

  const save = async () => {
    if (!form.name.trim()) { showToast('Ingresá un nombre para el paquete', 'error'); return; }
    const adult = Number(form.adultPrice);
    if (!Number.isFinite(adult) || adult < 0) { showToast('El precio es obligatorio y no puede ser negativo', 'error'); return; }
    if (isSalon && !(adult > 0)) { showToast('El precio del paquete debe ser mayor que cero', 'error'); return; }
    if (!isSalon && form.childPrice !== '' && (!Number.isFinite(Number(form.childPrice)) || Number(form.childPrice) < 0)) {
      showToast('El precio niño no puede ser negativo', 'error'); return;
    }
    const duration = Number(form.durationHours);
    if (isSalon && !(duration > 0)) { showToast('La duración del paquete es obligatoria y debe ser mayor que cero', 'error'); return; }
    if (isSalon && form.allowsExtraHours) {
      const extraPrice = Number(form.extraHourPrice);
      const maxExtra = Number(form.maxExtraHours);
      if (!Number.isFinite(extraPrice) || extraPrice < 0 || form.extraHourPrice === '') {
        showToast('El precio por hora extra es obligatorio si habilitás horas extra', 'error'); return;
      }
      if (!Number.isInteger(maxExtra) || maxExtra <= 0) {
        showToast('El máximo de horas extra debe ser mayor que cero', 'error'); return;
      }
    }

    setSaving(true);
    try {
      const payload = isSalon ? {
        name: form.name.trim(),
        description: form.description.trim(),
        adultPrice: adult,
        childPrice: null,
        maxGuests: form.maxGuests === '' ? null : Number(form.maxGuests),
        durationHours: duration,
        allowsExtraHours: form.allowsExtraHours,
        extraHourPrice: form.allowsExtraHours ? Number(form.extraHourPrice) : null,
        maxExtraHours: form.allowsExtraHours ? Number(form.maxExtraHours) : null,
      } : {
        name: form.name.trim(),
        description: form.description.trim(),
        adultPrice: adult,
        childPrice: form.childPrice === '' ? null : Number(form.childPrice),
        childAgeLimit: Number(form.childAgeLimit) || 14,
        minGuests: form.minGuests === '' ? null : Number(form.minGuests),
        maxGuests: form.maxGuests === '' ? null : Number(form.maxGuests),
      };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{isSalon ? 'Paquetes del salón' : 'Menús / opciones'}</h3>
            <p className="text-xs text-gray-500 truncate">{service.title}</p>
          </div>
          <Button iconOnly icon={X} variant="ghost" size="sm" aria-label="Cerrar" onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ── FORM VIEW ── */}
          {form ? (
            <div className="space-y-3">
              <button onClick={() => { setForm(null); setEditingId(null); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-1">
                <AppIcon icon={ArrowLeft} size={14} aria-hidden="true" /> Volver a la lista
              </button>
              <h4 className="font-bold text-gray-900">
                {editingId ? (isSalon ? 'Editar paquete' : 'Editar menú') : (isSalon ? 'Nuevo paquete' : 'Nuevo menú')}
              </h4>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del paquete *</label>
                <Input
                  placeholder={isSalon ? 'Ej: Jornada corta' : 'Ej: Pizza party'}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Qué incluye este paquete" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {isSalon ? (
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
                    Definí cuánto cuesta reservar el salón durante este bloque de horas. El cliente podrá agregar horas extra si habilitás esa opción.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Capacidad máxima <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <Input type="number" min="0" placeholder="Personas" value={form.maxGuests}
                      onChange={(e) => setForm({ ...form, maxGuests: e.target.value })} />
                  </div>
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
              ) : (
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
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Edad niño (máx.)</label>
                      <Input type="number" min="0" value={form.childAgeLimit}
                        onChange={(e) => setForm({ ...form, childAgeLimit: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Mín. invitados</label>
                      <Input type="number" min="0" placeholder="—" value={form.minGuests}
                        onChange={(e) => setForm({ ...form, minGuests: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Máx. invitados</label>
                      <Input type="number" min="0" placeholder="—" value={form.maxGuests}
                        onChange={(e) => setForm({ ...form, maxGuests: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" disabled={saving}
                  onClick={() => { setForm(null); setEditingId(null); }}>
                  Cancelar
                </Button>
                <Button className="flex-1" loading={saving} onClick={save}>
                  {editingId ? 'Guardar cambios' : (isSalon ? 'Crear paquete' : 'Crear menú')}
                </Button>
              </div>
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <>
              <Button variant="outline" className="w-full mb-4 border-2 border-dashed border-primary/30 text-primary hover:bg-primary-light"
                icon={Plus} onClick={openCreate}>
                {isSalon ? 'Agregar paquete' : 'Agregar menú'}
              </Button>

              {loading ? (
                <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}</div>
              ) : menus.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  {isSalon
                    ? 'Todavía no tenés paquetes. Creá el primero (ej: jornada corta y jornada extendida) para poder publicar el salón.'
                    : 'Todavía no tenés menús. Creá el primero para que los clientes puedan elegir.'}
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
                          {m.isDurationPackage ? (
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
        </div>
      </div>
    </div>
  );
}
