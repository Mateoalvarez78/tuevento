// ─── PROVIDER DASHBOARD MOCK DATA ─────────────────────────────────────────────
// Números realistas para Uruguay 2026 — precios en pesos uruguayos (UYU)
// Catering: ~$300-$1.000/persona según tipo de evento

export const DASH_PROVIDER = {
  name: 'Sabores del Sur Catering',
  ownerName: 'Carolina García',
  avatar: 'https://i.pravatar.cc/150?img=48',
  level: 'Pro',
  rating: 4.9,
  reviewCount: 124,
  memberSince: 'Ene 2023',
  phone: '+598 91 234-5678',
  whatsapp: '+598 91 234-5678',
  zone: 'Montevideo e Interior',
  responseTime: '28 min',
  responseRate: 98,
  completionRate: 97,
  repeatClientRate: 34,
  profileComplete: 87,
};

export const CURRENT_STATS = {
  revenue:      { value: 195000, prev: 138000, sparkline: [48,62,79,71,96,87,73,81,108,94,138,195] },
  bookings:     { value: 52,     prev: 48,     sparkline: [18,24,31,28,35,29,40,38,44,41,48,52] },
  services:     { value: 5,      prev: 4,      sparkline: [3,3,3,4,4,4,4,5,5,5,5,5] },
  conversion:   { value: 68,     prev: 65,     sparkline: [60,61,63,62,65,64,66,67,65,68,67,68] },
  profileViews: { value: 1248,   prev: 1100,   sparkline: [800,850,900,880,950,1000,1050,1100,1050,1150,1200,1248] },
  rating:       { value: 4.9,    prev: 4.8,    sparkline: [4.7,4.7,4.8,4.8,4.8,4.8,4.9,4.9,4.9,4.8,4.9,4.9] },
};

// revenue en miles de pesos (195 = $195.000 UYU) — formato que usa el chart YAxis con '${v}K'
export const MONTHLY_DATA = [
  { month: 'Jul', bookings: 18, revenue: 48  },
  { month: 'Ago', bookings: 24, revenue: 62  },
  { month: 'Sep', bookings: 31, revenue: 79  },
  { month: 'Oct', bookings: 28, revenue: 71  },
  { month: 'Nov', bookings: 35, revenue: 96  },
  { month: 'Dic', bookings: 29, revenue: 87  },
  { month: 'Ene', bookings: 40, revenue: 73  },
  { month: 'Feb', bookings: 38, revenue: 81  },
  { month: 'Mar', bookings: 44, revenue: 108 },
  { month: 'Abr', bookings: 41, revenue: 94  },
  { month: 'May', bookings: 48, revenue: 138 },
  { month: 'Jun', bookings: 52, revenue: 195 },
];

export const TOP_SERVICES = [
  { name: 'Catering Premium Bodas', bookings: 45, pct: 100, revenue: 485000 },
  { name: 'Almuerzo Corporativo',    bookings: 38, pct: 84,  revenue: 142000 },
  { name: 'Cena de Gala',           bookings: 31, pct: 69,  revenue: 195000 },
  { name: 'Catering Infantil',      bookings: 24, pct: 53,  revenue: 92000  },
  { name: 'Cumpleaños Adultos',     bookings: 19, pct: 42,  revenue: 218000 },
];

export const BOOKING_STATUS_DATA = [
  { name: 'Confirmadas', value: 38, color: '#0BB885' },
  { name: 'Pendientes',  value: 8,  color: '#F5A623' },
  { name: 'Finalizadas', value: 182,color: '#2563EB' },
  { name: 'Canceladas',  value: 12, color: '#E84D2C' },
];

export const HEATMAP_HOURS = ['08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
export const HEATMAP_DATA = [
  { day: 'Lun', slots: [0,0,1,0,1,2,3,5,8,12,15,18,14,10,6,2] },
  { day: 'Mar', slots: [0,0,0,1,2,3,4,6,10,15,18,22,19,13,8,3] },
  { day: 'Mié', slots: [0,1,1,2,3,4,5,7,12,18,22,25,21,16,9,4] },
  { day: 'Jue', slots: [0,0,1,1,2,3,5,8,11,16,19,23,18,12,7,2] },
  { day: 'Vie', slots: [1,1,2,3,5,8,12,18,22,28,35,40,36,28,18,8] },
  { day: 'Sáb', slots: [5,8,12,18,22,30,42,52,60,65,68,72,68,58,42,20] },
  { day: 'Dom', slots: [3,5,8,12,18,25,35,45,50,55,58,60,54,44,30,12] },
];

// Montos en pesos uruguayos. Precios por persona:
//   Bodas premium:     $820–$990/pax
//   Cena de gala:      $640–$680/pax
//   Cumpleaños adultos:$525–$545/pax
//   Almuerzo corp.:    $420–$430/pax
//   Catering infantil: $297–$327/pax
export const BOOKINGS = [
  // HOY 29 jun
  { id:'bk1', clientName:'Valentina López',    clientAvatar:'https://i.pravatar.cc/60?img=2',  clientPhone:'+598 92 222-3333', service:'Almuerzo Corporativo',    date:'2026-06-29', time:'13:00', location:'Torre Libertad, Montevideo',          guests:50,  amount:21000,  status:'confirmed', eventType:'Empresarial', notes:'Opciones vegetarianas para 10 personas', requestNumber:'TE-2026-041', depositPaid:true  },
  { id:'bk2', clientName:'Andrés Sosa',        clientAvatar:'https://i.pravatar.cc/60?img=3',  clientPhone:'+598 93 333-4444', service:'Cumpleaños Adultos',      date:'2026-06-29', time:'20:00', location:'Salón Crystal, Montevideo',            guests:80,  amount:43500,  status:'confirmed', eventType:'Cumpleaños', notes:'Torta de chocolate incluida', requestNumber:'TE-2026-042', depositPaid:true  },
  // 30 jun
  { id:'bk3', clientName:'María García',       clientAvatar:'https://i.pravatar.cc/60?img=1',  clientPhone:'+598 91 111-2222', service:'Catering Premium Bodas',  date:'2026-06-30', time:'19:30', location:'Quinta Los Eucaliptos, Canelones',     guests:150, amount:134000, status:'confirmed', eventType:'Casamiento', notes:'Menú sin TACC para 15 personas', requestNumber:'TE-2026-040', depositPaid:true  },
  // 2 jul
  { id:'bk4', clientName:'Florencia Ruiz',     clientAvatar:'https://i.pravatar.cc/60?img=4',  clientPhone:'+598 94 444-5555', service:'Catering Premium Bodas',  date:'2026-07-02', time:'21:00', location:'Terraza Rooftop, Montevideo',          guests:100, amount:82000,  status:'confirmed', eventType:'Cumpleaños', notes:'Temática años 80', requestNumber:'TE-2026-039', depositPaid:true  },
  // 5 jul
  { id:'bk5', clientName:'TechCorp Uruguay',   clientAvatar:'https://i.pravatar.cc/60?img=5',  clientPhone:'+598 95 555-6666', service:'Almuerzo Corporativo',    date:'2026-07-05', time:'12:00', location:'Edificio WTC, Montevideo',             guests:60,  amount:25500,  status:'confirmed', eventType:'Empresarial', notes:'30% veganos', requestNumber:'TE-2026-038', depositPaid:true  },
  { id:'bk6', clientName:'Laura Fernández',    clientAvatar:'https://i.pravatar.cc/60?img=6',  clientPhone:'+598 96 666-7777', service:'Cumpleaños Adultos',      date:'2026-07-05', time:'20:00', location:'Casa particular, Punta Carretas',      guests:60,  amount:29800,  status:'pending',   eventType:'Cumpleaños', notes:'Cumpleaños sorpresa', requestNumber:'TE-2026-043', depositPaid:false },
  // 7 jul
  { id:'bk7', clientName:'Carolina González',  clientAvatar:'https://i.pravatar.cc/60?img=7',  clientPhone:'+598 97 777-8888', service:'Catering Premium Bodas',  date:'2026-07-07', time:'20:30', location:'Estancia La Paz, Canelones',           guests:180, amount:172000, status:'confirmed', eventType:'Casamiento', notes:'Open bar post cena', requestNumber:'TE-2026-037', depositPaid:true  },
  // 12 jul
  { id:'bk8', clientName:'UruTech Solutions',  clientAvatar:'https://i.pravatar.cc/60?img=8',  clientPhone:'+598 98 888-9999', service:'Cena de Gala',            date:'2026-07-12', time:'20:00', location:'World Trade Center, Montevideo',       guests:100, amount:68000,  status:'pending',   eventType:'Empresarial', notes:'Cierre de año fiscal', requestNumber:'TE-2026-044', depositPaid:false },
  // 19 jul
  { id:'bk9', clientName:'Mario Díaz',         clientAvatar:'https://i.pravatar.cc/60?img=9',  clientPhone:'+598 91 999-0000', service:'Cumpleaños Adultos',      date:'2026-07-19', time:'20:00', location:'Club Punta Carretas, Montevideo',      guests:120, amount:64000,  status:'confirmed', eventType:'Cumpleaños', notes:'Fiesta de 50 años', requestNumber:'TE-2026-036', depositPaid:true  },
  // 26 jul
  { id:'bk10',clientName:'Sofía Martínez',     clientAvatar:'https://i.pravatar.cc/60?img=10', clientPhone:'+598 92 000-1111', service:'Catering Premium Bodas',  date:'2026-07-26', time:'20:30', location:'Quinta San Marcos, Maldonado',         guests:200, amount:198000, status:'pending',   eventType:'Casamiento', notes:'Invitados de Argentina', requestNumber:'TE-2026-045', depositPaid:false },
  // Pasadas – completadas
  { id:'bk11',clientName:'Claudia Méndez',     clientAvatar:'https://i.pravatar.cc/60?img=11', clientPhone:'+598 93 111-2222', service:'Cumpleaños Adultos',      date:'2026-06-21', time:'21:00', location:'Salón Amaranto, Montevideo',           guests:70,  amount:36800,  status:'completed', eventType:'Cumpleaños', notes:null, requestNumber:'TE-2026-035', depositPaid:true  },
  { id:'bk12',clientName:'Empresa Rioplatense',clientAvatar:'https://i.pravatar.cc/60?img=12', clientPhone:'+598 94 222-3333', service:'Almuerzo Corporativo',    date:'2026-06-14', time:'13:00', location:'Oficinas Rioplatense, Montevideo',     guests:40,  amount:17200,  status:'completed', eventType:'Empresarial', notes:null, requestNumber:'TE-2026-034', depositPaid:true  },
  { id:'bk13',clientName:'Familia Herrero',    clientAvatar:'https://i.pravatar.cc/60?img=13', clientPhone:'+598 95 333-4444', service:'Catering Premium Bodas',  date:'2026-06-07', time:'20:00', location:'Quinta Villa Rosa, Canelones',         guests:130, amount:109000, status:'completed', eventType:'Casamiento', notes:null, requestNumber:'TE-2026-033', depositPaid:true  },
  { id:'bk14',clientName:'Nicolás Pereira',    clientAvatar:'https://i.pravatar.cc/60?img=14', clientPhone:'+598 96 444-5555', service:'Cena de Gala',            date:'2026-05-31', time:'20:00', location:'Hotel Sofitel, Montevideo',            guests:85,  amount:54500,  status:'completed', eventType:'Empresarial', notes:null, requestNumber:'TE-2026-032', depositPaid:true  },
  { id:'bk15',clientName:'Santiago Rodríguez', clientAvatar:'https://i.pravatar.cc/60?img=15', clientPhone:'+598 97 555-6666', service:'Catering Infantil',       date:'2026-05-25', time:'17:00', location:'Quinta El Bosque, Canelones',          guests:60,  amount:19600,  status:'completed', eventType:'Infantil',   notes:null, requestNumber:'TE-2026-031', depositPaid:true  },
  { id:'bk16',clientName:'Diego Acosta',       clientAvatar:'https://i.pravatar.cc/60?img=16', clientPhone:'+598 98 666-7777', service:'Catering Infantil',       date:'2026-05-18', time:'17:00', location:'Club Infantil Arcoíris, Montevideo',   guests:45,  amount:13400,  status:'completed', eventType:'Infantil',   notes:null, requestNumber:'TE-2026-030', depositPaid:true  },
];

export const REVIEWS_DATA = [
  { id:'rv1', clientName:'María García',     clientAvatar:'https://i.pravatar.cc/60?img=1',  rating:5, date:'2026-06-25', service:'Catering Premium Bodas', text:'Absolutamente increíble. La comida estaba deliciosa, el servicio impecable y la presentación de los platos fue una obra de arte. Todos los invitados quedaron sorprendidos.', providerReply:'¡Gracias María! Fue un placer ser parte de tu día especial. 🎉', helpful:12 },
  { id:'rv2', clientName:'Valentina López',  clientAvatar:'https://i.pravatar.cc/60?img=2',  rating:5, date:'2026-06-20', service:'Almuerzo Corporativo',    text:'Excelente servicio para nuestro evento corporativo. Puntuales, profesionales y la comida fue de primera calidad. El equipo se adaptó perfectamente a nuestros requerimientos.', providerReply:null, helpful:8 },
  { id:'rv3', clientName:'Andrés Sosa',      clientAvatar:'https://i.pravatar.cc/60?img=3',  rating:4, date:'2026-06-15', service:'Cumpleaños Adultos',      text:'Muy buena experiencia en general. La comida riquísima y el personal muy atento. Solo un pequeño retraso en la llegada pero todo se resolvió bien.', providerReply:'Gracias por el feedback, tomamos nota para seguir mejorando.', helpful:5 },
  { id:'rv4', clientName:'Florencia Ruiz',   clientAvatar:'https://i.pravatar.cc/60?img=4',  rating:5, date:'2026-06-10', service:'Catering Infantil',       text:'Los nenes la pasaron genial y los grandes también. La variedad de platos fue increíble y todo muy bien presentado. ¡Muy recomendables!', providerReply:null, helpful:15 },
  { id:'rv5', clientName:'Carolina González',clientAvatar:'https://i.pravatar.cc/60?img=7',  rating:5, date:'2026-05-28', service:'Catering Premium Bodas', text:'Mi boda fue perfecta gracias a Sabores del Sur. La atención al detalle, los sabores únicos y el profesionalismo son incomparables. ¡Muchas gracias!', providerReply:'¡Carolina, fue un honor ser parte de tu día! Que sean muy felices 💕', helpful:23 },
];

export const GOALS = [
  { id:'g1', label:'Reservas del mes',  current:52,     target:60,     unit:'',  format:'number',   color:'#E84D2C' },
  { id:'g2', label:'Facturación',       current:195000, target:280000, unit:'$', format:'currency',  color:'#0BB885' },
  { id:'g3', label:'Clientes nuevos',   current:38,     target:50,     unit:'',  format:'number',   color:'#2563EB' },
  { id:'g4', label:'Rating promedio',   current:4.9,    target:5.0,    unit:'★', format:'decimal',  color:'#F5A623' },
];

export const PAYMENTS = {
  pendingAmount: 58000,
  nextPayout: '05 Jul 2026',
  platformFee: 8,
  thisMonthProcessed: 195000,
  lastPayout: { amount: 138000, date: '05 Jun 2026' },
  history: [
    { id:'ph1', date:'05 Jun 2026', amount:138000, status:'paid' },
    { id:'ph2', date:'05 May 2026', amount:94000,  status:'paid' },
    { id:'ph3', date:'05 Abr 2026', amount:108000, status:'paid' },
    { id:'ph4', date:'05 Mar 2026', amount:81000,  status:'paid' },
  ],
};

export const ACTIVITY_FEED = [
  { id:'a1',  type:'booking_new',       icon:'📅', color:'#0BB885', text:'Nueva reserva de Valentina López',          time:'hace 5 min',  amount:21000  },
  { id:'a2',  type:'review_new',        icon:'⭐', color:'#F5A623', text:'Florencia Ruiz dejó una reseña de 5★',      time:'hace 2 hs',   amount:null   },
  { id:'a3',  type:'payment_received',  icon:'💰', color:'#0BB885', text:'Pago recibido por boda García-López',       time:'hace 3 hs',   amount:134000 },
  { id:'a4',  type:'booking_confirmed', icon:'✅', color:'#2563EB', text:'Reserva confirmada: TechCorp Uruguay',      time:'hace 5 hs',   amount:null   },
  { id:'a5',  type:'booking_new',       icon:'📅', color:'#0BB885', text:'Nueva reserva de Laura Fernández',          time:'hace 6 hs',   amount:29800  },
  { id:'a6',  type:'review_reply',      icon:'💬', color:'#9CA3AF', text:'Respondiste la reseña de María García',     time:'ayer',        amount:null   },
  { id:'a7',  type:'service_published', icon:'🚀', color:'#7C3AED', text:'Nuevo listado publicado: Cena de Gala',     time:'hace 2 días', amount:null   },
  { id:'a8',  type:'payment_received',  icon:'💰', color:'#0BB885', text:'Liquidación mensual: $138.000',             time:'hace 3 días', amount:138000 },
  { id:'a9',  type:'booking_cancelled', icon:'❌', color:'#E84D2C', text:'Cancelación: Carlos Herrera (jun 15)',      time:'hace 4 días', amount:null   },
  { id:'a10', type:'review_new',        icon:'⭐', color:'#F5A623', text:'Andrés Sosa dejó una reseña de 4★',         time:'hace 5 días', amount:null   },
];

export const ALERTS = [
  { id:'al1', level:'opportunity', icon:'🔥', title:'Alta demanda detectada',  text:'Tu servicio "Catering Premium Bodas" tiene 45 búsquedas esta semana. Considerá aumentar tu precio o crear un nuevo listado.' },
  { id:'al2', level:'warning',     icon:'⚠️', title:'3 consultas sin responder', text:'Hace 2 días que no respondes 3 consultas. Tu tasa de respuesta puede bajar afectando tu posicionamiento.' },
  { id:'al3', level:'tip',         icon:'💡', title:'Mejorá tu visibilidad',     text:'Agregar más fotos a tus servicios puede aumentar la conversión hasta un 40%.' },
];

export const PERFORMANCE = {
  responseTime:       28,
  acceptanceRate:     91,
  cancellationRate:   3,
  repeatBookingRate:  34,
  newClientsThisMonth: 38,
  recurringClients:   18,
};

export const QUICK_ACTIONS = [
  { icon:'➕', label:'Crear servicio',   color:'#E84D2C', bg:'#FEF0EB', tab:'servicios'  },
  { icon:'📅', label:'Ver calendario',   color:'#2563EB', bg:'#EFF6FF', tab:'calendario' },
  { icon:'⭐', label:'Responder reseñas',color:'#F5A623', bg:'#FFF7ED', tab:'resenas'    },
  { icon:'👤', label:'Editar perfil',    color:'#7C3AED', bg:'#FAF5FF', tab:'perfil'     },
  { icon:'📊', label:'Ver estadísticas', color:'#0BB885', bg:'#EBF9F4', tab:'dashboard'  },
  { icon:'💬', label:'Mis solicitudes',  color:'#64748B', bg:'#F8FAFC', tab:'solicitudes'},
];
