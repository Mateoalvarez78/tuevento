// Cliente del módulo `contact`. Se mockea `./api` (el límite de red), igual que
// el resto de los tests de servicios del proyecto.
import { describe, test, expect, vi, beforeEach } from 'vitest';

const post = vi.fn();
const get = vi.fn();
const patch = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    post: (...a) => post(...a),
    get: (...a) => get(...a),
    patch: (...a) => patch(...a),
  },
  // buildQuery real: interesa comprobar la URL que se arma.
  buildQuery: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== false) q.set(k, String(v));
    });
    const s = q.toString();
    return s ? `?${s}` : '';
  },
}));

const { contactService, CONTACT_LIMITS, CONTACT_STATUS_LABELS } =
  await import('@/services/contactService');

beforeEach(() => {
  post.mockReset();
  get.mockReset();
  patch.mockReset();
});

describe('límites compartidos con el backend', () => {
  test('coinciden con los de contact.routes.js y el CHECK de la migración 025', () => {
    expect(CONTACT_LIMITS).toEqual({
      nameMax: 120,
      emailMax: 255,
      subjectMax: 150,
      messageMin: 10,
      messageMax: 4000,
    });
  });
});

describe('vocabulario de estados', () => {
  test('es exactamente el del CHECK, y en el orden del embudo de atención', () => {
    expect(Object.keys(CONTACT_STATUS_LABELS)).toEqual([
      'new', 'in_progress', 'resolved', 'spam',
    ]);
  });
});

describe('submit', () => {
  test('hace POST a /contact con los campos y el honeypot', async () => {
    post.mockResolvedValue({ success: true, data: { id: 'm1', createdAt: '2026-09-26T12:00:00.000Z' } });

    const res = await contactService.submit({
      name: 'Ana', email: 'ana@example.com', subject: 'Hola',
      message: 'Un mensaje suficientemente largo.',
    });

    expect(post).toHaveBeenCalledWith('/contact', {
      name: 'Ana',
      email: 'ana@example.com',
      subject: 'Hola',
      message: 'Un mensaje suficientemente largo.',
      honeypot: '',
    });
    expect(res).toEqual({ id: 'm1', createdAt: '2026-09-26T12:00:00.000Z' });
  });

  test('propaga el error del backend tal cual — no lo convierte en éxito', async () => {
    const err = Object.assign(new Error('Validation failed'), { status: 400 });
    post.mockRejectedValue(err);
    await expect(
      contactService.submit({ name: 'x', email: 'y', message: 'z' })
    ).rejects.toBe(err);
  });

  test('un 429 se propaga con su mensaje, para poder mostrarlo', async () => {
    const err = Object.assign(new Error('Esperá un rato'), { status: 429 });
    post.mockRejectedValue(err);
    await expect(
      contactService.submit({ name: 'a', email: 'b', message: 'c' })
    ).rejects.toMatchObject({ status: 429, message: 'Esperá un rato' });
  });
});

describe('admin.getAll', () => {
  const ROW = {
    id: 'm1', name: 'Ana', email: 'ana@example.com', subject: null,
    message: 'Hola', status: 'new', admin_notes: null, source: 'web_contact_form',
    created_at: '2026-09-26T12:00:00.000Z', updated_at: '2026-09-26T12:00:00.000Z',
  };

  test('mapea snake_case a la forma de la UI', async () => {
    get.mockResolvedValue({ data: [ROW], pagination: null, counts: {}, newCount: 0 });
    const res = await contactService.admin.getAll();
    expect(res.data[0]).toEqual({
      id: 'm1', name: 'Ana', email: 'ana@example.com', subject: null,
      message: 'Hola', status: 'new', adminNotes: null, source: 'web_contact_form',
      createdAt: '2026-09-26T12:00:00.000Z', updatedAt: '2026-09-26T12:00:00.000Z',
    });
  });

  test('pasa el filtro de estado como query param', async () => {
    get.mockResolvedValue({ data: [], counts: {}, newCount: 0 });
    await contactService.admin.getAll({ status: 'new', limit: 50 });
    expect(get).toHaveBeenCalledWith('/contact?status=new&limit=50');
  });

  test('sin filtros no agrega query string', async () => {
    get.mockResolvedValue({ data: [], counts: {}, newCount: 0 });
    await contactService.admin.getAll();
    expect(get).toHaveBeenCalledWith('/contact');
  });

  test('devuelve counts y newCount, con valores por defecto seguros', async () => {
    get.mockResolvedValue({ data: [] });
    const res = await contactService.admin.getAll();
    expect(res.counts).toEqual({});
    expect(res.newCount).toBe(0);
  });
});

describe('admin.updateStatus', () => {
  test('hace PATCH con el estado', async () => {
    patch.mockResolvedValue({ data: { id: 'm1', status: 'resolved' } });
    await contactService.admin.updateStatus('m1', { status: 'resolved' });
    expect(patch).toHaveBeenCalledWith('/contact/m1', { status: 'resolved' });
  });

  test('sin adminNotes NO manda la clave (PATCH parcial: no toca la columna)', async () => {
    patch.mockResolvedValue({ data: { id: 'm1' } });
    await contactService.admin.updateStatus('m1', { status: 'spam' });
    const [, body] = patch.mock.calls[0];
    expect('admin_notes' in body).toBe(false);
  });

  test('con adminNotes la manda en snake_case', async () => {
    patch.mockResolvedValue({ data: { id: 'm1' } });
    await contactService.admin.updateStatus('m1', { status: 'resolved', adminNotes: 'ok' });
    expect(patch).toHaveBeenCalledWith('/contact/m1', { status: 'resolved', admin_notes: 'ok' });
  });

  test('con adminNotes vacío manda la clave vacía (para limpiarla)', async () => {
    patch.mockResolvedValue({ data: { id: 'm1' } });
    await contactService.admin.updateStatus('m1', { status: 'resolved', adminNotes: '' });
    expect(patch).toHaveBeenCalledWith('/contact/m1', { status: 'resolved', admin_notes: '' });
  });
});
