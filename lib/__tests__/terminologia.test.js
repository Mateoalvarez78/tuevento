// La terminología visible dice "Opción/Opciones", nunca "Menú".
//
// Es un test de archivos, no de render: el repo no hace pruebas de JSX (Vite
// no parsea JSX en .js sin el plugin de React). Alcanza igual, porque lo que
// se quiere impedir es que vuelva a aparecer el texto viejo en la UI.
//
// Los nombres TÉCNICOS (`service_packages`, `package_id`, rutas `/packages`)
// se conservan a propósito: el renombrado es de UX, no de contrato.
import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(process.cwd());
const CARPETAS = ['app', 'components'];

function archivosJs(dir, acc = []) {
  for (const entrada of readdirSync(dir)) {
    if (entrada === 'node_modules' || entrada === '.next' || entrada === '__tests__') continue;
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) archivosJs(ruta, acc);
    else if (entrada.endsWith('.js')) acc.push(ruta);
  }
  return acc;
}

const TODOS = CARPETAS.flatMap((c) => archivosJs(join(RAIZ, c)));

// Solo el texto que ve el usuario: se descartan las líneas de comentario,
// donde nombrar lo viejo es legítimo al explicar una migración.
const lineasVisibles = (ruta) =>
  readFileSync(ruta, 'utf8')
    .split('\n')
    .map((l, i) => ({ n: i + 1, texto: l }))
    .filter(({ texto }) => {
      const t = texto.trim();
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
    });

const buscar = (patron) => {
  const hits = [];
  for (const ruta of TODOS) {
    for (const { n, texto } of lineasVisibles(ruta)) {
      if (patron.test(texto)) hits.push(`${ruta.replace(RAIZ, '')}:${n}`);
    }
  }
  return hits;
};

describe('terminología visible', () => {
  test('no queda "Menús" como nombre de las opciones', () => {
    // "menús de navegación" en un comentario es otra cosa; acá solo miramos
    // texto renderizable.
    expect(buscar(/Menús/)).toEqual([]);
  });

  test('no queda "Nuevo paquete" ni "Nombre del paquete"', () => {
    expect(buscar(/Nuevo paquete|Nombre del paquete/)).toEqual([]);
  });

  test('no queda "Crear paquete" ni "Editar paquete"', () => {
    expect(buscar(/Crear paquete|Editar paquete/)).toEqual([]);
  });

  test('no queda el ejemplo "Pizza party", que aparecía dentro de DJ', () => {
    // El ejemplo tiene que ser coherente con la categoría; uno gastronómico
    // fijo se vuelve absurdo en cualquier otra.
    expect(buscar(/Pizza party/)).toEqual([]);
  });
});

describe('nombres técnicos preservados', () => {
  test('las rutas del backend siguen usando /packages', () => {
    const contenido = readFileSync(join(RAIZ, 'services', 'modifierService.js'), 'utf8');
    expect(contenido).toContain('/packages/');
    expect(contenido).not.toContain('/opciones/');
  });

  test('"Paquete cerrado" sigue siendo una modalidad de cobro válida', () => {
    // Es el nombre comercial de fixed_package, no el de la entidad.
    const labels = readFileSync(join(RAIZ, 'lib', 'packagePricingField.js'), 'utf8');
    expect(labels).toMatch(/fixed_package/);
  });
});
