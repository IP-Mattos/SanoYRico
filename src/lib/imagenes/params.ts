// src/lib/imagenes/params.ts
// Validación pura de los parámetros de GET /api/imagenes/{cupon,promo}.
import { FORMATOS_FLYER, type FormatoFlyer } from '@/lib/flyers/params'

export const MAX_SALUDO = 30

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type Resultado<T> = { ok: true; params: T } | { ok: false; error: string }

function leerFormato(sp: URLSearchParams): FormatoFlyer | null {
  const f = sp.get('formato') ?? 'cuadrado'
  return (FORMATOS_FLYER as readonly string[]).includes(f) ? (f as FormatoFlyer) : null
}

/** Fecha opcional: '' → null; debe ser parseable. */
function leerFecha(raw: string | null): { ok: true; v: string | null } | { ok: false } {
  const s = (raw ?? '').trim()
  if (!s) return { ok: true, v: null }
  if (s.length > 40 || Number.isNaN(new Date(s).getTime())) return { ok: false }
  return { ok: true, v: s }
}

export interface ParamsCuponImagen {
  id: string
  formato: FormatoFlyer
  saludo: string
}

export function parsearParamsCupon(sp: URLSearchParams): Resultado<ParamsCuponImagen> {
  const id = (sp.get('id') ?? '').trim()
  if (!UUID.test(id)) return { ok: false, error: 'Cupón inválido' }
  const formato = leerFormato(sp)
  if (!formato) return { ok: false, error: 'Formato inválido' }
  // Se quitan caracteres de control; el texto lo renderiza Satori, no es HTML
  const saludo = (sp.get('saludo') ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim()
  if (saludo.length > MAX_SALUDO) return { ok: false, error: `El saludo admite hasta ${MAX_SALUDO} caracteres` }
  return { ok: true, params: { id, formato, saludo } }
}

export interface ParamsPromoImagen {
  pct: number
  minimo: number
  desde: string | null
  hasta: string | null
  formato: FormatoFlyer
}

export function parsearParamsPromo(sp: URLSearchParams): Resultado<ParamsPromoImagen> {
  const pctRaw = sp.get('pct') ?? ''
  const pct = Number(pctRaw)
  if (pctRaw.trim() === '' || !Number.isFinite(pct) || pct < 1 || pct > 100) {
    return { ok: false, error: 'El porcentaje debe estar entre 1 y 100' }
  }
  const minimoRaw = sp.get('minimo') ?? '0'
  const minimo = Number(minimoRaw)
  if (minimoRaw.trim() === '' || !Number.isFinite(minimo) || minimo < 0 || minimo > 10_000_000) {
    return { ok: false, error: 'El monto mínimo no es válido' }
  }
  const desde = leerFecha(sp.get('desde'))
  const hasta = leerFecha(sp.get('hasta'))
  if (!desde.ok || !hasta.ok) return { ok: false, error: 'Fecha inválida' }
  if (desde.v && hasta.v && new Date(hasta.v) <= new Date(desde.v)) {
    return { ok: false, error: '"Hasta" tiene que ser posterior a "Desde"' }
  }
  const formato = leerFormato(sp)
  if (!formato) return { ok: false, error: 'Formato inválido' }
  return { ok: true, params: { pct, minimo, desde: desde.v, hasta: hasta.v, formato } }
}
