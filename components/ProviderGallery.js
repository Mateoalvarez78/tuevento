'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react';
import { assetUrl } from '@/services/api';
import { getCategoryIcon } from '@/utils/icons';

export default function ProviderGallery({ images = [], name, categorySlug }) {
  const imgs = (images || []).map(assetUrl).filter(Boolean);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = () => setActive((a) => (a - 1 + imgs.length) % imgs.length);
  const next = () => setActive((a) => (a + 1) % imgs.length);

  // Fallback elegante cuando el servicio no tiene fotos
  if (imgs.length === 0) {
    const CategoryIcon = getCategoryIcon(categorySlug);
    return (
      <div className="rounded-2xl overflow-hidden h-[300px] md:h-[420px] flex flex-col items-center justify-center bg-gradient-to-br from-primary-light to-gray-100">
        <CategoryIcon size={64} strokeWidth={1.5} className="text-primary/40 mb-3" aria-hidden="true" />
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <ImageIcon size={15} /> Este servicio todavía no tiene fotos
        </div>
      </div>
    );
  }

  const safeActive = Math.min(active, imgs.length - 1);

  return (
    <>
      <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden h-[380px] md:h-[460px]">
        <div className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden" onClick={() => setLightbox(true)}>
          <img src={imgs[safeActive]} alt={`${name} - principal`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
          {imgs.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all">
                <ChevronLeft size={18} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {imgs.slice(0, 4).map((img, i) => (
          <div key={i} className="relative cursor-pointer overflow-hidden" onClick={() => { setActive(i); setLightbox(true); }}>
            <img src={img} alt={`${name} - ${i + 1}`} className={`w-full h-full object-cover hover:scale-105 transition-transform duration-300 ${safeActive === i ? 'ring-2 ring-primary ring-inset' : ''}`} />
            {i === 3 && imgs.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">+{imgs.length - 4} fotos</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {imgs.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {imgs.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className={`gallery-dot ${i === safeActive ? 'active' : ''} bg-gray-300`} style={{ background: i === safeActive ? '#E84D2C' : undefined }} />
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onClick={() => setLightbox(false)}>
            <X size={20} />
          </button>
          {imgs.length > 1 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onClick={(e) => { e.stopPropagation(); prev(); }}>
              <ChevronLeft size={24} />
            </button>
          )}
          <img src={imgs[safeActive]} alt={`${name} - ${safeActive + 1}`} className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
          {imgs.length > 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onClick={(e) => { e.stopPropagation(); next(); }}>
              <ChevronRight size={24} />
            </button>
          )}
          <div className="absolute bottom-4 text-white/70 text-sm">{safeActive + 1} / {imgs.length}</div>
        </div>
      )}
    </>
  );
}
