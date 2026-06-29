// ─── MOCKS BARREL ─────────────────────────────────────────────────────────────
// Single entry point for all mock data.
// Components must NEVER import from here directly — use the services/ layer.

export { CATEGORIES } from './categories.mock';
export { MOCK_USERS } from './users.mock';
export { PROVIDER_OVERRIDES, NEW_PROVIDERS } from './providers.mock';
export { MOCK_SERVICES } from './services.mock';
export { MOCK_RESERVATIONS, PROVIDER_REQUESTS, PROVIDER_STATS } from './bookings.mock';
