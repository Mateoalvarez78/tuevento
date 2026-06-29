// ─── STATUS CONFIGURATIONS ────────────────────────────────────────────────────
// Single source of truth for all status labels, colors, and descriptions.
// Used by ProviderStatusBadge, ServiceStatusBadge, admin tables, and dashboards.

export const PROVIDER_STATUS = {
  pending: {
    label: 'Pendiente',
    description: 'En revisión por el equipo de TuEvento',
    color: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    icon: '⏳',
  },
  approved: {
    label: 'Aprobado',
    description: 'Visible públicamente en el catálogo',
    color: 'emerald',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
    icon: '✓',
  },
  rejected: {
    label: 'Rechazado',
    description: 'No cumple los requisitos de la plataforma',
    color: 'red',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-400',
    icon: '✕',
  },
  suspended: {
    label: 'Suspendido',
    description: 'Cuenta temporalmente inactiva',
    color: 'gray',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
    icon: '⊘',
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
  },
  pending_review: {
    label: 'En revisión',
    description: 'Enviado al equipo para aprobación',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  active: {
    label: 'Activo',
    description: 'Visible públicamente en el catálogo',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
  },
  paused: {
    label: 'Pausado',
    description: 'Temporalmente oculto del catálogo',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-400',
  },
  rejected: {
    label: 'Rechazado',
    description: 'No cumple los requisitos',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-400',
  },
};

export const BOOKING_STATUS = {
  pending:   { label: 'Pendiente',   bg: 'bg-amber-50',   text: 'text-amber-700'  },
  confirmed: { label: 'Confirmado',  bg: 'bg-emerald-50', text: 'text-emerald-700' },
  rejected:  { label: 'Rechazado',   bg: 'bg-red-50',     text: 'text-red-700'    },
  cancelled: { label: 'Cancelado',   bg: 'bg-gray-100',   text: 'text-gray-600'   },
  completed: { label: 'Completado',  bg: 'bg-blue-50',    text: 'text-blue-700'   },
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

// ─── ADMIN NAVIGATION ─────────────────────────────────────────────────────────
export const ADMIN_NAV = [
  { href: '/admin',                   label: 'Overview',     icon: 'LayoutDashboard' },
  { href: '/admin/proveedores',       label: 'Proveedores',  icon: 'Store'           },
  { href: '/admin/servicios',         label: 'Servicios',    icon: 'Package'         },
];
