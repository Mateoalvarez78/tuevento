# Frontend ↔ Backend Connection Guide

## Setup

1. Start the backend:
   ```bash
   cd eventonow-back && npm run dev   # runs on http://localhost:4000
   ```

2. Start the frontend:
   ```bash
   cd tuevento && npm run dev          # runs on http://localhost:3000
   ```

3. Environment (`.env.local` already created):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ```

---

## Architecture

```
Browser
  └── Next.js 16 (App Router, React 19)
        └── services/api.js        ← centralized HTTP client
              ├── services/providerService.js
              ├── services/serviceService.js
              ├── services/bookingService.js
              ├── services/categoryService.js
              └── services/adminService.js
                    └── http://localhost:4000/api
```

---

## Connected Screens

| Screen | File | API Endpoints |
|--------|------|---------------|
| Catalog | `app/catalogo/page.js` | `GET /services` (filters + pagination) |
| Service Detail | `app/proveedor/[id]/page.js` | `GET /services/:id` |
| Book Service | `app/reservar/page.js` | `GET /services/:id` |
| Client Dashboard | `app/dashboard/cliente/page.js` | `GET /users/me/bookings`, `GET /services/:id` (per fav) |
| Provider Dashboard | `app/dashboard/proveedor/page.js` | `GET /providers/me`, `GET /bookings/provider`, `GET /services/mine` |
| Admin Overview | `app/admin/page.js` | `GET /admin/dashboard` |
| Admin Providers | `app/admin/proveedores/page.js` | `GET /admin/providers` |
| Admin Services | `app/admin/servicios/page.js` | `GET /admin/services` |

### Auth (all screens)
- `POST /auth/login` → stores JWT in `localStorage` key `te_token`
- `POST /auth/register`
- `GET /auth/me` → session rehydration on page load
- `POST /auth/logout`
- `GET /users/me/favorites` → loaded on login/mount

---

## Service Layer Files

| File | Purpose |
|------|---------|
| `services/api.js` | `request()`, `tokenStorage`, `ApiError`, `buildQuery()` |
| `services/providerService.js` | Catalog + detail; maps `service` → `provider` shape |
| `services/serviceService.js` | Provider self-service CRUD + admin |
| `services/bookingService.js` | Create/update bookings; `accepted` ↔ `confirmed` mapping |
| `services/categoryService.js` | Category list with in-memory cache + mock fallback |
| `services/adminService.js` | Admin stats + delegates to provider/service admin sub-APIs |

---

## Key Design Decisions

### Service ↔ Provider shape mapping
The frontend uses a "provider card" shape (`.name`, `.rating`, `.reviewCount`, `.zone`, etc.).
The backend returns services with slightly different field names. `mapServiceToProvider()` in
`providerService.js` handles the translation:

| Backend field | Frontend field |
|---------------|----------------|
| `rating_avg` | `rating` |
| `total_reviews` | `reviewCount` |
| `price_from` | `priceFrom` |
| `category_slug` | `category` |
| `category_name` | `categoryLabel` |

### Status normalization
Backend booking status `accepted` → frontend `confirmed` (legacy UI labels).
`bookingService.js` maps both directions automatically.

### Server-side pagination
The catalog (`/api/services`) handles pagination, filtering, and sorting.
`providerService.getAll({ page, limit, sort, ...filters })` passes all params to the API.

### Optimistic favorites
`lib/AppContext.js` toggles favorites optimistically (instant UI update) then syncs to
`POST /favorites/:serviceId` or `DELETE /favorites/:serviceId`.

### JWT auto-logout
`services/api.js` calls `setUnauthorizedHandler()` — any 401 response clears the token
and redirects to `/login`.

---

## Test Credentials (seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@eventonow.uy` | `admin123!` |
| Superadmin | `super@eventonow.uy` | `super123!` |
| Client | `cliente@test.uy` | `cliente123!` |
| Provider (catering) | `proveedor1@test.uy` | `prov123!` |
| Provider (foto) | `proveedor2@test.uy` | `prov123!` |
| Provider (DJ) | `proveedor3@test.uy` | `prov123!` |

---

## Still Using Mock Data

These sections still render mock/static data (not yet wired to API):

| Location | What's mocked |
|----------|---------------|
| `app/dashboard/proveedor/page.js` — sidebar | `DASH_PROVIDER` (avatar, name, stats strip) |
| All dashboard chart components | `lib/proveedorDashboardData.js` static data |
| `DashCommissions` | Static commission history |
| Category quick-pills in catalog | `CATEGORIES` from `lib/mockData` (used for UI labels only; filtering is server-side) |
| Homepage featured services | Not yet connected |

To fully wire the provider dashboard charts, update the chart components to accept props
from `bookingService.getProviderStats()` response (already fetched in `reload()`).
