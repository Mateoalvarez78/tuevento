import {
  UtensilsCrossed, Music, Camera, Clapperboard, Sparkles, PartyPopper,
  Martini, Speaker, Flame, Pizza, Tent, Users, Mic2, Aperture, ShieldCheck,
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'catering',      label: 'Catering',          icon: UtensilsCrossed, count: 48 },
  { id: 'dj',            label: 'DJ & Música',       icon: Music,           count: 32 },
  { id: 'fotografia',    label: 'Fotografía',        icon: Camera,          count: 56 },
  { id: 'video',         label: 'Video & Cine',      icon: Clapperboard,    count: 21 },
  { id: 'decoracion',    label: 'Decoración',        icon: Sparkles,        count: 39 },
  { id: 'animacion',     label: 'Animación',         icon: PartyPopper,     count: 24 },
  { id: 'barra',         label: 'Barra de Tragos',   icon: Martini,         count: 19 },
  { id: 'sonido',        label: 'Sonido & Luces',    icon: Speaker,         count: 28 },
  { id: 'parrilla',      label: 'Parrilla',          icon: Flame,           count: 22 },
  { id: 'pizza',         label: 'Pizzas',            icon: Pizza,           count: 17 },
  { id: 'castillo',      label: 'Castillos',         icon: Tent,            count: 14 },
  { id: 'mozos',         label: 'Mozos',             icon: Users,           count: 31 },
  { id: 'musica_vivo',   label: 'Música en Vivo',    icon: Mic2,            count: 15 },
  { id: 'cabina_fotos',  label: 'Cabina de Fotos',   icon: Aperture,        count: 12 },
  { id: 'seguridad',     label: 'Seguridad',         icon: ShieldCheck,     count: 8  },
];
