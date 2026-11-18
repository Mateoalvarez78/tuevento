@AGENTS.md

# Eventonow Frontend

Next.js 16 + React 19, JavaScript puro (sin TypeScript), Tailwind v4. Ver la Knowledge Base completa en [`../docs/`](../docs/) — este archivo son solo las reglas específicas de esta mitad del repo. Punto de entrada general: [`../CLAUDE.md`](../CLAUDE.md).

## Antes de tocar este código

- [docs/FRONTEND.md](../docs/FRONTEND.md) — árbol de rutas y convenciones generales.
- [docs/COMPONENT_LIBRARY.md](../docs/COMPONENT_LIBRARY.md) — **revisar siempre antes de crear un componente nuevo**.
- [docs/UI_GUIDELINES.md](../docs/UI_GUIDELINES.md) — tokens de diseño (Tailwind v4 vive en `app/globals.css`, no hay `tailwind.config.js`).
- [docs/SERVICE_LAYER.md](../docs/SERVICE_LAYER.md) — cómo se llama al backend.

## Reglas de esta mitad del repo

- **Nunca `fetch` directo desde un componente** — siempre a través de `services/*.js`.
- **Reutilizar antes de crear**: `Modal`, `Drawer`, `Button`, `Input`, `Chip`, `Badge`, `AppIcon`, `MetricCard` cubren casi cualquier necesidad de UI — ver [docs/COMPONENT_LIBRARY.md](../docs/COMPONENT_LIBRARY.md).
- **Fechas siempre por `lib/date.js`** — nunca `new Date().toISOString()` para una fecha de negocio (corre el día en Uruguay, UTC-3, después de las 21:00). Ver [docs/DECISIONS.md](../docs/DECISIONS.md).
- **Sin TypeScript.**
- **Next.js 16 tiene breaking changes** respecto a versiones anteriores (ver `AGENTS.md` arriba) — confirmar contra `node_modules/next/dist/docs/` antes de asumir un comportamiento de una versión previa (ej. `params` en rutas dinámicas es una `Promise`).

## Pagos (seña + saldo con dLocal Go)

Fuente de verdad del dominio: `eventonow-back/docs/payments/ARCHITECTURE.md` y `eventonow-back/src/modules/payments/CLAUDE.md` (repo del backend).

- **El frontend nunca decide que algo está pagado.** Solo muestra `payment_status` de la reserva y el estado del intento que devuelve la API. `/pago/exito` y `/pago/cancelado` no confían en la URL: consultan `POST /payments/intents/:id/sync`.
- Toda la lógica de qué cobro toca, plazos y textos vive en `lib/payments.js` (puro, con tests). Las llamadas, en `services/paymentService.js`.
- Ante `PAYMENT_STATUS_UNKNOWN` o `PAYMENT_UNDER_REVIEW` el mensaje al cliente pide **no volver a pagar** (`paymentErrorMessage`). No reemplazarlo por un genérico.
- El cliente solo cancela por su cuenta si `payment_status === 'unpaid'`; con dinero cobrado lo gestiona el equipo.
- Flags públicas: `NEXT_PUBLIC_ONLINE_PAYMENTS_ENABLED=true` muestra el botón de pago real; `NEXT_PUBLIC_PAYMENT_SIMULATION=true` solo en desarrollo y nunca junto con la anterior.
- Admin: `/admin/pagos` (conciliación) y la pestaña **Cobros** del proveedor (conexión con dLocal Go).

## Ver también

[`../docs/FRONTEND.md`](../docs/FRONTEND.md) · [`../docs/COMPONENT_LIBRARY.md`](../docs/COMPONENT_LIBRARY.md) · [`../docs/CODING_STANDARDS.md`](../docs/CODING_STANDARDS.md)
