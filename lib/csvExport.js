// ─── CSV EXPORT HELPER ────────────────────────────────────────────────────────
// Genérico y reutilizable. Escapa valores, agrega BOM UTF-8 (Excel) y dispara
// la descarga en el navegador.

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * @param {Array<object>} rows
 * @param {Array<{label:string, value:string|function}>} columns
 * @returns {string} CSV
 */
export function buildCsv(rows, columns) {
  const header = columns.map((c) => escapeCsv(c.label)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsv(typeof c.value === 'function' ? c.value(row) : row[c.value])).join(',')
  );
  return [header, ...lines].join('\r\n');
}

/** Dispara la descarga de un CSV (con BOM para que Excel respete UTF-8). */
export function downloadCsv(filename, csv) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Nombre de archivo con fecha: prefijo-YYYY-MM-DD.csv */
export function datedFilename(prefix) {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${prefix}-${iso}.csv`;
}
