// src/lib/flyers/params.ts
// Validación pura de los parámetros de GET /api/flyers (sin I/O).

export const FORMATOS_FLYER = ['cuadrado', 'historia'] as const
export type FormatoFlyer = (typeof FORMATOS_FLYER)[number]

export const MAX_PRODUCTOS_FLYER = 6
export const MAX_TITULO_FLYER = 60
export const MAX_CUPON_FLYER = 20
export const TITULO_FLYER_DEFAULT = 'Nuestros favoritos'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CUPON = /^[A-Z0-9-]+$/

export interface ParamsFlyer {
  ids: string[]
  formato: FormatoFlyer
  titulo: string
  cupon: string | null
}

export type ResultadoParams = { ok: true; params: ParamsFlyer } | { ok: false; error: string }

export function parsearParamsFlyer(sp: URLSearchParams): ResultadoParams {
  const ids = [
    ...new Set(
      (sp.get('ids') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ]
  if (ids.length < 1 || ids.length > MAX_PRODUCTOS_FLYER) {
    return { ok: false, error: `Elegí entre 1 y ${MAX_PRODUCTOS_FLYER} productos` }
  }
  if (!ids.every((id) => UUID.test(id))) return { ok: false, error: 'Producto inválido' }

  const formato = sp.get('formato') ?? 'cuadrado'
  if (!(FORMATOS_FLYER as readonly string[]).includes(formato)) return { ok: false, error: 'Formato inválido' }

  const titulo = (sp.get('titulo') ?? '').trim() || TITULO_FLYER_DEFAULT
  if (titulo.length > MAX_TITULO_FLYER) {
    return { ok: false, error: `El título admite hasta ${MAX_TITULO_FLYER} caracteres` }
  }

  const cuponRaw = (sp.get('cupon') ?? '').trim().toUpperCase()
  if (cuponRaw && (cuponRaw.length > MAX_CUPON_FLYER || !CUPON.test(cuponRaw))) {
    return { ok: false, error: 'Cupón inválido (solo letras, números y guiones, hasta 20)' }
  }

  return { ok: true, params: { ids, formato: formato as FormatoFlyer, titulo, cupon: cuponRaw || null } }
}

/** Reordena los productos cargados según el orden de selección y descarta los que no llegaron. */
export function ordenarPorIds<T extends { id: string }>(ids: string[], items: T[]): T[] {
  const porId = new Map(items.map((i) => [i.id, i]))
  return ids.flatMap((id) => {
    const it = porId.get(id)
    return it ? [it] : []
  })
}
