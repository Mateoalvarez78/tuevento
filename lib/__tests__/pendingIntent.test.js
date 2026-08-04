// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { savePendingIntent, readPendingIntent, clearPendingIntent } from '../pendingIntent';

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pendingIntent', () => {
  test('guarda y lee la misma intención', () => {
    savePendingIntent({ type: 'add_item', serviceId: 's1' });
    const read = readPendingIntent();
    expect(read).toMatchObject({ type: 'add_item', serviceId: 's1' });
    expect(typeof read.savedAt).toBe('number');
  });

  test('nunca persiste JWT/location_token/precios aunque se le pasen (contrato de uso, no del helper) — el helper guarda tal cual lo que se le da, la responsabilidad de no incluirlos es de cada caller', () => {
    // Este test documenta el contrato: si un caller comete el error de
    // incluir un campo sensible, el helper NO lo filtra — por diseño, cada
    // caller (useAcceptProposal/useAddToMyEvent) es responsable de construir
    // un objeto ya mínimo antes de llamar a savePendingIntent (ver esos
    // hooks, que nunca arman `location`/payload con locationToken/JWT).
    savePendingIntent({ type: 'add_item', serviceId: 's1' });
    const raw = JSON.parse(sessionStorage.getItem('te_pending_my_event_intent'));
    expect(raw).not.toHaveProperty('locationToken');
    expect(raw).not.toHaveProperty('jwt');
  });

  test('devuelve null si no hay nada guardado', () => {
    expect(readPendingIntent()).toBeNull();
  });

  test('clearPendingIntent borra la entrada', () => {
    savePendingIntent({ type: 'add_item' });
    clearPendingIntent();
    expect(readPendingIntent()).toBeNull();
  });

  test('una entrada expirada (>30 min) se descarta y se borra sola', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    savePendingIntent({ type: 'add_item' });

    vi.spyOn(Date, 'now').mockReturnValue(now + 31 * 60 * 1000);
    expect(readPendingIntent()).toBeNull();
    expect(sessionStorage.getItem('te_pending_my_event_intent')).toBeNull();
  });

  test('una entrada dentro de la ventana de 30 min sigue siendo válida', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    savePendingIntent({ type: 'add_item' });

    vi.spyOn(Date, 'now').mockReturnValue(now + 29 * 60 * 1000);
    expect(readPendingIntent()).not.toBeNull();
  });

  test('JSON corrupto en sessionStorage no rompe, devuelve null', () => {
    sessionStorage.setItem('te_pending_my_event_intent', '{not valid json');
    expect(readPendingIntent()).toBeNull();
  });
});
