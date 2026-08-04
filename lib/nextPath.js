// ─── nextPath ───────────────────────────────────────────────────────────
// Valida un `?next=` de retorno poslogin — nunca se navega directo con lo
// que venga en la URL sin pasar por acá. Evita un open-redirect: solo
// acepta una ruta interna real (empieza con "/", nunca "//" ni "/\", que
// los navegadores pueden interpretar como protocol-relative hacia otro
// origen), nunca una URL absoluta (http(s)://, javascript:, etc.).

export function safeInternalPath(value) {
  if (!value || typeof value !== 'string') return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}
