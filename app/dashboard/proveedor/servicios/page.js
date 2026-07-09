'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Search, Eye, Pencil, Pause, Play, Trash2, Image as ImageIcon,
  ClipboardList, Send, Star, MapPin, CalendarClock, AlertTriangle, X,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { serviceService } from '@/services/serviceService';
import { categoryService } from '@/services/categoryService';
import { assetUrl } from '@/services/api';
import ServiceStatusBadge from '@/components/ServiceStatusBadge';
import EmptyState from '@/components/EmptyState';
import MenuManager from '@/components/dashboard/proveedor/MenuManager';
import ServiceImageManager from '@/components/dashboard/proveedor/ServiceImageManager';
import { ZONES } from '@/utils/constants';

const PRICE_TYPES = [
  { id: 'per_person', label: 'Por persona' },
  { id: 'per_event',  label: 'Por evento'  },
  { id: 'per_hour',   label: 'Por hora'    },
];

const STATUS_FILTERS = [
  { id: 'all',            label: 'Todos' },
  { id: 'draft',          label: 'Borrador' },
  { id: 'pending_review', label: 'En revisión' },
  { id: 'active',         label: 'Activo' },
  { id: 'paused',         label: 'Pausado' },
  { id: 'rejected',       label: 'Rechazado' },
];

const EMPTY_FORM = {
  title: '', category_id: '', description: '', price_type: 'per_person', price_from: '',
  min_guests: '', max_guests: '', duration_hours: '', zones: [],
};

function serviceToForm(s) {
  return {
    title: s.title || '',
    category_id: s.categoryId || '',
    description: s.description || '',
    price_type: s.priceType || 'per_person',
    price_from: s.priceFrom != null ? String(s.priceFrom) : '',
    min_guests: s.minGuests != null ? String(s.minGuests) : '',
    max_guests: s.maxGuests != null ? String(s.maxGuests) : '',
    duration_hours: s.durationHours != null ? String(s.durationHours) : '',
    zones: Array.isArray(s.zones) ? s.zones : [],
  };
}

export default function ProviderServicesPage() {
  const { showToast } = useApp();
  const access = useRequireRole(['provider']);

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [drawer, setDrawer] = useState(null); // { editing: service|null, form }
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [menuService, setMenuService] = useState(null);
  const [imageService, setImageService] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [svcs, cats] = await Promise.all([
        serviceService.getByProvider(),
        categoryService.getAll(),
      ]);
      setServices(svcs || []);
      setCategories(cats || []);
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar los servicios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (access === 'loading' || access === 'denied') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Verificando acceso…</div>;
  }
  if (access === 'unauth') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Necesitás iniciar sesión</h2>
          <Link href="/provider/login" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">Ingresar</Link>
        </div>
      </div>
    );
  }

  const filtered = services.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || s.title.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || s.categoryId === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const openCreate = () => setDrawer({ editing: null, form: { ...EMPTY_FORM } });
  const openEdit = (s) => setDrawer({ editing: s, form: serviceToForm(s) });

  const handleSave = async () => {
    const f = drawer.form;
    if (!f.title.trim()) { showToast('Ingresá un título', 'error'); return; }
    if (!f.category_id) { showToast('Elegí una categoría', 'error'); return; }
    const price = Number(f.price_from);
    if (!Number.isFinite(price) || price < 0) { showToast('Ingresá un precio base válido', 'error'); return; }

    const payload = {
      category_id: f.category_id,
      title: f.title.trim(),
      description: f.description.trim(),
      price_type: f.price_type,
      price_from: price,
      min_guests: f.min_guests !== '' ? Number(f.min_guests) : null,
      max_guests: f.max_guests !== '' ? Number(f.max_guests) : null,
      duration_hours: f.duration_hours !== '' ? Number(f.duration_hours) : null,
      zones: f.zones,
    };

    setSaving(true);
    try {
      if (drawer.editing) {
        await serviceService.update(drawer.editing.id, payload);
        showToast('Servicio actualizado', 'success');
      } else {
        await serviceService.create(payload);
        showToast('Servicio creado como borrador', 'success');
      }
      setDrawer(null);
      await reload();
    } catch (e) {
      showToast(e?.message || 'No se pudo guardar el servicio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const runStatusAction = async (service, action, label) => {
    setBusyId(service.id);
    try {
      await serviceService[action](service.id);
      showToast(label, 'success');
      await reload();
    } catch (e) {
      showToast(e?.message || 'No se pudo completar la acción', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    const s = confirmDelete;
    setBusyId(s.id);
    try {
      await serviceService.remove(s.id);
      showToast('Servicio eliminado', 'info');
      setConfirmDelete(null);
      await reload();
    } catch (e) {
      showToast(e?.message || 'No se pudo eliminar el servicio', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/dashboard/proveedor" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-1">
              <ArrowLeft size={13} /> Panel de proveedor
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Mis servicios</h1>
          </div>
          <button
            onClick={openCreate}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus size={15} /> Crear servicio
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_FILTERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-primary"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.icon} {c.label}</option>)}
          </select>
          {!loading && !error && (
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} de {services.length} servicio{services.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
            <p className="text-gray-700 font-medium mb-1">No pudimos cargar tus servicios</p>
            <p className="text-sm text-gray-500 mb-5">{error}</p>
            <button onClick={reload} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
              Reintentar
            </button>
          </div>
        )}

        {/* Empty: sin servicios */}
        {!loading && !error && services.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState
              icon="📋"
              title="Todavía no tenés servicios"
              description="Creá tu primer servicio para empezar a aparecer en el catálogo de Eventonow."
              cta="Crear mi primer servicio"
              onCta={openCreate}
            />
          </div>
        )}

        {/* Empty: sin resultados para filtros */}
        {!loading && !error && services.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState icon="🔍" title="Sin resultados" description="Ningún servicio coincide con estos filtros." />
          </div>
        )}

        {/* List */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <ServiceRow
                key={s.id}
                service={s}
                busy={busyId === s.id}
                onEdit={() => openEdit(s)}
                onImages={() => setImageService(s)}
                onMenus={() => setMenuService(s)}
                onSubmit={() => runStatusAction(s, 'submit', 'Enviado a revisión')}
                onPause={() => runStatusAction(s, 'pause', 'Servicio pausado')}
                onResume={() => runStatusAction(s, 'resume', 'Servicio reactivado')}
                onDelete={() => setConfirmDelete(s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit drawer */}
      {drawer && (
        <ServiceDrawer
          drawer={drawer}
          setDrawer={setDrawer}
          categories={categories}
          saving={saving}
          onSave={handleSave}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar servicio</h3>
            <p className="text-sm text-gray-500 mb-5">
              ¿Seguro que querés eliminar <strong>{confirmDelete.title}</strong>? Vas a poder seguir viéndolo en tu historial de reservas, pero deja de estar disponible.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={busyId === confirmDelete.id} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 text-sm transition-colors disabled:opacity-50">
                {busyId === confirmDelete.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {menuService && <MenuManager service={menuService} onClose={() => setMenuService(null)} onChanged={reload} />}
      {imageService && <ServiceImageManager service={imageService} onClose={() => setImageService(null)} onChanged={reload} />}
    </div>
  );
}

function ServiceRow({ service: s, busy, onEdit, onImages, onMenus, onSubmit, onPause, onResume, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
          {s.primaryImage ? (
            <img src={assetUrl(s.primaryImage)} alt={s.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl leading-none">{s.categoryEmoji || '📦'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-gray-900 truncate">{s.title}</span>
            <ServiceStatusBadge status={s.status} />
          </div>
          <div className="text-xs text-gray-500 mb-1.5">
            {s.categoryLabel} · desde ${s.priceFrom.toLocaleString('es-UY')} {s.priceUnit}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={11} /> {s.zones.length ? s.zones.join(', ') : 'Sin zona definida'}</span>
            <span className="flex items-center gap-1">
              <Star size={11} className={s.rating > 0 ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
              {s.rating > 0 ? `${s.rating.toFixed(1)} (${s.reviewCount})` : 'Sin reseñas'}
            </span>
            <span>{s.bookings} reserva{s.bookings !== 1 ? 's' : ''}</span>
            {s.updatedAt && <span className="flex items-center gap-1"><CalendarClock size={11} /> {new Date(s.updatedAt + 'T12:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}</span>}
          </div>
          {s.statusReason && (
            <div className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle size={11} /> {s.statusReason}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-gray-50">
        <button onClick={onEdit} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Pencil size={12} /> Editar
        </button>
        <button onClick={onImages} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors">
          <ImageIcon size={12} /> Fotos
        </button>
        <button onClick={onMenus} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors">
          <ClipboardList size={12} /> Menús
        </button>
        {s.status === 'active' && (
          <Link href={`/proveedor/${s.id}`} target="_blank" className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors">
            <Eye size={12} /> Ver público
          </Link>
        )}
        {(s.status === 'draft' || s.status === 'rejected') && (
          <button disabled={busy} onClick={onSubmit} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
            <Send size={12} /> {s.status === 'rejected' ? 'Reenviar a revisión' : 'Enviar a revisión'}
          </button>
        )}
        {s.status === 'active' && (
          <button disabled={busy} onClick={onPause} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50">
            <Pause size={12} /> Pausar
          </button>
        )}
        {s.status === 'paused' && (
          <button disabled={busy} onClick={onResume} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
            <Play size={12} /> Reactivar
          </button>
        )}
        {(s.status === 'draft' || s.status === 'pending_review' || s.status === 'paused' || s.status === 'rejected') && (
          <button disabled={busy} onClick={onDelete} className="ml-auto p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors" title="Eliminar">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function ServiceDrawer({ drawer, setDrawer, categories, saving, onSave, onClose }) {
  const { editing, form } = drawer;
  const setForm = (patch) => setDrawer({ ...drawer, form: { ...form, ...patch } });
  const toggleZone = (z) => {
    const has = form.zones.includes(z);
    setForm({ zones: has ? form.zones.filter((x) => x !== z) : [...form.zones, z] });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-gray-900">{editing ? 'Editar servicio' : 'Nuevo servicio'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Ej: Catering para casamientos"
              value={form.title}
              onChange={(e) => setForm({ title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría *</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={form.category_id}
              onChange={(e) => setForm({ category_id: e.target.value })}
            >
              <option value="">Seleccioná...</option>
              {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.icon} {c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Contá qué incluye tu servicio"
              value={form.description}
              onChange={(e) => setForm({ description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Modalidad</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.price_type}
                onChange={(e) => setForm({ price_type: e.target.value })}
              >
                {PRICE_TYPES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Precio base *</label>
              <input
                type="number" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="0"
                value={form.price_from}
                onChange={(e) => setForm({ price_from: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mín. invitados</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={form.min_guests} onChange={(e) => setForm({ min_guests: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Máx. invitados</label>
              <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={form.max_guests} onChange={(e) => setForm({ max_guests: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Duración (hs)</label>
              <input type="number" min="0" step="0.5" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={form.duration_hours} onChange={(e) => setForm({ duration_hours: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Zonas de cobertura</label>
            <div className="flex flex-wrap gap-2">
              {ZONES.map((z) => {
                const active = form.zones.includes(z);
                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() => toggleZone(z)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${active ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary/40'}`}
                  >
                    {z}
                  </button>
                );
              })}
            </div>
          </div>

          {editing && (
            <p className="text-xs text-gray-400">
              Para cambiar fotos o menús, usá los botones "Fotos" y "Menús" de la lista. El estado de publicación se cambia con las acciones de cada tarjeta.
            </p>
          )}
        </div>

        <div className="flex gap-2 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving} className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark text-sm transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear servicio'}
          </button>
        </div>
      </div>
    </div>
  );
}
