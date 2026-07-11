// ─── STATUS CONFIGURATIONS ────────────────────────────────────────────────────
// Single source of truth for all status labels, colors, and descriptions.
// Used by ProviderStatusBadge, ServiceStatusBadge, admin tables, and dashboards.
// `icon` es siempre un componente Lucide (nunca un emoji).

import {
  CheckCircle2, PauseCircle, CircleSlash, FileEdit, Clock, XCircle,
} from 'lucide-react';

export const PROVIDER_STATUS = {
  active: {
    label: 'Activo',
    description: 'Visible públicamente en el catálogo',
    color: 'emerald',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
  },
  suspended: {
    label: 'Suspendido',
    description: 'Cuenta temporalmente pausada',
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    icon: PauseCircle,
  },
  inactive: {
    label: 'Desactivado',
    description: 'Cuenta desactivada por Eventonow',
    color: 'gray',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
    icon: CircleSlash,
  },
};

export const SERVICE_STATUS = {
  draft: {
    label: 'Borrador',
    description: 'No publicado, solo visible para vos',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
    icon: FileEdit,
  },
  pending_review: {
    label: 'En revisión',
    description: 'Enviado al equipo para aprobación',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    icon: Clock,
  },
  active: {
    label: 'Activo',
    description: 'Visible públicamente en el catálogo',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
  },
  paused: {
    label: 'Pausado',
    description: 'Temporalmente oculto del catálogo',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-400',
    icon: PauseCircle,
  },
  rejected: {
    label: 'Rechazado',
    description: 'No cumple los requisitos',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-400',
    icon: XCircle,
  },
};

export const BOOKING_STATUS = {
  pending:   { label: 'Pendiente',   bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Clock },
  confirmed: { label: 'Confirmado',  bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  rejected:  { label: 'Rechazado',   bg: 'bg-red-50',     text: 'text-red-700',     icon: XCircle },
  cancelled: { label: 'Cancelado',   bg: 'bg-gray-100',   text: 'text-gray-600',    icon: CircleSlash },
  completed: { label: 'Completado',  bg: 'bg-blue-50',    text: 'text-blue-700',    icon: CheckCircle2 },
};

// ─── GEOGRAPHIC ZONES ─────────────────────────────────────────────────────────
export const ZONES = [
  'Montevideo',
  'Canelones',
  'Maldonado',
  'San José',
  'Colonia',
  'Paysandú',
  'Salto',
  'Rivera',
  'Interior del país',
];

// ─── PRICE TYPES ──────────────────────────────────────────────────────────────
export const PRICE_TYPES = [
  { id: 'per_person', label: 'Por persona' },
  { id: 'per_event',  label: 'Por evento'  },
  { id: 'per_hour',   label: 'Por hora'    },
  { id: 'consultar',  label: 'A consultar' },
];
