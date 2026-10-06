// src/lib/imagenes/formato.ts
// Formateo puro para las imágenes de cupón y promo (es-UY, hora de Montevideo).

const ZONA = 'America/Montevideo'

/** "$5.000" (enteros) o "$1.250,50". */
export function formatearMonto(n: number): string {
  const redondeado = Math.round(n * 100) / 100
  const [ent, dec] = (Number.isInteger(redondeado) ? String(redondeado) : redondeado.toFixed(2)).split('.')
  return `$${ent.replace(/\B(?=(\d{3})+$)/g, '.')}${dec ? `,${dec}` : ''}`
}

function partes(iso: string): { d: string; m: string; a: string } | null {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return null
  const f = new Intl.DateTimeFormat('es-UY', { timeZone: ZONA, day: '2-digit', month: '2-digit', year: 'numeric' })
  const mapa = Object.fromEntries(f.formatToParts(fecha).map((p) => [p.type, p.value]))
  return { d: mapa.day, m: mapa.month, a: mapa.year }
}

/** dd/mm */
export function fechaCorta(iso: string): string | null {
  const p = partes(iso)
  return p ? `${p.d}/${p.m}` : null
}

/** dd/mm/aaaa */
export function fechaCompleta(iso: string): string | null {
  const p = partes(iso)
  return p ? `${p.d}/${p.m}/${p.a}` : null
}
