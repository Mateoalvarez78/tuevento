'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UploadCloud, Star, Trash2, ArrowLeft, ArrowRight, ImageIcon, AlertTriangle, X } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { serviceImageService, IMAGE_LIMITS } from '@/services/serviceImageService';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

export default function ServiceImageManager({ service, onClose, onChanged }) {
  const { showToast } = useApp();
  const inputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState([]);   // [{ file, preview }]
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [brokenIds, setBrokenIds] = useState(() => new Set());

  const reload = useCallback(() => {
    setLoading(true); setError(null);
    return serviceImageService.getServiceImages(service.id)
      .then((imgs) => { setImages(imgs); setLoading(false); })
      .catch((e) => { setError(e?.message || 'No se pudieron cargar las imágenes'); setLoading(false); });
  }, [service.id]);

  useEffect(() => { reload(); }, [reload]);
  // Limpia previews al desmontar
  useEffect(() => () => pending.forEach((p) => URL.revokeObjectURL(p.preview)), [pending]);

  const totalCount = images.length + pending.length;

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    let slots = IMAGE_LIMITS.maxCount - totalCount;
    const accepted = [];
    for (const file of files) {
      if (slots <= 0) { showToast(`Máximo ${IMAGE_LIMITS.maxCount} imágenes por servicio`, 'error'); break; }
      const { valid, error: err } = serviceImageService.validateFile(file);
      if (!valid) { showToast(`${file.name}: ${err}`, 'error'); continue; }
      accepted.push({ file, preview: URL.createObjectURL(file) });
      slots--;
    }
    if (accepted.length) setPending((prev) => [...prev, ...accepted]);
  };

  const removePending = (idx) => {
    setPending((prev) => {
      URL.revokeObjectURL(prev[idx]?.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const upload = async () => {
    if (!pending.length) return;
    setUploading(true);
    try {
      await serviceImageService.uploadServiceImages(service.id, pending.map((p) => p.file));
      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
      await reload();
      onChanged?.();
      showToast('Imágenes subidas', 'success');
    } catch (e) {
      showToast(e?.message || 'No se pudieron subir las imágenes', 'error');
    } finally {
      setUploading(false);
    }
  };

  const setMain = async (id) => {
    setBusy(true);
    try { await serviceImageService.setMainServiceImage(service.id, id); await reload(); onChanged?.(); }
    catch (e) { showToast(e?.message || 'Error', 'error'); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    setBusy(true);
    try { await serviceImageService.deleteServiceImage(service.id, id); await reload(); onChanged?.(); showToast('Imagen eliminada', 'info'); }
    catch (e) { showToast(e?.message || 'Error', 'error'); }
    finally { setBusy(false); }
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const order = images.map((im) => im.id);
    [order[index], order[target]] = [order[target], order[index]];
    setBusy(true);
    try { const updated = await serviceImageService.reorderServiceImages(service.id, order); setImages(updated); onChanged?.(); }
    catch (e) { showToast(e?.message || 'Error', 'error'); }
    finally { setBusy(false); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <Modal
      open
      onClose={() => !uploading && onClose()}
      title="Fotos del servicio"
      size="lg"
      footer={<Button variant="outline" className="ml-auto" onClick={onClose}>Listo</Button>}
    >
      <p className="text-xs text-gray-500 truncate -mt-4 mb-4">{service.title}</p>

      {/* Dropzone */}
      <div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button" tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'}`}
        >
          <AppIcon icon={UploadCloud} size={26} className="text-primary" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-700">Arrastrá imágenes acá o hacé clic para elegir</p>
          <p className="text-xs text-gray-400">{IMAGE_LIMITS.allowedLabel} · hasta {IMAGE_LIMITS.maxSizeMB} MB · máx. {IMAGE_LIMITS.maxCount} ({totalCount}/{IMAGE_LIMITS.maxCount})</p>
          <input ref={inputRef} type="file" accept={IMAGE_LIMITS.allowedTypes.join(',')} multiple className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        </div>

        {/* Preview de pendientes */}
        {pending.length > 0 && (
          <div className="mt-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {pending.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={p.preview} alt={p.file.name} className="w-full h-full object-cover" />
                  <Button
                    iconOnly icon={X} size="sm" variant="ghost"
                    className="absolute top-1 right-1 !w-6 !h-6 bg-black/60 text-white hover:bg-black/80"
                    aria-label="Quitar imagen"
                    onClick={() => removePending(i)}
                  />
                </div>
              ))}
            </div>
            <Button className="mt-3 w-full" loading={uploading} onClick={upload}>
              {uploading ? 'Subiendo…' : `Subir ${pending.length} ${pending.length === 1 ? 'imagen' : 'imágenes'}`}
            </Button>
          </div>
        )}
      </div>

      {/* Galería actual */}
      <div className="mt-5">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Galería actual</h4>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton aspect-video rounded-xl" />)}</div>
        ) : error ? (
          <div className="text-center py-6 text-sm text-red-600 flex items-center justify-center gap-2">
            {error} <Button variant="ghost" size="sm" onClick={reload}>Reintentar</Button>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl">
            <AppIcon icon={ImageIcon} size={28} className="mx-auto text-gray-300 mb-2" aria-hidden="true" />
            <p className="text-sm text-gray-500">Todavía no cargaste fotos.</p>
            <p className="text-xs text-gray-400 mt-1">La primera que subas será la principal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((im, i) => (
              <div key={im.id} className={`relative group aspect-video rounded-xl overflow-hidden border ${im.isMain ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'} bg-gray-50`}>
                {brokenIds.has(im.id) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400 bg-gray-100 px-2 text-center">
                    <AppIcon icon={AlertTriangle} size={18} className="text-amber-500" aria-hidden="true" />
                    <span className="text-[10px] leading-tight">No se pudo cargar. Volvé a subirla.</span>
                  </div>
                ) : (
                  <img
                    src={im.url}
                    alt={im.originalName || 'Foto del servicio'}
                    className="w-full h-full object-cover"
                    onError={() => setBrokenIds((prev) => new Set(prev).add(im.id))}
                  />
                )}
                {im.isLegacyLocal && !brokenIds.has(im.id) && (
                  <span
                    className="absolute top-1.5 right-1.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-1"
                    title="Subida antes de la migración a Cloudinary — puede desaparecer en cualquier momento. Recomendado: volver a subirla."
                  >
                    <AppIcon icon={AlertTriangle} size={9} aria-hidden="true" /> Antigua
                  </span>
                )}
                {im.isMain && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <AppIcon icon={Star} size={9} className="fill-current" aria-hidden="true" /> Principal
                  </span>
                )}
                {/* Acciones */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <Button iconOnly size="sm" variant="ghost" className="bg-white/90 !text-gray-700 hover:!text-primary"
                    icon={Star} disabled={busy || im.isMain} aria-label="Marcar principal" title="Marcar principal"
                    onClick={() => setMain(im.id)} />
                  <Button iconOnly size="sm" variant="ghost" className="bg-white/90 !text-gray-700 hover:!text-primary"
                    icon={ArrowLeft} disabled={busy || i === 0} aria-label="Mover antes" title="Mover antes"
                    onClick={() => move(i, -1)} />
                  <Button iconOnly size="sm" variant="ghost" className="bg-white/90 !text-gray-700 hover:!text-primary"
                    icon={ArrowRight} disabled={busy || i === images.length - 1} aria-label="Mover después" title="Mover después"
                    onClick={() => move(i, 1)} />
                  <Button iconOnly size="sm" variant="ghost" className="bg-white/90 !text-red-600 hover:!bg-red-50"
                    icon={Trash2} disabled={busy} aria-label="Eliminar" title="Eliminar"
                    onClick={() => remove(im.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
