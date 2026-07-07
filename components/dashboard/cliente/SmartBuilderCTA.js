'use client';

import Link from 'next/link';
import { Bot, ArrowRight } from 'lucide-react';

export default function SmartBuilderCTA() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gray-900 text-white p-6 sm:p-8">
      <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary/20 blur-2xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
          <Bot size={28} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">¿No sabés por dónde empezar?</h3>
          <p className="text-white/70 text-sm mt-1 max-w-xl">
            Muy pronto vas a poder decirnos <span className="text-white font-medium">“quiero organizar un cumpleaños para 50 personas”</span> y Eventonow te va a armar la mejor combinación de proveedores.
          </p>
        </div>
        <Link href="/armar-evento" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm shrink-0">
          Armar mi evento <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
