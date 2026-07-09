'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/AppContext';
import { providerService } from '@/services/providerService';
import { categoryService } from '@/services/categoryService';
import { ZONES } from '@/utils/constants';
import { ChevronRight, Check, ArrowLeft } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Cuenta',    description: 'Creá tu acceso' },
  { id: 2, label: 'Negocio',   description: 'Tu servicio' },
  { id: 3, label: 'Contacto',  description: 'Datos de contacto' },
  { id: 4, label: 'Listo',     description: 'Confirmación' },
];

const EVENT_TYPES = ['Cumpleaños', 'Casamiento', 'Empresarial', 'Infantil', 'Fiesta privada', 'Quinceañera', 'Egresados'];

const INITIAL = {
  // step 1
  ownerName: '', email: '', password: '', phone: '',
  // step 2
  businessName: '', category: '', description: '', zones: [], eventTypes: [], priceFrom: '',
  // step 3
  whatsapp: '', instagram: '', website: '',
};

export default function ProveedorRegistroPage() {
  const router = useRouter();
  const { login, showToast } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleZone = (z) =>
    set('zones', form.zones.includes(z) ? form.zones.filter((x) => x !== z) : [...form.zones, z]);

  const toggleEventType = (t) =>
    set('eventTypes', form.eventTypes.includes(t) ? form.eventTypes.filter((x) => x !== t) : [...form.eventTypes, t]);

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.ownerName.trim()) e.ownerName = 'Requerido';
      if (!form.email.includes('@')) e.email = 'Email inválido';
      if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
      if (!form.phone.trim()) e.phone = 'Requerido';
    }
    if (step === 2) {
      if (!form.businessName.trim()) e.businessName = 'Requerido';
      if (!form.category) e.category = 'Seleccioná una categoría';
      if (!form.description.trim()) e.description = 'Requerido';
      if (form.zones.length === 0) e.zones = 'Seleccioná al menos una zona';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (submitting) return;
    // categoryService mapea id=slug y categoryId=UUID real; el backend necesita el UUID.
    const categoryId = categories.find((c) => c.id === form.category)?.categoryId || null;
    setSubmitting(true);
    try {
      await providerService.register({
        ownerName:    form.ownerName,
        email:        form.email,
        password:     form.password,
        phone:        form.phone,
        businessName: form.businessName,
        categoryId,
        description:  form.description,
        zones:        form.zones,
        whatsapp:     form.whatsapp || form.phone,
        instagram:    form.instagram,
        website:      form.website,
      });
      showToast('Solicitud enviada. Revisaremos tu cuenta de proveedor.', 'success');
      setStep(4);
    } catch (err) {
      showToast(err?.message || 'No pudimos enviar tu solicitud. Intentá de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Back */}
        {step < 4 && (
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
            <ArrowLeft size={14} /> Volver al inicio
          </Link>
        )}

        {/* Stepper */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-8">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step > s.id ? 'bg-green-500 text-white' : step === s.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.id ? <Check size={13} /> : s.id}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold ${step === s.id ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</div>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          {/* ── STEP 1: CUENTA ── */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Creá tu cuenta de proveedor</h1>
              <p className="text-gray-500 text-sm mb-6">Empezá gratis. Tu cuenta será revisada por el equipo de TuEvento.</p>

              <div className="space-y-4">
                <Field label="Nombre completo" error={errors.ownerName}>
                  <input type="text" value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} placeholder="Juan García" className={input(errors.ownerName)} />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="juan@miempresa.com" className={input(errors.email)} />
                </Field>
                <Field label="Contraseña" error={errors.password}>
                  <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" className={input(errors.password)} />
                </Field>
                <Field label="Teléfono / WhatsApp" error={errors.phone}>
                  <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+598 9X XXX-XXXX" className={input(errors.phone)} />
                </Field>
              </div>

              <button onClick={next} className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors">
                Continuar <ChevronRight size={17} />
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                ¿Ya tenés cuenta?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">Iniciar sesión</Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: NEGOCIO ── */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Tu servicio</h1>
              <p className="text-gray-500 text-sm mb-6">Contanos qué ofrecés.</p>

              <div className="space-y-4">
                <Field label="Nombre de tu negocio / servicio" error={errors.businessName}>
                  <input type="text" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="Ej: Catering Sabores del Sur" className={input(errors.businessName)} />
                </Field>

                <Field label="Categoría" error={errors.category}>
                  <select value={form.category} onChange={(e) => set('category', e.target.value)} className={input(errors.category)}>
                    <option value="">Seleccioná una categoría…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </Field>

                <Field label="Descripción" error={errors.description}>
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={4}
                    placeholder="Contá brevemente qué ofrecés, tu experiencia y qué te diferencia…"
                    className={input(errors.description) + ' resize-none'}
                  />
                </Field>

                <Field label="Precio desde (UYU)" error={errors.priceFrom}>
                  <input type="number" value={form.priceFrom} onChange={(e) => set('priceFrom', e.target.value)} placeholder="Ej: 45000" className={input(errors.priceFrom)} />
                </Field>

                <Field label="Zonas donde trabajás" error={errors.zones}>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {ZONES.map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => toggleZone(z)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          form.zones.includes(z)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40'
                        }`}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Tipos de evento (opcional)">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {EVENT_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleEventType(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          form.eventTypes.includes(t)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={back} className="px-5 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">Atrás</button>
                <button onClick={next} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors">
                  Continuar <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: CONTACTO ── */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Datos de contacto</h1>
              <p className="text-gray-500 text-sm mb-6">Opcionales, pero ayudan a los clientes a encontrarte.</p>

              <div className="space-y-4">
                <Field label="WhatsApp (número con código de país)">
                  <input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+598 9X XXX-XXXX" className={input()} />
                </Field>
                <Field label="Instagram">
                  <input type="text" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@minegocio" className={input()} />
                </Field>
                <Field label="Sitio web">
                  <input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://minegocio.com.uy" className={input()} />
                </Field>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={back} className="px-5 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">Atrás</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: CONFIRMACIÓN ── */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                Revisaremos tu información en las próximas 24–48 horas. Te avisaremos por email cuando tu cuenta sea aprobada.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-6 text-left">
                <strong>Estado actual:</strong> Pendiente de revisión. Una vez aprobado, tus servicios serán visibles en el catálogo.
              </div>
              <Link href="/" className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors">
                Volver al inicio
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function input(error) {
  return `w-full border ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors`;
}
