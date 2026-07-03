'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { serviceService } from '@/services/serviceService';

const EMPTY = {
  name: '', description: '', adultPrice: '', childPrice: '',
  childAgeLimit: 14, minGuests: '', maxGuests: '',
};

const money = (n) => `$${Number(n).toLocaleString('es-UY')}`;

export default function MenuManager({ service, onClose, onChanged }) {
  const { showToast } = useApp();
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
    });
  };

  const notifyChanged = () => { if (typeof onChanged === 'function') onChanged(); };

  const save = async () => {
    if (!form.name.trim()) { showToast('Ingresá un nombre para el menú', 'error'); return; }
    const adult = Number(form.adultPrice);
    if (!Number.isFinite(adult) || adult < 0) { showToast('El precio adulto es obligatorio y no puede ser negativo', 'error'); return; }
    if (form.childPrice !== '' && (!Number.isFinite(Number(form.childPrice)) || Number(form.childPrice) < 0)) {
      showToast('El precio niño no puede ser negativo', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
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
      showToast(editingId ? 'Menú actualizado' : 'Menú creado', 'success');
    } catch (err) {
      showToast(err?.message || 'No se pudo guardar el menú', 'error');
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
    if (!window.confirm(`¿Eliminar el menú "${m.name}"? Las reservas anteriores no se ven afectadas.`)) return;
    try {
      await serviceService.deletePackage(service.id, m.id);
      await load();
      notifyChanged();
      showToast('Menú eliminado', 'info');
    } catch (err) {
      showToast(err?.message || 'No se pudo eliminar el menú', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">Menús / opciones</h3>
            <p className="text-xs text-gray-500 truncate">{service.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ── FORM VIEW ── */}
          {form ? (
            <div className="space-y-3">
              <button onClick={() => { setForm(null); setEditingId(null); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-1">
                <ArrowLeft size={14} /> Volver a la lista
              </button>
              <h4 className="font-bold text-gray-900">{editingId ? 'Editar menú' : 'Nuevo menú'}</h4>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Ej: Pizza party" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Qué incluye este menú" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Precio adulto * (por persona)</label>
                  <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="0" value={form.adultPrice} onChange={(e) => setForm({ ...form, adultPrice: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Precio niño <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Sin cargo" value={form.childPrice} onChange={(e) => setForm({ ...form, childPrice: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Edad niño (máx.)</label>
                  <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={form.childAgeLimit} onChange={(e) => setForm({ ...form, childAgeLimit: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mín. invitados</label>
                  <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="—" value={form.minGuests} onChange={(e) => setForm({ ...form, minGuests: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Máx. invitados</label>
                  <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="—" value={form.maxGuests} onChange={(e) => setForm({ ...form, maxGuests: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setForm(null); setEditingId(null); }} disabled={saving}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={save} disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark text-sm transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Crear menú')}
                </button>
              </div>
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <>
              <button onClick={openCreate}
                className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 border-2 border-dashed border-primary/30 text-primary font-semibold rounded-xl hover:bg-primary-light transition-colors text-sm">
                <Plus size={16} /> Agregar menú
              </button>

              {loading ? (
                <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}</div>
              ) : menus.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  Todavía no tenés menús. Creá el primero para que los clientes puedan elegir.
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
                          <div className="text-xs text-gray-600 mt-0.5">
                            Adulto <span className="font-semibold">{money(m.adultPrice)}</span>
                            {m.childPrice != null ? <> · Niño (hasta {m.childAgeLimit}) <span className="font-semibold">{money(m.childPrice)}</span></> : ' · sin precio niño'}
                          </div>
                          {(m.minGuests || m.maxGuests) && (
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {m.minGuests ? `mín. ${m.minGuests}` : ''}{m.minGuests && m.maxGuests ? ' · ' : ''}{m.maxGuests ? `máx. ${m.maxGuests}` : ''} invitados
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => toggle(m)} title={m.isActive ? 'Desactivar' : 'Activar'}
                            className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors">
                            {m.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button onClick={() => openEdit(m)} title="Editar"
                            className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => remove(m)} title="Eliminar"
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors">
                            <Trash2 size={15} />
                          </button>
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
