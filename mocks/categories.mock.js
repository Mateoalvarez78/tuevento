import {
  UtensilsCrossed, Music, Camera, Sparkles, PartyPopper,
  Martini, Speaker, Tent, Users, Aperture, Building2,
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'catering',      label: 'Catering',          icon: UtensilsCrossed, count: 48 },
  { id: 'dj',            label: 'DJ & Música',       icon: Music,           count: 32 },
  { id: 'fotografia',    label: 'Fotografía',        icon: Camera,          count: 56 },
  { id: 'decoracion',    label: 'Decoración',        icon: Sparkles,        count: 39 },
  { id: 'animacion',     label: 'Animación',         icon: PartyPopper,     count: 24 },
  { id: 'barra',         label: 'Barra de Tragos',   icon: Martini,         count: 19 },
  { id: 'sonido',        label: 'Sonido & Luces',    icon: Speaker,         count: 28 },
  { id: 'castillo',      label: 'Castillos',         icon: Tent,            count: 14 },
  { id: 'mozos',         label: 'Mozos',             icon: Users,           count: 31 },
  { id: 'cabina_fotos',  label: 'Cabina de Fotos',   icon: Aperture,        count: 12 },
  { id: 'salon-de-fiestas', label: 'Salón de fiestas', icon: Building2,     count: 0  },
];
