'use client';

// Gestión de las opciones de un servicio: la lista con su contexto, y el
// acceso al constructor. Reemplaza al gestor anterior, que abría directo un formulario vacío
// sin decir de qué servicio se trataba.
import { useState, useEffect } from 'react';
import { Plus, Pencil, Copy, Eye, EyeOff, Trash2, Package } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { serviceService } from '@/services/serviceService';
import { PRICING_MODEL_LABELS } from '@/lib/packagePricingField';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import OptionBuilder from './OptionBuilder';

const moneda = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

// Qué precio representa a la opción en la lista, según su modalidad.
const precioDe = (o) => {
  if (o.pricingModel === 'custom_quote') return 'A consultar';
  const n = o.adultPrice || o.unitPrice || o.hourlyPrice || 0;
  return moneda(n);
};

export default function OptionsManager({ service, onClose, onChanged }) {
  const { showToast } = useApp();
  const [opciones, setOpciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(null);
  const [editando, setEditando] = useState(null); // null | {} (nueva) | opción

  const cargar = async () => {
    setCargando(true);
    try {
      setOpciones(await serviceService.getPackages(service.id));
    } catch (err) {
      showToast(err?.message || 'No se pudieron cargar las opciones', 'error');
    } finally {
      setCargando(false);
    }
  };

  // Recarga al cambiar de servicio. `cargar` se redefine en cada render y
  // agregarlo a las dependencias dispararía un bucle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, [service.id]);

  const tras = async (fn, mensaje) => {
    try {
      await fn();
      await cargar();
      onChanged?.();
      if (mensaje) showToast(mensaje, 'success');
    } catch (err) {
      showToast(err?.message || 'No se pudo completar la acción', 'error');
    } finally {
      setOcupado(null);
    }
  };

  const alternarEstado = (o) => {
    setOcupado(o.id);
    return tras(
      () => serviceService.setPackageStatus(service.id, o.id, !o.isActive),
      o.isActive ? 'Opción desactivada' : 'Opción activada'
    );
  };

  const eliminar = (o) => {
    setOcupado(o.id);
    return tras(() => serviceService.deletePackage(service.id, o.id), 'Opción eliminada');
  };

  // Duplicar copia la información básica. Inclusiones y adicionales no se
  // arrastran: son configuración propia de cada opción y copiarlas en
  // silencio produciría cobros que el proveedor no revisó.
  const duplicar = (o) => {
    setOcupado(o.id);
    return tras(() => serviceService.createPackage(service.id, {
      name: `${o.name} (copia)`,
      description: o.description,
      subcategoryId: o.subcategoryId || null,
      pricingModel: o.pricingModel,
      adultPrice: o.adultPrice, childPrice: o.childPrice,
      childAgeLimit: o.childAgeLimit,
      minGuests: o.minGuests, maxGuests: o.maxGuests,
      durationHours: o.durationHours,
      allowsExtraHours: o.allowsExtraHours, extraHourPrice: o.extraHourPrice, maxExtraHours: o.maxExtraHours,
      unitPrice: o.unitPrice, unitLabelSingular: o.unitLabelSingular, unitLabelPlural: o.unitLabelPlural,
      minUnits: o.minUnits, maxUnits: o.maxUnits,
      hourlyPrice: o.hourlyPrice, defaultBillableHours: o.defaultBillableHours,
    }), 'Opción duplicada');
  };

  if (editando !== null) {
    return (
      <OptionBuilder
        service={service}
        option={editando.id ? editando : null}
        onClose={() => setEditando(null)}
        onSaved={() => { cargar(); onChanged?.(); }}
      />
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Opciones del servicio"
      footer={(
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-xs text-gray-500">
            {opciones.length} {opciones.length === 1 ? 'opción' : 'opciones'}
          </span>
          <Button icon={Plus} onClick={() => setEditando({})}>Nueva opción</Button>
        </div>
      )}
    >
      <div className="mb-4 pb-3 border-b border-gray-100">
        <h4 className="text-base font-bold text-gray-900">{service.title}</h4>
        <p className="text-xs text-gray-500">{service.categoryName}</p>
      </div>

      {cargando && <p className="text-sm text-gray-500 py-6 text-center">Cargando opciones…</p>}

      {!cargando && !opciones.length && (
        <div className="text-center py-10 px-4">
          <AppIcon icon={Package} className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h5 className="text-base font-bold text-gray-900 mb-1">Todavía no agregaste opciones</h5>
          <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
            Creá distintas formas de contratar tu servicio.
            Por ejemplo: “Solo DJ”, “DJ + luces” o “DJ completo”.
          </p>
          <Button icon={Plus} onClick={() => setEditando({})}>Crear primera opción</Button>
        </div>
      )}

      {!cargando && !!opciones.length && (
        <div className="space-y-2">
          {opciones.map((o) => (
            <div
              key={o.id}
              className={`rounded-xl border p-3 transition-colors ${
                o.isActive ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold truncate ${o.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {o.name}
                    </span>
                    {!o.isActive && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-semibold">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {o.subcategoryName ? `${o.subcategoryName} · ` : ''}
                    {PRICING_MODEL_LABELS[o.pricingModel] || 'Precio fijo por evento'}
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{precioDe(o)}</span>
              </div>

              <div className="flex gap-1 mt-2 flex-wrap">
                <Button size="sm" variant="outline" icon={Pencil} onClick={() => setEditando(o)}>Editar</Button>
                <Button size="sm" variant="ghost" icon={Copy} disabled={ocupado === o.id}
                  onClick={() => duplicar(o)}>Duplicar</Button>
                <Button size="sm" variant="ghost" icon={o.isActive ? EyeOff : Eye} disabled={ocupado === o.id}
                  onClick={() => alternarEstado(o)}>
                  {o.isActive ? 'Desactivar' : 'Activar'}
                </Button>
                <Button size="sm" variant="ghost" icon={Trash2} disabled={ocupado === o.id}
                  aria-label={`Eliminar ${o.name}`} onClick={() => eliminar(o)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
