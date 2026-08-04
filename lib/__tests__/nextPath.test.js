import { describe, test, expect } from 'vitest';
import { safeInternalPath } from '../nextPath';

describe('safeInternalPath', () => {
  test('acepta una ruta interna real', () => {
    expect(safeInternalPath('/mi-evento')).toBe('/mi-evento');
    expect(safeInternalPath('/armar-evento?x=1')).toBe('/armar-evento?x=1');
  });

  test('rechaza valores vacíos/nulos', () => {
    expect(safeInternalPath(null)).toBeNull();
    expect(safeInternalPath(undefined)).toBeNull();
    expect(safeInternalPath('')).toBeNull();
  });

  test('rechaza URLs absolutas (open redirect)', () => {
    expect(safeInternalPath('https://evil.com')).toBeNull();
    expect(safeInternalPath('http://evil.com/mi-evento')).toBeNull();
  });

  test('rechaza protocol-relative ("//" y "/\\\\") — un navegador puede interpretarlas como otro origen', () => {
    expect(safeInternalPath('//evil.com')).toBeNull();
    expect(safeInternalPath('/\\evil.com')).toBeNull();
  });

  test('rechaza rutas que no empiezan con "/"', () => {
    expect(safeInternalPath('mi-evento')).toBeNull();
    expect(safeInternalPath('javascript:alert(1)')).toBeNull();
  });
});
