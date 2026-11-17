'use client';

import { useState } from 'react';
import { Search, Mail, Inbox } from 'lucide-react';
import { useAdminContactMessages } from '@/hooks/useAdmin';
import { CONTACT_STATUS_LABELS } from '@/services/contactService';
import { safeFormatDate } from '@/lib/date';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import Drawer from '@/components/Drawer';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

// Pestañas de la bandeja. '' = todas. El vocabulario sale de
// CONTACT_STATUS_LABELS (services/contactService.js), espejo del CHECK de la
// migración 025 — no una lista escrita a mano acá.
const STATUS_TABS = [
  { value: '', label: 'Todos' },
  ...Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

// Mismo criterio de color que el resto del panel (ver admin/resenas).
const STATUS_STYLES = {
  new:         { bg: 'bg-primary/15',      text: 'text-primary',      border: 'border-transparent' },
  in_progress: { bg: 'bg-amber-500/10',    text: 'text-amber-400',    border: 'border-transparent' },
  resolved:    { bg: 'bg-emerald-500/10',  text: 'text-emerald-400',  border: 'border-transparent' },
  spam:        { bg: 'bg-gray-700',        text: 'text-gray-400',     border: 'border-transparent' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.spam;
  return <Badge bg={s.bg} text={s.text} border={s.border} label={CONTACT_STATUS_LABELS[status] || status} />;
}

export default function AdminContactoPage() {
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const { messages, counts, newCount, loading, error, updateStatus } =
    useAdminContactMessages({ status: activeTab || undefined });

  // Filtro de texto en cliente sobre la página ya cargada — mismo criterio que
  // admin/resenas. El filtro por estado sí es server-side.
  const displayed = messages.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.subject || '').toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  const handleStatusChange = async (id, status) => {
    setSaving(true);
    try {
      await updateStatus(id, status);
      setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        theme="dark"
        title="Mensajes de contacto"
        subtitle={
          newCount > 0
            ? `${newCount} sin atender · ${messages.length} en esta vista`
            : `${messages.length} en esta vista`
        }
        className="mb-5 sm:mb-6"
      />

      <Input
        variant="dark"
        icon={Search}
        wrapperClassName="max-w-sm mb-5"
        placeholder="Buscar por nombre, correo o contenido…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar mensajes"
      />

      {/* Pestañas por estado */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.value && counts[tab.value] > 0 && (
              <span className="ml-1.5 text-xs text-gray-500">{counts[tab.value]}</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          No se pudieron cargar los mensajes: {error.message}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Sin mensajes"
          description={
            search.trim()
              ? 'Ningún mensaje coincide con tu búsqueda.'
              : 'Todavía no llegó ningún mensaje por el formulario de contacto.'
          }
        />
      ) : (
        <div className="space-y-2">
          {displayed.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="w-full text-left bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-4 py-3.5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="min-w-0 flex items-center gap-2.5">
                  {/* Los mensajes sin atender se distinguen de un vistazo. */}
                  {m.status === 'new' && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-label="Sin atender" />
                  )}
                  <span className="font-semibold text-gray-100 truncate">{m.name}</span>
                  <span className="text-xs text-gray-500 truncate hidden sm:inline">{m.email}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={m.status} />
                  <span className="text-xs text-gray-500 tabular-nums">
                    {safeFormatDate(m.createdAt)}
                  </span>
                </div>
              </div>
              {m.subject && (
                <p className="text-sm text-gray-300 truncate">{m.subject}</p>
              )}
              <p className="text-xs text-gray-500 line-clamp-2">{m.message}</p>
            </button>
          ))}
        </div>
      )}

      {/* Detalle */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        theme="dark"
        title="Mensaje de contacto"
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-gray-500 tabular-nums">
                {safeFormatDate(selected.createdAt)}
              </span>
            </div>

            <dl className="space-y-2.5">
              <div>
                <dt className="text-xs text-gray-500 mb-0.5">Nombre</dt>
                <dd className="text-gray-100 font-medium">{selected.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 mb-0.5">Correo</dt>
                <dd>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-primary hover:underline inline-flex items-center gap-1.5 break-all"
                  >
                    <AppIcon icon={Mail} size={14} aria-hidden="true" />
                    {selected.email}
                  </a>
                </dd>
              </div>
              {selected.subject && (
                <div>
                  <dt className="text-xs text-gray-500 mb-0.5">Asunto</dt>
                  <dd className="text-gray-200">{selected.subject}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500 mb-1">Mensaje</dt>
                <dd className="text-gray-200 whitespace-pre-wrap bg-gray-900 border border-gray-800 rounded-xl p-3.5 leading-relaxed">
                  {selected.message}
                </dd>
              </div>
            </dl>

            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500 mb-2.5">Cambiar estado</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => (
                  <Button
                    key={value}
                    size="sm"
                    theme="dark"
                    variant={selected.status === value ? 'primary' : 'outline'}
                    disabled={saving || selected.status === value}
                    onClick={() => handleStatusChange(selected.id, value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
