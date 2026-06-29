// ─── MOCK USERS ───────────────────────────────────────────────────────────────
// Includes: clients, providers, and an admin user.
// Credentials for demo login:
//   Cliente:    valentina@example.com / 123456
//   Proveedor:  mateo@example.com     / 123456
//   Admin:      admin@tuevento.com.uy / admin123

export const MOCK_USERS = [
  {
    id: 'u1',
    name: 'Valentina López',
    email: 'valentina@example.com',
    password: '123456',
    role: 'client',
    avatar: 'https://i.pravatar.cc/150?img=47',
    phone: '+598 91 234-5678',
    createdAt: '2024-03-15',
  },
  {
    id: 'u2',
    name: 'Mateo García',
    email: 'mateo@example.com',
    password: '123456',
    role: 'provider',
    avatar: 'https://i.pravatar.cc/150?img=12',
    phone: '+598 99 876-5432',
    createdAt: '2024-01-10',
    providerId: 'p1',
  },
  {
    id: 'u3',
    name: 'Sofía Martínez',
    email: 'sofia@example.com',
    password: '123456',
    role: 'client',
    avatar: 'https://i.pravatar.cc/150?img=32',
    phone: '+598 95 555-1234',
    createdAt: '2024-05-20',
  },
  {
    id: 'u4',
    name: 'Admin TuEvento',
    email: 'admin@tuevento.com.uy',
    password: 'admin123',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?img=68',
    phone: '+598 98 000-0000',
    createdAt: '2023-01-01',
  },
  // Providers pending approval
  {
    id: 'u5',
    name: 'Carolina Benítez',
    email: 'carolina@festivasur.com.uy',
    password: '123456',
    role: 'provider',
    avatar: 'https://i.pravatar.cc/150?img=21',
    phone: '+598 94 111-2222',
    createdAt: '2026-06-20',
    providerId: 'p9',
  },
  {
    id: 'u6',
    name: 'Andrés Torres',
    email: 'andres@djandres.com.uy',
    password: '123456',
    role: 'provider',
    avatar: 'https://i.pravatar.cc/150?img=14',
    phone: '+598 92 333-4444',
    createdAt: '2026-06-22',
    providerId: 'p10',
  },
  {
    id: 'u7',
    name: 'Fernanda Castro',
    email: 'fernanda@luces360.com.uy',
    password: '123456',
    role: 'provider',
    avatar: 'https://i.pravatar.cc/150?img=29',
    phone: '+598 96 555-6666',
    createdAt: '2026-06-18',
    providerId: 'p11',
  },
  // Provider rejected
  {
    id: 'u8',
    name: 'Pablo Rodríguez',
    email: 'pablo@pablofoto.com.uy',
    password: '123456',
    role: 'provider',
    avatar: 'https://i.pravatar.cc/150?img=10',
    phone: '+598 91 777-8888',
    createdAt: '2026-06-10',
    providerId: 'p12',
  },
  // Provider suspended
  {
    id: 'u9',
    name: 'Lucía Ríos',
    email: 'lucia@animasiones.com.uy',
    password: '123456',
    role: 'provider',
    avatar: 'https://i.pravatar.cc/150?img=37',
    phone: '+598 98 999-0000',
    createdAt: '2026-04-15',
    providerId: 'p13',
  },
];
