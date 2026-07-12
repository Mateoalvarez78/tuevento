'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Eye, Pencil, Pause, Play, Trash2, Image as ImageIcon,
  ClipboardList, Send, Star, MapPin, CalendarClock, AlertTriangle, SearchX,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useSessionState } from '@/hooks/useSessionState';
import { getCategoryIcon } from '@/utils/icons';
import { safeFormatDate } from '@/lib/date';
import { serviceService } from '@/services/serviceService';
import { categoryService } from '@/services/categoryService';
import { assetUrl } from '@/services/api';
import ServiceStatusBadge from '@/components/ServiceStatusBadge';
import EmptyState from '@/components/EmptyState';
import MenuManager from '@/components/dashboard/proveedor/MenuManager';
import ServiceImageManager from '@/components/dashboard/proveedor/ServiceImageManager';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Drawer from '@/components/Drawer';
import Chip from '@/components/Chip';
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
  use_provider_capacity: true, max_concurrent_events: '', max_concurrent_guests: '',
  duration_minutes: '', preparation_minutes: '0', cleanup_minutes: '0', minimum_booking_notice_hours: '',
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
    use_provider_capacity: s.useProviderCapacity !== false,
    max_concurrent_events: s.maxConcurrentEvents != null ? String(s.maxConcurrentEvents) : '',
    max_concurrent_guests: s.maxConcurrentGuests != null ? String(s.maxConcurrentGuests) : '',
    duration_minutes: s.durationMinutes != null ? String(s.durationMinutes) : '',
    preparation_minutes: s.preparationMinutes != null ? String(s.preparationMinutes) : '0',
    cleanup_minutes: s.cleanupMinutes != null ? String(s.cleanupMinutes) : '0',
    minimum_booking_notice_hours: s.minimumBookingNoticeHours != null ? String(s.minimumBookingNoticeHours) : '',
  };
}

export default function ProviderServicesPage() {
  const { showToast } = useApp();

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useSessionState('provServiciosSearch', '');
  const [statusFilter, setStatusFilter] = useSessionState('provServiciosStatus', 'all');
  const [categoryFilter, setCategoryFilter] = useSessionState('provServiciosCategory', 'all');

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
      useProviderCapacity: f.use_provider_capacity,
      maxConcurrentEvents: f.use_provider_capacity ? null : (f.max_concurrent_events !== '' ? Number(f.max_concurrent_events) : null),
      maxConcurrentGuests: f.use_provider_capacity ? null : (f.max_concurrent_guests !== '' ? Number(f.max_concurrent_guests) : null),
      durationMinutes: f.duration_minutes !== '' ? Number(f.duration_minutes) : null,
      preparationMinutes: f.preparation_minutes !== '' ? Number(f.preparation_minutes) : 0,
      cleanupMinutes: f.cleanup_minutes !== '' ? Number(f.cleanup_minutes) : 0,
      minimumBookingNoticeHours: f.use_provider_capacity ? null : (f.minimum_booking_notice_hours !== '' ? Number(f.minimum_booking_notice_hours) : null),
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
    <>
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-sm text-gray-500">{services.length} servicio{services.length !== 1 ? 's' : ''}</p>
        <Button icon={Plus} onClick={openCreate}>Crear servicio</Button>
      </div>

      {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <Input
            icon={Search}
            wrapperClassName="flex-1 min-w-[180px] max-w-xs"
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
            {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.label}</option>)}
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
            <AppIcon icon={AlertTriangle} size={32} className="mx-auto text-amber-500 mb-3" aria-hidden="true" />
            <p className="text-gray-700 font-medium mb-1">No pudimos cargar tus servicios</p>
            <p className="text-sm text-gray-500 mb-5">{error}</p>
            <Button onClick={reload}>Reintentar</Button>
          </div>
        )}

        {/* Empty: sin servicios */}
        {!loading && !error && services.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState
              icon={ClipboardList}
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
            <EmptyState icon={SearchX} title="Sin resultados" description="Ningún servicio coincide con estos filtros." />
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
        <Modal
          open
          onClose={() => setConfirmDelete(null)}
          title="Eliminar servicio"
          size="sm"
          footer={
            <>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" loading={busyId === confirmDelete.id} onClick={handleDelete}>
                Eliminar
              </Button>
            </>
          }
        >
          <p className="text-sm text-gray-500">
            ¿Seguro que querés eliminar <strong>{confirmDelete.title}</strong>? Vas a poder seguir viéndolo en tu historial de reservas, pero deja de estar disponible.
          </p>
        </Modal>
      )}

      {menuService && <MenuManager service={menuService} onClose={() => setMenuService(null)} onChanged={reload} />}
      {imageService && <ServiceImageManager service={imageService} onClose={() => setImageService(null)} onChanged={reload} />}
    </>
  );
}

function ServiceRow({ service: s, busy, onEdit, onImages, onMenus, onSubmit, onPause, onResume, onDelete }) {
  const CategoryIcon = getCategoryIcon(s.category);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
          {s.primaryImage ? (
            <img src={assetUrl(s.primaryImage)} alt={s.title} className="w-full h-full object-cover" />
          ) : (
            <AppIcon icon={CategoryIcon} size={24} strokeWidth={1.5} className="text-gray-400" aria-hidden="true" />
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
            <span className="flex items-center gap-1"><AppIcon icon={MapPin} size={11} aria-hidden="true" /> {s.zones.length ? s.zones.join(', ') : 'Sin zona definida'}</span>
            <span className="flex items-center gap-1">
              <AppIcon icon={Star} size={11} className={s.rating > 0 ? 'text-yellow-400 fill-current' : 'text-gray-300'} aria-hidden="true" />
              {s.rating > 0 ? `${s.rating.toFixed(1)} (${s.reviewCount})` : 'Sin reseñas'}
            </span>
            <span>{s.bookings} reserva{s.bookings !== 1 ? 's' : ''}</span>
            {s.updatedAt && <span className="flex items-center gap-1"><AppIcon icon={CalendarClock} size={11} aria-hidden="true" /> {safeFormatDate(s.updatedAt)}</span>}
          </div>
          {s.statusReason && (
            <div className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
              <AppIcon icon={AlertTriangle} size={11} aria-hidden="true" /> {s.statusReason}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-gray-50">
        <Button variant="outline" size="sm" icon={Pencil} onClick={onEdit}>Editar</Button>
        <Button variant="outline" size="sm" icon={ImageIcon} className="!text-primary !border-primary/30 hover:!bg-primary-light" onClick={onImages}>Fotos</Button>
        <Button variant="outline" size="sm" icon={ClipboardList} className="!text-primary !border-primary/30 hover:!bg-primary-light" onClick={onMenus}>Menús</Button>
        {s.status === 'active' && (
          <Button variant="ghost" size="sm" icon={Eye} href={`/proveedor/${s.id}`} target="_blank">Ver público</Button>
        )}
        {(s.status === 'draft' || s.status === 'rejected') && (
          <Button size="sm" icon={Send} disabled={busy} onClick={onSubmit}>
            {s.status === 'rejected' ? 'Reenviar a revisión' : 'Enviar a revisión'}
          </Button>
        )}
        {s.status === 'active' && (
          <Button variant="warning" size="sm" icon={Pause} disabled={busy} onClick={onPause}>Pausar</Button>
        )}
        {s.status === 'paused' && (
          <Button variant="success" size="sm" icon={Play} disabled={busy} onClick={onResume}>Reactivar</Button>
        )}
        {(s.status === 'draft' || s.status === 'pending_review' || s.status === 'paused' || s.status === 'rejected') && (
          <Button iconOnly icon={Trash2} variant="ghost" size="sm" className="ml-auto !text-gray-400 hover:!text-red-500" aria-label="Eliminar" title="Eliminar" disabled={busy} onClick={onDelete} />
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
    <Drawer
      open
      onClose={onClose}
      title={editing ? 'Editar servicio' : 'Nuevo servicio'}
      footer={
        <>
          <Button variant="outline" className="flex-1" disabled={saving} onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" loading={saving} onClick={onSave}>
            {editing ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
          <Input
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
            {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.label}</option>)}
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
            <Input type="number" min="0" placeholder="0" value={form.price_from} onChange={(e) => setForm({ price_from: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mín. invitados</label>
            <Input type="number" min="0" value={form.min_guests} onChange={(e) => setForm({ min_guests: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Máx. invitados</label>
            <Input type="number" min="0" value={form.max_guests} onChange={(e) => setForm({ max_guests: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Duración (hs)</label>
            <Input type="number" min="0" step="0.5" value={form.duration_hours} onChange={(e) => setForm({ duration_hours: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Zonas de cobertura</label>
          <div className="flex flex-wrap gap-2">
            {ZONES.map((z) => (
              <Chip key={z} selected={form.zones.includes(z)} onClick={() => toggleZone(z)}>{z}</Chip>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Capacidad y disponibilidad</label>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-3">
            <input
              type="checkbox"
              checked={form.use_provider_capacity}
              onChange={(e) => setForm({ use_provider_capacity: e.target.checked })}
            />
            Usar la capacidad general de mi cuenta (configurada en Calendario → Configuración)
          </label>

          {!form.use_provider_capacity && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Máx. eventos simultáneos</label>
                <Input type="number" min="1" placeholder="Ej: 1" value={form.max_concurrent_events} onChange={(e) => setForm({ max_concurrent_events: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Máx. personas simultáneas</label>
                <Input type="number" min="1" placeholder="Sin límite" value={form.max_concurrent_guests} onChange={(e) => setForm({ max_concurrent_guests: e.target.value })} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Duración estimada (min.)</label>
              <Input type="number" min="0" placeholder="Ej: 300" value={form.duration_minutes} onChange={(e) => setForm({ duration_minutes: e.target.value })} />
            </div>
            {!form.use_provider_capacity && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Anticipación mínima (hs)</label>
                <Input type="number" min="0" placeholder="Ej: 72" value={form.minimum_booking_notice_hours} onChange={(e) => setForm({ minimum_booking_notice_hours: e.target.value })} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Preparación previa (min.)</label>
              <Input type="number" min="0" value={form.preparation_minutes} onChange={(e) => setForm({ preparation_minutes: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Desmontaje (min.)</label>
              <Input type="number" min="0" value={form.cleanup_minutes} onChange={(e) => setForm({ cleanup_minutes: e.target.value })} />
            </div>
          </div>
        </div>

        {editing && (
          <p className="text-xs text-gray-400">
            Para cambiar fotos o menús, usá los botones "Fotos" y "Menús" de la lista. El estado de publicación se cambia con las acciones de cada tarjeta.
          </p>
        )}
      </div>
    </Drawer>
  );
}
